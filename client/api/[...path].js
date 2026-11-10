let app;
let initError = null;
try {
  app = require('../server/server');
} catch (err) {
  initError = err.message + '\n' + err.stack;
  console.error('Error importing server:', err);
}

module.exports = (req, res) => {
  if (initError || !app) {
    return res.status(500).json({ error: 'Server initialization failed', details: initError });
  }
  return app(req, res);
};
