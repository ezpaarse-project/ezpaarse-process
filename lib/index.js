const { CronJob } = require('cron');

const timezone = process.env.TIMEZONE;
const schedule = process.env.CRON_SCHEDULE;

const processBibAPI = require('../bin/bibapi');
const processUnifAccess = require('../bin/unifaccess');
const processEzmesure = require('../bin/ezmesure');
const processEzp = require('../bin/ezp');
const processDev = require('../bin/dev');

const { sendMail } = require('./mail');
const { setDate } = require('./utils');

async function task() {
  setDate();
  if (process.env.NODE_ENV === 'production') {
    await processEzp();
    await processEzmesure();
    await processBibAPI();
    await processUnifAccess();
  } else {
    await processEzp();
    await processEzmesure();
    await processDev();
  }
  await sendMail();
}

task();

const cron = new CronJob(schedule, task, null, false, timezone);

cron.start();
