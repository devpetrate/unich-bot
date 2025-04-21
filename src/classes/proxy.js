const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');

let proxies = [];

function loadProxies(path = './proxies.txt') {
  if (fs.existsSync(path)) {
    const data = fs.readFileSync(path, 'utf-8');
    proxies = data.split('\n').map(p => p.trim()).filter(Boolean);
  } else {
    console.warn('[!] proxies.txt not found.');
  }
}

function getRandomProxy() {
  if (proxies.length === 0) return null;
  const index = Math.floor(Math.random() * proxies.length);
  return proxies[index];
}

function getProxyAgent(proxy) {
  if (!proxy) return null;
  return new HttpsProxyAgent(proxy); // Assume full format
}

module.exports = {
  loadProxies,
  getRandomProxy,
  getProxyAgent
};