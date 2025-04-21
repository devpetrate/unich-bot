const chalk = require('chalk');

function log(message, current = null, total = null, type = 'info') {
  const now = new Date();
  const timestamp = now
    .toLocaleString('en-GB')
    .replace(',', '')
    .replace(/\//g, '-');

  const index = current && total ? `[${current}/${total}]` : '';
  const prefix = chalk.gray(`[${timestamp}]`) + (index ? ` ${chalk.white(index)}` : '');

  let logText;

  switch (type) {
    case 'success':
      logText = chalk.green(`[✓] ${message}`);
      break;
    case 'error':
      logText = chalk.red(`[✗] ${message}`);
      break;
    case 'warning':
      logText = chalk.yellow(`[!] ${message}`);
      break;
    case 'process':
      logText = chalk.cyan(`[~] ${message}`);
      break;
    default:
      logText = chalk.white(`[?] ${message}`);
      break;
  }

  console.log(`${prefix} ${logText}`);
}

module.exports = { log };
