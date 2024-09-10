const fs = require('fs/promises');
const path = require('path');

const {
  resultsDir,
  config,
  machines: allMachine,
  splitDate,
  checkArgs,
  createLogger,
} = require('../lib/utils');

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
      const portal = job?.portal;
      const logFileName = job?.logFileName;

      // if portal is send in args
      if (requestedPortal && !requestedPortal.includes(portal)) {
        continue;
      }

      logger.log(`[ezp][${machine}][${portal}]: prepare command`);

      const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

      const ecFile = path.resolve(result, `${logFileName}.${year}.${month}.${day}.ec.csv`);
      const reportFile = path.resolve(result, `${logFileName}.${year}.${month}.${day}.report.json`);

      try {
        await fs.unlink(ecFile);
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.error(`File ${ecFile} does not exist`);
        } else {
          logger.error(`Error deleting file: ${error.message}`);
        }
      }

      try {
        await fs.unlink(reportFile);
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.error(`File ${reportFile} does not exist`);
        } else {
          logger.error(`Error deleting file: ${error.message}`);
        }
      }
    }
  }
}

async function removeResultEzp(machines, requestedPortal, date) {
  logger = await createLogger('removeEzpResult');
  await executeCommand(machines, requestedPortal, date);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const params = checkArgs(args);
  const paramMachine = params?.machine ? params.machine : allMachine;
  const paramPortal = params?.requestedPortal;
  const paramDate = params.date ? new Date(params.date) : new Date();

  (async () => {
    await removeResultEzp(paramMachine, paramPortal, paramDate);
  })();
}

module.exports = removeResultEzp;
