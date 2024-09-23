/* eslint-disable no-console */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn } = require('child_process');

const config = require('../../config/config.json');

const archivesDir = process.env.ARCHIVES_DIR_PATH;
const resultsDir = process.env.RESULTS_DIR_PATH;
const ezmesureURL = process.env.EZMESURE_URL;
const ezpaarseHost = process.env.EZPAARSE_HOST;
const elasticURL = process.env.ELASTIC_URL;
const username = process.env.EZMESURE_USERNAME;
const password = process.env.EZMESURE_PASSWORD;
let token;

const machines = Object.keys(config);
const requestedPortal = [];

/**
 * Set token with username and password
 */
async function setEzmesureToken() {
  let loginResponse;

  try {
    loginResponse = await fetch(`${ezmesureURL}/api/login/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
  } catch (err) {
    console.error('[ezmesure]: Cannot get token');
  }

  if (loginResponse?.ok) {
    const headersLoginResponse = loginResponse.headers;
    const regexToken = /=(.*?);/;
    const userToken = headersLoginResponse.get('set-cookie').match(regexToken)[1];
    return userToken;
  }
}

function dateForLog() {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0').toString();
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Get year, month trimester, day of date
 *
 * @param {Date} newDate
 *
 * @returns year, month trimester, day of date
 */
function splitDate(newDate) {
  const year = newDate.getFullYear().toString();
  const month = String(newDate.getMonth() + 1).padStart(2, '0').toString();
  const trimester = Math.ceil(month / 3);
  const day = String(newDate.getDate()).padStart(2, '0');

  return {
    year,
    month,
    trimester,
    day,
  };
}

const argsAvailable = [
  'machines',
  'portals',
  'ezmesure',
  'ezp',
  'force',
  'unifAccess',
  'bibApi',
  'startDate',
  'endDate',
];

/**
 * Get name of machine for portal
 *
 * @param {Object} data ezpaarse-process config
 * @param {string} portalName
 *
 * @returns machine or undefined
 */
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

/**
 * Check if date exist, respect YYYY-mm-dd format and not in future.
 *
 * @param {string} date
 *
 * @returns Is valid
 */
function checkValidDate(date) {
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  if (!regex.test(date)) {
    console.error(`Date [${date}] is not at format YYYY-mm-dd`);
    process.exit(1);
  }

  const newDate = new Date(date);

  if (newDate >= new Date()) {
    console.error(`Date [${date}] Cannot be in future`);
    process.exit(1);
  }

  const [year, month, day] = date.split('-').map(Number);

  if (newDate.getFullYear() !== year || newDate.getMonth() + 1 !== month || newDate.getDate() !== day) {
    console.error(`Date [${date}] does not exist`);
    process.exit(1);
  }

  return true;
}

/**
 * Check if args is available and consistent
 *
 * @param {string[]} args
 *
 * @returns args
 */
function checkArgs(args) {
  const res = {
    machines,
    requestedPortal,
  };

  args.forEach((arg) => {
    const [key, value] = arg.split('=');
    if (!argsAvailable.includes(key)) {
      console.error(`[${argsAvailable.join(', ')}] are available as args`);
      process.exit(1);
    }

    if (key === 'machines') {
      const paramMachines = value.split(',');
      res.machines = paramMachines.filter((machine) => {
        if (!machines.includes(machine)) {
          console.error(`Machine [${machine}] does not exit on config`);
          process.exit(1);
        }
        return machines.includes(machine);
      });
    }
    if (key === 'portals') {
      const paramPortals = value.split(',');

      const portals = paramPortals.filter((portal) => {
        const machine = filterByPortal(config, portal);
        if (!machine) {
          console.error(`Portal [${portal}] does not exit on config`);
          process.exit(1);
        }
        res.machines.push(machine);
        return portal;
      });

      res.machines = [...new Set(res.machines)];
      res.requestedPortals = portals;
    }
    if (key === 'startDate') {
      checkValidDate(value);
      res.startDate = value;
    }
    if (key === 'endDate') {
      checkValidDate(value);
      res.endDate = value;
    }
    if (key === 'force') {
      res.force = true;
    }
    if (key === 'ezmesure') {
      res.ezmesure = true;
    }
    if (key === 'ezp') {
      res.ezp = true;
    }
    if (key === 'bibApi') {
      res.bibApi = true;
    }
    if (key === 'unifAccess') {
      res.unifAccess = true;
    }
  });
  return res;
}

/**
 * Create Logger for each command.
 *
 * @param {string} type Type of command.
 *
 * @returns Logger.
 */
async function createLogger(type) {
  const date = new Date();
  const { year, month, day } = splitDate(date);

  const dirLogPath = path.resolve(__dirname, '..', 'log', type);
  await fsp.mkdir(dirLogPath, { recursive: true });

  const baseFilename = `${year}-${month}-${day}-${type}.log`;
  const logFile = fs.createWriteStream(path.resolve(dirLogPath, baseFilename), { flags: 'a' });

  const errorbaseFilename = `${year}-${month}-${day}-${type}.error.log`;
  const errorLogFile = fs.createWriteStream(path.resolve(dirLogPath, errorbaseFilename), { flags: 'a' });

  const logger = {
    log: (message) => {
      const logMessage = message;
      console.log(logMessage);
      logFile.write(`[${new Date().toISOString()}]: ${logMessage.toString()}\n`);
    },
    error: (message) => {
      const errorMessage = message;
      console.error(errorMessage);
      errorLogFile.write(`${errorMessage.toString()}\n`);
      logFile.write(`[${new Date().toISOString()}]: ${errorMessage.toString()}\n`);
    },
  };

  return logger;
}

/**
 * Run command in shell.
 *
 * @param {string} command Command.
 * @param {string[]} attrs Args of command.
 *
 * @returns {Promise}
 */
async function runShellCommand(command, attrs) {
  console.log(`[command]: ${command} ${attrs.join(' ')}`);
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
  setEzmesureToken,
  checkArgs,
  createLogger,
  splitDate,
  dateForLog,
  runShellCommand,
};
