require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('\n❌ ERROR: No se encontró la variable DATABASE_URL en el archivo .env');
    console.log('Asegúrate de haber creado el archivo .env en la raíz con el formato:');
    console.log('DATABASE_URL=postgresql://postgres:[TU_CONTRASEÑA]@db.hxkyinybjephrgcunxom.supabase.co:5432/postgres\n');
    process.exit(1);
  }

  if (databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('[TU_CONTRASEÑA]')) {
    console.error('\n⚠️ ATENCIÓN: Debes reemplazar [YOUR-PASSWORD] en el archivo .env por tu contraseña real de Supabase.\n');
    process.exit(1);
  }

  console.log('\n🔄 Probando conexión con Supabase PostgreSQL...');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ ¡Conexión establecida con éxito!');

    const res = await client.query('SELECT id, slug, nombre, plan FROM barberias;');
    console.log('\n📦 Datos encontrados en tu Supabase:');
    console.table(res.rows);

    const resCitas = await client.query('SELECT count(*) as total_citas FROM citas;');
    console.log(`📊 Total de citas registradas: ${resCitas.rows[0].total_citas}`);

    console.log('\n🎉 ¡Tu base de datos en Supabase está 100% lista y conectada!\n');
    await client.end();
  } catch (err) {
    console.error('\n❌ Error conectando a Supabase:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('👉 La contraseña que pusiste en .env es incorrecta. Revísala e intenta de nuevo.');
    }
    await client.end().catch(() => {});
    process.exit(1);
  }
}

testConnection();
