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

async function executeCommand(machines, requestedPortal, date) {
  const {
    year,
    month,
    day,
  } = splitDate(date);

  for (let i = 0; i < machines.length; i += 1) {
    const machine = machines[i];
    const jobs = config[machines[i]];

    for (let j = 0; j < jobs.length; j += 1) {
      const job = jobs[j];
      const headers = job?.headers;
      const portal = job?.portal;
      const logFileName = job?.logFileName;

      // if portal is send in args
      if (requestedPortal && !requestedPortal.includes(portal)) {
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

async function processEzp(machines, requestedPortal, date) {
  logger = await createLogger('ezp');
  await executeCommand(machines, requestedPortal, date);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const params = checkArgs(args);
  const paramMachine = params?.machine ? params.machine : allMachine;
  const paramPortal = params?.requestedPortal;
  const paramDate = params.date ? new Date(params.date) : new Date();

  (async () => {
    await processEzp(paramMachine, paramPortal, paramDate);
  })();
}

module.exports = processEzp;
