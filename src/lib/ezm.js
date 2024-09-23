const ezmesureURL = process.env.EZMESURE_URL;
const token = require('./utils');

const { runShellCommand } = require('./utils');

/**
 * @returns Is set
 */
async function setEzmConfig() {
  const command = 'ezm';
  const args1 = [
    'config',
    'set',
    'token',
    token,
  ];

  const args2 = [
    'config',
    'set',
    'baseUrl',
    ezmesureURL,
  ];

  try {
    await runShellCommand(command, args1);
    await runShellCommand(command, args2);
  } catch (err) {
    console.error('[ezm]: config is not set');
    return;
  }

  console.log('[ezm]: config is set');
  return true;
}

module.exports = setEzmConfig;
