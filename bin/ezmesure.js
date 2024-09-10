process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

const {
  resultsDir,
  ezmesureURL,
  token,
  config,
  machines: allMachine,
  checkArgs,
  createLogger,
  splitDate,
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
    const jobs = config[machines[i]];

    for (let j = 0; j < jobs.length; j += 1) {
      const job = jobs[j];
      const portal = job?.portal;

      // if portal is send in args
      if (requestedPortal && !requestedPortal.includes(portal)) {
        continue;
      }

      const logFileName = job?.logFileName;
      let indexName = `${job?.indexName}-${year}`;

      switch (indexName) {
        case 'istex':
          indexName = `${job?.indexName}_${indexName}_t${trimester}`;
          break;
        case 'panist':
          indexName = `${job?.indexName}_${indexName}_t${trimester}`;
          break;
        default:
          indexName = `${job?.indexName}-${year}`;
      }

      const ecFile = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`, `${logFileName}.${year}.${month}.${day}.ec.csv`);

      if (await fs.existsSync(ecFile)) {
        const fileContent = fs.readFileSync(ecFile);

        let response;

        try {
          response = await fetch(`${ezmesureURL}/api/logs/${indexName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/gzip',
              Authorization: `Bearer ${token}`,
            },
            body: fileContent,
          });
        } catch (err) {
          logger.error(`[ezmesure][${machine}][${portal}]: Cannot insert file [${ecFile}] on index [${indexName}]`);
          addMessage(`[ezmesure][${machine}][${portal}]:\nError: Cannot insert file [${ecFile}] on index [${indexName}]`, true);
        }

        if (response) {
          logger.log(`[ezmesure][${machine}][${portal}]: Insert file [${ecFile}] on index [${indexName}]`);
          addMessage(`[ezmesure][${machine}][${portal}]: OK`, false);
        }
      } else {
        logger.log(`[ezmesure][${machine}][${portal}]: ECs file [${ecFile}] not found`);
        addMessage(`[ezmesure][${machine}][${portal}]:\nError: ECs file [${ecFile}] not found`, true);
      }
    }
  }
}

async function processEzmesure(machines, requestedPortal, date) {
  logger = await createLogger('ezmesure');
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
