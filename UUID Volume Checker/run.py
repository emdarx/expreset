from flask import Flask, render_template
import requests
import re
from tenacity import retry, wait_fixed, stop_after_delay
import time
import functools
import concurrent.futures
from jdatetime import datetime as jdatetime_datetime, timedelta as jdatetime_timedelta
import pytz


app = Flask(__name__, static_url_path='', static_folder='./')


def get_users():
    url = 'https://raw.githubusercontent.com/emdarx/expreset/main/user/list.txt'
    response = requests.get(url)
    response.raise_for_status()
    lines = response.text.split('\n')
    users = []
    for line in lines:
        try:
            telegram_id, uuid, expire_date = line.strip().split(',')
            users.append({'telegram_id': telegram_id, 'uuid': uuid, 'expire_date': expire_date})
        except ValueError:
            pass
    return sorted(users, key=lambda u: get_remaining_days(u['expire_date']))


def memoize(func):
    cache = {}

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        key = (args, tuple(kwargs.items()))
        now = time.time()
        if key not in cache or now - cache[key]["time"] > 900:
            result = func(*args, **kwargs)
            cache[key] = {"result": result, "time": now}
        return cache[key]["result"]

    return wrapper


@memoize
@retry(wait=wait_fixed(2), stop=stop_after_delay(10))
def get_remaining_traffic(uuid):
    remaining_traffic = 0.0
    reset_times = None
    url = f"https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid={uuid}"
    response = requests.get(url)
    if response.status_code == 200:
        response_json = response.json()
        remaining_traffic_str = response_json.get('remainingTraffic', '0.0')
        match = re.search(r'(\d+\.\d+)', remaining_traffic_str)
        if match:
            remaining_traffic = float(match.group(1))
        reset_times = response_json.get('resetTimes', None)
    return remaining_traffic, reset_times


TABLE_HTML = """
    <table>
      <thead>
        <tr>
          <th>UUID</th>
          <th>ID</th>
          <th>Remaining Volume</th>
          <th>Number of Charges</th>
          <th>Days Left</th>
          <th>Extend Traffic</th>
        </tr>
      </thead>
      <tbody>
        {}
      </tbody>
    </table>
"""


def fetch_remaining_traffic(user):
    try:
        remaining_traffic, reset_times = get_remaining_traffic(user['uuid'])
        reset_times_str = f"{reset_times}/5" if reset_times is not None else ""

        remaining_days = get_remaining_days(user['expire_date'])

        uuid_link = f'<a href="https://getafreenode.com/node.php?uuid={user["uuid"]}" target="_blank" style="color: blue;">{user["uuid"]}</a>'
        row = f"<tr><td>{uuid_link}</td><td>{user['telegram_id']}</td><td>{remaining_traffic:.2f} GB</td><td>{reset_times_str}</td><td>{remaining_days} days</td>"

        if remaining_traffic < 3:
            row += f"<td><button class=\"blue-button\" onclick=\"extendVolume('{user['uuid']}')\">+ Increase</button></td>"
        else:
            row += "<td></td>"
        row += "</tr>"
        return remaining_days, row
    except Exception:
        return float('inf'), ""


def get_remaining_days(expire_date):
    if expire_date.lower() == 'unlimited':
        return float('inf')
    else:
        year = int(expire_date[:4])
        month = int(expire_date[4:6])
        day = int(expire_date[6:8])
        shamsi_date = jdatetime_datetime(year, month, day)

        try:
            today_shamsi = jdatetime_datetime.now(pytz.timezone('Asia/Tehran')).replace(hour=0, minute=0, second=0, microsecond=0).date()
            remaining_days = (shamsi_date.date() - today_shamsi).days
            if remaining_days < 0:
                remaining_days = (today_shamsi - shamsi_date.date()).days
                remaining_days = -remaining_days
        except Exception:
            remaining_days = 0

        return remaining_days


@app.route('/')
def index():
    users = get_users()
    user_table = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_user = {executor.submit(fetch_remaining_traffic, user): user for user in users}
        for future in concurrent.futures.as_completed(future_to_user):
            user = future_to_user[future]
            remaining_days, row = future.result()
            if row:
                user_table.append((remaining_days, row))
    sorted_user_table = sorted(user_table, key=lambda x: x[0])
    sorted_rows = [row for _, row in sorted_user_table]
    table_html = TABLE_HTML.format('\n'.join(sorted_rows))
    return render_template('index.html', users=users, table_html=table_html)


if __name__ == '__main__':
    app.run(debug=False)
