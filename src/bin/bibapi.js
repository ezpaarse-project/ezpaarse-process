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

const machine = 'vpportail';
const portal = 'bibapi';
const indexName = 'int_bibapi-ezpaarse';

/**
 * Process BibAPI Log
 *
 * @param {Date} date Date of log files.
 */
async function processBibAPI(date) {
  const {
    year,
    month,
    day,
  } = splitDate(date);

  const source = path.resolve(archivesDir, machine, portal, year, `${year}-${month}`);
  const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);

  const baseFilename = `${machine}.${portal}.applis.${year}.${month}.${day}`;
  const sourceFilepath = path.resolve(source, `${baseFilename}.log.gz`);
  const transformBibAPIFilepath = path.resolve(result, `${baseFilename}.tranform.jsonl`);
  const ezuBibAPIFilepath = path.resolve(result, `${baseFilename}.ezu.jsonl`);
  const elasticBibAPIFilepath = path.resolve(result, `${baseFilename}.ezmesure.jsonl`);

  logger = await createLogger('bibapi');

  /**
   * Custom transformLogLine
   * @param {string} line Line to be transform
   *
   * @returns transformed line
   */
  const transformLogLine = (line) => {
    const copyLine = line;
    copyLine.datetime = line?.timestamp;
    copyLine.domaine = line?.domaine?.toUpperCase();
    return copyLine;
  };

  let success = await transformFile(logger, machine, portal, sourceFilepath, transformBibAPIFilepath, transformLogLine);
  if (success) { success = await enrichFileWithEzu(logger, machine, portal, transformBibAPIFilepath, ezuBibAPIFilepath); }
  if (success) { success = await prepareFileForElastic(logger, machine, portal, ezuBibAPIFilepath, elasticBibAPIFilepath); }
  if (success) { await sendFileToElastic(logger, machine, portal, elasticBibAPIFilepath, indexName); }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const params = checkArgs(args);
  const paramDate = params.date ? new Date(params.date) : new Date();

  (async () => {
    await processBibAPI(paramDate);
  })();
}

module.exports = processBibAPI;
