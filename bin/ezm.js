process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

const {
  resultsDir,
  config,
  machines: allMachine,
  checkArgs,
  createLogger,
  splitDate,
} = require('../lib/utils');

const {
  runShellCommand,
} = require('../lib/utils');

const { addMessage } = require('../lib/mail');

let logger;

async function executeCommand(machines, requestedPortal, date) {
  const {
    year,
    month,
    day,
    trimester,
  } = splitDate(date);

  for (let i = 0; i < machines.length; i += 1) {
    const machine = machines[i];
    const portals = config[machines[i]];

    for (let j = 0; j < portals.length; j += 1) {
      const portal = portals[j];
      const portalName = portal?.portal;

      // if portal is send in args
      if (requestedPortal && !requestedPortal.includes(portalName)) {
        continue;
      }

      const baseFilename = portal?.baseFilename;
      let indexName = `${portal?.indexName}-${year}`;

      switch (indexName) {
        case 'istex':
          indexName = `${portal?.indexName}_${indexName}_t${trimester}`;
          break;
        case 'panist':
          indexName = `${portal?.indexName}_${indexName}_t${trimester}`;
          break;
        default:
          indexName = `${portal?.indexName}-${year}`;
      }

      const ecFile = path.resolve(resultsDir, machine, portalName, year, `${year}-${month}`, `${baseFilename}.${year}.${month}.${day}.ec.csv`);

      if (!await fs.existsSync(ecFile)) {
        logger.log(`[ezm][${machine}][${portalName}]: ECs file [${ecFile}] not found`);
        addMessage(`[ezm][${machine}][${portalName}]:\nError: ECs file [${ecFile}] not found`, true);
        continue;
      }

      const command = 'ezm';
      const args = [
        'indices',
        'insert',
        indexName,
        ecFile,
      ];

      try {
        await runShellCommand(command, args);
        logger.log(`[ezm][${machine}][${portalName}]: Insert file [${ecFile}] on index [${indexName}]`);
        addMessage(`[ezm][${machine}][${portalName}]: OK`, false);
      } catch (err) {
        logger.error(err);
        addMessage(`[ezm][${machine}][${portalName}]: \n Error in ezm`, true);
      }
    }
  }
}

async function processEzmesure(machines, requestedPortal, date) {
  logger = await createLogger('ezm');
  await executeCommand(machines, requestedPortal, date);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const params = checkArgs(args);
  const paramMachine = params?.machine ? params.machine : allMachine;
  const paramPortal = params?.requestedPortal;
  const paramDate = params.date ? new Date(params.date) : new Date();

  (async () => {
    await processEzmesure(paramMachine, paramPortal, paramDate);
  })();
}

module.exports = processEzmesure;
