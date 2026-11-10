module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ status: 'ok', message: 'Vercel Serverless Function is Working!' }));
};
