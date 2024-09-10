const { CronJob } = require('cron');

const timezone = process.env.TIMEZONE;
const schedule = process.env.CRON_SCHEDULE;

const processBibAPI = require('../bin/bibapi');
const processUnifAccess = require('../bin/unifaccess');
const processEzmesure = require('../bin/ezmesure');
const processEzp = require('../bin/ezp');
const processDev = require('../bin/dev');

const { sendMail } = require('./mail');
const { machines } = require('./utils');

async function task() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  await processEzp(machines, null, date);
  await processEzmesure(machines, null, date);
  await processBibAPI(date);
  await processUnifAccess(date);
  await sendMail(date);
}

const cron = new CronJob(schedule, task, null, false, timezone);

cron.start();
