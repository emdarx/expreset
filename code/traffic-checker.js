addEventListener('scheduled', event => {
  event.waitUntil(
    handleScheduledEvent()
  )
})

async function handleScheduledEvent() {
  const telegram_token = '1010101010101010101010101010101010101010101010101';
  const users_url = 'https://raw.githubusercontent.com/emdarx/expreset/main/user/list.txt';
  const users_response = await fetch(users_url);
  const users_text = await users_response.text();
  const users_list = users_text.split('\n').filter(Boolean);
  const eligible_users = [];
  for (const uuid of users_list) {
    const [telegram_id, user_uuid] = uuid.split(",");
    const url = `https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid=${user_uuid}`;
    const response = await fetch(url);
    const json = await response.json();
    if (json.hasOwnProperty('remainingTraffic')) {
      const remaining_traffic = parseFloat(json.remainingTraffic);
      if (remaining_traffic < 3) {
        eligible_users.push(user_uuid);
      }
    } else {
      console.log(`Unable to find remaining traffic information for UUID ${user_uuid} in the response.`);
    }
  }
  if (eligible_users.length > 0) {
    const message = `اشتراک های نیازمند تمدید:\n${eligible_users.join('\n')}`;
    const encoded_message = encodeURIComponent(message);
    const telegram_url = `https://api.telegram.org/bot${telegram_token}/sendMessage?chat_id=119626024&text=${encoded_message}`;
    const telegram_response = await fetch(telegram_url);
    console.log(`Telegram API response: ${telegram_response.status}`);
  }
}
