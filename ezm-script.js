const fs = require('fs');
const util = require('util');
const { spawn } = require('child_process');

const config = require("./config.json");

const resultsDir = process.env.RESULTS_DIR_PATH
const ezmesureHost = process.env.EZMESURE_HOST

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const year = yesterday.getFullYear();
const month = String(yesterday.getMonth() + 1).padStart(2, '0');
const day = String(yesterday.getDate()).padStart(2, '0');

const logFileName = `${year}-${month}-${day}-ezp.log`;
const logFile = fs.createWriteStream(`./log/ezp/${logFileName}`, { flags: 'a' });

const errorLogFileName = `${year}-${month}-${day}-ezp.error.log`;
const errorLogFile = fs.createWriteStream(`./log/ezp/${errorLogFileName}`, { flags: 'a' });

console.log = function(...args) {
  logFile.write(util.format(...args) + '\n');
  process.stdout.write(util.format(...args) + '\n');
};

console.error = function(...args) {
  errorLogFile.write(util.format(...args) + '\n');
  process.stderr.write(util.format(...args) + '\n');
};

const machines = Object.keys(config)

async function ezmProcess() {
  for (let i = 0; i < machines.length; i++) {
    const machine = machines[i];
    const jobs = config[machines[i]];

    for (let j = 0; j < jobs.length; j++) {
      console.log(`[ezm][${machine}][${portal}]: prepare command`);

      const job = jobs[j];
      const logFileName = job?.logFileName;
    
      const command = 'ezm';
      const args = [
        'indices',
        'insert'
      ]

      const ecFile = `${resultsDir}/${machine}/${portal}/${year}/${year}-${month}/${logFileName}.${y}.${mois}.${jour}.ec.csv`;

      console.log(`[ezm][${machine}][${portal}]: ${command} ${args.join(' ')}`);

      try {
        await runShellCommand(command, args);
      } catch (err) {
        console.error(err);
      }
    }
  }
}


async function runShellCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: true });

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

(async () => {
  await ezmProcess();
})();
