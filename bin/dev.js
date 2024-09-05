const path = require('path');

const {
  archivesDir,
  resultsDir,
  year,
  month,
  day,
  createLogger,
} = require('../lib/utils');

const {
  transformFile,
  ezuConfig,
  enrichFileWithEzu,
  prepareFileForElastic,
  sendFileToElastic,
} = require('../lib/processLogJSON');

let logger;

const machine = 'machine2';
const portal = 'portal';
const indexName = 'json';

const source = path.resolve(archivesDir, machine, portal, year, `${year}-${month}`);
const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

const baseFilename = `${machine}.json.${year}.${month}.${day}`;
const sourceFilepath = path.resolve(source, `${baseFilename}.log.gz`);
const transformDevFilepath = path.resolve(result, `${baseFilename}.tranform.jsonl`);
const ezuDevFilepath = path.resolve(result, `${baseFilename}.ezu.jsonl`);
const elasticDevFilepath = path.resolve(result, `${baseFilename}.ezmesure.jsonl`);

async function processDev() {
  logger = await createLogger('machine2');

  const transformLogLine = (line) => {
    const copyLine = line;
    copyLine.datetime = line?.timestamp;
    return line;
  };

  let success = await ezuConfig(logger, machine, portal);
  if (success) { success = await transformFile(logger, machine, portal, sourceFilepath, transformDevFilepath, transformLogLine); }
  if (success) { success = await enrichFileWithEzu(logger, machine, portal, transformDevFilepath, ezuDevFilepath); }
  if (success) { success = await prepareFileForElastic(logger, machine, portal, ezuDevFilepath, elasticDevFilepath); }
  if (success) { await sendFileToElastic(logger, machine, portal, elasticDevFilepath, indexName); }
}

if (require.main === module) {
  (async () => {
    await processDev();
  })();
}

module.exports = processDev;
