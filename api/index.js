const app = require('../server/server');

module.exports = (req, res) => {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const matched = urlObj.searchParams.get('match') || req.headers['x-matched-path'];
    if (matched) {
      const cleanMatch = matched.startsWith('/') ? matched : '/' + matched;
      req.url = cleanMatch.startsWith('/api') ? cleanMatch : '/api' + cleanMatch;
    }
  } catch (e) {
    // Fallback silencioso si no se puede parsear
  }
  return app(req, res);
};
