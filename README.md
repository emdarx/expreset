اینترنت آزاد برای همه یا هیچکس ...
سپاس از اساتید @iSegaro و @vfarid


ابتدا یک ورکر در کلادفلر بسازید و کد زیر را در ورکر قرار دهید

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

سپس کانفیگ خود را بصورت زیر در کلاینت ایجاد کنید

![image](https://user-images.githubusercontent.com/16276003/229743960-3481a69e-d919-4109-a719-246166ed301a.png)

UUID: a7df0287-3541-4a54-919e-27425e27131b
