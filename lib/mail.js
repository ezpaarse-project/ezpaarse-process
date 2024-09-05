const nodemailer = require('nodemailer');

const {
  year, month, day, formatDate,
} = require('./utils');

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: process.env.SMTP_PORT,
});

const mailMessages = [];
let error = false;

function addMessage(message, isError) {
  if (!error && isError) {
    error = isError;
  }
  mailMessages.push(`[${formatDate()}]${message}\n`);
}

async function sendMail() {
  mailMessages.unshift(`Date: ${year}-${month}-${day}\n\n`);

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
