# 🦄 Unich Auto-Ref Bot

Welcome to the **Unich Auto-Ref Bot**, an automated system designed to handle Unich account registrations and referral submissions with ease.

> Developed with 💻 by **DevPetrate**

---

## 📌 About Unich

[Unich](https://unich.com) is a platform that provides crypto users with airdrops and referral-based rewards. This bot helps automate the process of:

- Registering new Unich accounts
- Resolving OTPs from Hotmail
- Signing up automatically
- Applying your referral code on each successful registration

---

## 🚀 Features

- Fully automated Unich sign-up process
- Hotmail IMAP OTP retrieval
- Captcha solving via CapMonster
- Rotating proxy support
- Logs with colored output
- Retry mechanism for reliability

---

## ⚙️ Requirements

Before running the bot, make sure the following are ready:

### 📁 `config.json`

Get CapMonster Api Key: https://capmonster.cloud/Dashboard

A config file is required in the `src/utils/` directory with your CapMonster API key:

```json
{
  "twoCaptchaKey": "YOUR_2CAPTCHA_API_KEY",
  "capMonsterKey": "YOUR_CAPMONSTER_API_KEY",
  "gt": "e7baa772ac1ae5dceccd7273ad5f57bd"
}
```

### 📁 `hotmails.txt Setup`
Create a file named `hotmails.txt` in the root folder with one Hotmail per line, using the format below:

```
email:password:refresh_token:auth_token:client_id
sampleemail@hotmail.com:YourPass123:refreshTokenXYZ:authTokenABC:clientIdDEF
```

### 📁 `Installation` 

Clone This Repository
```
git clone https://github.com/devpetrate/unich-bot
cd unich-bot
```

### 📁 `Installation` Install Dependencies

```
npm install
```

### ▶️  `Run the Bot` 
Start the bot using:

``` bash
npm start
```

You will be prompted to enter your referral code.

✅ Use this referral code: `petrate`


### 💾 `Output`
Successfully created accounts will be saved in:

`accounts.txt`

Format:
```
email:password
```

