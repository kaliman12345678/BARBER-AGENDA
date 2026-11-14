require('dotenv').config();
const db = require('./server/database');

async function testInsertFicha() {
  const insertSql = `
    INSERT INTO fichas_tecnicas (
      barberia_id,
      cliente_telefono,
      cliente_nombre,
      barbero_id,
      cita_id,
      fecha,
      tipo_corte,
      maquina_laterales,
      corte_superior,
      detalles_barba,
      productos_aplicados,
      observaciones_piel,
      foto_resultado_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `;

  try {
    const res = await db.prepare(insertSql).get(
      '1794631242838',
      '3114220554',
      'Manuel prueba',
      '1794631242874',
      2,
      '2026-11-13',
      'Mid Fade',
      '0.5',
      'Tijera',
      'Perfilado',
      'Cera',
      'Normal',
      null
    );
    console.log('Insert success:', res);
  } catch (err) {
    console.error('Insert error:', err);
  }
}

testInsertFicha().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
