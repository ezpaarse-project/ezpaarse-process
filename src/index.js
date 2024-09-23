const { CronJob } = require('cron');

const timezone = process.env.TIMEZONE;
const schedule = process.env.CRON_SCHEDULE;

const unifaccessPipeline = require('../config/unifaccess/pipeline.json');
const unifaccessMapping = require('../config/unifaccess/mapping.json');

const bibApiPipeline = require('../config/bibapi/pipeline.json');
const bibApiMapping = require('../config/bibapi/mapping.json');

const { setEzmesureToken } = require('./lib/utils');

const setEzuConfig = require('./lib/ezu');
const setEzmConfig = require('./lib/ezm');

const {
  checkPipelineExists,
  createPipeline,
  checkIndexExists,
  createMapping,
} = require('./lib/elastic');

const processBibAPI = require('./bin/bibapi');
const processUnifAccess = require('./bin/unifaccess');
const processEzmesure = require('./bin/ezm');
const processEzp = require('./bin/ezp');
// const processDev = require('./bin/dev');

const { sendMail } = require('./lib/mail');
const { machines } = require('./lib/utils');

/**
 * Task call in cron
 */
async function task() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  await processEzp(machines, null, date, false);
  await processEzmesure(machines, null, date);
  await processBibAPI(date);
  await processUnifAccess(date);
  await sendMail(date);
}

const cron = new CronJob(schedule, task, null, false, timezone);

(async () => {
  // Setup bibApi pipeline
  const indexNameBibApi = 'int_bibapi-ezpaarse';
  const isBibApiPipelineExist = checkPipelineExists(indexNameBibApi);
  if (!isBibApiPipelineExist) {
    await createPipeline(unifaccessPipeline, indexNameBibApi);
  }
  // Setup bibApi mapping
  const isBibApiIndexExist = checkIndexExists(indexNameBibApi);
  if (!isBibApiIndexExist) {
    await createMapping(unifaccessMapping, indexNameBibApi);
  }

  // Setup unifAccess pipeline
  const indexNameUnifAccess = 'int_unifaccess-ezpaarse';
  const isUnifAccessPipelineExist = checkPipelineExists(indexNameUnifAccess);
  if (!isUnifAccessPipelineExist) {
    await createPipeline(bibApiPipeline);
  }
  // Setup unifAccess mapping
  const isUnifAccessIndexExist = checkIndexExists(indexNameUnifAccess);
  if (!isUnifAccessIndexExist) {
    await createMapping(bibApiMapping);
  }

  await setEzuConfig();
  await setEzmConfig();

  await setEzmesureToken();

  if (process.env.NODE_ENV === 'development') {
    task();
  }

  cron.start();
})();
