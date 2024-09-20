const processBibAPI = require('./bibapi');
const processUnifAccess = require('./unifaccess');
const processEzmesure = require('./ezm');
const processEzp = require('./ezp');
const { sendMail } = require('../lib/mail');

const { machines: allMachine, checkArgs } = require('../lib/utils');

const removeEzmResult = require('./removeEzmResult');

/**
 * Returns all dates between two dates in yyyy-mm-dd format.
 *
 * @param {string} startDate Start date in yyyy-mm-dd format.
 * @param {string} endDate End date in yyyy-mm-dd format.
 *
 * @returns {string[]} Array of dates in yyyy-mm-dd format.
 */
function getDatesBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray = [];

  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    const year = dt.getFullYear();
    const month = (`0${dt.getMonth() + 1}`).slice(-2);
    const day = (`0${dt.getDate()}`).slice(-2);
    dateArray.push(`${year}-${month}-${day}`);
  }

  return dateArray;
}

if (require.main === module) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const args = process.argv.slice(2);
  const params = checkArgs(args);
  const paramMachines = params?.machines ? params?.machines : allMachine;
  const paramPortal = params?.requestedPortals;
  const paramStartDate = params.startDate ? new Date(params.startDate) : yesterday;
  const paramEndDate = params.endDate ? new Date(params.endDate) : yesterday;
  const paramEzmesure = params.ezmesure;
  const paramEzp = params.ezp;
  const paramBibApi = params.bibApi;
  const paramUnifAccess = params.unifAccess;

  const dates = getDatesBetween(paramStartDate, paramEndDate);

  console.log('Machines:', paramMachines);
  console.log('Portals:', paramPortal);
  console.log('Start Date:', paramStartDate);
  console.log('End Date:', paramEndDate);
  console.log('ezmesure:', paramEzmesure);
  console.log('ezp:', paramEzp);
  console.log('bibApi:', paramBibApi);
  console.log('unifAccess:', paramUnifAccess);

  (async () => {
    const actualDate = new Date();
    for (let i = 0; i < dates.length; i += 1) {
      const date = dates[i];
      if (paramEzp) {
        await processEzp(paramMachines, paramPortal, new Date(date), true);
      }
      if (paramEzmesure) {
        await removeEzmResult(paramMachines, paramPortal, new Date(date));
        await processEzmesure(paramMachines, paramPortal, new Date(date));
      }
      if (paramBibApi) {
        await processBibAPI(new Date(date));
      }
      if (paramUnifAccess) {
        await processUnifAccess(new Date(date));
      }
    }
    await sendMail(actualDate);
  })();
}
