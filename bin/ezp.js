const fs = require('fs');
const path = require('path');

const {
  archivesDir,
  resultsDir,
  ezpaarseHost,
  config,
  machines: allMachine,
  checkArgs,
  createLogger,
  splitDate,
  runShellCommand,
} = require('../lib/utils');

const { addMessage } = require('../lib/mail');

let logger;

/**
 * @param {string[]} machines Array of machines name
 * @param {string[]} requestedPortal Array of portals name
 * @param {Date} date Date of log files
 * @param {Boolean} force Overwrites existing results
 */
async function executeCommand(machines, requestedPortal, date, force) {
  const {
    year,
    month,
    day,
  } = splitDate(date);

  for (let i = 0; i < machines.length; i += 1) {
    const machine = machines[i];
    const portals = config[machines[i]];

    for (let j = 0; j < portals.length; j += 1) {
      const portal = portals[j];
      const headers = portal?.headers;
      const portalName = portal?.portal;
      const baseFilename = portal?.baseFilename;

      // if portal is send in args
      if (requestedPortal && !requestedPortal.includes(portalName)) {
        continue;
      }

      logger.log(`[ezp][${machine}][${portalName}]: prepare command`);

      const command = 'ezp';
      const args = [
        'bulk',
      ];

      const source = path.resolve(archivesDir, machine, portalName, year, `${year}-${month}`);
      const result = path.resolve(resultsDir, machine, portalName, year, `${year}-${month}`);

      const logFile = path.resolve(source, `${baseFilename}.${year}.${month}.${day}.log.gz`);

      if (!await fs.existsSync(logFile)) {
        logger.log(`[ezp][${machine}][${portalName}]: Log File [${logFile}] not found`);
        addMessage(`[ezp][${machine}][${portalName}]:\nError: Log File [${logFile}] not found`, true);
        continue;
      }

      if (headers) {
        // add headers
        Object.entries(headers).forEach(([key, value]) => {
          args.push('-H');
          args.push(`'${key}: ${value}'`);
        });
      }

      args.push('-h');
      args.push(ezpaarseHost);
      args.push(source);
      args.push(result);

      if (force) {
        args.push('-f');
      }

      try {
        await runShellCommand(command, args);
        logger.log(`[ezp][${machine}][${portalName}]: logs have been processed`);
        addMessage(`[ezp][${machine}][${portalName}]: OK`, false);
      } catch (err) {
        logger.error(err);
        addMessage(`[ezp][${machine}][${portalName}]: \n Error in ezp`, true);
      }
    }
  }
}

/**
 * @param {string[]} machines Array of machines name
 * @param {string[]} requestedPortal Array of portals name
 * @param {Date} date Date of log files
 * @param {Boolean} force Overwrites existing results
 */
async function processEzp(machines, requestedPortal, date, force) {
  logger = await createLogger('ezp');
  await executeCommand(machines, requestedPortal, date, force);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const params = checkArgs(args);
  const paramMachine = params?.machine ? params.machine : allMachine;
  const paramPortal = params?.requestedPortal;
  const paramDate = params.date ? new Date(params.date) : new Date();
  const paramForce = params?.force;

  (async () => {
    await processEzp(paramMachine, paramPortal, paramDate, paramForce);
  })();
}

module.exports = processEzp;
