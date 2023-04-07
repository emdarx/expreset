addEventListener('scheduled', event => {
  event.waitUntil(
    handleScheduledEvent()
  )
})

async function handleScheduledEvent() {
  const githubUrl = 'https://raw.githubusercontent.com/emdarx/expreset/main/list.txt';
  const telegramToken = '6193623555555555555555555555555555555W2DY'; // توکن ربات تلگرام
  const telegramChatId = '00000000'; // آیدی عددی چت

  const response = await fetch(githubUrl);
  const text = await response.text();
  const servers = text.split('\n');
  const brokenServers = [];

  for (const server of servers) {
    const url = `https://${server}/`;
    const response = await fetch(url);

    if (response.status !== 200) {
      brokenServers.push(server);
    } else {
      const text = await response.text();
      if (text.includes('404 page not found')) {
        brokenServers.push(server);
      }
    }
  }

  if (brokenServers.length > 0) {
    const message = `❌ The following servers are down: ${brokenServers.join(', ')}`;
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${telegramChatId}&text=${message}`;
    const response = await fetch(url);
    console.log(`Telegram API response: ${response.status}`);
  } else {
    console.log('All servers are up.');
  }

  return true;
}
