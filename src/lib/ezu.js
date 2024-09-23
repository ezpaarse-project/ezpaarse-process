const ezunpaywallURL = process.env.EZUNPAYWALL_URL;
const ezunpaywallApikey = process.env.EZUNPAYWALL_APIKEY;

const { runShellCommand } = require('./utils');

/**
 * @returns Is set
 */
async function setEzuConfig() {
  const command = 'ezu';
  const args1 = [
    'config',
  ];

  const args2 = [
    'config',
    '--set',
    'baseURL',
    ezunpaywallURL,
  ];

  const args3 = [
    'config',
    '--set',
    'apikey',
    ezunpaywallApikey,
  ];

  try {
    await runShellCommand(command, args1);
    await runShellCommand(command, args2);
    await runShellCommand(command, args3);
  } catch (err) {
    console.error('[ezu]: config is not set');
    return;
  }

  console.log('[ezu]: config is set');
  return true;
}

module.exports = setEzuConfig;
