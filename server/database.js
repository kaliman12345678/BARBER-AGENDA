const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'barberia.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- 0. TABLA MULTI-TENANT DE BARBERÍAS (PLAN B)
    CREATE TABLE IF NOT EXISTS barberias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      eslogan TEXT,
      logo_url TEXT,
      color_primario TEXT DEFAULT '#2563eb',
      color_secundario TEXT DEFAULT '#1e293b',
      telefono TEXT,
      direccion TEXT,
      plan TEXT DEFAULT 'vip', -- 'basico', 'pro', 'vip'
      modulos_activos TEXT, -- JSON con { agenda, portal_barberos, liquidaciones, costos, productos, rentabilidad, galeria, auditoria }
      pin_admin TEXT DEFAULT '1234',
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS barberos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      nombre TEXT NOT NULL,
      telefono TEXT,
      foto_url TEXT,
      porcentaje_comision REAL DEFAULT 50.0,
      horario_inicio TEXT DEFAULT '09:00',
      horario_fin TEXT DEFAULT '20:00',
      dias_laborales TEXT DEFAULT '1,2,3,4,5,6', -- 1=Lunes, 7=Domingo
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      nombre TEXT NOT NULL,
      precio_cop INTEGER NOT NULL,
      duracion_minutos INTEGER NOT NULL DEFAULT 45,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bloqueos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      barbero_id INTEGER, -- NULL significa bloqueo para toda la barbería
      fecha TEXT NOT NULL, -- YYYY-MM-DD
      hora_inicio TEXT NOT NULL, -- HH:mm
      hora_fin TEXT NOT NULL, -- HH:mm
      motivo TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS liquidaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      barbero_id INTEGER NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      total_servicios INTEGER NOT NULL,
      total_bruto INTEGER NOT NULL,
      porcentaje_aplicado REAL NOT NULL,
      monto_comision INTEGER NOT NULL,
      deducciones INTEGER DEFAULT 0,
      total_pagado INTEGER NOT NULL,
      metodo_pago TEXT DEFAULT 'Efectivo',
      fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
      notas TEXT,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      barbero_id INTEGER NOT NULL,
      servicio_id INTEGER NOT NULL,
      cliente_nombre TEXT NOT NULL,
      cliente_telefono TEXT NOT NULL,
      fecha TEXT NOT NULL, -- YYYY-MM-DD
      hora_inicio TEXT NOT NULL, -- HH:mm
      hora_fin TEXT NOT NULL, -- HH:mm
      estado TEXT DEFAULT 'confirmada', -- confirmada, completada, cancelada, no_asistio
      precio_cobrado INTEGER NOT NULL,
      notas TEXT,
      liquidacion_id INTEGER,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE RESTRICT,
      FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE RESTRICT,
      FOREIGN KEY (liquidacion_id) REFERENCES liquidaciones (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS costos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      tipo TEXT DEFAULT 'egreso', -- 'egreso' o 'ingreso'
      categoria TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto_cop INTEGER NOT NULL,
      fecha TEXT NOT NULL, -- YYYY-MM-DD
      metodo_pago TEXT DEFAULT 'Efectivo',
      barbero_id INTEGER,
      notas TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      nombre TEXT NOT NULL,
      foto_url TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      precio_venta INTEGER NOT NULL,
      costo_compra INTEGER NOT NULL DEFAULT 0,
      porcentaje_comision REAL DEFAULT 10.0, -- % para el barbero que lo vende
      categoria TEXT DEFAULT 'Cuidado Capilar',
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ventas_productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      precio_unitario INTEGER NOT NULL,
      costo_unitario INTEGER NOT NULL DEFAULT 0,
      total_venta INTEGER NOT NULL,
      porcentaje_comision REAL NOT NULL,
      monto_comision INTEGER NOT NULL,
      ganancia_neta INTEGER NOT NULL,
      barbero_id INTEGER, -- Quién lo vendió (o NULL si vendió la recepción)
      metodo_pago TEXT DEFAULT 'Efectivo',
      fecha TEXT NOT NULL, -- YYYY-MM-DD
      notas TEXT,
      liquidacion_id INTEGER,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE SET NULL,
      FOREIGN KEY (liquidacion_id) REFERENCES liquidaciones (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      tipo_evento TEXT NOT NULL, -- 'CITA_CREADA', 'CITA_REASIGNADA', 'CITA_ESTADO', 'VENTA_PRODUCTO', 'COSTO_REGISTRADO', 'LIQUIDACION'
      descripcion TEXT NOT NULL,
      usuario TEXT DEFAULT 'admin', -- 'admin', 'cliente', o 'barbero:ID'
      detalles_json TEXT,
      fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS galeria_multimedia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberia_id INTEGER DEFAULT 1,
      titulo TEXT NOT NULL,
      tipo TEXT DEFAULT 'imagen', -- 'imagen', 'video', 'instagram', 'youtube', 'tiktok'
      url_media TEXT NOT NULL,
      url_red_social TEXT,
      descripcion TEXT,
      barbero_id INTEGER,
      orden INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barberia_id) REFERENCES barberias (id) ON DELETE CASCADE,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE SET NULL
    );
  `);

  // Configuración inicial por defecto
  const setConfig = db.prepare(`INSERT OR IGNORE INTO configuracion (clave, valor) VALUES (?, ?)`);
  setConfig.run('nombre_barberia', 'The Barber Club');
  setConfig.run('telefono_barberia', '+57 300 123 4567');
  setConfig.run('direccion_barberia', 'Calle Principal # 10 - 20');
  setConfig.run('pin_admin', '1234');
  setConfig.run('pin_superadmin', '9999'); // Clave de acceso a /superadmin
  setConfig.run('intervalo_minutos', '30'); // Granularidad del selector de horas
  setConfig.run('hora_apertura', '08:00');
  setConfig.run('hora_cierre', '20:00');

  // Inicializar barbería #1 por defecto (The Barber Club) con Plan VIP completo
  try {
    const modulosVip = JSON.stringify({
      agenda: true,
      max_barberos: 999,
      portal_barberos: true,
      liquidaciones: true,
      costos: true,
      notificaciones_audio: true,
      productos: true,
      rentabilidad: true,
      galeria: true,
      auditoria: true
    });

    const bCount = db.prepare('SELECT COUNT(*) as count FROM barberias').get().count;
    if (bCount === 0) {
      db.prepare(`
        INSERT INTO barberias (id, slug, nombre, eslogan, logo_url, color_primario, color_secundario, telefono, direccion, plan, modulos_activos, pin_admin, activo)
        VALUES (1, 'the-barber-club', 'The Barber Club', 'Estilo clásico con técnica moderna', '', '#2563eb', '#1e293b', '+57 300 123 4567', 'Calle Principal # 10 - 20', 'vip', ?, '1234', 1)
      `).run(modulosVip);
    }
  } catch (e) {
    console.error('Error inicializando barberia #1:', e);
  }

  // Migración segura para añadir columna barberia_id a todas las tablas existentes
  const tablasConTenant = [
    'barberos', 'servicios', 'bloqueos', 'liquidaciones', 
    'citas', 'costos', 'productos', 'ventas_productos', 
    'auditoria', 'galeria_multimedia'
  ];

  for (const tabla of tablasConTenant) {
    try {
      db.prepare(`ALTER TABLE ${tabla} ADD COLUMN barberia_id INTEGER DEFAULT 1`).run();
    } catch (e) {}
    try {
      db.prepare(`UPDATE ${tabla} SET barberia_id = 1 WHERE barberia_id IS NULL`).run();
    } catch (e) {}
  }

  // Migración segura para columnas añadidas en costos
  try {
    db.prepare("ALTER TABLE costos ADD COLUMN tipo TEXT DEFAULT 'egreso'").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE costos ADD COLUMN barbero_id INTEGER").run();
  } catch (e) {}

  // Migración segura para autenticación individual de barberos (Email y Contraseña)
  try {
    db.prepare("ALTER TABLE barberos ADD COLUMN pin TEXT DEFAULT '1234'").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE barberos ADD COLUMN email TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE barberos ADD COLUMN password TEXT DEFAULT '123456'").run();
  } catch (e) {}

  // Asignar correos y contraseñas por defecto a los barberos existentes si están vacíos
  try {
    const barberosSinEmail = db.prepare("SELECT id, nombre, email, password FROM barberos WHERE email IS NULL OR email = ''").all();
    for (const b of barberosSinEmail) {
      const nombreLimpio = b.nombre.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const defaultEmail = `${nombreLimpio || 'barbero' + b.id}@barberia.com`;
      db.prepare("UPDATE barberos SET email = ?, password = COALESCE(password, '123456') WHERE id = ?").run(defaultEmail, b.id);
    }
  } catch (e) {}

  // Seed de productos de venta si no hay
  const prodCount = db.prepare(`SELECT COUNT(*) as count FROM productos`).get().count;
  if (prodCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO productos (nombre, foto_url, stock, precio_venta, costo_compra, porcentaje_comision, categoria, descripcion, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertProd.run(
      'Cera Modeladora Acabado Mate (100g)',
      'https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=300&h=300&fit=crop',
      15,
      35000,
      18000,
      15.0, // 15% para el barbero que la venda ($5.250 COP)
      'Cuidado Capilar',
      'Fijación media-alta sin brillo para peinados naturales y duraderos.'
    );

    insertProd.run(
      'Aceite Hidratante para Barba (30ml)',
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&h=300&fit=crop',
      10,
      28000,
      14000,
      10.0, // 10% para el barbero ($2.800 COP)
      'Cuidado de Barba',
      'Aceite de argán y jojoba que suaviza la barba y cuida la piel.'
    );

    insertProd.run(
      'Shampoo Anticaída & Fortalecedor (250ml)',
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&h=300&fit=crop',
      8,
      42000,
      22000,
      10.0,
      'Cuidado Capilar',
      'Con biotina y extractos naturales para estimular el crecimiento.'
    );
  }

  // Seed de datos de prueba si no hay barberos
  const barberoCount = db.prepare(`SELECT COUNT(*) as count FROM barberos`).get().count;
  if (barberoCount === 0) {
    const insertBarbero = db.prepare(`
      INSERT INTO barberos (nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertBarbero.run('Carlos Rodríguez', '3101112233', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=300&fit=crop&crop=faces', 50.0, '09:00', '19:00', '1,2,3,4,5,6');
    insertBarbero.run('Mateo Gómez', '3152223344', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop&crop=faces', 55.0, '10:00', '20:00', '2,3,4,5,6,7');
    insertBarbero.run('Sebastián Peña', '3203334455', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces', 50.0, '09:00', '18:00', '1,2,3,4,5');
  }

  // Seed de servicios si no hay
  const servicioCount = db.prepare(`SELECT COUNT(*) as count FROM servicios`).get().count;
  if (servicioCount === 0) {
    const insertServicio = db.prepare(`
      INSERT INTO servicios (nombre, precio_cop, duracion_minutos, descripcion, activo)
      VALUES (?, ?, ?, ?, 1)
    `);

    insertServicio.run('Corte Clásico / Fade', 25000, 45, 'Corte tradicional o degradado con terminación en navaja y peinado.');
    insertServicio.run('Perfilado & Arreglo de Barba', 18000, 30, 'Diseño de barba con vapor ozono, aceites esenciales y navaja.');
    insertServicio.run('Combo Real (Corte + Barba)', 38000, 60, 'El paquete completo: corte a elección, toalla caliente y diseño de barba.');
    insertServicio.run('Diseño / Cejas / Greca', 12000, 20, 'Diseño artístico de grecas o perfilado de cejas con navaja.');
    insertServicio.run('Exfoliación & Mascarilla Negra', 22000, 30, 'Limpieza profunda facial, eliminación de puntos negros y tónico refrescante.');
  }

  // Seed de costos de ejemplo si no hay
  const costoCount = db.prepare(`SELECT COUNT(*) as count FROM costos`).get().count;
  if (costoCount === 0) {
    const insertCosto = db.prepare(`
      INSERT INTO costos (categoria, descripcion, monto_cop, fecha, metodo_pago, notas)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const hoy = new Date().toISOString().split('T')[0];
    insertCosto.run('Insumos / Productos', 'Caja de cuchillas Dorco x100 y Gel de afeitar', 65000, hoy, 'Efectivo', 'Compra droguería central');
    insertCosto.run('Servicios Públicos', 'Factura de Energía Eléctrica', 180000, hoy, 'Transferencia', 'Mes corriente');
  }

  // Seed de multimedia / redes sociales si no hay
  const mediaCount = db.prepare(`SELECT COUNT(*) as count FROM galeria_multimedia`).get().count;
  if (mediaCount === 0) {
    const primerBarbero = db.prepare(`SELECT id FROM barberos LIMIT 1`).get();
    const barberoIdVal = primerBarbero ? primerBarbero.id : null;

    const insertMedia = db.prepare(`
      INSERT INTO galeria_multimedia (titulo, tipo, url_media, url_red_social, descripcion, barbero_id, orden, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertMedia.run(
      'Mid Fade con Textura & Perfilado',
      'imagen',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=600&fit=crop',
      'https://instagram.com',
      'Degradado medio con navaja y peinado mate con cera arcillosa.',
      barberoIdVal,
      1
    );

    insertMedia.run(
      'Diseño & Arreglo de Barba con Toalla Caliente',
      'imagen',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=600&fit=crop',
      'https://instagram.com',
      'Terapia de vapor y perfilado con navaja clásica.',
      barberoIdVal,
      2
    );

    insertMedia.run(
      'Fade Clásico & Barba Estilo Royale',
      'imagen',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop',
      'https://instagram.com',
      'El corte más pedido de la semana en la barbería.',
      barberoIdVal,
      3
    );

    insertMedia.run(
      'Ambiente & Estilo en la Barbería',
      'imagen',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=600&fit=crop',
      'https://instagram.com',
      'Música, café de cortesía y la mejor atención de la ciudad.',
      null,
      4
    );
  }
}

initDatabase();

module.exports = db;
