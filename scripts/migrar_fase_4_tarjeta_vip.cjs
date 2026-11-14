const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hxkyinybjephrgcunxom:misservicioS%231@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrar() {
  console.log('🚀 Iniciando migración Paso 4: Tarjeta VIP & Sellos en Supabase...');

  // 1. Columnas en clientes
  await pool.query(`
    ALTER TABLE clientes 
    ADD COLUMN IF NOT EXISTS sellos_acumulados INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sellos_meta INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS premio_proximo TEXT DEFAULT 'Corte o Barba Gratis',
    ADD COLUMN IF NOT EXISTS nivel_vip TEXT DEFAULT 'Bronce VIP',
    ADD COLUMN IF NOT EXISTS premios_redimidos INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS codigo_qr_vip TEXT;
  `);
  console.log('✅ Columnas de fidelización y sellos añadidas a la tabla clientes.');

  // 2. Tabla movimientos_tarjeta_vip
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movimientos_tarjeta_vip (
      id SERIAL PRIMARY KEY,
      barberia_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      tipo TEXT NOT NULL, -- 'sello', 'canje', 'reinicio'
      cantidad INTEGER DEFAULT 1,
      barbero_nombre TEXT,
      notas TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tabla movimientos_tarjeta_vip lista.');

  // 3. Crear índice para búsquedas rápidas
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_movimientos_vip_cliente ON movimientos_tarjeta_vip(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_movimientos_vip_barberia ON movimientos_tarjeta_vip(barberia_id);
  `);
  console.log('✅ Índices de rendimiento creados.');

  await pool.end();
  console.log('🎉 Migración completada exitosamente.');
}

migrar().catch(err => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
