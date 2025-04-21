const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { generatePassword } = require('../utils/generator');
const config = require('../utils/config.json');
const { log } = require('../utils/logger');
const { makeUnichRequest } = require('./api');
const { fetchOtpFromHotmail } = require('./authhotmail');
const { getRandomProxy, getProxyAgent } = require('./proxy');

class UnichBot {
  constructor(refCode) {
    this.refCode = refCode;
    this.currentNum = 0;
    this.total = 0;
    this.projectRoot = path.join(__dirname, '..', '..');
  }

  // for capmonster
  // async solveCaptcha(gt, action) {
  //   for (let attempt = 0; attempt < 3; attempt++) {
  //     log(`Solving captcha for ${action} (Attempt ${attempt + 1}/3)...`, this.currentNum, this.total, 'process');

  //     try {
  //       const createRes = await makeUnichRequest({
  //         url: 'https://api.capmonster.cloud/createTask',
  //         data: {
  //           clientKey: config.capMonsterKey,
  //           task: {
  //             type: 'GeeTestTaskProxyless',
  //             websiteURL: 'https://unich.com/en/airdrop/sign-up',
  //             gt,
  //             version: '4'
  //           }
  //         }
  //       });

  //       const taskId = createRes.data.taskId;
  //       log(`Captcha task created. Task ID: ${taskId}`, this.currentNum, this.total, 'process');

  //       let pollCount = 0;
  //       while (pollCount < 20) {
  //         await new Promise(res => setTimeout(res, 5000));
  //         const result = await makeUnichRequest({
  //           url: 'https://api.capmonster.cloud/getTaskResult',
  //           data: { clientKey: config.capMonsterKey, taskId }
  //         });

  //         if (result.data.status === 'ready') {
  //           log(`Captcha solved for ${action}`, this.currentNum, this.total, 'success');
  //           return { ...result.data.solution, action };
  //         }
  //         pollCount++;
  //       }

  //       throw new Error('Captcha solving timed out');
  //     } catch (error) {
  //       log(`Captcha solve failed: ${error.message}`, this.currentNum, this.total, 'warning');
  //       log(`Waiting 10s before retrying captcha for ${action}...`, this.currentNum, this.total, 'process');
  //       await new Promise(res => setTimeout(res, 10000));
  //     }
  //   }

  //   throw new Error(`Captcha could not be solved after 3 attempts for ${action}`);
  // }

  async solveCaptcha(gt, action) {
    for (let attempt = 0; attempt < 3; attempt++) {
      log(`Solving captcha for ${action} (Attempt ${attempt + 1}/3)...`, this.currentNum, this.total, 'process');
  
      try {
        const createRes = await axios.post('https://api.2captcha.com/createTask', {
          clientKey: config.twoCaptchaKey,
          task: {
            type: 'GeeTestTaskProxyless',
            websiteURL: 'https://unich.com/en/airdrop/sign-up',
            version: 4,
            initParameters: {
              captcha_id: gt
            }
          }
        });
  
        const taskId = createRes.data.taskId;
        if (!taskId) throw new Error(createRes.data.errorDescription || 'No taskId returned');
  
        log(`Captcha task created. Task ID: ${taskId}`, this.currentNum, this.total, 'process');
  
        let pollCount = 0;
        while (pollCount < 20) {
          await new Promise(res => setTimeout(res, 5000));
          const result = await axios.post('https://api.2captcha.com/getTaskResult', {
            clientKey: config.twoCaptchaKey,
            taskId
          });
  
          if (result.data.status === 'ready') {
            log(`Captcha solved for ${action}`, this.currentNum, this.total, 'success');
            return {
              ...result.data.solution,
              action
            };
          }
  
          pollCount++;
        }
  
        throw new Error('Captcha solving timed out');
      } catch (error) {
        log(`Captcha solve failed: ${error.message}`, this.currentNum, this.total, 'warning');
        log(`Waiting 10s before retrying captcha for ${action}...`, this.currentNum, this.total, 'process');
        await new Promise(res => setTimeout(res, 10000));
      }
    }
  
    throw new Error(`Captcha could not be solved after 3 attempts for ${action}`);
  }
  


  async requestOtp(email, captcha) {
    const payload = {
      email: email.trim(),
      lot_number: captcha.lot_number,
      pass_token: captcha.pass_token,
      gen_time: captcha.gen_time.toString(),
      captcha_output: captcha.captcha_output,
      action: 'REGISTER'
    };

    const res = await makeUnichRequest({
      url: 'https://api.unich.com/airdrop/user/v1/auth/otp/request',
      data: payload
    });

    if (res.status === 201) {
      log('OTP requested successfully', this.currentNum, this.total, 'success');
      return true;
    }
    throw new Error(`OTP request failed: ${res.status}`);
  }

  async resolveOtp(email, otp, captcha) {
    const payload = {
      email: email.trim(),
      otp: otp.trim(),
      lot_number: captcha.lot_number,
      pass_token: captcha.pass_token,
      gen_time: captcha.gen_time.toString(),
      captcha_output: captcha.captcha_output
    };

    log(`Sending OTP resolve payload`, this.currentNum, this.total, 'process');

    const res = await makeUnichRequest({
      url: 'https://api.unich.com/airdrop/user/v1/auth/otp/resolve',
      data: payload
    });

    if (res.data?.data?.otpToken) {
      log('OTP resolved successfully', this.currentNum, this.total, 'success');
      return res.data.data.otpToken;
    }

    throw new Error(res.data?.message || 'OTP resolve failed');
  }

  async signUp(email, password, otpToken, captcha) {
    const payload = {
      email: email.trim(),
      password: password,
      otpToken: otpToken,
      lot_number: captcha.lot_number,
      pass_token: captcha.pass_token,
      gen_time: captcha.gen_time.toString(),
      captcha_output: captcha.captcha_output
    };
  
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await makeUnichRequest({
          url: 'https://api.unich.com/airdrop/user/v1/auth/sign-up',
          data: payload
        });
  
        if (res.status === 201 && res.data?.data?.accessToken) {
          log('Account created successfully', this.currentNum, this.total, 'success');
          return res.data.data.accessToken;
        }
  
        throw new Error(res.data?.message || 'Signup failed');
      } catch (err) {
        log(`Signup attempt ${attempt + 1} failed: ${err.message}`, this.currentNum, this.total, 'warning');
        if (attempt < 2) {
          log(`Waiting 10s before retrying sign-up...`, this.currentNum, this.total, 'process');
          await new Promise(res => setTimeout(res, 10000));
        }
      }
    }
  
    throw new Error('Signup failed after 3 attempts');
  }
  

  async applyReferral(authToken) {
    const payload = { code: this.refCode };

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await makeUnichRequest({
          url: 'https://api.unich.com/airdrop/user/v1/ref/refer-sign-up',
          data: payload,
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        if (res.status === 201) {
          log('Referral applied successfully', this.currentNum, this.total, 'success');
          return true;
        }

        throw new Error(res.data?.message || 'Referral failed');
      } catch (err) {
        log(`Referral attempt ${attempt + 1} failed: ${err.message}`, this.currentNum, this.total, 'warning');
        await new Promise(res => setTimeout(res, 10000));
      }
    }

    throw new Error('Referral application failed after 3 attempts');
  }

  async registerAccount(email, authToken) {
    const proxy = getRandomProxy();
    const ip = proxy?.split('@').pop().split(':')[0];
    const password = generatePassword();

    try {
      log(`Processing register account`, this.currentNum, this.total, 'process');
      log(`Email using: ${email}`, this.currentNum, this.total, 'success');
      log(`IP Using: ${ip || 'No proxy'}`, this.currentNum, this.total, 'success');

      const captchaRegister = await this.solveCaptcha(config.gt, 'REGISTER');
      await this.requestOtp(email, captchaRegister);

      await new Promise(res => setTimeout(res, 10000));

      const otp = await fetchOtpFromHotmail(email, authToken);
      log(`Resolving OTP ${otp}...`, this.currentNum, this.total, 'process');

      const captchaResolve = await this.solveCaptcha(config.gt, 'OTP_RESOLVE');
      const otpToken = await this.resolveOtp(email, otp, captchaResolve);

      await new Promise(res => setTimeout(res, 10000));

      log(`Completing registration...`, this.currentNum, this.total, 'process');
      const captchaSignup = await this.solveCaptcha(config.gt, 'SIGNUP');
      const accessToken = await this.signUp(email, password, otpToken, captchaSignup);

      await new Promise(res => setTimeout(res, 10000));

      await this.applyReferral(accessToken);

      const accountsPath = path.join(this.projectRoot, 'accounts.txt');
      fs.appendFileSync(accountsPath, `${email}:${password}\n`);
      log(`Registration completed successfully!`, this.currentNum, this.total, 'success');
      return true;
    } catch (error) {
      log(`Registration failed: ${error.message}`, this.currentNum, this.total, 'error');
      return false;
    }
  }

  static async processAccounts(emails, refCode) {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i++) {
      const bot = new UnichBot(refCode);
      bot.total = emails.length;
      bot.currentNum = i + 1;

      const { email, authToken } = emails[i];
      const result = await bot.registerAccount(email, authToken);

      result ? success++ : failed++;
      console.log('-------------------------------------------------------------------------------------');
      await new Promise(res => setTimeout(res, 10000)); // Cooldown between accounts
    }

    log(`${success} successful, ${failed} failed`, '', '', 'success');
    log(`Results saved in accounts.txt`, '', '', 'success');
  }
}

module.exports = { UnichBot };
