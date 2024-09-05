const fs = require('fs');
const path = require('path');

const {
  archivesDir,
  resultsDir,
  ezpaarseHost,
  config,
  machines,
  requestedPortal,
  year,
  month,
  day,
  createLogger,
  runShellCommand,
} = require('../lib/utils');

const { addMessage } = require('../lib/mail');

let logger;

async function executeCommand() {
  for (let i = 0; i < machines.length; i += 1) {
    const machine = machines[i];
    const jobs = config[machines[i]];

    for (let j = 0; j < jobs.length; j += 1) {
      const job = jobs[j];
      const headers = job?.headers;
      const portal = job?.portal;
      const logFileName = job?.logFileName;

      // if portal is send in args
      if (requestedPortal && portal !== requestedPortal) {
        continue;
      }

      logger.log(`[ezp][${machine}][${portal}]: prepare command`);

      const command = 'ezp';
      const args = [
        'bulk',
      ];

      const source = path.resolve(archivesDir, machine, portal, year, `${year}-${month}`);
      const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

      const logFile = path.resolve(source, `${logFileName}.${year}.${month}.${day}.log.gz`);

      if (!await fs.existsSync(logFile)) {
        logger.log(`[ezp][${machine}][${portal}]: Log File [${logFile}] not found`);
        addMessage(`[ezp][${machine}][${portal}]:\nError: Log File [${logFile}] not found`, true);
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

      logger.log(`[ezp][${machine}][${portal}]: ${command} ${args.join(' ')}`);

      let success = false;

      try {
        success = await runShellCommand(command, args);
      } catch (err) {
        logger.error(err);
        addMessage(`[ezp][${machine}][${portal}]: \n Error in ezp`, true);
      }

      if (success) {
        logger.log(`[ezp][${machine}][${portal}]: logs have been processed`);
        addMessage(`[ezp][${machine}][${portal}]: OK`, false);
      }
    }
  }
}

async function processEzp() {
  logger = await createLogger('ezp');
  await executeCommand();
}

if (require.main === module) {
  (async () => {
    await processEzp();
  })();
}

module.exports = processEzp;
