// src/classes/authhotmail.js
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { log } = require('../utils/logger');

async function fetchOtpFromHotmail(email, authToken) {
  const client = new ImapFlow({
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
    logger: false,
    auth: {
      user: email,
      accessToken: authToken
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    const folders = ['INBOX', 'Junk'];

    for (let attempt = 1; attempt <= 3; attempt++) {
      log(`Attempt ${attempt}/3`, '', '~');

      for (const folder of folders) {
        try {
          const lock = await client.getMailboxLock(folder);
          try {
            log(`Checking ${folder}...`, '', '~');

            const { exists } = await client.status(folder);
            if (exists === 0) continue;

            const messages = await client.search({
              since: new Date(Date.now() - 15 * 60 * 1000)
            });

            if (messages.length === 0) continue;

            const fetched = await client.fetch(messages.reverse(), {
              source: true,
              envelope: true
            });

            for await (const msg of fetched) {
              const parsed = await simpleParser(msg.source);
              const emailText = parsed.text || '';

              const otpMatch = emailText.match(/please enter the OTP\s*\n\s*(\d{6})\s*\n/i) ||
                               emailText.match(/(?:OTP|code)[:\s]*(\d{6})/i) ||
                               emailText.match(/(^|\s)(\d{6})($|\s)/);

              if (otpMatch) {
                const otp = (otpMatch[1] || otpMatch[2]).replace(/\D/g, '');
                if (otp.length === 6) {
                  log(`Found valid OTP: ${otp}`, '', '✓');
                  return otp;
                }
              }
            }
          } finally {
            lock.release();
          }
        } catch (folderError) {
          log(`Folder ${folder} error: ${folderError.message}`, '', '✗');
        }
      }

      if (attempt < 3) {
        log('Waiting 15s before next attempt...', '', '~');
        await new Promise(res => setTimeout(res, 15000));
      }
    }

    throw new Error('No valid OTP found after 3 attempts');
  } catch (err) {
    log(`Hotmail fetch failed: ${err.message}`, '', '✗');
    throw err;
  }
}

module.exports = { fetchOtpFromHotmail };
