
from flask import Flask, render_template
import requests
import re

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
        
def get_remaining_traffic(uuid):
    remaining_traffic = 0.0 # initialize remaining_traffic to 0.0
    url = f"https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid={uuid}"
    response = requests.get(url)
    if response.status_code == 200:
        response_json = response.json()
        remaining_traffic_str = response_json.get('remainingTraffic', '0.0')
        match = re.search(r'(\d+\.\d+)', remaining_traffic_str)
        if match:
            remaining_traffic = float(match.group(1))
    return remaining_traffic

TABLE_HTML = """
    <table>
      <thead>
        <tr>
          <th>UUID</th>
          <th>Telegram ID</th>
          <th>Remaining Volume</th>
          <th>Volume Increase</th>
        </tr>
      </thead>
      <tbody>
        {}
      </tbody>
    </table>
"""

@app.route('/')
def index():
    users = get_users()
    user_table = []
    for user in users:
        remaining_traffic = get_remaining_traffic(user['uuid'])
        row = f"<tr><td>{user['uuid']}</td><td>{user['telegram_id']}</td><td>{remaining_traffic:.2f} GB</td>"
        if remaining_traffic < 3:
            row += f"<td><button class=\"blue-button\" onclick=\"extendVolume('{user['uuid']}')\">Volume Increase</button></td>"
        else:
            row += "<td></td>"
        row += "</tr>"
        user_table.append(row)
    table_html = TABLE_HTML.format('\n'.join(user_table))
    return render_template('index.html', users=users, table_html=table_html)


if __name__ == '__main__':
    app.run(debug=True)
    webbrowser.open('http://127.0.0.1:5000')
