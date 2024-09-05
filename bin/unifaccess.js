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

const pipeline = require('../config/unifaccess/pipeline.json');
const mapping = require('../config/unifaccess/mapping.json');

let logger;

const machine = 'vp-unif-access';
const portal = 'unifaccess';
const indexName = 'int_unifaccess-ezpaarse';

const source = path.resolve(archivesDir, machine, portal, year, `${year}-${month}`);
const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

const baseFilename = `${machine}.${portal}.applis.${year}.${month}.${day}`;
const sourceFilepath = path.resolve(source, `${baseFilename}.log.gz`);
const transformUnifAccessFilepath = path.resolve(result, `${baseFilename}.tranform.jsonl`);
const ezuUnifAccessFilepath = path.resolve(result, `${baseFilename}.ezu.jsonl`);
const elasticUnifAccessFilepath = path.resolve(result, `${baseFilename}.ezmesure.jsonl`);

async function processUnifAccess() {
  logger = await createLogger('unifaccess');

  const transformLogLine = (line) => {
    const copyLine = line;
    copyLine.datetime = copyLine?.timestamp;
    copyLine.source = copyLine?.source?.toUpperCase();
    copyLine.userAgent = copyLine?.userAgent?.toString();
    if (copyLine?.urlOrigine) {
      const { 2: domain } = copyLine.urlOrigine.split('/');
      copyLine.domain = domain;
    }

    if (copyLine?.sourcesOption) {
      copyLine.sourcesOptionSize = copyLine.sourcesOption.length;
    }
    return copyLine;
  };

  let success = await ezuConfig(logger, machine, portal);
  if (success) { success = await transformFile(logger, machine, portal, sourceFilepath, transformUnifAccessFilepath, transformLogLine); }
  if (success) { success = await enrichFileWithEzu(logger, machine, portal, transformUnifAccessFilepath, ezuUnifAccessFilepath); }
  if (success) { success = await prepareFileForElastic(logger, machine, portal, ezuUnifAccessFilepath, elasticUnifAccessFilepath); }
  if (success) { success = await createPipeline(logger, machine, portal, pipeline, indexName); }
  if (success) { success = await createMapping(logger, machine, portal, mapping, indexName); }
  if (success) { await sendFileToElastic(logger, machine, portal, elasticUnifAccessFilepath, indexName); }
}

if (require.main === module) {
  (async () => {
    await processUnifAccess();
  })();
}

module.exports = processUnifAccess;
