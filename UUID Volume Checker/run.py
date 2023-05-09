from flask import Flask, render_template
import requests
import re
from tenacity import retry, wait_fixed, stop_after_delay
import time
import functools
import concurrent.futures


app = Flask(__name__, static_url_path='', static_folder='./')


def get_users():
    url = 'https://raw.githubusercontent.com/emdarx/expreset/main/user/list.txt'
    response = requests.get(url)
    response.raise_for_status()
    lines = response.text.split('\n')
    users = []
    for line in lines:
        try:
            telegram_id, uuid = line.strip().split(',')
            users.append({'telegram_id': telegram_id, 'uuid': uuid})
        except ValueError:
            pass
    return users


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
    remaining_traffic = 0.0  # initialize remaining_traffic to 0.0
    reset_times = None  # initialize reset_times to None
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
          <th>Telegram ID</th>
          <th>Remaining Volume</th>
          <th>Number of charges</th>
          <th>             </th>
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
        row = f"<tr><td>{user['uuid']}</td><td>{user['telegram_id']}</td><td>{remaining_traffic:.2f} GB</td><td>{reset_times_str}</td>"
        if remaining_traffic < 3:
            row += f"<td><button class=\"blue-button\" onclick=\"extendVolume('{user['uuid']}')\">+ Increase</button></td>"
        else:
            row += "<td></td>"
        row += "</tr>"
        return row
    except:
        return ""


@app.route('/')
def index():
    users = get_users()
    user_table = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_user = {executor.submit(fetch_remaining_traffic, user): user for user in users}
        for future in concurrent.futures.as_completed(future_to_user):
            user = future_to_user[future]
            row = future.result()
            if row:
                user_table.append(row)
    table_html = TABLE_HTML.format('\n'.join(user_table))
    return render_template('index.html', users=users, table_html=table_html)

if __name__ == '__main__':
    app.run(debug=False)
