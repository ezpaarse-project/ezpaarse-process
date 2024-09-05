const fsp = require('fs/promises');
const path = require('path');

function formatDate() {
  const now = new Date();
  now.setDate(now.getDate() - 1);

  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0').toString();
  const day = String(now.getDate()).padStart(2, '0').toString();

  return {
    yyyy: year,
    yyymm: `${year}-${month}`,
    yyyymmdd: `${year}.${month}.${day}`,
  };
}

async function copyAndRename(sourceFilePath, destinationFolderPath) {
  const { yyyy, yyymm, yyyymmdd } = formatDate();

  const targetFolder = path.join(destinationFolderPath, yyyy, yyymm);

  try {
    await fsp.mkdir(targetFolder, { recursive: true });
  } catch (err) {
    console.log(err);
    return;
  }

  const fileName = path.basename(sourceFilePath);
  const baseName = fileName.replace('.log.gz', '');
  const newFileName = `${baseName}.${yyyymmdd}.log.gz`;

  const destinationFilepath = path.join(targetFolder, newFileName);

  try {
    await fsp.copyFile(sourceFilePath, destinationFilepath);
  } catch (err) {
    console.log(err);
  }
}

(async () => {
  const sourceFile1 = './examples/machine1.apache.log.gz';
  const destinationFolder1 = './archives/machine1/portal';

  const sourceFile2 = './examples/machine2.json.log.gz';
  const destinationFolder2 = './archives/machine2/portal';

  await copyAndRename(sourceFile1, destinationFolder1);
  await copyAndRename(sourceFile2, destinationFolder2);
})();
