This resource provides users with a list of VIP servers accessible by v2ray clients.

UUID for VIP Servers: a7df0287-3541-4a54-919e-27425e27131b


first put this code on your Cloudflare Workers:

```
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const serverListUrl = 'https://raw.githubusercontent.com/amirhmz/v2ray-vip/main/servers.txt';
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
```
