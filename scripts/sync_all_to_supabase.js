const { Pool } = require('pg');
const store = require('../server/store');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hxkyinybjephrgcunxom:misservicioS%231@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function sync() {
  console.log('🔄 Sincronizando datos locales hacia Supabase PostgreSQL...');

  // 1. Barberías
  for (const b of store.barberias) {
    console.log(`Procesando barbería: ${b.nombre} (ID: ${b.id}, Slug: ${b.slug})...`);
    
    // Verificar si ya existe por slug o por id
    const existing = await pool.query('SELECT id, slug FROM barberias WHERE id = $1 OR LOWER(slug) = $2', [b.id, b.slug.toLowerCase()]);
    
    const modulosStr = typeof b.modulos_activos === 'string' ? b.modulos_activos : JSON.stringify(b.modulos_activos || {});
    const precioCop = b.precio_mensual_cop || (b.plan === 'basico' ? 70000 : b.plan === 'pro' ? 120000 : 180000);
    const emailVal = b.email || (b.id === 1 ? 'contacto@barberclub.com' : `${b.slug}@barberia.com`);
    
    if (existing.rows.length > 0) {
      console.log(`  Actualizando barbería existente ID ${existing.rows[0].id}...`);
      await pool.query(`
        UPDATE barberias
        SET nombre = $1,
            eslogan = $2,
            logo_url = $3,
            color_primario = $4,
            color_secundario = $5,
            telefono = $6,
            direccion = $7,
            plan = $8,
            modulos_activos = $9::jsonb,
            pin_admin = $10,
            activo = $11,
            email = $12,
            precio_mensual_cop = $13
        WHERE id = $14
      `, [
        b.nombre,
        b.eslogan || 'Tu estilo en las mejores manos',
        b.logo_url || '',
        b.color_primario || '#2563eb',
        b.color_secundario || '#1e293b',
        b.telefono || '',
        b.direccion || '',
        b.plan || 'basico',
        modulosStr,
        b.pin_admin,
        b.activo !== undefined ? b.activo : 1,
        emailVal,
        precioCop,
        existing.rows[0].id
      ]);
    } else {
      console.log(`  Insertando nueva barbería ID ${b.id}...`);
      await pool.query(`
        INSERT INTO barberias (
          id, slug, nombre, eslogan, logo_url, color_primario, color_secundario,
          telefono, direccion, plan, modulos_activos, pin_admin, activo, email, precio_mensual_cop
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15)
      `, [
        b.id,
        b.slug,
        b.nombre,
        b.eslogan || 'Tu estilo en las mejores manos',
        b.logo_url || '',
        b.color_primario || '#2563eb',
        b.color_secundario || '#1e293b',
        b.telefono || '',
        b.direccion || '',
        b.plan || 'basico',
        modulosStr,
        b.pin_admin,
        b.activo !== undefined ? b.activo : 1,
        emailVal,
        precioCop
      ]);
    }
  }

  // 2. Barberos
  for (const bar of store.barberos) {
    const existing = await pool.query('SELECT id FROM barberos WHERE id = $1', [bar.id]);
    if (existing.rows.length === 0) {
      console.log(`Insertando barbero ${bar.nombre} (ID ${bar.id}, Barberia ${bar.barberia_id})...`);
      await pool.query(`
        INSERT INTO barberos (
          id, barberia_id, nombre, telefono, email, password, pin, foto_url,
          porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        bar.id,
        bar.barberia_id,
        bar.nombre,
        bar.telefono || '',
        bar.email || '',
        bar.password || '123456',
        bar.pin || '1234',
        bar.foto_url || '',
        bar.porcentaje_comision || 50.0,
        bar.horario_inicio || '09:00',
        bar.horario_fin || '20:00',
        bar.dias_laborales || '1,2,3,4,5,6',
        bar.activo !== undefined ? bar.activo : 1
      ]);
    } else {
      console.log(`Barbero ${bar.nombre} (ID ${bar.id}) ya existe.`);
    }
  }

  // 3. Servicios
  for (const s of store.servicios) {
    const existing = await pool.query('SELECT id FROM servicios WHERE id = $1', [s.id]);
    if (existing.rows.length === 0) {
      console.log(`Insertando servicio ${s.nombre} (ID ${s.id}, Barberia ${s.barberia_id})...`);
      await pool.query(`
        INSERT INTO servicios (
          id, barberia_id, nombre, precio_cop, duracion_minutos, descripcion, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        s.id,
        s.barberia_id,
        s.nombre,
        s.precio_cop || 25000,
        s.duracion_minutos || 45,
        s.descripcion || '',
        s.activo !== undefined ? s.activo : 1
      ]);
    }
  }

  // 4. Configuración
  const configs = [
    { clave: 'pin_superadmin', valor: 'Exakta#2026Master!' },
    { clave: 'superadmin_email', valor: 'admin@exakta.online' },
    { clave: 'superadmin_telefono', valor: '3114220554' },
    { clave: 'superadmin_nombre', valor: 'SuperAdmin EXAKTA' },
    { clave: 'precio_plan_basico', valor: '70000' },
    { clave: 'precio_plan_pro', valor: '120000' },
    { clave: 'precio_plan_vip', valor: '180000' }
  ];

  for (const c of configs) {
    const ex = await pool.query('SELECT clave FROM configuracion WHERE clave = $1', [c.clave]);
    if (ex.rows.length > 0) {
      await pool.query('UPDATE configuracion SET valor = $1 WHERE clave = $2', [c.valor, c.clave]);
    } else {
      await pool.query('INSERT INTO configuracion (clave, valor) VALUES ($1, $2)', [c.clave, c.valor]);
    }
  }

  // Ajustar secuencias al max id
  await pool.query("SELECT setval('barberias_id_seq', COALESCE((SELECT MAX(id) FROM barberias WHERE id < 1000000000), 1) + 1, false)").catch(() => {});
  await pool.query("SELECT setval('barberos_id_seq', COALESCE((SELECT MAX(id) FROM barberos WHERE id < 1000000000), 1) + 1, false)").catch(() => {});
  await pool.query("SELECT setval('servicios_id_seq', COALESCE((SELECT MAX(id) FROM servicios WHERE id < 1000000000), 1) + 1, false)").catch(() => {});

  console.log('✅ Sincronización completa con Supabase PostgreSQL.');
  await pool.end();
}

sync().catch(err => {
  console.error('Error sincronizando con Supabase:', err);
  process.exit(1);
});
