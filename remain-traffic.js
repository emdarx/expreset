addEventListener('scheduled', event => {
  event.waitUntil(
    handleScheduledEvent()
  )
})

async function handleScheduledEvent() {
  const uuid='1E2782BB-AC2E-402F-A362-5A1C467D8051';
  const telegram_token='619362355555555555555555555555555555555555';
  const telegram_chat_id='00000000';
  const url = "https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid="+uuid;
  const response = await fetch(url);
  const json = await response.json();
  console.log(json);
  if (json.hasOwnProperty("remainingTraffic")) {
    const remaining_traffic = parseFloat(json.remainingTraffic);
    console.log(remaining_traffic);
    const message = `🌏 ترافیک باقی مانده: ${remaining_traffic} گیگابایت\n\n@Expreset Bronze سرویس`;
    const encoded_message = encodeURIComponent(message);
    const telegram_url = `https://api.telegram.org/bot${telegram_token}/sendMessage?chat_id=${telegram_chat_id}&text=${encoded_message}`;
    const telegram_response = await fetch(telegram_url);
    console.log(`Telegram API response: ${telegram_response.status}`);
  } else {
    console.log("Unable to find remaining traffic information in the response.");
  }
}
