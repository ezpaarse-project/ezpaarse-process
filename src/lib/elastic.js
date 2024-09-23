const {
  token,
  elasticURL,
} = require('./utils');

/**
 * @param {string} indexName
 *
 * @returns Is Exist
 */
async function checkPipelineExists(indexName) {
  try {
    const response = await fetch(`${elasticURL}/_ingest/pipeline/${indexName}-pipeline`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${token}`,
      },
    });

    if (response.status === 200) {
      console.info(`[elastic]: pipeline [${indexName}-pipeline] exist.`);
      return true;
    } if (response.status === 404) {
      return false;
    }
    console.error(`[elastic]: Cannot get if pipeline [${indexName}-pipeline] exist - ${response.status}`);
    return false;
  } catch (err) {
    console.error(`[elastic]: Cannot get if pipeline [${indexName}-pipeline] exist - ${err}`);
    return false;
  }
}

/**
 * Create pipeline
 *
 * @param {Object} pipeline Config of pipeline in JSON
 * @param {string} indexName Index name. the name of pipeline will be ${indexName}-pipeline
 *
 * @returns Is created
 */
async function createPipeline(pipeline, indexName) {
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
    console.error('[elastic]: Cannot create pipeline');
    return;
  }

  return true;
}

/**
 * @param {string} indexName
 *
 * @returns Is Exist
 */
async function checkIndexExists(indexName) {
  try {
    const response = await fetch(`${elasticURL}/${indexName}`, {
      method: 'HEAD',
      headers: {
        Authorization: `Basic ${token}`,
      },
    });

    if (response.status === 200) {
      console.info(`[elastic]: index [${indexName}] exist.`);
      return true;
    } if (response.status === 404) {
      return false;
    }
    console.error(`[elastic]: Cannot get if index [${indexName}] exist - ${response.status}`);
    return false;
  } catch (err) {
    console.error(`[elastic]: Cannot get if index [${indexName}] exist - ${err}`);
    return false;
  }
}

/**
 * Create mapping
 *
 * @param {Object} pipeline Mapping in JSON
 * @param {string} indexName
 *
 * @returns Is created
 */
async function createMapping(mapping, indexName) {
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
    console.error('[elastic]: Cannot create mapping');
    return;
  }

  return true;
}

module.exports = {
  checkPipelineExists,
  createMapping,
  checkIndexExists,
  createPipeline,
};
