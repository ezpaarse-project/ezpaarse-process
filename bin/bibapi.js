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
  createMapping,
  createPipeline,
  sendFileToElastic,
} = require('../lib/processLogJSON');

const pipeline = require('../config/bibapi/pipeline.json');
const mapping = require('../config/bibapi/mapping.json');

let logger;

const machine = 'vpportail';
const portal = 'bibapi';
const indexName = 'int_bibapi-ezpaarse';

const source = path.resolve(archivesDir, machine, portal, year, `${year}-${month}`);
const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

const baseFilename = `${machine}.${portal}.applis.${year}.${month}.${day}`;
const sourceFilepath = path.resolve(source, `${baseFilename}.log.gz`);
const transformBibAPIFilepath = path.resolve(result, `${baseFilename}.tranform.jsonl`);
const ezuBibAPIFilepath = path.resolve(result, `${baseFilename}.ezu.jsonl`);
const elasticBibAPIFilepath = path.resolve(result, `${baseFilename}.ezmesure.jsonl`);

async function processBibAPI() {
  logger = await createLogger('bibapi');

  const transformLogLine = (line) => {
    const copyLine = line;
    copyLine.datetime = line?.timestamp;
    copyLine.domaine = line?.domaine?.toUpperCase();
    return copyLine;
  };

  let success = await ezuConfig(logger, machine, portal);
  if (success) { success = await transformFile(logger, machine, portal, sourceFilepath, transformBibAPIFilepath, transformLogLine); }
  if (success) { success = await enrichFileWithEzu(logger, machine, portal, transformBibAPIFilepath, ezuBibAPIFilepath); }
  if (success) { success = await prepareFileForElastic(logger, machine, portal, ezuBibAPIFilepath, elasticBibAPIFilepath); }
  if (success) { success = await createPipeline(logger, machine, portal, pipeline, indexName); }
  if (success) { success = await createMapping(logger, machine, portal, mapping, indexName); }
  if (success) { await sendFileToElastic(logger, machine, portal, elasticBibAPIFilepath, indexName); }
}

if (require.main === module) {
  (async () => {
    await processBibAPI();
  })();
}

module.exports = processBibAPI;
