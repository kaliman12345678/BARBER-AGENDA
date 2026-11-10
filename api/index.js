const app = require('../server/server');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverless: true, time: new Date().toISOString() });
});

module.exports = app;
