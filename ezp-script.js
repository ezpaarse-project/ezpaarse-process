const fs = require('fs');
const util = require('util');
const { spawn } = require('child_process');

const config = require("./config.json");

const archivesDir = process.env.ARCHIVES_DIR_PATH
const resultsDir = process.env.RESULTS_DIR_PATH
const ezpaarseHost = process.env.EZPAARSE_HOST

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

async function ezpProcess() {
  for (let i = 0; i < machines.length; i++) {
    const machine = machines[i];
    const jobs = config[machines[i]];

    for (let j = 0; j < jobs.length; j++) {
      console.log(`[ezp][${machine}][${portal}]: prepare command`);

      const job = jobs[j];
      const headers = job?.headers;
      const portal = job?.portal;

      const command = 'ezp';
      const args = [
        'bulk',
      ]

      // add headers
      for (const [key, value] of Object.entries(headers)) {
        args.push('-H');
        args.push(`'${key}: ${value}'`);
      }

      const source = `${archivesDir}/${machine}/${portal}/${year}/${year}-${month}`;
      const result = `${resultsDir}/${machine}/${portal}/${year}/${year}-${month}`;

      args.push('-h');
      args.push(ezpaarseHost);

      args.push(source);
      args.push(result);

      console.log(`[ezp][${machine}][${portal}]: ${command} ${args.join(' ')}`);

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
  await ezpProcess();
})();
