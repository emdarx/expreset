addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const sitesListUrl = 'https://raw.githubusercontent.com/emdarx/expreset/main/list.txt';

  const sitesListResponse = await fetch(sitesListUrl);
  const sitesListText = await sitesListResponse.text();
  const sites = sitesListText.split('\n').map(site => site.trim()).filter(site => site !== '');

  const fetchOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Cloudflare-Health-Check/1.0; +https://developers.cloudflare.com/load-balancing/health-check)',
      'Content-Type': 'text/html; charset=utf-8'
    }
  };

  const report = {
    healthy: [],
    unhealthy: []
  };
  for (const site of sites) {
    const url = `https://${site}`;

    const pingResponse = await fetch(url, { method: 'HEAD', ...fetchOptions });
    if (!pingResponse.ok) {
      report.unhealthy.push({ site, message: `سایت قابل دسترسی نیست (${pingResponse.status})` });
      continue;
    }

    report.healthy.push(site);
  }

  const reportHtml = `
    <!DOCTYPE html>
<html>
  <head>
    <title>گزارش وضعیت سرورها</title>
    <style>
      #container {
        margin: 0 auto;
        text-align: center;
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        width: 50%;
      }

      h1 {
        color: #4d4d4d;
      }

      ul {
        list-style-type: none;
        padding: 0;
      }

      li {
        margin-bottom: 10px;
      }

      p {
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div id="container">
      <h1>گزارش وضعیت سرورها</h1>
      <p>تعداد سرورهای سالم: ${report.healthy.length}</p>
      <ul>
        ${report.healthy.map((site) => `<li>${site}</li>`).join("")}
      </ul>
      <p>تعداد سرورهای خراب: ${report.unhealthy.length}</p>
      <ul>
        ${report.unhealthy
          .map((site) => `<li>${site.site}: ${site.message}</li>`)
          .join("")}
      </ul>
    </div>
  </body>
</html>
  `;

  return new Response(reportHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
