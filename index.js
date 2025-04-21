const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { UnichBot } = require('./src/classes/unich');
const { loadProxies } = require('./src/classes/proxy');
const { log } = require('./src/utils/logger');
const chalk = require('chalk');

console.clear();
console.log(`
██╗   ██╗███╗   ██╗██╗██╗ ██████╗██╗  ██╗
██║   ██║████╗  ██║██║██║██╔════╝██║ ██╔╝
██║   ██║██╔██╗ ██║██║██║██║     █████╔╝
██║   ██║██║╚██╗██║██║██║██║     ██╔═██╗
╚██████╔╝██║ ╚████║██║██║╚██████╗██║  ██╗
 ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝ ╚═════╝╚═╝  ╚═╝
   Unich Auto-Ref Bot | By DevPetrate
`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter your Unich referral code: ', async (code) => {
  rl.close();

  try {
    loadProxies();
    const bot = new UnichBot(code.trim());

    const emailsPath = path.join(bot.projectRoot, 'hotmails.txt');
    if (!fs.existsSync(emailsPath)) {
      throw new Error('Missing hotmails.txt');
    }

    const emails = fs.readFileSync(emailsPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [email, , , authToken] = line.trim().split(':');
        return { email, authToken };
      });

    log(`Running ${emails.length} accounts from hotmails.txt`, null, null, 'process');
    const proxies = fs.readFileSync(path.join(bot.projectRoot, 'proxies.txt'), 'utf-8')
      .split('\n')
      .filter(Boolean);
    log(`Loaded ${proxies.length} proxies from proxies.txt`, null, null, 'success');

    console.log(chalk.gray('-------------------------------------------------------------------------------------'));
    await UnichBot.processAccounts(emails, code.trim());
    console.log(chalk.gray('-------------------------------------------------------------------------------------'));
    log('Done!', null, null, 'success');
  } catch (err) {
    log(err.message, null, null, 'error');
    process.exit(1);
  }
});
