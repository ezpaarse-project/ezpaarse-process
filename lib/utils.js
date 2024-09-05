/* eslint-disable no-console */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn } = require('child_process');

const config = require('../config/config.json');

const archivesDir = process.env.ARCHIVES_DIR_PATH;
const resultsDir = process.env.RESULTS_DIR_PATH;
const ezmesureURL = process.env.EZMESURE_URL;
const ezpaarseHost = process.env.EZPAARSE_HOST;
const elasticURL = process.env.ELASTIC_URL;
const username = process.env.EZMESURE_ADMIN_USERNAME;
const password = process.env.EZMESURE_ADMIN_PASSWORD;
const token = Buffer.from(`${username}:${password}`).toString('base64');

let machines = Object.keys(config);
let requestedPortal;

let yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

let year = yesterday.getFullYear().toString();
let month = String(yesterday.getMonth() + 1).padStart(2, '0').toString();
let trimester = Math.ceil(month / 3);
let day = String(yesterday.getDate()).padStart(2, '0');

function setDate() {
  yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  year = yesterday.getFullYear().toString();
  month = String(yesterday.getMonth() + 1).padStart(2, '0').toString();
  trimester = Math.ceil(month / 3);
  day = String(yesterday.getDate()).padStart(2, '0');
}

function formatDate() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

const regexYear = /^[0-9]{4}$/;
const regexMonth = /^(0[1-9]|1[0-2])$/;
const regexDay = /^(0[1-9]|[12][0-9]|3[01])$/;

const argsAvailable = [
  'year',
  'month',
  'day',
  'machine',
  'portal',
];

// Args from node command
const args = process.argv.slice(2);

function filterByPortal(data, portalName) {
  const keys = Object.keys(data);
  // eslint-disable-next-line no-restricted-syntax
  for (const key of keys) {
    const hasPortal = data[key].some((item) => item.portal === portalName);

    if (hasPortal) {
      return key;
    }
  }
  return undefined;
}

args.forEach((arg) => {
  const [key, value] = arg.split('=');
  if (!argsAvailable.includes(key)) {
    console.error(`[${argsAvailable.join(', ')}] are available as args`);
    process.exit(1);
  }
  if (key === 'year') {
    if (!regexYear.test(value)) {
      console.log(`year [${value}] does not respect /^[0-9]{4}$/`);
      process.exit(1);
    }
    year = value;
  }
  if (key === 'month') {
    if (!regexMonth.test(value)) {
      console.log(`month [${value}] does not respect /^(0[1-9]|1[0-2])$/`);
      process.exit(1);
    }
    month = value;
    trimester = Math.ceil(month / 3);
  }

  if (key === 'day') {
    if (!regexDay.test(value)) {
      console.log(`day [${value}] does not respect /^(0[1-9]|[12][0-9]|3[01])$/`);
      process.exit(1);
    }
    day = value;
  }

  if (key === 'machine') {
    machines = machines.filter((machine) => machine === value);
    if (machines.length === 0) {
      console.error(`Machine [${value}] does not exit on config`);
      process.exit(1);
    }
  }
  if (key === 'portal') {
    const machine = filterByPortal(config, value);
    if (!machine) {
      console.error(`Portal [${value}] does not exit on config`);
      process.exit(1);
    }
    machines = [machine];
    requestedPortal = value;
  }
});

async function createLogger(type) {
  const dirLogPath = path.resolve(__dirname, '..', 'log', type);
  await fsp.mkdir(dirLogPath, { recursive: true });

  const logFileName = `${year}-${month}-${day}-${type}.log`;
  const logFile = fs.createWriteStream(path.resolve(dirLogPath, logFileName), { flags: 'a' });

  const errorLogFileName = `${year}-${month}-${day}-${type}.error.log`;
  const errorLogFile = fs.createWriteStream(path.resolve(dirLogPath, errorLogFileName), { flags: 'a' });

  const logger = {
    log: (message) => {
      const logMessage = message;
      console.log(logMessage);
      logFile.write(`[${formatDate()}]${logMessage.toString()}\n`);
    },
    error: (message) => {
      const errorMessage = message;
      console.error(errorMessage);
      errorLogFile.write(`${errorMessage.toString()}\n`);
      logFile.write(`[${formatDate()}]${errorMessage.toString()}\n`);
    },
  };

  return logger;
}

async function runShellCommand(command, attrs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, attrs, { shell: true });

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Error: ${code}`));
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  archivesDir,
  resultsDir,
  ezmesureURL,
  username,
  password,
  token,
  ezpaarseHost,
  elasticURL,
  config,
  machines,
  requestedPortal,
  yesterday,
  year,
  month,
  trimester,
  day,
  setDate,
  createLogger,
  formatDate,
  runShellCommand,
};
