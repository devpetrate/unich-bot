// src/classes/api.js
const axios = require('axios');
const { getRandomProxy, getProxyAgent } = require('./proxy');

async function makeUnichRequest({ method = 'POST', url, data, headers = {}, authToken = null }) {
  const proxy = getRandomProxy();
  const httpsAgent = proxy ? getProxyAgent(proxy) : undefined;

  const config = {
    method,
    url,
    data,
    httpsAgent,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Origin': 'https://unich.com',
      'Referer': 'https://unich.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...headers
    }
  };

  try {
    const res = await axios(config);
    return res;
  } catch (err) {
    console.error(`[!] Request to ${url} failed`, {
      message: err.message,
      response: err.response?.data
    });
    throw err;
  }
}

module.exports = { makeUnichRequest };

// src/classes/unich.js MODIFICATIONS
// Replace axios logic with:
// const { makeUnichRequest } = require('./api');
// Then in requestOtp, resolveOtp, signUp, applyReferral, use makeUnichRequest with appropriate params.

// Example: Replace this.makeRequest(...) with:
// await makeUnichRequest({ url: 'https://api.unich.com/airdrop/user/v1/auth/otp/request', data: payload });
