const nodemailer = require('nodemailer');

const { splitDate, dateForLog } = require('./utils');

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: process.env.SMTP_PORT,
});

const mailMessages = [];
let error = false;

/**
 * Add message for mail.
 *
 * @param {string} message Log message.
 * @param {boolean} isError Is an error.
 */
function addMessage(message, isError) {
  if (!error && isError) {
    error = isError;
  }
  mailMessages.push(`[${dateForLog()}]${message}\n`);
}

async function sendMail(date1, date2) {
  const splitedDate1 = splitDate(date1);
  const year1 = splitedDate1.year;
  const month1 = splitedDate1.month;
  const day1 = splitedDate1.day;
  let year2;
  let month2;
  let day2;
  if (date2) {
    const splitedDate2 = splitDate(date2);
    year2 = splitedDate2.year;
    month2 = splitedDate2.month;
    day2 = splitedDate2.day;
    mailMessages.unshift(`Date: ${year1}-${month1}-${day1} - ${year2}-${month2}-${day2} \n\n`);
  } else {
    mailMessages.unshift(`Date: ${year1}-${month1}-${day1}\n\n`);
  }

  try {
    await transporter.verify();
  } catch (err) {
    console.error(`[smtp]: Cannot ping ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`, err);
    return false;
  }

  const mailOptions = {
    from: process.env.NOTIFICATIONS_SENDER,
    to: process.env.NOTIFICATIONS_RECEIVERS,
    subject: `[process][${error ? 'Error' : 'OK'}]: Rapport de traitement`,
    text: mailMessages.join('\n'),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[mail]: Mail is sent');
  } catch (err) {
    console.log('[mail]: Cannot send mail');
  }

  mailMessages.slice(0, mailMessages.length);
}

module.exports = {
  mailMessages,
  addMessage,
  sendMail,
};
