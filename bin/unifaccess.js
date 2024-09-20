const path = require('path');

const {
  archivesDir,
  resultsDir,
  checkArgs,
  createLogger,
  splitDate,
} = require('../lib/utils');

const {
  transformFile,
  enrichFileWithEzu,
  prepareFileForElastic,
  sendFileToElastic,
} = require('../lib/processLogJSON');

let logger;

const machine = 'vp-unif-access';
const portal = 'unifaccess';
const indexName = 'int_unifaccess-ezpaarse';

/**
 * Process unifAccess Log
 *
 * @param {Date} date Date of log files.
 */
async function processUnifAccess(date) {
  const {
    year,
    month,
    day,
  } = splitDate(date);

  const source = path.resolve(archivesDir, machine, portal, year, `${year}-${month}`);
  const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

  const baseFilename = `${machine}.${portal}.applis.${year}.${month}.${day}`;
  const sourceFilepath = path.resolve(source, `${baseFilename}.log.gz`);
  const transformUnifAccessFilepath = path.resolve(result, `${baseFilename}.tranform.jsonl`);
  const ezuUnifAccessFilepath = path.resolve(result, `${baseFilename}.ezu.jsonl`);
  const elasticUnifAccessFilepath = path.resolve(result, `${baseFilename}.ezmesure.jsonl`);

  logger = await createLogger('unifaccess');

  /**
   * Custom transformLogLine
   * @param {string} line Line to be transform
   *
   * @returns transformed line
   */
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

  let success = await transformFile(logger, machine, portal, sourceFilepath, transformUnifAccessFilepath, transformLogLine);
  if (success) { success = await enrichFileWithEzu(logger, machine, portal, transformUnifAccessFilepath, ezuUnifAccessFilepath); }
  if (success) { success = await prepareFileForElastic(logger, machine, portal, ezuUnifAccessFilepath, elasticUnifAccessFilepath); }
  if (success) { await sendFileToElastic(logger, machine, portal, elasticUnifAccessFilepath, indexName); }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const params = checkArgs(args);
  const paramDate = params.date ? new Date(params.date) : new Date();

  (async () => {
    await processUnifAccess(paramDate);
  })();
}

module.exports = processUnifAccess;
