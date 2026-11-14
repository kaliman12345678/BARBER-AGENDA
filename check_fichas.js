require('dotenv').config();
const db = require('./server/database');

async function checkFichas() {
  const f = await db.prepare('SELECT * FROM fichas_tecnicas').all();
  console.log('Total fichas_tecnicas in DB:', f.length);
  console.log(f);
}

checkFichas().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
