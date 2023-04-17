addEventListener('scheduled', event => {
  event.waitUntil(
    handleScheduledEvent()
  )
})

async function handleScheduledEvent() {
  const telegram_token = '00000000000000000000000000000000000000000000000';
  const users_url = 'https://raw.githubusercontent.com/emdarx/expreset/main/user/list.txt';
  const users_response = await fetch(users_url);
  const users_text = await users_response.text();
  const users_list = users_text.split('\n').filter(Boolean);
  for (const uuid of users_list) {
    const [telegram_id, user_uuid] = uuid.split(",");
    const display_uuid = user_uuid.split('-')[0];
    const url = `https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid=${user_uuid}`;
    const response = await fetch(url);
    const json = await response.json();
    if (json.hasOwnProperty('remainingTraffic')) {
      const remaining_traffic = parseFloat(json.remainingTraffic);
      const message = `ترافیک باقی مانده ${remaining_traffic} گیگابایت\n#${display_uuid}`;
      const encoded_message = encodeURIComponent(message);
      const telegram_url = `https://api.telegram.org/bot${telegram_token}/sendMessage?chat_id=${telegram_id}&text=${encoded_message}`;
      const telegram_response = await fetch(telegram_url);
      console.log(`Telegram API response for UUID ${user_uuid}: ${telegram_response.status}`);
    } else {
      console.log(`Unable to find remaining traffic information for UUID ${user_uuid} in the response.`);
    }
  }
}
