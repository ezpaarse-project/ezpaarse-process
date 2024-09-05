process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');

const {
  resultsDir,
  ezmesureURL,
  token,
  config,
  machines,
  requestedPortal,
  year,
  trimester,
  month,
  day,
  createLogger,
} = require('../lib/utils');

const { addMessage } = require('../lib/mail');

let logger;

async function executeCommand() {
  for (let i = 0; i < machines.length; i += 1) {
    const machine = machines[i];
    const jobs = config[machines[i]];

    for (let j = 0; j < jobs.length; j += 1) {
      const job = jobs[j];
      const portal = job?.portal;

      // if portal is send in args
      if (requestedPortal && portal !== requestedPortal) {
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

async function processEzmesure() {
  logger = await createLogger('ezmesure');
  await executeCommand();
}

if (require.main === module) {
  (async () => {
    await processEzmesure();
  })();
}

module.exports = processEzmesure;
