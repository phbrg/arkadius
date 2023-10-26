require('dotenv').config();
module.exports = async function logSystem(webhook, message) {
  await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify({ content: message }),
    headers: { 'Content-Type': 'application/json' },
  })
    .catch(err => {
      fetch(process.env.ERROR_WEBHOOK, {
        method: 'POST',
        body: JSON.stringify({ content: `log error: ${err}` }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
}