const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const zlib = require('zlib');
const readline = require('readline');
const crypto = require('crypto');

const {
  token,
  resultsDir,
  year,
  month,
  elasticURL,
  runShellCommand,
} = require('./utils');

const { addMessage } = require('./mail');

const ezunpaywallURL = process.env.EZUNPAYWALL_URL;
const ezunpaywallApikey = process.env.EZUNPAYWALL_APIKEY;

async function transformFile(logger, machine, portal, logFilePath, transformedFilepath, transformLogLine) {
  if (!await fs.existsSync(logFilePath)) {
    logger.error(`[script][${machine}][${portal}]: Log file [${logFilePath}] does not exist`);
    addMessage(`[script][${machine}][${portal}]:\nError: Log file [${logFilePath}] does not exist`, true);
    return;
  }

  let readStream;
  try {
    readStream = fs.createReadStream((logFilePath));
  } catch (err) {
    logger.error(`[script][${machine}][${portal}]: Cannot read log file [${logFilePath}]`);
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot read log file [${logFilePath}]`, true);
    return;
  }

  let decompressedStream;
  try {
    decompressedStream = readStream.pipe(zlib.createGunzip());
  } catch (err) {
    logger.error(`[script][${machine}][${portal}]: Cannot unzip log file [${readStream?.filename}]`);
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot unzip log file [${readStream?.filename}]`, true);
    return;
  }

  let writeStream;
  try {
    const result = path.resolve(resultsDir, machine, portal, year, `${year}-${month}`);
    await fsp.mkdir(result, { recursive: true });
    writeStream = fs.createWriteStream(transformedFilepath);
  } catch (err) {
    logger.error(`[script][${machine}][${portal}]: Cannot write in [${transformedFilepath}]`);
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot write in [${transformedFilepath}]`, true);
    return;
  }

  const rl = readline.createInterface({
    input: decompressedStream,
    crlfDelay: Infinity,
  });

  // eslint-disable-next-line no-restricted-syntax
  for await (const line of rl) {
    let parsedLine;
    try {
      parsedLine = JSON.parse(line);
    } catch (err) {
      logger.error(`[script][${machine}][${portal}]: Cannot parse [${line}] in JSON format`);
      addMessage(`[script][${machine}][${portal}]:\nError: Cannot parse [${line}] in JSON format`, true);
      return;
    }

    parsedLine = transformLogLine(parsedLine);

    const outputData = JSON.stringify(parsedLine);
    try {
      writeStream.write(`${outputData}\n`);
    } catch (err) {
      logger.error(`[script][${machine}][${portal}]: Cannot write in transform file [${outputData}]`);
      addMessage(`[script][${machine}][${portal}]:\nError: : Cannot write in transform file [${outputData}]`, true);
      return;
    }
  }
  logger.log(`[script][${machine}][${portal}]: transform log done`, true);
  return true;
}

async function ezuConfig(logger, machine, portal) {
  const command = 'ezu';
  const args1 = [
    'config',
  ];

  const args2 = [
    'config',
    '--set',
    'baseURL',
    ezunpaywallURL,
  ];

  const args3 = [
    'config',
    '--set',
    'apikey',
    ezunpaywallApikey,
  ];

  try {
    await runShellCommand(command, args1);
    await runShellCommand(command, args2);
    await runShellCommand(command, args3);
  } catch (err) {
    logger.error(err);
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot config ezu`, true);
    return;
  }

  logger.log(`[ezu][${machine}][${portal}]: config is set`);
  return true;
}

async function enrichFileWithEzu(logger, machine, portal, transformedFilepath, ezuEnrichedFilepath) {
  if (!await fs.existsSync(transformedFilepath)) {
    logger.error(`[script][${machine}][${portal}]: Transformed file [${transformedFilepath}] does not exist`);
    addMessage(`[script][${machine}][${portal}]:\nError: Transformed file [${transformedFilepath}] does not exist`, true);
    return;
  }

  const command = 'ezu';
  const args = [
    'enrich',
    'job',
    '--file',
    transformedFilepath,
    '--out',
    ezuEnrichedFilepath,
  ];

  logger.log(`[ezu][${machine}][${portal}]: ${command} ${args.join(' ')}`);

  try {
    await runShellCommand(command, args);
  } catch (err) {
    logger.error(err);
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot enrich with ezu`, true);
    return;
  }

  logger.log(`[ezu][${machine}][${portal}]: enrich done`);
  return true;
}

async function prepareFileForElastic(logger, machine, portal, ezuEnrichedFilepath, elasticFilepath, indexName) {
  if (!await fs.existsSync(ezuEnrichedFilepath)) {
    logger.error(`[script][${machine}][${portal}]: ezu enriched file [${ezuEnrichedFilepath}] does not exist`);
    addMessage(`[script][${machine}][${portal}]:\nError: ezu enriched file [${ezuEnrichedFilepath}] does not exist`, true);
    return;
  }

  let readStream;
  try {
    readStream = fs.createReadStream(ezuEnrichedFilepath);
  } catch (err) {
    logger.error(`[script][${machine}][${portal}]: Cannot read ezu enriched file [${ezuEnrichedFilepath}]`);
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot read ezu enriched file [${ezuEnrichedFilepath}]`, true);
    return;
  }

  let writeStream;
  try {
    writeStream = fs.createWriteStream(elasticFilepath);
  } catch (err) {
    logger.error(`[script][${machine}][${portal}]: Cannot write on elastic file [${elasticFilepath}]`);
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot write on elastic file [${elasticFilepath}]`, true);
    return;
  }

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  // eslint-disable-next-line no-restricted-syntax
  for await (const line of rl) {
    let parsedLine;
    try {
      parsedLine = JSON.parse(line);
    } catch (err) {
      logger.error(`[script][${machine}][${portal}]: Cannot parse [${line}] in JSON format`);
      addMessage(`[script][${machine}][${portal}]:\nError: Cannot parse [${line}] in JSON format`, true);
      return;
    }

    const id = crypto.createHash('sha1').update(line).digest('hex');

    // eslint-disable-next-line no-underscore-dangle
    parsedLine._id = id;

    try {
      writeStream.write(`${JSON.stringify({ index: { _index: indexName, _id: parsedLine._id } })}\n`);
      writeStream.write(`${line}\n`);
    } catch (err) {
      logger.error(`[script][${machine}][${portal}]: Cannot write [${line}] in elastic file [${elasticFilepath}]`);
      addMessage(`[script][${machine}][${portal}]:\nError: Cannot write [${line}] in elastic file [${elasticFilepath}]`, true);
      return;
    }
  }

  return true;
}

async function createPipeline(logger, machine, portal, pipeline, indexName) {
  try {
    await fetch(`${elasticURL}/_ingest/pipeline/${indexName}-pipeline`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-ndjson',
        Authorization: `Basic ${token}`,
      },
      body: pipeline,
    });
  } catch (err) {
    logger.error('[elastic]: Cannot create pipeline');
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot create pipeline`, true);
    return;
  }

  return true;
}

async function createMapping(logger, machine, portal, mapping, indexName) {
  try {
    await fetch(`${elasticURL}/${indexName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-ndjson',
        Authorization: `Basic ${token}`,
      },
      body: mapping,
    });
  } catch (err) {
    logger.error('[elastic]: Cannot create mapping');
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot create mapping`, true);
    return;
  }

  return true;
}

async function sendFileToElastic(logger, machine, portal, elasticFilepath, indexName) {
  if (!await fs.existsSync(elasticFilepath)) {
    logger.error(`[script][${machine}][${portal}]: Elastic file [${elasticFilepath}] does not exist`);
    addMessage(`[script][${machine}][${portal}]:\nError: Elastic file [${elasticFilepath}] does not exist`, true);
    return;
  }
  const fileContent = fs.readFileSync(elasticFilepath, 'utf-8');

  try {
    await fetch(`${elasticURL}/${indexName}/_bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        Authorization: `Basic ${token}`,
      },
      body: fileContent,
    });
  } catch (err) {
    logger.error('[elastic]: Cannot send data to elastic');
    addMessage(`[script][${machine}][${portal}]:\nError: Cannot bulk elastic`, true);
    return;
  }

  logger.log('[elastic]: Data successfully sent to Elasticsearch');
  addMessage(`[script][${machine}][${portal}]: OK`, false);
  return true;
}

module.exports = {
  transformFile,
  ezuConfig,
  enrichFileWithEzu,
  prepareFileForElastic,
  createMapping,
  createPipeline,
  sendFileToElastic,
};
