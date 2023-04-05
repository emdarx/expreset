addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const serverListUrl = 'https://raw.githubusercontent.com/emdarx/expreset/main/list.txt';
  const serverListResponse = await fetch(serverListUrl);
  const serverListText = await serverListResponse.text();
  const serverList = serverListText.split('\n');
  
  for (let i = serverList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [serverList[i], serverList[j]] = [serverList[j], serverList[i]];
  }
  
  const selectedServer = serverList[Math.floor(Math.random() * serverList.length)];
  
  const url = new URL(request.url);
  url.host = selectedServer;
  
  return fetch(url, request);
}
