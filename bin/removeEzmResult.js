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
      const baseFilename = job?.baseFilename;

      // if portal is send in args
      if (requestedPortal && !requestedPortal.includes(portal)) {
        continue;
      }

      logger.log(`[ezp][${machine}][${portal}]: prepare command`);

      const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

      const reportFile = path.resolve(result, `${baseFilename}.${year}.${month}.${day}.ec.report.ezm.json`);

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

async function removeEzmResult(machines, requestedPortal, date) {
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
    await removeEzmResult(paramMachine, paramPortal, paramDate);
  })();
}

module.exports = removeEzmResult;
