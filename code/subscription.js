const maxPerType = 300
const includeOriginalConfigs = 0
const onlyUseMyConfigs = 0
const subLinks = [
  "https://raw.githubusercontent.com/freefq/free/master/v2",
  "https://raw.githubusercontent.com/Pawdroid/Free-servers/main/sub",
  "https://raw.githubusercontent.com/aiboboxx/v2rayfree/main/v2",
  "https://raw.githubusercontent.com/AzadNetCH/Clash/main/V2Ray.txt",
  "https://raw.githubusercontent.com/vpei/Free-Node-Merge/main/o/node.txt"
]

const cnfLinks = [
  "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/sub_merge.txt",
  "https://raw.githubusercontent.com/awesome-vpn/awesome-vpn/master/all"
]
const myConfigs = [
// "vmess://ewogICAgImFkZCI6ICJtdG4uZXhwcmVzZXQuY2xpY2siLAogICAgImFpZCI6ICIwIiwKICAgICJob3N0IjogInNlcnZlcjExLmFtaXJkYXJrLmNsaWNrIiwKICAgICJpZCI6ICJhNDk0N2NkNS1iNTkxLTQ5MzgtOTM5Zi1lNWMxZWVlZjBlNmQiLAogICAgIm5ldCI6ICJ3cyIsCiAgICAicGF0aCI6ICIvdm1lc3MiLAogICAgInBvcnQiOiAiNDQzIiwKICAgICJwcyI6ICIiLAogICAgInNjeSI6ICJhdXRvIiwKICAgICJzbmkiOiAic2VydmVyMTEuYW1pcmRhcmsuY2xpY2siLAogICAgInRscyI6ICJ0bHMiLAogICAgInR5cGUiOiAiYXV0byIsCiAgICAidiI6ICIyIgp9Cg==",
// "vmess://...."
]
const cleanIPPerOperator = {
  AST: [],
  HWB: [],
  IRANCELL: [],
  MBT: [],
  HamraheAval: [],
  ADSL: ['mkh.expreset.click'],
  PRS: [],
  RighTel: [],
  SHT: [],
  ZTL: []
}

const addressList = [
  "discord.com",
  "cloudflare.com",
  "nginx.com",
  "cdnjs.com"
]

const fpList = [
  "chrome",
  "chrome",
  "chrome",
  "firefox",
  "safari",
  "edge",
  "ios",
  "android",
  "random",
  "random"
]

const alpnList = [
  "http/1.1",
  "h2,http/1.1",
  "h2,http/1.1"
]

var cleanIP = ''

export default {
  async fetch(request) {
    var url = new URL(request.url)
    var pathParts = url.pathname.replace(/^\/|\/$/g, "").split("/")
    var type = pathParts[0].toLowerCase()
    if (type == 'sub') {
      if (pathParts[1] !== undefined) {
        cleanIP = pathParts[1].toLowerCase().trim()
      }

      var configList = []
      if (!onlyUseMyConfigs) {
        for (var subLink of subLinks) {
          try {
            configList = configList.concat(await fetch(subLink).then(r => r.text()).then(a => atob(a)).then(t => t.split("\n")))
          } catch (e) { }
        }
        for (var cnfLink of cnfLinks) {
          try {
            configList = configList.concat(await fetch(cnfLink).then(r => r.text()).then(t => t.split("\n")))
          } catch (e) { }
        }
      }

      var vmessConfigList = configList.filter(cnf => (cnf.search("vmess://") == 0))
      var trojanConfigList = configList.filter(cnf => (cnf.search("trojan://") == 0))
      var ssConfigList = configList.filter(cnf => (cnf.search("ss://") == 0))
      var finalConfigList = []

      if (includeOriginalConfigs) {
        finalConfigList = finalConfigList.concat(getMultipleRandomElements(vmessConfigList, maxPerType))
      }

      var ipList = []
      if (cleanIP) {
        ipList = {GEN: [cleanIP]}
      } else {
        ipList = {...cleanIPPerOperator}
        Object.keys(ipList).forEach((k) => !ipList[k].length && delete ipList[k]);
      }
      if (!Object.keys(ipList)) {
        ipList = {COM: ['']}
      }

      for (var code in ipList) {
        for (var ip of ipList[code]) {
          finalConfigList = finalConfigList.concat(
            getMultipleRandomElements(
              vmessConfigList.map(decodeVmess).map(cnf => mixConfig(cnf, url, "vmess", ip, code)).filter(cnf => (!!cnf && cnf.id)).map(encodeVmess).filter(cnf => !!cnf),
              maxPerType
            )
          )
          if (myConfigs.length) {
            finalConfigList = finalConfigList.concat(
              myConfigs.map(decodeVmess).map(cnf => mixConfig(cnf, url, "vmess", ip, code)).filter(cnf => (!!cnf && cnf.id)).map(encodeVmess).filter(cnf => !!cnf)
            )
          }
        }
      }

      if (includeOriginalConfigs) {
        finalConfigList = finalConfigList.concat(getMultipleRandomElements(trojanConfigList, maxPerType))
        finalConfigList = finalConfigList.concat(getMultipleRandomElements(ssConfigList, maxPerType))
      }

      return new Response((finalConfigList.join("\n")));
    } else {
      var url = new URL(request.url)
      var newUrl = new URL("https://" + url.pathname.replace(/^\/|\/$/g, ""))
      return fetch(new Request(newUrl, request));
    }
  }
}

function encodeVmess(conf) {
  try {
    return "vmess://" + btoa(JSON.stringify(conf))
  } catch {
    return null
  }
}

function decodeVmess(conf) {
  try {
    return JSON.parse(atob(conf.substr(8)))
  } catch {
    return {}
  }
}

function mixConfig(conf, url, protocol, ip, operator) {
  try {
    if (conf.tls != "tls") {
      return {}
    }
    var addr = conf.sni
    if (!addr) {
      if (conf.add && !isIp(conf.add)) {
        addr = conf.add
      } else if (conf.host && !isIp(conf.host)) {
        addr = conf.host
      }
    }
    if (!addr) {
      return {}
    }
    conf.name = '@Expreset - ' + operator;
    conf.ps = conf.name
    conf.sni = url.hostname
    if (ip) {
      conf.add = ip
    } else {
      conf.add = addressList[Math.floor(Math.random() * addressList.length)]
    }

    if (protocol == "vmess") {
      conf.sni = url.hostname
      conf.host = url.hostname
      if (conf.path == undefined) {
        conf.path = ""
      }
      conf.path = "/" + addr + ":" + conf.port + "/" + conf.path.replace(/^\//g, "")
      conf.fp = fpList[Math.floor(Math.random() * fpList.length)]
      conf.alpn = alpnList[Math.floor(Math.random() * alpnList.length)]
      const ports = [443, 8443, 2053, 2083, 2087, 2096];
	  const randomPort = ports[Math.floor(Math.random() * ports.length)];
	  conf.port = randomPort;
    }
    return conf
  } catch (e) {
    return {}
  }
}

function getMultipleRandomElements(arr, num) {
  var shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, num)
}

function isIp(str) {
  try {
    if (str == "" || str == undefined) return false
    if (!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){2}\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-4])$/.test(str)) {
      return false
    }
    var ls = str.split('.')
    if (ls == null || ls.length != 4 || ls[3] == "0" || parseInt(ls[3]) === 0) {
      return false
    }
    return true
  } catch (e) { }
  return false
}
