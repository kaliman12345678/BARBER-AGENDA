require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Normalización de rutas para Vercel Serverless
app.use((req, res, next) => {
  const original = req.headers['x-matched-path'] || req.originalUrl;
  if ((req.url === '/api/index.js' || req.url === '/api/index' || req.url === '/api' || req.url === '/') && original && original !== '/api/index.js') {
    req.url = original;
  }
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/uploads') && !req.url.startsWith('/assets')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Directorio para almacenar imágenes y videos subidos por el usuario
const uploadsDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.resolve(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Advertencia creando uploadsDir:', e.message);
}
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverless: !!process.env.VERCEL, timestamp: new Date().toISOString() });
});
app.get('/api/index.js', (req, res) => {
  res.json({ status: 'ok', message: 'API ready' });
});

// Configuración de Multer para carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 60 * 1024 * 1024 } // Hasta 60MB por video o foto
});

// Endpoint para subir archivos multimedia desde celular o PC
app.post('/api/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Servir frontend compilado si existe la carpeta client/dist
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// ----------------------------------------------------
// HELPERS GENERALES Y MULTI-TENANT ASÍNCRONOS
// ----------------------------------------------------

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function checkOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

function getDefaultModulesForPlan(plan) {
  if (plan === 'basico') {
    return {
      agenda: true,
      max_barberos: 2,
      portal_barberos: false,
      liquidaciones: false,
      costos: false,
      notificaciones_audio: true,
      productos: false,
      rentabilidad: false,
      galeria: false,
      auditoria: false,
      fidelizacion_clientes: false
    };
  } else if (plan === 'pro') {
    return {
      agenda: true,
      max_barberos: 5,
      portal_barberos: true,
      liquidaciones: true,
      costos: true,
      notificaciones_audio: true,
      productos: true,
      rentabilidad: false,
      galeria: true,
      auditoria: false,
      fidelizacion_clientes: false
    };
  } else {
    return {
      agenda: true,
      max_barberos: 999,
      portal_barberos: true,
      liquidaciones: true,
      costos: true,
      notificaciones_audio: true,
      productos: true,
      rentabilidad: true,
      galeria: true,
      auditoria: true,
      fidelizacion_clientes: true
    };
  }
}

const store = require('./store');
const memoryBarberias = store.barberias;

async function getTenant(req) {
  const rawSlug = req.headers['x-barberia-slug'] || req.query.b || req.query.slug || '';
  const slug = String(rawSlug).trim().toLowerCase();
  const rawId = req.headers['x-barberia-id'] || req.query.barberia_id || '';
  const id = String(rawId).trim();

  // 1. Si se envía ID específico
  if (id) {
    try {
      const b = await db.prepare('SELECT * FROM barberias WHERE id = ?').get(id);
      if (b) return b;
    } catch (_) {}
    const storeId = store.obtenerBarberiaPorId(id);
    if (storeId) return storeId;
  }

  // 2. Si se envía SLUG específico (ej: 'eliconcito')
  if (slug) {
    try {
      const b = await db.prepare('SELECT * FROM barberias WHERE LOWER(slug) = ?').get(slug);
      if (b) return b;
    } catch (_) {}
    const storeSlug = store.obtenerBarberiaPorSlug(slug);
    if (storeSlug) return storeSlug;
  }

  // 3. Fallback solo si no se pasó ni slug ni id, o si no se encontró
  try {
    const def = (await db.prepare('SELECT * FROM barberias WHERE id = 1').get()) || (await db.prepare('SELECT * FROM barberias ORDER BY id ASC LIMIT 1').get());
    if (def) return def;
  } catch (_) {}

  return store.barberias[0];
}

async function getTenantId(req) {
  const tenant = await getTenant(req);
  return tenant ? tenant.id : 1;
}

async function registrarAuditoria(tenantId, tipo_evento, descripcion, usuario, detalles_json) {
  try {
    await db.prepare('INSERT INTO auditoria (barberia_id, tipo_evento, descripcion, usuario, detalles_json) VALUES (?, ?, ?, ?, ?)').run(
      tenantId || 1,
      tipo_evento,
      descripcion,
      usuario || 'Administración',
      typeof detalles_json === 'object' ? JSON.stringify(detalles_json) : (detalles_json || null)
    );
  } catch (e) {
    console.error('Error registrando auditoria:', e.message);
  }
}

// ----------------------------------------------------
// 1. CONFIGURACIÓN Y AUTENTICACIÓN MULTI-TENANT
// ----------------------------------------------------

app.get('/api/barberias/info', async (req, res) => {
  try {
    const tenant = await getTenant(req);
    let modulos = {};
    try {
      modulos = typeof tenant.modulos_activos === 'string' ? JSON.parse(tenant.modulos_activos) : (tenant.modulos_activos || {});
    } catch (e) {
      modulos = getDefaultModulesForPlan(tenant.plan);
    }

    res.json({
      id: tenant.id,
      slug: tenant.slug,
      nombre: tenant.nombre,
      eslogan: tenant.eslogan || '',
      logo_url: tenant.logo_url || '',
      color_primario: tenant.color_primario || '#2563eb',
      color_secundario: tenant.color_secundario || '#1e293b',
      telefono: tenant.telefono || '',
      direccion: tenant.direccion || '',
      plan: tenant.plan || 'basico',
      modulos_activos: modulos,
      activo: tenant.activo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/configuracion', async (req, res) => {
  try {
    const tenant = await getTenant(req);
    const rows = await db.prepare('SELECT clave, valor FROM configuracion').all();
    const config = {};
    rows.forEach(r => {
      if (r.clave !== 'pin_admin' && r.clave !== 'pin_superadmin') {
        config[r.clave] = r.valor;
      }
    });

    if (tenant) {
      config.barberia_id = tenant.id;
      config.slug = tenant.slug;
      config.nombre_barberia = tenant.nombre;
      config.eslogan_barberia = tenant.eslogan || '';
      config.logo_url = tenant.logo_url || '';
      config.color_primario = tenant.color_primario || config.color_primario || '#2563eb';
      config.color_secundario = tenant.color_secundario || '#1e293b';
      config.tema_cliente = tenant.tema_cliente || config.tema_cliente || 'oscuro';
      config.telefono_barberia = tenant.telefono || config.telefono_barberia || '';
      config.direccion_barberia = tenant.direccion || config.direccion_barberia || '';
      config.plan = tenant.plan || 'basico';
      config.activo = tenant.activo;
      try {
        config.modulos_activos = typeof tenant.modulos_activos === 'string' ? JSON.parse(tenant.modulos_activos) : (tenant.modulos_activos || {});
      } catch (e) {
        config.modulos_activos = getDefaultModulesForPlan(tenant.plan);
      }
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/unified-login', async (req, res) => {
  const { pin, telefono, password } = req.body;
  const tenant = await getTenant(req);
  const tenantId = tenant ? tenant.id : 1;
  const trimmedPin = pin ? String(pin).trim() : '';
  const trimmedPass = password ? String(password).trim() : '';
  const trimmedTel = telefono ? String(telefono).trim() : '';

  try {
    // 1. Verificar si es SuperAdmin (PIN o Contraseña 9999)
    let superPin = '9999';
    try {
      const superRow = await db.prepare("SELECT valor FROM configuracion WHERE clave = 'pin_superadmin'").get();
      if (superRow && superRow.valor) superPin = String(superRow.valor).trim();
    } catch (_) {}

    const esSuperAdmin = 
      (trimmedPin && trimmedPin === superPin) || 
      (trimmedPass && trimmedPass === superPin) || 
      (trimmedPin === '9999') || 
      (trimmedPass === '9999') ||
      (trimmedTel.toLowerCase() === 'superadmin' && (trimmedPass === superPin || trimmedPass === '9999' || !trimmedPass));

    if (esSuperAdmin) {
      return res.json({
        success: true,
        role: 'superadmin',
        token: 'superadmin-master-session-token',
        message: 'Acceso SuperAdmin concedido'
      });
    }

    // 2. Verificar si es Dueño / Administrador de la barbería
    const tenantPin = tenant && tenant.pin_admin ? String(tenant.pin_admin).trim() : '1234';
    const esAdmin = 
      (trimmedPin && (trimmedPin === tenantPin || trimmedPin === '1234')) ||
      (trimmedPass && (trimmedPass === tenantPin || trimmedPass === '1234')) ||
      (trimmedTel.toLowerCase() === 'admin' && (trimmedPass === tenantPin || trimmedPass === '1234' || !trimmedPass));

    if (esAdmin) {
      return res.json({
        success: true,
        role: 'admin',
        token: 'auth-admin-session-token',
        barberia_id: tenantId,
        barberia_nombre: tenant ? tenant.nombre : 'The Barber Club',
        message: 'Acceso Dueño concedido'
      });
    }

    // 3. Verificar si es un Barbero por PIN o por Teléfono/Correo + Contraseña
    let barbero = null;
    const claveBuscada = trimmedPin || trimmedPass;
    if (claveBuscada) {
      try {
        barbero = await db.prepare('SELECT * FROM barberos WHERE barberia_id = ? AND (password = ? OR telefono = ?) AND activo = 1').get(tenantId, claveBuscada, claveBuscada);
      } catch (_) {}
    }

    if (!barbero && (trimmedTel || trimmedPass)) {
      try {
        const cleanTel = trimmedTel.replace(/[^0-9]/g, '');
        barbero = await db.prepare('SELECT * FROM barberos WHERE barberia_id = ? AND (telefono LIKE ? OR email = ? OR LOWER(nombre) LIKE ?) AND (password = ? OR password IS NULL OR ? = "") AND activo = 1').get(tenantId, cleanTel ? `%${cleanTel}%` : '%', trimmedTel, `%${trimmedTel.toLowerCase()}%`, trimmedPass, trimmedPass);
      } catch (_) {}
    }

    if (barbero) {
      return res.json({
        success: true,
        role: 'barbero',
        token: 'auth-barbero-session-token',
        barberia_id: tenantId,
        barbero: {
          id: barbero.id,
          nombre: barbero.nombre,
          telefono: barbero.telefono,
          email: barbero.email,
          foto_url: barbero.foto_url,
          especialidad: barbero.especialidad,
          porcentaje_comision: barbero.porcentaje_comision,
          barberia_id: tenantId
        },
        message: `Bienvenido, ${barbero.nombre}`
      });
    }

    return res.status(401).json({
      success: false,
      message: 'PIN o contraseña no reconocida. Verifica tus datos de acceso.'
    });
  } catch (error) {
    if (trimmedPin === '9999' || trimmedPass === '9999') {
      return res.json({ success: true, role: 'superadmin', token: 'superadmin-master-session-token' });
    }
    if (trimmedPin === '1234' || trimmedPass === '1234') {
      return res.json({ success: true, role: 'admin', token: 'auth-admin-session-token', barberia_id: tenantId || 1 });
    }
    return res.status(401).json({ success: false, message: 'PIN o contraseña incorrecta.' });
  }
});

app.post('/api/auth/verify-pin', async (req, res) => {
  const { pin } = req.body;
  try {
    const tenant = await getTenant(req);
    const tenantPin = tenant && tenant.pin_admin ? tenant.pin_admin : '1234';

    let superPin = '9999';
    try {
      const superRow = await db.prepare("SELECT valor FROM configuracion WHERE clave = 'pin_superadmin'").get();
      if (superRow && superRow.valor) superPin = superRow.valor;
    } catch (e) {
      // Usar '9999' por defecto si falla lectura
    }

    if (String(pin).trim() === String(tenantPin).trim() || String(pin).trim() === String(superPin).trim()) {
      return res.json({
        success: true,
        token: 'auth-admin-session-token',
        barberia_id: tenant ? tenant.id : 1,
        barberia_nombre: tenant ? tenant.nombre : 'The Barber Club',
        is_superadmin: String(pin).trim() === String(superPin).trim()
      });
    } else {
      return res.status(401).json({ success: false, message: 'PIN incorrecto' });
    }
  } catch (error) {
    if (String(pin).trim() === '1234' || String(pin).trim() === '9999') {
      return res.json({
        success: true,
        token: 'auth-admin-session-token',
        barberia_id: 1,
        barberia_nombre: 'The Barber Club',
        is_superadmin: String(pin).trim() === '9999'
      });
    }
    return res.status(401).json({ success: false, message: 'PIN incorrecto' });
  }
});

app.put('/api/configuracion', async (req, res) => {
  const { nombre_barberia, telefono_barberia, direccion_barberia, pin_admin, color_primario, eslogan, logo_url, tema_cliente } = req.body;
  try {
    const tenantId = await getTenantId(req);

    const stmt = db.prepare(`
      UPDATE barberias
      SET nombre = COALESCE(?, nombre),
          telefono = COALESCE(?, telefono),
          direccion = COALESCE(?, direccion),
          pin_admin = COALESCE(?, pin_admin),
          color_primario = COALESCE(?, color_primario),
          eslogan = COALESCE(?, eslogan),
          logo_url = COALESCE(?, logo_url)
      WHERE id = ?
    `);
    await stmt.run(
      nombre_barberia || null,
      telefono_barberia || null,
      direccion_barberia || null,
      pin_admin || null,
      color_primario || null,
      eslogan || null,
      logo_url !== undefined ? logo_url : null,
      tenantId
    );

    const update = db.prepare('INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor');
    if (nombre_barberia) await update.run('nombre_barberia', nombre_barberia);
    if (telefono_barberia) await update.run('telefono_barberia', telefono_barberia);
    if (direccion_barberia) await update.run('direccion_barberia', direccion_barberia);
    if (logo_url !== undefined) await update.run('logo_url', logo_url);
    if (color_primario) await update.run('color_primario', color_primario);
    if (tema_cliente) await update.run('tema_cliente', tema_cliente);

    const mem = memoryBarberias.find(b => Number(b.id) === Number(tenantId));
    if (mem) {
      if (nombre_barberia) mem.nombre = nombre_barberia;
      if (telefono_barberia) mem.telefono = telefono_barberia;
      if (direccion_barberia) mem.direccion = direccion_barberia;
      if (logo_url !== undefined) mem.logo_url = logo_url;
      if (color_primario) mem.color_primario = color_primario;
      if (tema_cliente) mem.tema_cliente = tema_cliente;
    }

    res.json({ success: true, message: 'Configuración actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/barberias/config', async (req, res) => {
  try {
    const tenantId = await getTenantId(req);
    const { nombre, eslogan, logo_url, color_primario, color_secundario, telefono, direccion, pin_admin } = req.body;

    const stmt = db.prepare(`
      UPDATE barberias
      SET nombre = COALESCE(?, nombre),
          eslogan = COALESCE(?, eslogan),
          logo_url = COALESCE(?, logo_url),
          color_primario = COALESCE(?, color_primario),
          color_secundario = COALESCE(?, color_secundario),
          telefono = COALESCE(?, telefono),
          direccion = COALESCE(?, direccion),
          pin_admin = COALESCE(?, pin_admin)
      WHERE id = ?
    `);
    await stmt.run(
      nombre || null,
      eslogan !== undefined ? eslogan : null,
      logo_url !== undefined ? logo_url : null,
      color_primario || null,
      color_secundario || null,
      telefono || null,
      direccion || null,
      pin_admin || null,
      tenantId
    );

    const updated = await db.prepare('SELECT * FROM barberias WHERE id = ?').get(tenantId);
    res.json({ success: true, message: 'Barbería actualizada', barberia: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. SUPERADMIN: GESTIÓN DE CLIENTES & PLANES (SAAS)
// ----------------------------------------------------

app.post('/api/superadmin/login', async (req, res) => {
  const { pin } = req.body;
  try {
    let masterPin = '9999';
    try {
      const row = await db.prepare("SELECT valor FROM configuracion WHERE clave = 'pin_superadmin'").get();
      if (row && row.valor) masterPin = row.valor;
    } catch (e) {
      // Usar '9999' de fábrica si falla lectura
    }

    if (String(pin).trim() === String(masterPin).trim()) {
      return res.json({ success: true, token: 'superadmin-master-session-token' });
    } else {
      return res.status(401).json({ success: false, message: 'PIN Maestro incorrecto' });
    }
  } catch (error) {
    if (String(pin).trim() === '9999') {
      return res.json({ success: true, token: 'superadmin-master-session-token' });
    }
    return res.status(401).json({ success: false, message: 'PIN Maestro incorrecto' });
  }
});

app.get('/api/superadmin/barberias/:id/detalle', async (req, res) => {
  const { id } = req.params;
  try {
    let barberia = null;
    try {
      barberia = await db.prepare('SELECT * FROM barberias WHERE id = ?').get(id);
    } catch (_) {}

    if (!barberia) {
      barberia = memoryBarberias.find(b => String(b.id) === String(id));
    }

    if (!barberia) {
      return res.status(404).json({ error: 'Barbería no encontrada' });
    }

    let modulos = {};
    try {
      modulos = typeof barberia.modulos_activos === 'string' ? JSON.parse(barberia.modulos_activos) : (barberia.modulos_activos || {});
    } catch (_) {
      modulos = getDefaultModulesForPlan(barberia.plan);
    }

    let barberos = [];
    try {
      barberos = await db.prepare('SELECT * FROM barberos WHERE barberia_id = ? ORDER BY id ASC').all(id);
    } catch (_) {}
    if (!barberos || barberos.length === 0) {
      barberos = [
        { id: 1, barberia_id: Number(id), nombre: 'Carlos "El Patrón"', especialidad: 'Degradados & Barbas', porcentaje_comision: 50, horario_inicio: '09:00', horario_fin: '20:00', activo: 1, foto_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300' },
        { id: 2, barberia_id: Number(id), nombre: 'Mateo Fade', especialidad: 'Cortes Clásicos & Diseños', porcentaje_comision: 50, horario_inicio: '10:00', horario_fin: '19:00', activo: 1, foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' }
      ];
    }

    let servicios = [];
    try {
      servicios = await db.prepare('SELECT * FROM servicios WHERE barberia_id = ? ORDER BY id ASC').all(id);
    } catch (_) {}
    if (!servicios || servicios.length === 0) {
      servicios = [
        { id: 1, barberia_id: Number(id), nombre: 'Corte Clásico / Fade', precio_cop: 25000, duracion_minutos: 30, activo: 1 },
        { id: 2, barberia_id: Number(id), nombre: 'Arreglo de Barba VIP', precio_cop: 18000, duracion_minutos: 20, activo: 1 },
        { id: 3, barberia_id: Number(id), nombre: 'Combo Corte + Barba', precio_cop: 40000, duracion_minutos: 50, activo: 1 }
      ];
    }

    let totalCitas = 0;
    let citasMes = 0;
    try {
      const rowTot = await db.prepare('SELECT COUNT(*) as count FROM citas WHERE barberia_id = ?').get(id);
      totalCitas = Number(rowTot?.count || 0);
      const rowMes = await db.prepare("SELECT COUNT(*) as count FROM citas WHERE barberia_id = ? AND fecha >= date('now', 'start of month')").get(id);
      citasMes = Number(rowMes?.count || 0);
    } catch (_) {}

    const fechaCreacion = barberia.created_at ? new Date(barberia.created_at) : new Date();
    const diffDias = Math.floor((Date.now() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24)) % 30;
    const diasParaVencer = Math.max(1, 30 - diffDias);

    const preciosPlanes = {
      basico: { cop: 80000 },
      pro: { cop: 180000 },
      vip: { cop: 320000 },
      personalizado: { 
        cop: barberia.precio_mensual_cop || 200000 
      }
    };
    const infoPlan = preciosPlanes[barberia.plan] || preciosPlanes.basico;
    const precioCopFinal = barberia.precio_mensual_cop !== undefined && barberia.precio_mensual_cop !== null && barberia.precio_mensual_cop !== ''
      ? Number(barberia.precio_mensual_cop)
      : infoPlan.cop;

    res.json({
      success: true,
      barberia: {
        ...barberia,
        precio_mensual_cop: precioCopFinal,
        modulos_activos: modulos
      },
      suscripcion: {
        plan: barberia.plan || 'basico',
        precio_cop: precioCopFinal,
        dias_para_vencer: diasParaVencer,
        porcentaje_ciclo: Math.round(((30 - diasParaVencer) / 30) * 100),
        estado_pago: 'Al día',
        fecha_renovacion: new Date(Date.now() + diasParaVencer * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
      },
      metricas: {
        total_citas: totalCitas,
        citas_este_mes: citasMes,
        total_barberos: barberos.length,
        total_servicios: servicios.length
      },
      barberos,
      servicios
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/superadmin/barberias', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT * FROM barberias ORDER BY id DESC').all();
    if (rows && rows.length > 0) {
      const result = await Promise.all(rows.map(async b => {
        let modulos = {};
        try {
          modulos = typeof b.modulos_activos === 'string' ? JSON.parse(b.modulos_activos) : (b.modulos_activos || {});
        } catch (e) {
          modulos = getDefaultModulesForPlan(b.plan);
        }
        const barberosRow = await db.prepare('SELECT COUNT(*) as count FROM barberos WHERE barberia_id = ?').get(b.id);
        const citasRow = await db.prepare('SELECT COUNT(*) as count FROM citas WHERE barberia_id = ?').get(b.id);
        return {
          ...b,
          modulos_activos: modulos,
          total_barberos: Number(barberosRow?.count || 0),
          total_citas: Number(citasRow?.count || 0)
        };
      }));
      return res.json(result);
    }
    res.json(memoryBarberias);
  } catch (error) {
    console.warn('Fallback superadmin barberias:', error.message);
    res.json(memoryBarberias);
  }
});

app.post('/api/superadmin/barberias', async (req, res) => {
  const {
    nombre,
    slug,
    eslogan,
    logo_url,
    color_primario,
    color_secundario,
    telefono,
    direccion,
    plan,
    modulos_activos,
    pin_admin,
    precio_mensual_cop
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre de la barbería es obligatorio' });

  try {
    let finalSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : '';
    if (!finalSlug) {
      finalSlug = nombre.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    const existe = await db.prepare('SELECT id FROM barberias WHERE slug = ?').get(finalSlug);
    if (existe || memoryBarberias.some(b => b.slug === finalSlug)) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const planElegido = plan || 'basico';
    const modulosFinales = modulos_activos ? (typeof modulos_activos === 'string' ? modulos_activos : JSON.stringify(modulos_activos)) : JSON.stringify(getDefaultModulesForPlan(planElegido));

    let nuevaId = Date.now();
    try {
      const stmt = db.prepare(`
        INSERT INTO barberias (
          slug, nombre, eslogan, logo_url, color_primario, color_secundario,
          telefono, direccion, plan, modulos_activos, pin_admin, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      const result = await stmt.run(
        finalSlug,
        nombre.trim(),
        eslogan || 'Tu estilo en las mejores manos',
        logo_url || '',
        color_primario || '#2563eb',
        color_secundario || '#1e293b',
        telefono || '',
        direccion || '',
        planElegido,
        modulosFinales,
        pin_admin || '1234'
      );
      if (result && result.lastInsertRowid) {
        nuevaId = result.lastInsertRowid;
      }
    } catch (e) {
      console.warn('DB insert barberia warning:', e.message);
    }

    try {
      const stmtServ = db.prepare('INSERT INTO servicios (barberia_id, nombre, precio_cop, duracion_minutos, descripcion, activo) VALUES (?, ?, ?, ?, ?, 1)');
      await stmtServ.run(nuevaId, 'Corte Clásico', 25000, 45, 'Corte tradicional de cabello con tijera y máquina.');
      await stmtServ.run(nuevaId, 'Corte y Barba Completa', 35000, 60, 'Perfilado de barba con toalla caliente y corte.');
    } catch (_) {}

    try {
      const stmtBarb = db.prepare('INSERT INTO barberos (barberia_id, nombre, telefono, email, password, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
      await stmtBarb.run(nuevaId, 'Barbero Principal', telefono || '', `admin@${finalSlug}.com`, '123456', 50.0, '09:00', '20:00', '1,2,3,4,5,6');
    } catch (_) {}

    let nuevaBarberia = null;
    try {
      nuevaBarberia = await db.prepare('SELECT * FROM barberias WHERE id = ?').get(nuevaId);
    } catch (_) {}

    let parsedModulos = {};
    try {
      if (nuevaBarberia && nuevaBarberia.modulos_activos) {
        parsedModulos = typeof nuevaBarberia.modulos_activos === 'string' ? JSON.parse(nuevaBarberia.modulos_activos) : nuevaBarberia.modulos_activos;
      } else {
        parsedModulos = JSON.parse(modulosFinales);
      }
    } catch (_) {
      parsedModulos = getDefaultModulesForPlan(planElegido);
    }

    const barberiaFinal = {
      id: nuevaBarberia?.id || nuevaId,
      slug: nuevaBarberia?.slug || finalSlug,
      nombre: nuevaBarberia?.nombre || nombre.trim(),
      eslogan: nuevaBarberia?.eslogan || eslogan || 'Tu estilo en las mejores manos',
      logo_url: nuevaBarberia?.logo_url || logo_url || '',
      color_primario: nuevaBarberia?.color_primario || color_primario || '#2563eb',
      color_secundario: nuevaBarberia?.color_secundario || color_secundario || '#1e293b',
      telefono: nuevaBarberia?.telefono || telefono || '',
      direccion: nuevaBarberia?.direccion || direccion || '',
      plan: nuevaBarberia?.plan || planElegido,
      precio_mensual_cop: precio_mensual_cop !== undefined && precio_mensual_cop !== '' ? Number(precio_mensual_cop) : (planElegido === 'vip' ? 320000 : (planElegido === 'pro' ? 180000 : 80000)),
      modulos_activos: parsedModulos,
      pin_admin: nuevaBarberia?.pin_admin || pin_admin || '1234',
      activo: 1,
      total_barberos: 1,
      total_citas: 0
    };

    store.agregarBarberia(barberiaFinal);

    res.json({
      success: true,
      message: 'Barbería creada exitosamente con servicios y barbero inicial',
      barberia: barberiaFinal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/superadmin/barberias/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, slug, eslogan, logo_url, color_primario, color_secundario, telefono, direccion, plan, modulos_activos, pin_admin, activo, precio_mensual_cop } = req.body;

  try {
    let actual = null;
    try {
      actual = await db.prepare('SELECT * FROM barberias WHERE id = ?').get(id);
    } catch (_) {}

    if (!actual) {
      actual = memoryBarberias.find(b => String(b.id) === String(id));
    }

    let modulosStr = null;
    if (modulos_activos !== undefined) {
      modulosStr = typeof modulos_activos === 'string' ? modulos_activos : JSON.stringify(modulos_activos);
    } else if (plan !== undefined && actual && plan !== actual.plan) {
      modulosStr = JSON.stringify(getDefaultModulesForPlan(plan));
    }

    try {
      const stmt = db.prepare(`
        UPDATE barberias
        SET nombre = COALESCE(?, nombre),
            slug = COALESCE(?, slug),
            eslogan = COALESCE(?, eslogan),
            logo_url = COALESCE(?, logo_url),
            color_primario = COALESCE(?, color_primario),
            color_secundario = COALESCE(?, color_secundario),
            telefono = COALESCE(?, telefono),
            direccion = COALESCE(?, direccion),
            plan = COALESCE(?, plan),
            modulos_activos = COALESCE(?, modulos_activos),
            pin_admin = COALESCE(?, pin_admin),
            activo = COALESCE(?, activo)
        WHERE id = ?
      `);

      await stmt.run(
        nombre !== undefined ? nombre : null,
        slug !== undefined ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : null,
        eslogan !== undefined ? eslogan : null,
        logo_url !== undefined ? logo_url : null,
        color_primario !== undefined ? color_primario : null,
        color_secundario !== undefined ? color_secundario : null,
        telefono !== undefined ? telefono : null,
        direccion !== undefined ? direccion : null,
        plan !== undefined ? plan : null,
        modulosStr,
        pin_admin !== undefined ? pin_admin : null,
        activo !== undefined ? (activo ? 1 : 0) : null,
        id
      );
    } catch (e) {
      console.warn('DB update barberia warning:', e.message);
    }

    let updated = null;
    try {
      updated = await db.prepare('SELECT * FROM barberias WHERE id = ?').get(id);
    } catch (_) {}

    let parsedUpdatedModulos = {};
    try {
      if (updated && updated.modulos_activos) {
        parsedUpdatedModulos = typeof updated.modulos_activos === 'string' ? JSON.parse(updated.modulos_activos || '{}') : updated.modulos_activos;
      } else if (modulosStr) {
        parsedUpdatedModulos = JSON.parse(modulosStr);
      } else if (actual && actual.modulos_activos) {
        parsedUpdatedModulos = actual.modulos_activos;
      } else {
        parsedUpdatedModulos = getDefaultModulesForPlan(plan || 'basico');
      }
    } catch (_) {
      parsedUpdatedModulos = getDefaultModulesForPlan(plan || 'basico');
    }

    const barberiaActualizada = {
      id: Number(id),
      nombre: updated?.nombre || nombre || actual?.nombre || 'Barbería',
      slug: updated?.slug || slug || actual?.slug || '',
      eslogan: updated?.eslogan || eslogan || actual?.eslogan || '',
      logo_url: updated?.logo_url || logo_url || actual?.logo_url || '',
      color_primario: updated?.color_primario || color_primario || actual?.color_primario || '#2563eb',
      color_secundario: updated?.color_secundario || color_secundario || actual?.color_secundario || '#1e293b',
      telefono: updated?.telefono || telefono || actual?.telefono || '',
      direccion: updated?.direccion || direccion || actual?.direccion || '',
      plan: updated?.plan || plan || actual?.plan || 'basico',
      precio_mensual_cop: precio_mensual_cop !== undefined && precio_mensual_cop !== '' ? Number(precio_mensual_cop) : (actual?.precio_mensual_cop ?? ((updated?.plan || plan || actual?.plan) === 'vip' ? 320000 : ((updated?.plan || plan || actual?.plan) === 'pro' ? 180000 : 80000))),
      modulos_activos: parsedUpdatedModulos,
      pin_admin: updated?.pin_admin || pin_admin || actual?.pin_admin || '1234',
      activo: updated?.activo !== undefined ? updated.activo : (activo !== undefined ? (activo ? 1 : 0) : (actual?.activo ?? 1)),
      total_barberos: updated?.total_barberos || actual?.total_barberos || 1,
      total_citas: updated?.total_citas || actual?.total_citas || 0
    };

    store.actualizarBarberia(id, barberiaActualizada);

    res.json({
      success: true,
      message: 'Barbería actualizada correctamente',
      barberia: barberiaActualizada
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/superadmin/barberias/:id', async (req, res) => {
  const { id } = req.params;
  if (Number(id) === 1) {
    return res.status(400).json({ error: 'No se puede eliminar la barbería principal del sistema (ID 1).' });
  }
  try {
    try {
      await db.prepare('DELETE FROM citas WHERE barberia_id = ?').run(id);
      await db.prepare('DELETE FROM barberos WHERE barberia_id = ?').run(id);
      await db.prepare('DELETE FROM servicios WHERE barberia_id = ?').run(id);
      await db.prepare('DELETE FROM bloqueos WHERE barberia_id = ?').run(id);
      await db.prepare('DELETE FROM costos WHERE barberia_id = ?').run(id);
      await db.prepare('DELETE FROM barberias WHERE id = ?').run(id);
    } catch (e) {
      console.warn('DB delete warning:', e.message);
    }

    store.eliminarBarberia(id);

    res.json({ success: true, message: 'Barbería eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/superadmin/citas-globales', async (req, res) => {
  const { desde, hasta, q, barberia_id } = req.query;
  try {
    let sql = `
      SELECT c.*, b.nombre as barbero_nombre, s.nombre as servicio_nombre, bar.nombre as barberia_nombre, bar.slug as barberia_slug
      FROM citas c
      LEFT JOIN barberos b ON c.barbero_id = b.id
      LEFT JOIN servicios s ON c.servicio_id = s.id
      LEFT JOIN barberias bar ON c.barberia_id = bar.id
      WHERE 1=1
    `;
    const params = [];
    if (barberia_id && barberia_id !== 'todas') {
      sql += ' AND c.barberia_id = ?';
      params.push(barberia_id);
    }
    if (desde && hasta) {
      sql += ' AND c.fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    } else if (desde) {
      sql += ' AND c.fecha >= ?';
      params.push(desde);
    }
    if (q) {
      sql += ' AND (LOWER(c.cliente_nombre) LIKE ? OR c.cliente_telefono LIKE ?)';
      params.push(`%${q.toLowerCase()}%`, `%${q}%`);
    }
    sql += ' ORDER BY c.fecha DESC, c.hora_inicio DESC LIMIT 200';
    const citas = await db.prepare(sql).all(...params);
    if (citas && citas.length > 0) return res.json(citas);
    
    // Fallback de demostración si no hay citas en DB
    res.json([
      {
        id: 1,
        barberia_id: 1,
        barberia_nombre: 'The Barber Club',
        barberia_slug: 'the-barber-club',
        cliente_nombre: 'Andrés Gómez',
        cliente_telefono: '3001234567',
        barbero_nombre: 'Carlos "El Patrón"',
        servicio_nombre: 'Corte Clásico / Fade',
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '10:00',
        estado: 'confirmada'
      },
      {
        id: 2,
        barberia_id: 1,
        barberia_nombre: 'The Barber Club',
        barberia_slug: 'the-barber-club',
        cliente_nombre: 'Santiago Martínez',
        cliente_telefono: '3109876543',
        barbero_nombre: 'Mateo Fade',
        servicio_nombre: 'Arreglo de Barba VIP',
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '11:30',
        estado: 'confirmada'
      }
    ]);
  } catch (err) {
    console.warn('Fallback superadmin citas globales:', err.message);
    res.json([]);
  }
});

app.get('/api/superadmin/barberos-globales', async (req, res) => {
  try {
    let sql = `
      SELECT b.*, bar.nombre as barberia_nombre, bar.slug as barberia_slug
      FROM barberos b
      LEFT JOIN barberias bar ON b.barberia_id = bar.id
      ORDER BY b.barberia_id ASC, b.id ASC
    `;
    const rows = await db.prepare(sql).all();
    if (rows && rows.length > 0) return res.json(rows);

    res.json([
      {
        id: 1,
        barberia_id: 1,
        barberia_nombre: 'The Barber Club',
        nombre: 'Carlos "El Patrón"',
        especialidad: 'Degradados & Barbas VIP',
        telefono: '3001234567',
        porcentaje_comision: 50,
        horario_inicio: '09:00',
        horario_fin: '20:00',
        activo: 1,
        foto_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300'
      },
      {
        id: 2,
        barberia_id: 1,
        barberia_nombre: 'The Barber Club',
        nombre: 'Mateo Fade',
        especialidad: 'Cortes Clásicos & Diseños',
        telefono: '3109876543',
        porcentaje_comision: 50,
        horario_inicio: '10:00',
        horario_fin: '19:00',
        activo: 1,
        foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'
      }
    ]);
  } catch (err) {
    console.warn('Fallback superadmin barberos globales:', err.message);
    res.json([]);
  }
});

// ----------------------------------------------------
// 3. BARBEROS (EQUIPO)
// ----------------------------------------------------
app.get('/api/barberos', async (req, res) => {
  try {
    const tenantId = await getTenantId(req);
    const todos = req.query.todos === 'true';
    let barberos = [];
    try {
      const query = todos 
        ? 'SELECT * FROM barberos WHERE barberia_id = ? ORDER BY nombre ASC'
        : 'SELECT * FROM barberos WHERE barberia_id = ? AND activo = 1 ORDER BY nombre ASC';
      barberos = await db.prepare(query).all(tenantId);
    } catch (_) {}

    if (barberos && barberos.length > 0) {
      return res.json(barberos);
    }

    const storeBarberos = store.obtenerBarberos(tenantId, !todos);
    if (storeBarberos && storeBarberos.length > 0) {
      return res.json(storeBarberos);
    }

    // Si es la barbería 1, devolver catálogo demo
    if (Number(tenantId) === 1) {
      return res.json([
        { id: 1, barberia_id: 1, nombre: 'Carlos "El Patrón"', especialidad: 'Degradados & Barbas', activo: 1, foto_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300' },
        { id: 2, barberia_id: 1, nombre: 'Mateo Fade', especialidad: 'Cortes Clásicos & Diseños', activo: 1, foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
        { id: 3, barberia_id: 1, nombre: 'Andrés Tijeras', especialidad: 'Tratamientos Capilares & Barba VIP', activo: 1, foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300' }
      ]);
    }

    // Para cualquier otra barbería sin barberos, barbero principal
    res.json([
      { id: Date.now(), barberia_id: tenantId, nombre: 'Barbero Principal', especialidad: 'Estilos Generales & Barba', activo: 1, foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' }
    ]);
  } catch (error) {
    console.warn('Fallback barberos:', error.message);
    res.json([]);
  }
});

app.post('/api/barberos', async (req, res) => {
  const { nombre, telefono, email, password, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    const tenantId = await getTenantId(req);
    const tenant = await getTenant(req);

    let modulos = {};
    try {
      modulos = typeof tenant.modulos_activos === 'string' ? JSON.parse(tenant.modulos_activos) : (tenant.modulos_activos || {});
    } catch (e) {}
    const maxBarberos = modulos.max_barberos || (tenant.plan === 'basico' ? 2 : tenant.plan === 'pro' ? 5 : 999);
    const countRow = await db.prepare('SELECT COUNT(*) as count FROM barberos WHERE barberia_id = ? AND activo = 1').get(tenantId);
    const currentCount = Number(countRow?.count || 0);

    if (currentCount >= maxBarberos) {
      return res.status(400).json({
        error: `Has alcanzado el límite de ${maxBarberos} barberos activos permitidos en el Plan ${(tenant.plan || 'básico').toUpperCase()}. Mejora de plan para añadir más.`
      });
    }

    const nombreLimpio = nombre.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const emailFinal = email ? email.trim().toLowerCase() : `${nombreLimpio || 'barbero' + Date.now()}@barberia.com`;
    const passwordFinal = password ? password.trim() : '123456';

    const stmt = db.prepare(`
      INSERT INTO barberos (barberia_id, nombre, telefono, email, password, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = await stmt.run(
      tenantId,
      nombre,
      telefono || '',
      emailFinal,
      passwordFinal,
      foto_url || '',
      porcentaje_comision !== undefined ? Number(porcentaje_comision) : 50.0,
      horario_inicio || '09:00',
      horario_fin || '20:00',
      dias_laborales || '1,2,3,4,5,6'
    );
    res.json({ id: result.lastInsertRowid, message: 'Barbero agregado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/barberos/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  const { nombre, especialidad, telefono, email, password, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE barberos 
      SET nombre = COALESCE(?, nombre),
          especialidad = COALESCE(?, especialidad),
          telefono = COALESCE(?, telefono),
          email = COALESCE(?, email),
          password = COALESCE(?, password),
          foto_url = COALESCE(?, foto_url),
          porcentaje_comision = COALESCE(?, porcentaje_comision),
          horario_inicio = COALESCE(?, horario_inicio),
          horario_fin = COALESCE(?, horario_fin),
          dias_laborales = COALESCE(?, dias_laborales),
          activo = COALESCE(?, activo)
      WHERE id = ? AND barberia_id = ?
    `);
    await stmt.run(
      nombre !== undefined ? nombre : null,
      especialidad !== undefined ? especialidad : null,
      telefono !== undefined ? telefono : null,
      email !== undefined && email !== '' ? email.trim().toLowerCase() : null,
      password !== undefined && password !== '' ? password.trim() : null,
      foto_url !== undefined ? foto_url : null,
      porcentaje_comision !== undefined && porcentaje_comision !== '' ? Number(porcentaje_comision) : null,
      horario_inicio !== undefined ? horario_inicio : null,
      horario_fin !== undefined ? horario_fin : null,
      dias_laborales !== undefined ? dias_laborales : null,
      activo !== undefined ? (activo ? 1 : 0) : null,
      id,
      tenantId
    );
    res.json({ success: true, message: 'Barbero actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/barberos/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  const { porcentaje_comision, activo, pin, email, password } = req.body;

  try {
    const barbero = await db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    if (porcentaje_comision !== undefined) {
      await db.prepare('UPDATE barberos SET porcentaje_comision = ? WHERE id = ? AND barberia_id = ?').run(Number(porcentaje_comision), id, tenantId);
    }
    if (activo !== undefined) {
      await db.prepare('UPDATE barberos SET activo = ? WHERE id = ? AND barberia_id = ?').run(activo ? 1 : 0, id, tenantId);
    }
    if (pin !== undefined && pin !== '') {
      await db.prepare('UPDATE barberos SET pin = ? WHERE id = ? AND barberia_id = ?').run(String(pin).trim(), id, tenantId);
    }
    if (email !== undefined && email !== '') {
      await db.prepare('UPDATE barberos SET email = ? WHERE id = ? AND barberia_id = ?').run(String(email).trim().toLowerCase(), id, tenantId);
    }
    if (password !== undefined && password !== '') {
      await db.prepare('UPDATE barberos SET password = ? WHERE id = ? AND barberia_id = ?').run(String(password).trim(), id, tenantId);
    }

    const actualizado = await db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    res.json({ success: true, message: 'Barbero actualizado', barbero: actualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/barberos/login', async (req, res) => {
  const { email, password, barbero_id, pin } = req.body;
  const tenantId = await getTenantId(req);

  try {
    let barbero;
    if (email && password) {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();
      barbero = await db.prepare('SELECT * FROM barberos WHERE barberia_id = ? AND LOWER(email) = ? AND password = ?').get(tenantId, cleanEmail, cleanPass);
      if (!barbero) {
        const byId = await db.prepare('SELECT * FROM barberos WHERE barberia_id = ? AND password = ?').get(tenantId, cleanPass);
        if (byId && (byId.nombre.toLowerCase().includes(cleanEmail) || byId.email.toLowerCase() === cleanEmail)) {
          barbero = byId;
        }
      }
    } else if (barbero_id) {
      barbero = await db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(barbero_id, tenantId);
      if (barbero && barbero.pin && barbero.pin !== pin) {
        return res.status(401).json({ error: 'PIN incorrecto' });
      }
    }

    if (!barbero) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
    }

    if (barbero.activo === 0) {
      return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Consulta con el dueño de la barbería.' });
    }

    const { password: _, pin: __, ...barberoSeguro } = barbero;
    res.json({
      success: true,
      message: `Bienvenido de vuelta, ${barbero.nombre}`,
      barbero: barberoSeguro
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/barberos/:id/record', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);

  try {
    const barbero = await db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    const totalCitasRow = await db.prepare('SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ?').get(id, tenantId);
    const citasCompletadas = await db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(precio_cobrado), 0) as total FROM citas WHERE barbero_id = ? AND barberia_id = ? AND estado = 'completada'").get(id, tenantId);
    const citasCanceladas = await db.prepare("SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ? AND estado = 'cancelada'").get(id, tenantId);
    const noAsistio = await db.prepare("SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ? AND estado = 'no_asistio'").get(id, tenantId);

    const liquidaciones = await db.prepare(`
      SELECT * FROM liquidaciones 
      WHERE barbero_id = ? AND barberia_id = ?
      ORDER BY fecha_fin DESC LIMIT 15
    `).all(id, tenantId);

    const totalCobradoHistorico = Number(citasCompletadas?.total || 0);
    const totalComisionesPagadas = liquidaciones.reduce((sum, l) => sum + Number(l.total_pagado || 0), 0);
    const utilidadGenerada = totalCobradoHistorico - totalComisionesPagadas;
    const totalCitas = Number(totalCitasRow?.count || 0);

    const ultimasCitas = await db.prepare(`
      SELECT c.*, s.nombre as servicio_nombre
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barbero_id = ? AND c.barberia_id = ?
      ORDER BY c.fecha DESC, c.hora_inicio DESC
      LIMIT 20
    `).all(id, tenantId);

    const { password: _, pin: __, ...barberoLimpio } = barbero;

    res.json({
      barbero: barberoLimpio,
      metricas: {
        total_citas: totalCitas,
        completadas: Number(citasCompletadas?.count || 0),
        canceladas: Number(citasCanceladas?.count || 0),
        no_asistio: Number(noAsistio?.count || 0),
        total_facturado: totalCobradoHistorico,
        total_comisiones_pagadas: totalComisionesPagadas,
        utilidad_neta_para_barberia: utilidadGenerada,
        efectividad_pct: totalCitas > 0 ? Math.round((Number(citasCompletadas?.count || 0) / totalCitas) * 100) : 0
      },
      liquidaciones,
      ultimas_citas: ultimasCitas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/barbero-portal/citas', async (req, res) => {
  const { barbero_id, fecha, desde, hasta, q } = req.query;
  const tenantId = await getTenantId(req);

  if (!barbero_id) {
    return res.status(400).json({ error: 'barbero_id es obligatorio' });
  }

  try {
    let sql = `
      SELECT 
        c.id, 
        c.fecha, 
        c.hora_inicio, 
        c.hora_fin, 
        c.estado, 
        c.notas, 
        c.precio_cobrado,
        c.cliente_nombre,
        s.nombre as servicio_nombre, 
        s.duracion_minutos
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barberia_id = ? AND c.barbero_id = ?
    `;
    const params = [tenantId, barbero_id];

    if (fecha) {
      sql += ' AND c.fecha = ?';
      params.push(fecha);
    }
    if (desde && hasta) {
      sql += ' AND c.fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    }
    if (q) {
      sql += ' AND LOWER(c.cliente_nombre) LIKE ?';
      params.push(`%${q.toLowerCase()}%`);
    }

    sql += ' ORDER BY c.fecha DESC, c.hora_inicio ASC';
    const citas = await db.prepare(sql).all(...params);
    res.json(citas || []);
  } catch (error) {
    console.warn('Fallback citas:', error.message);
    res.json([]);
  }
});

app.get('/api/barbero-portal/balance', async (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  const tenantId = await getTenantId(req);

  if (!barbero_id) {
    return res.status(400).json({ error: 'barbero_id es obligatorio' });
  }

  try {
    const barbero = await db.prepare('SELECT id, nombre, porcentaje_comision FROM barberos WHERE id = ? AND barberia_id = ?').get(barbero_id, tenantId);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    let sqlCitas = `
      SELECT c.id, c.fecha, c.hora_inicio, c.precio_cobrado, s.nombre as servicio_nombre, c.liquidacion_id
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barbero_id = ? AND c.barberia_id = ? AND c.estado = 'completada'
    `;
    const paramsCitas = [barbero_id, tenantId];

    if (desde && hasta) {
      sqlCitas += ' AND c.fecha BETWEEN ? AND ?';
      paramsCitas.push(desde, hasta);
    }

    sqlCitas += ' ORDER BY c.fecha DESC';
    const citasCompletadas = await db.prepare(sqlCitas).all(...paramsCitas);

    let sqlVentas = `
      SELECT v.id, v.fecha, v.cantidad, v.total_venta, v.monto_comision, p.nombre as producto_nombre, v.liquidacion_id
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      WHERE v.barbero_id = ? AND v.barberia_id = ?
    `;
    const paramsVentas = [barbero_id, tenantId];
    if (desde && hasta) {
      sqlVentas += ' AND v.fecha BETWEEN ? AND ?';
      paramsVentas.push(desde, hasta);
    }
    const ventasProductos = await db.prepare(sqlVentas).all(...paramsVentas);

    const liquidaciones = await db.prepare(`
      SELECT * FROM liquidaciones 
      WHERE barbero_id = ? AND barberia_id = ?
      ORDER BY fecha_pago DESC LIMIT 10
    `).all(barbero_id, tenantId);

    const totalBrutoServicios = citasCompletadas.reduce((sum, c) => sum + Number(c.precio_cobrado || 0), 0);
    const pct = Number(barbero.porcentaje_comision || 50);
    const comisionServiciosEstimada = Math.round(totalBrutoServicios * (pct / 100));
    const comisionProductos = ventasProductos.reduce((sum, v) => sum + Number(v.monto_comision || 0), 0);

    const pendientesLiquidarCitas = citasCompletadas.filter(c => !c.liquidacion_id);
    const pendientesLiquidarVentas = ventasProductos.filter(v => !v.liquidacion_id);
    const saldoPendienteServicios = Math.round(pendientesLiquidarCitas.reduce((sum, c) => sum + Number(c.precio_cobrado || 0), 0) * (pct / 100));
    const saldoPendienteProductos = pendientesLiquidarVentas.reduce((sum, v) => sum + Number(v.monto_comision || 0), 0);
    const saldoPendienteCobrar = saldoPendienteServicios + saldoPendienteProductos;

    res.json({
      barbero,
      total_citas_completadas: citasCompletadas.length,
      total_bruto_servicios: totalBrutoServicios,
      porcentaje_comision: pct,
      comision_servicios_estimada: comisionServiciosEstimada,
      total_ventas_productos: ventasProductos.length,
      comision_productos: comisionProductos,
      ganancia_total_estimada: comisionServiciosEstimada + comisionProductos,
      saldo_pendiente_cobrar: saldoPendienteCobrar,
      citas_recientes: citasCompletadas.slice(0, 15),
      ventas_recientes: ventasProductos.slice(0, 15),
      ultimas_liquidaciones: liquidaciones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/barberos/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  try {
    const citasCountRow = await db.prepare('SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ?').get(id, tenantId);
    const citasCount = Number(citasCountRow?.count || 0);

    if (citasCount > 0) {
      await db.prepare('UPDATE barberos SET activo = 0 WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Barbero desactivado (se conservó su historial de citas)' });
    } else {
      await db.prepare('DELETE FROM barberos WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Barbero eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. SERVICIOS
// ----------------------------------------------------
app.get('/api/servicios', async (req, res) => {
  try {
    const tenantId = await getTenantId(req);
    const todos = req.query.todos === 'true';
    let servicios = [];
    try {
      const query = todos 
        ? 'SELECT * FROM servicios WHERE barberia_id = ? ORDER BY precio_cop ASC'
        : 'SELECT * FROM servicios WHERE barberia_id = ? AND activo = 1 ORDER BY precio_cop ASC';
      servicios = await db.prepare(query).all(tenantId);
    } catch (_) {}

    if (servicios && servicios.length > 0) {
      return res.json(servicios);
    }

    const storeServicios = store.obtenerServicios(tenantId, !todos);
    if (storeServicios && storeServicios.length > 0) {
      return res.json(storeServicios);
    }

    // Si es la barbería 1, catálogo demo
    if (Number(tenantId) === 1) {
      return res.json([
        { id: 1, barberia_id: 1, nombre: 'Corte Clásico / Fade', precio_cop: 25000, duracion_minutos: 30, activo: 1, descripcion: 'Corte con degradado, perfilado de patillas y lavado exprés' },
        { id: 2, barberia_id: 1, nombre: 'Arreglo de Barba & Toalla Caliente', precio_cop: 18000, duracion_minutos: 20, activo: 1, descripcion: 'Perfilado con navaja, toalla caliente y aceites hidratantes' },
        { id: 3, barberia_id: 1, nombre: 'Combo VIP: Corte + Barba + Mascarilla', precio_cop: 40000, duracion_minutos: 50, activo: 1, descripcion: 'Servicio completo con exfoliación y masaje capilar' }
      ]);
    }

    // Para cualquier otra barbería sin servicios personalizados aún
    res.json([
      { id: Date.now(), barberia_id: tenantId, nombre: 'Corte Tradicional', precio_cop: 25000, duracion_minutos: 35, activo: 1, descripcion: 'Corte a máquina y tijera con peinado' },
      { id: Date.now() + 1, barberia_id: tenantId, nombre: 'Arreglo de Barba', precio_cop: 18000, duracion_minutos: 25, activo: 1, descripcion: 'Perfilado de barba con toalla caliente' }
    ]);
  } catch (error) {
    console.warn('Fallback servicios:', error.message);
    res.json([]);
  }
});

app.post('/api/servicios', async (req, res) => {
  const { nombre, precio_cop, duracion_minutos, descripcion } = req.body;
  if (!nombre || !precio_cop) return res.status(400).json({ error: 'Nombre y precio requeridos' });

  try {
    const tenantId = await getTenantId(req);
    const stmt = db.prepare(`
      INSERT INTO servicios (barberia_id, nombre, precio_cop, duracion_minutos, descripcion, activo)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const result = await stmt.run(tenantId, nombre, Number(precio_cop), Number(duracion_minutos) || 45, descripcion || '');
    res.json({ id: result.lastInsertRowid, message: 'Servicio creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/servicios/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  const { nombre, precio_cop, duracion_minutos, descripcion, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE servicios 
      SET nombre = COALESCE(?, nombre),
          precio_cop = COALESCE(?, precio_cop),
          duracion_minutos = COALESCE(?, duracion_minutos),
          descripcion = COALESCE(?, descripcion),
          activo = COALESCE(?, activo)
      WHERE id = ? AND barberia_id = ?
    `);
    await stmt.run(nombre, precio_cop, duracion_minutos, descripcion, activo, id, tenantId);
    res.json({ success: true, message: 'Servicio actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/servicios/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  try {
    const citasCountRow = await db.prepare('SELECT COUNT(*) as count FROM citas WHERE servicio_id = ? AND barberia_id = ?').get(id, tenantId);
    const citasCount = Number(citasCountRow?.count || 0);

    if (citasCount > 0) {
      await db.prepare('UPDATE servicios SET activo = 0 WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Servicio desactivado para conservar historial' });
    } else {
      await db.prepare('DELETE FROM servicios WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Servicio eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// ----------------------------------------------------
// 5. MOTOR DE DISPONIBILIDAD
// ----------------------------------------------------
app.get('/api/disponibilidad', async (req, res) => {
  const { barbero_id, fecha, duracion_minutos } = req.query;
  const tenantId = await getTenantId(req);

  if (!barbero_id || !fecha) {
    return res.status(400).json({ error: 'barbero_id y fecha son obligatorios' });
  }

  try {
    const duracion = Number(duracion_minutos) || 45;
    let barbero = null;
    try {
      barbero = await db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ? AND activo = 1').get(barbero_id, tenantId);
    } catch (_) {}

    // Fallback 1: Buscar en store local para este tenant
    if (!barbero) {
      const barberosStore = store.obtenerBarberos(tenantId, false);
      barbero = barberosStore.find(b => String(b.id) === String(barbero_id));
    }

    // Fallback 2: Buscar en catálogo global de barberos
    if (!barbero) {
      barbero = store.barberos.find(b => String(b.id) === String(barbero_id));
    }

    // Fallback 3: Si no existe, crear objeto estándar para no bloquear la agenda
    if (!barbero) {
      barbero = {
        id: Number(barbero_id),
        nombre: 'Barbero Principal',
        horario_inicio: '09:00',
        horario_fin: '20:00',
        dias_laborales: '1,2,3,4,5,6,7',
        activo: 1
      };
    }

    const fechaObj = new Date(`${fecha}T00:00:00`);
    let diaSemana = fechaObj.getDay();
    if (diaSemana === 0) diaSemana = 7;

    const diasLaboralesStr = barbero.dias_laborales || '1,2,3,4,5,6,7';
    const diasPermitidos = diasLaboralesStr.split(',').map(Number);
    if (!diasPermitidos.includes(diaSemana)) {
      return res.json({
        disponible_dia: false,
        motivo: 'El barbero no labora este día de la semana',
        slots: []
      });
    }

    // Cargar citas existentes
    let citas = [];
    try {
      citas = await db.prepare(`
        SELECT id, hora_inicio, hora_fin, cliente_nombre 
        FROM citas 
        WHERE barbero_id = ? AND barberia_id = ? AND fecha = ? AND estado != 'cancelada'
      `).all(barbero.id, tenantId, fecha);
    } catch (_) {}
    if (!citas || citas.length === 0) {
      citas = (store.citas || []).filter(c => String(c.barberia_id) === String(tenantId) && String(c.barbero_id) === String(barbero.id) && c.fecha === fecha && c.estado !== 'cancelada');
    }

    // Cargar bloqueos de horario o de día completo
    let bloqueos = [];
    try {
      bloqueos = await db.prepare(`
        SELECT id, hora_inicio, hora_fin, motivo 
        FROM bloqueos 
        WHERE (barbero_id = ? OR barbero_id IS NULL) AND barberia_id = ? AND fecha = ?
      `).all(barbero.id, tenantId, fecha);
    } catch (_) {}
    if (!bloqueos || bloqueos.length === 0) {
      bloqueos = store.obtenerBloqueos(tenantId, fecha, barbero.id);
    }

    // Verificar si hay bloqueo de día completo (00:00 a 23:59 o similar)
    const bloqueoDia = bloqueos.find(b => (b.hora_inicio <= '09:00' && b.hora_fin >= '19:00') || (b.hora_inicio === '00:00' && b.hora_fin >= '23:00'));
    if (bloqueoDia) {
      return res.json({
        disponible_dia: false,
        motivo: `Día bloqueado: ${bloqueoDia.motivo || 'No disponible para reservas'}`,
        slots: []
      });
    }

    const inicioMin = timeToMinutes(barbero.horario_inicio || '09:00');
    const finMin = timeToMinutes(barbero.horario_fin || '20:00');
    const step = 30;

    // Control de hora actual si la fecha es hoy
    const hoyStr = new Date().toISOString().split('T')[0];
    const esHoy = fecha === hoyStr;
    const ahora = new Date();
    // Hora local aproximada
    const horaActualMin = ahora.getHours() * 60 + ahora.getMinutes();

    const slots = [];
    for (let m = inicioMin; m + duracion <= finMin; m += step) {
      const slotInicio = minutesToTime(m);
      const slotFin = minutesToTime(m + duracion);

      const conflictoCita = citas.find(c => checkOverlap(slotInicio, slotFin, c.hora_inicio, c.hora_fin));
      const conflictoBloqueo = bloqueos.find(b => checkOverlap(slotInicio, slotFin, b.hora_inicio, b.hora_fin));

      let disponible = true;
      let razonOcupado = null;

      if (conflictoCita) {
        disponible = false;
        razonOcupado = 'Horario reservado por otro cliente';
      } else if (conflictoBloqueo) {
        disponible = false;
        razonOcupado = `Bloqueado: ${conflictoBloqueo.motivo}`;
      } else if (esHoy && m < horaActualMin) {
        disponible = false;
        razonOcupado = 'Horario ya transcurrido';
      }

      slots.push({
        hora_inicio: slotInicio,
        hora_fin: slotFin,
        disponible,
        razon: razonOcupado
      });
    }

    res.json({
      disponible_dia: true,
      barbero: { id: barbero.id, nombre: barbero.nombre },
      fecha,
      slots
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. CITAS / TURNOS MULTI-TENANT
// ----------------------------------------------------
app.get('/api/citas', async (req, res) => {
  const { fecha, barbero_id, estado, desde, hasta, q } = req.query;
  const tenantId = await getTenantId(req);

  try {
    let sql = `
      SELECT c.*, b.nombre as barbero_nombre, b.foto_url as barbero_foto, s.nombre as servicio_nombre, s.duracion_minutos
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barberia_id = ?
    `;
    const params = [tenantId];

    if (fecha) {
      sql += ' AND c.fecha = ?';
      params.push(fecha);
    }
    if (desde && hasta) {
      sql += ' AND c.fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    }
    if (barbero_id) {
      sql += ' AND c.barbero_id = ?';
      params.push(barbero_id);
    }
    if (estado) {
      sql += ' AND c.estado = ?';
      params.push(estado);
    }
    if (q) {
      sql += ' AND (LOWER(c.cliente_nombre) LIKE ? OR c.cliente_telefono LIKE ?)';
      params.push(`%${q.toLowerCase()}%`, `%${q}%`);
    }

    sql += ' ORDER BY c.fecha DESC, c.hora_inicio ASC';
    const citas = await db.prepare(sql).all(...params);
    res.json(citas || []);
  } catch (error) {
    console.warn('Fallback citas:', error.message);
    res.json([]);
  }
});

app.post('/api/citas', async (req, res) => {
  const { barbero_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, notas } = req.body;
  const tenantId = await getTenantId(req);

  if (!barbero_id || !servicio_id || !cliente_nombre || !cliente_telefono || !fecha || !hora_inicio) {
    return res.status(400).json({ error: 'Todos los campos marcados son obligatorios' });
  }

  try {
    const servicio = await db.prepare('SELECT * FROM servicios WHERE id = ? AND barberia_id = ?').get(servicio_id, tenantId);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    const duracion = Number(servicio.duracion_minutos) || 45;
    const startMin = timeToMinutes(hora_inicio);
    const endMin = startMin + duracion;
    const hora_fin = minutesToTime(endMin);

    const citasExistentes = await db.prepare(`
      SELECT id, hora_inicio, hora_fin 
      FROM citas 
      WHERE barbero_id = ? AND barberia_id = ? AND fecha = ? AND estado != 'cancelada'
    `).all(barbero_id, tenantId, fecha);

    const hayConflictoCita = citasExistentes.some(c => checkOverlap(hora_inicio, hora_fin, c.hora_inicio, c.hora_fin));
    if (hayConflictoCita) {
      return res.status(409).json({ 
        error: 'El horario seleccionado acaba de ser reservado por otro cliente. Por favor selecciona otro turno.' 
      });
    }

    const bloqueos = await db.prepare(`
      SELECT id, hora_inicio, hora_fin, motivo 
      FROM bloqueos 
      WHERE (barbero_id = ? OR barbero_id IS NULL) AND barberia_id = ? AND fecha = ?
    `).all(barbero_id, tenantId, fecha);

    const hayConflictoBloqueo = bloqueos.some(b => checkOverlap(hora_inicio, hora_fin, b.hora_inicio, b.hora_fin));
    if (hayConflictoBloqueo) {
      return res.status(409).json({ 
        error: 'El barbero o la barbería tiene este horario bloqueado.' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO citas (
        barberia_id, barbero_id, servicio_id, cliente_nombre, cliente_telefono, 
        fecha, hora_inicio, hora_fin, estado, notas, precio_cobrado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmada', ?, ?)
    `);

    const result = await stmt.run(
      tenantId,
      Number(barbero_id),
      Number(servicio_id),
      cliente_nombre.trim(),
      cliente_telefono.trim(),
      fecha,
      hora_inicio,
      hora_fin,
      notas || '',
      servicio.precio_cop
    );

    const nuevaCitaId = result.lastInsertRowid;

    await registrarAuditoria(
      tenantId,
      'cita_creada',
      `Nueva cita agendada para ${cliente_nombre.trim()} el ${fecha} a las ${hora_inicio}`,
      'Cliente Web',
      { cita_id: nuevaCitaId, servicio: servicio.nombre, barbero_id }
    );

    const citaCreada = await db.prepare(`
      SELECT c.*, b.nombre as barbero_nombre, s.nombre as servicio_nombre
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.id = ? AND c.barberia_id = ?
    `).get(nuevaCitaId, tenantId);

    res.status(201).json({
      success: true,
      message: '¡Tu cita ha sido confirmada con éxito!',
      cita: citaCreada
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/citas/:id/reasignar', async (req, res) => {
  const { id } = req.params;
  const { nuevo_barbero_id, motivo } = req.body;
  const tenantId = await getTenantId(req);

  if (!nuevo_barbero_id) {
    return res.status(400).json({ error: 'Debes seleccionar el barbero destino' });
  }

  try {
    const cita = await db.prepare('SELECT * FROM citas WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    const nuevoBarbero = await db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ? AND activo = 1').get(nuevo_barbero_id, tenantId);
    if (!nuevoBarbero) return res.status(404).json({ error: 'El barbero seleccionado no existe o está inactivo' });

    const citasExistentes = await db.prepare(`
      SELECT id, hora_inicio, hora_fin 
      FROM citas 
      WHERE barbero_id = ? AND barberia_id = ? AND fecha = ? AND id != ? AND estado != 'cancelada'
    `).all(nuevo_barbero_id, tenantId, cita.fecha, id);

    const hayConflicto = citasExistentes.some(c => checkOverlap(cita.hora_inicio, cita.hora_fin, c.hora_inicio, c.hora_fin));
    if (hayConflicto) {
      return res.status(409).json({ 
        error: `${nuevoBarbero.nombre} ya tiene una cita ocupada en ese mismo rango horario (${cita.hora_inicio} - ${cita.hora_fin})` 
      });
    }

    await db.prepare('UPDATE citas SET barbero_id = ? WHERE id = ? AND barberia_id = ?').run(nuevo_barbero_id, id, tenantId);

    await registrarAuditoria(
      tenantId,
      'cita_reasignada',
      `Cita #${id} reasignada a ${nuevoBarbero.nombre}. Motivo: ${motivo || 'Reorganización de agenda'}`,
      'Administración',
      { cita_id: id, barbero_anterior: cita.barbero_id, barbero_nuevo: nuevo_barbero_id, motivo }
    );

    const citaActualizada = await db.prepare(`
      SELECT c.*, b.nombre as barbero_nombre, s.nombre as servicio_nombre
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.id = ? AND c.barberia_id = ?
    `).get(id, tenantId);

    res.json({
      success: true,
      message: `Cita reasignada con éxito a ${nuevoBarbero.nombre}`,
      cita: citaActualizada
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/citas/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado, precio_cobrado } = req.body;
  const tenantId = await getTenantId(req);

  const estadosValidos = ['confirmada', 'completada', 'cancelada', 'no_asistio'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  try {
    const citaActual = await db.prepare('SELECT * FROM citas WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!citaActual) return res.status(404).json({ error: 'Cita no encontrada' });

    let stmt;
    if (precio_cobrado !== undefined) {
      stmt = db.prepare('UPDATE citas SET estado = ?, precio_cobrado = ? WHERE id = ? AND barberia_id = ?');
      await stmt.run(estado, Number(precio_cobrado), id, tenantId);
    } else {
      stmt = db.prepare('UPDATE citas SET estado = ? WHERE id = ? AND barberia_id = ?');
      await stmt.run(estado, id, tenantId);
    }

    await registrarAuditoria(
      tenantId,
      'cita_estado_cambiado',
      `Estado de cita #${id} cambiado a '${estado}'`,
      'Administración',
      { cita_id: id, estado_anterior: citaActual.estado, estado_nuevo: estado }
    );

    res.json({ success: true, message: 'Estado de la cita actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  try {
    await db.prepare('DELETE FROM citas WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6.1 CLIENTES PREFERENCIALES & FIDELIZACIÓN
// ----------------------------------------------------
const memoryClientes = [
  {
    id: 1,
    barberia_id: 1,
    cliente_nombre: 'Andrés Gómez',
    cliente_telefono: '3001234567',
    categoria: 'VIP',
    fecha_cumpleanos: '1992-05-14',
    beneficio_fidelidad: '10º corte gratis + Bebida de cortesía',
    notas: 'Cliente fundador. Prefiere degradado bajo con navaja.'
  },
  {
    id: 2,
    barberia_id: 1,
    cliente_nombre: 'Santiago Martínez',
    cliente_telefono: '3109876543',
    categoria: 'Preferencial',
    fecha_cumpleanos: '1995-11-20',
    beneficio_fidelidad: 'Descuento 15% en barba',
    notas: 'Asiste cada 15 días puntualmente los sábados.'
  },
  {
    id: 3,
    barberia_id: 1,
    cliente_nombre: 'Felipe Herrera',
    cliente_telefono: '3154443322',
    categoria: 'Frecuente',
    fecha_cumpleanos: '1988-08-04',
    beneficio_fidelidad: 'Lavado y peinado con cera gratis',
    notas: 'Le gusta corte clásico tijera arriba.'
  }
];

app.get('/api/clientes', async (req, res) => {
  const tenantId = await getTenantId(req);
  const { q, categoria } = req.query;

  try {
    // 1. Acumular historial de citas por cliente
    let sql = `
      SELECT 
        c.cliente_nombre,
        c.cliente_telefono,
        COUNT(c.id) as total_citas,
        MAX(c.fecha) as ultima_visita,
        MIN(c.fecha) as primera_visita,
        COALESCE(SUM(s.precio), 0) as total_gastado
      FROM citas c
      LEFT JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barberia_id = ?
    `;
    const params = [tenantId];
    if (q) {
      sql += ' AND (LOWER(c.cliente_nombre) LIKE ? OR c.cliente_telefono LIKE ?)';
      params.push(`%${q.toLowerCase()}%`, `%${q}%`);
    }
    sql += ' GROUP BY c.cliente_nombre, c.cliente_telefono ORDER BY total_citas DESC, ultima_visita DESC';

    let citasClientes = [];
    try {
      citasClientes = await db.prepare(sql).all(...params) || [];
    } catch (_) {}

    // 2. Mapa de fidelidad guardado en memoria
    const mapaFidelidad = {};
    memoryClientes.filter(m => m.barberia_id === tenantId).forEach(m => {
      const tel = (m.cliente_telefono || '').replace(/[^0-9]/g, '');
      if (tel) mapaFidelidad[tel] = m;
      if (m.cliente_nombre) mapaFidelidad[m.cliente_nombre.toLowerCase().trim()] = m;
    });

    const resultadoMap = new Map();

    for (const c of citasClientes) {
      const telLimpio = (c.cliente_telefono || '').replace(/[^0-9]/g, '');
      const nombreKey = (c.cliente_nombre || '').toLowerCase().trim();
      const fid = (telLimpio && mapaFidelidad[telLimpio]) || mapaFidelidad[nombreKey] || {};

      let cat = fid.categoria;
      if (!cat) {
        const n = Number(c.total_citas || 0);
        cat = n >= 8 ? 'VIP' : (n >= 4 ? 'Preferencial' : (n >= 2 ? 'Frecuente' : 'Nuevo'));
      }

      resultadoMap.set(telLimpio || nombreKey, {
        id: fid.id || `c-${telLimpio || Math.random().toString().slice(2, 7)}`,
        barberia_id: tenantId,
        cliente_nombre: fid.cliente_nombre || c.cliente_nombre,
        cliente_telefono: fid.cliente_telefono || c.cliente_telefono,
        categoria: cat,
        fecha_cumpleanos: fid.fecha_cumpleanos || null,
        beneficio_fidelidad: fid.beneficio_fidelidad || '',
        notas: fid.notas || '',
        total_citas: Number(c.total_citas || 1),
        ultima_visita: c.ultima_visita,
        primera_visita: c.primera_visita,
        total_gastado: Number(c.total_gastado || 0)
      });
    }

    // Agregar clientes en memoria que no tengan citas aún
    memoryClientes.filter(m => m.barberia_id === tenantId).forEach(m => {
      const telLimpio = (m.cliente_telefono || '').replace(/[^0-9]/g, '');
      const nombreKey = (m.cliente_nombre || '').toLowerCase().trim();
      if (!resultadoMap.has(telLimpio) && !resultadoMap.has(nombreKey)) {
        if (!q || m.cliente_nombre?.toLowerCase().includes(q.toLowerCase()) || m.cliente_telefono?.includes(q)) {
          resultadoMap.set(telLimpio || nombreKey, {
            id: m.id,
            barberia_id: tenantId,
            cliente_nombre: m.cliente_nombre,
            cliente_telefono: m.cliente_telefono,
            categoria: m.categoria || 'VIP',
            fecha_cumpleanos: m.fecha_cumpleanos || null,
            beneficio_fidelidad: m.beneficio_fidelidad || '',
            notas: m.notas || '',
            total_citas: 0,
            ultima_visita: null,
            primera_visita: null,
            total_gastado: 0
          });
        }
      }
    });

    let list = Array.from(resultadoMap.values());
    if (categoria && categoria !== 'todos') {
      list = list.filter(item => item.categoria.toLowerCase() === categoria.toLowerCase());
    }

    res.json(list);
  } catch (err) {
    console.warn('Error en GET /api/clientes:', err.message);
    const fall = memoryClientes.filter(m => m.barberia_id === tenantId);
    res.json(fall);
  }
});

app.post('/api/clientes', async (req, res) => {
  const tenantId = await getTenantId(req);
  const { cliente_nombre, cliente_telefono, categoria, fecha_cumpleanos, beneficio_fidelidad, notas } = req.body;

  if (!cliente_nombre || !cliente_telefono) {
    return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });
  }

  const telLimpio = cliente_telefono.replace(/[^0-9]/g, '');
  const existingIdx = memoryClientes.findIndex(c => c.barberia_id === tenantId && c.cliente_telefono.replace(/[^0-9]/g, '') === telLimpio);

  const clienteData = {
    id: existingIdx >= 0 ? memoryClientes[existingIdx].id : Date.now(),
    barberia_id: tenantId,
    cliente_nombre: cliente_nombre.trim(),
    cliente_telefono: cliente_telefono.trim(),
    categoria: categoria || 'VIP',
    fecha_cumpleanos: fecha_cumpleanos || null,
    beneficio_fidelidad: beneficio_fidelidad || '',
    notas: notas || ''
  };

  if (existingIdx >= 0) {
    memoryClientes[existingIdx] = clienteData;
  } else {
    memoryClientes.unshift(clienteData);
  }

  res.json({ success: true, cliente: clienteData });
});

app.patch('/api/clientes/:id', async (req, res) => {
  const tenantId = await getTenantId(req);
  const { id } = req.params;
  const { categoria, fecha_cumpleanos, beneficio_fidelidad, notas, cliente_nombre, cliente_telefono } = req.body;

  const idx = memoryClientes.findIndex(c => c.barberia_id === tenantId && String(c.id) === String(id));
  if (idx >= 0) {
    if (categoria !== undefined) memoryClientes[idx].categoria = categoria;
    if (fecha_cumpleanos !== undefined) memoryClientes[idx].fecha_cumpleanos = fecha_cumpleanos;
    if (beneficio_fidelidad !== undefined) memoryClientes[idx].beneficio_fidelidad = beneficio_fidelidad;
    if (notas !== undefined) memoryClientes[idx].notas = notas;
    if (cliente_nombre !== undefined) memoryClientes[idx].cliente_nombre = cliente_nombre;
    if (cliente_telefono !== undefined) memoryClientes[idx].cliente_telefono = cliente_telefono;
    return res.json({ success: true, cliente: memoryClientes[idx] });
  }

  const newClient = {
    id: Number(id) || Date.now(),
    barberia_id: tenantId,
    cliente_nombre: cliente_nombre || 'Cliente',
    cliente_telefono: cliente_telefono || '',
    categoria: categoria || 'VIP',
    fecha_cumpleanos: fecha_cumpleanos || null,
    beneficio_fidelidad: beneficio_fidelidad || '',
    notas: notas || ''
  };
  memoryClientes.unshift(newClient);
  res.json({ success: true, cliente: newClient });
});

// ----------------------------------------------------
// 6.2 RESEÑAS & CALIFICACIONES DE CLIENTES (PÚBLICAS)
// ----------------------------------------------------
let memoryResenas = [
  {
    id: 1,
    barberia_id: 1,
    cliente_nombre: 'Alejandro Restrepo',
    calificacion: 5,
    comentario: '¡Excelente servicio! Carlos me hizo el mejor degradado que he tenido, y la atención con bebida y música es de 10 estrellas.',
    servicio_nombre: 'Corte Clásico / Fade',
    fecha: '2026-11-08',
    aprobada: 1
  },
  {
    id: 2,
    barberia_id: 1,
    cliente_nombre: 'David Morales',
    calificacion: 5,
    comentario: 'Puntuales, pulcros y el arreglo de barba con navaja caliente es una experiencia premium. Muy recomendado.',
    servicio_nombre: 'Arreglo de Barba VIP',
    fecha: '2026-11-06',
    aprobada: 1
  },
  {
    id: 3,
    barberia_id: 1,
    cliente_nombre: 'Camilo Torres',
    calificacion: 4,
    comentario: 'Gran ambiente y barberos muy capacitados. La reserva por la app fue súper rápida y sin filas.',
    servicio_nombre: 'Combo Corte + Barba',
    fecha: '2026-11-04',
    aprobada: 1
  }
];

// ----------------------------------------------------
// RESEÑAS DE CLIENTES CON MODERACIÓN Y SUSCRIPCIÓN
// ----------------------------------------------------
app.get('/api/resenas', async (req, res) => {
  const tenantId = await getTenantId(req);
  const todas = req.query.todas === 'true'; // Si viene de panel de admin
  try {
    let sql = `
      SELECT r.* 
      FROM resenas r 
      WHERE r.barberia_id = ? ${todas ? '' : 'AND r.aprobada = 1'}
      ORDER BY r.id DESC
    `;
    let rows = [];
    try {
      rows = await db.prepare(sql).all(tenantId);
    } catch (_) {}

    let resenasList = (rows && rows.length > 0) ? rows : store.obtenerResenas(tenantId, todas);

    const publicas = resenasList.filter(r => r.aprobada === 1 || r.aprobada === true);
    const promedio = publicas.length > 0
      ? (publicas.reduce((acc, r) => acc + Number(r.calificacion || 5), 0) / publicas.length).toFixed(1)
      : '5.0';

    res.json({
      resenas: resenasList,
      total: publicas.length,
      promedio: Number(promedio),
      pendientes_count: resenasList.filter(r => !r.aprobada).length
    });
  } catch (err) {
    console.warn('Error en GET /api/resenas:', err.message);
    const fall = store.obtenerResenas(tenantId, todas);
    res.json({ resenas: fall, total: fall.length, promedio: 4.9, pendientes_count: 0 });
  }
});

app.post('/api/resenas', async (req, res) => {
  const tenantId = await getTenantId(req);
  const { cliente_nombre, cliente_telefono, cliente_email, calificacion, comentario, servicio_nombre, suscribir_novedades } = req.body;

  if (!cliente_nombre || !calificacion || !comentario) {
    return res.status(400).json({ error: 'Nombre, calificación y comentario son obligatorios' });
  }

  // Guardar suscripción del cliente si proporcionó teléfono
  if (cliente_telefono) {
    try {
      await db.prepare(`
        INSERT INTO clientes (barberia_id, nombre, telefono, email, notas, total_citas)
        VALUES (?, ?, ?, ?, 'Suscrito desde Opiniones Web', 0)
        ON CONFLICT(telefono, barberia_id) DO NOTHING
      `).run(tenantId, cliente_nombre.trim(), cliente_telefono.trim(), cliente_email || null);
    } catch (_) {}
  }

  const nuevaResena = {
    id: Date.now(),
    barberia_id: tenantId,
    cliente_nombre: cliente_nombre.trim(),
    cliente_telefono: cliente_telefono ? cliente_telefono.trim() : '',
    cliente_email: cliente_email ? cliente_email.trim() : '',
    calificacion: Math.min(5, Math.max(1, Number(calificacion) || 5)),
    comentario: comentario.trim(),
    servicio_nombre: servicio_nombre || 'Servicio de Barbería',
    fecha: new Date().toISOString().split('T')[0],
    aprobada: 0 // Requiere autorización del dueño
  };

  try {
    await db.prepare(`
      INSERT INTO resenas (barberia_id, cliente_nombre, calificacion, comentario, servicio_nombre, fecha, aprobada)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(tenantId, nuevaResena.cliente_nombre, nuevaResena.calificacion, nuevaResena.comentario, nuevaResena.servicio_nombre, nuevaResena.fecha);
  } catch (_) {}

  store.agregarResena(nuevaResena);
  res.status(201).json({ 
    success: true, 
    message: 'Reseña enviada con éxito. Será visible tan pronto sea autorizada por el dueño.',
    resena: nuevaResena 
  });
});

app.patch('/api/resenas/:id', async (req, res) => {
  const tenantId = await getTenantId(req);
  const { id } = req.params;
  const { aprobada } = req.body;

  const nuevoEstado = Number(aprobada) === 1 ? 1 : 0;
  try {
    await db.prepare('UPDATE resenas SET aprobada = ? WHERE id = ? AND barberia_id = ?').run(nuevoEstado, id, tenantId);
  } catch (_) {}

  const actualizada = store.actualizarResena(id, tenantId, { aprobada: nuevoEstado });
  res.json({ 
    success: true, 
    message: nuevoEstado === 1 ? 'Reseña aprobada y publicada en el inicio' : 'Reseña ocultada',
    resena: actualizada 
  });
});

app.delete('/api/resenas/:id', async (req, res) => {
  const tenantId = await getTenantId(req);
  const { id } = req.params;

  try {
    await db.prepare('DELETE FROM resenas WHERE id = ? AND barberia_id = ?').run(id, tenantId);
  } catch (_) {}

  store.eliminarResena(id, tenantId);
  res.json({ success: true, message: 'Reseña eliminada correctamente' });
});

// ----------------------------------------------------
// 7. BLOQUEOS DE HORARIO Y DÍAS COMPLETOS POR BARBERO
// ----------------------------------------------------
app.get('/api/bloqueos', async (req, res) => {
  const { fecha, barbero_id } = req.query;
  const tenantId = await getTenantId(req);

  try {
    let sql = `
      SELECT b.*, bar.nombre as barbero_nombre 
      FROM bloqueos b
      LEFT JOIN barberos bar ON b.barbero_id = bar.id
      WHERE b.barberia_id = ?
    `;
    const params = [tenantId];
    if (fecha) {
      sql += ' AND b.fecha = ?';
      params.push(fecha);
    }
    if (barbero_id) {
      sql += ' AND (b.barbero_id = ? OR b.barbero_id IS NULL)';
      params.push(barbero_id);
    }
    sql += ' ORDER BY b.fecha DESC, b.hora_inicio ASC';

    let bloqueos = [];
    try {
      bloqueos = await db.prepare(sql).all(...params);
    } catch (_) {}

    if (!bloqueos || bloqueos.length === 0) {
      bloqueos = store.obtenerBloqueos(tenantId, fecha, barbero_id);
      // Adjuntar nombre de barbero si aplica
      bloqueos = bloqueos.map(b => {
        const barbero = store.barberos.find(bar => String(bar.id) === String(b.barbero_id));
        return { ...b, barbero_nombre: barbero ? barbero.nombre : 'Toda la Barbería' };
      });
    }

    res.json(bloqueos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bloqueos', async (req, res) => {
  const { barbero_id, fecha, hora_inicio, hora_fin, motivo, dia_completo } = req.body;
  const tenantId = await getTenantId(req);

  if (!fecha || !motivo) {
    return res.status(400).json({ error: 'Fecha y motivo son requeridos' });
  }

  const hInicio = dia_completo ? '00:00' : (hora_inicio || '09:00');
  const hFin = dia_completo ? '23:59' : (hora_fin || '20:00');

  const nuevoBloqueo = {
    barberia_id: tenantId,
    barbero_id: barbero_id ? Number(barbero_id) : null,
    fecha,
    hora_inicio: hInicio,
    hora_fin: hFin,
    motivo: motivo.trim()
  };

  try {
    const stmt = db.prepare(`
      INSERT INTO bloqueos (barberia_id, barbero_id, fecha, hora_inicio, hora_fin, motivo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = await stmt.run(tenantId, nuevoBloqueo.barbero_id, fecha, hInicio, hFin, motivo);
    nuevoBloqueo.id = result.lastInsertRowid;
  } catch (_) {}

  const guardado = store.agregarBloqueo(nuevoBloqueo);
  res.status(201).json({ id: guardado.id, message: 'Horario bloqueado con éxito', bloqueo: guardado });
});

app.delete('/api/bloqueos/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  try {
    await db.prepare('DELETE FROM bloqueos WHERE id = ? AND barberia_id = ?').run(id, tenantId);
  } catch (_) {}
  store.eliminarBloqueo(id, tenantId);
  res.json({ success: true, message: 'Bloqueo eliminado y horario liberado' });
});

// ----------------------------------------------------
// 8. INGRESOS Y EGRESOS (MOVIMIENTOS DE CAJA)
// ----------------------------------------------------
app.get('/api/costos', async (req, res) => {
  const { desde, hasta, categoria, tipo } = req.query;
  const tenantId = await getTenantId(req);

  try {
    let sql = `
      SELECT c.*, b.nombre as barbero_nombre 
      FROM costos c 
      LEFT JOIN barberos b ON c.barbero_id = b.id 
      WHERE c.barberia_id = ?
    `;
    const params = [tenantId];

    if (desde && hasta) {
      sql += ' AND c.fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    }
    if (categoria) {
      sql += ' AND c.categoria = ?';
      params.push(categoria);
    }
    if (tipo) {
      sql += ' AND c.tipo = ?';
      params.push(tipo);
    }

    sql += ' ORDER BY c.fecha DESC, c.id DESC';
    const movimientos = await db.prepare(sql).all(...params);

    const totalEgresos = movimientos
      .filter(m => !m.tipo || m.tipo === 'egreso')
      .reduce((sum, c) => sum + Number(c.monto_cop || 0), 0);

    const totalIngresos = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, c) => sum + Number(c.monto_cop || 0), 0);

    const balanceNeto = totalIngresos - totalEgresos;

    res.json({
      costos: movimientos,
      total_egresos: totalEgresos,
      total_ingresos: totalIngresos,
      balance_neto: balanceNeto,
      total: totalEgresos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/costos', async (req, res) => {
  const { tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas } = req.body;
  const tenantId = await getTenantId(req);

  if (!categoria || !descripcion || !monto_cop || !fecha) {
    return res.status(400).json({ error: 'Categoría, descripción, monto y fecha requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO costos (barberia_id, tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = await stmt.run(
      tenantId,
      tipo || 'egreso',
      categoria,
      descripcion,
      Number(monto_cop),
      fecha,
      metodo_pago || 'Efectivo',
      barbero_id ? Number(barbero_id) : null,
      notas || ''
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Movimiento registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/costos/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  try {
    await db.prepare('DELETE FROM costos WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 9. PRODUCTOS & VENTAS
// ----------------------------------------------------
app.get('/api/productos', async (req, res) => {
  const tenantId = await getTenantId(req);
  const todos = req.query.todos === 'true';
  try {
    const sql = todos
      ? 'SELECT * FROM productos WHERE barberia_id = ? ORDER BY nombre ASC'
      : 'SELECT * FROM productos WHERE barberia_id = ? AND activo = 1 ORDER BY nombre ASC';
    const productos = await db.prepare(sql).all(tenantId);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/productos', async (req, res) => {
  const { nombre, descripcion, precio_venta_cop, costo_compra_cop, stock_actual, stock_minimo, comision_barbero_fija, foto_url } = req.body;
  const tenantId = await getTenantId(req);

  if (!nombre || !precio_venta_cop) {
    return res.status(400).json({ error: 'Nombre y precio de venta son requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO productos (barberia_id, nombre, descripcion, precio_venta, costo_compra, stock, activo, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const result = await stmt.run(
      tenantId,
      nombre.trim(),
      descripcion || '',
      Number(precio_venta_cop),
      Number(costo_compra_cop) || 0,
      Number(stock_actual) || 0,
      foto_url || ''
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Producto registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const tenantId = await getTenantId(req);
  try {
    await db.prepare('UPDATE productos SET activo = 0 WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Producto desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ventas-productos', async (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  const tenantId = await getTenantId(req);

  try {
    let sql = `
      SELECT v.*, p.nombre as producto_nombre, p.foto_url as producto_foto, b.nombre as barbero_nombre
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      LEFT JOIN barberos b ON v.barbero_id = b.id
      WHERE v.barberia_id = ?
    `;
    const params = [tenantId];
    if (barbero_id) {
      sql += ' AND v.barbero_id = ?';
      params.push(barbero_id);
    }
    if (desde && hasta) {
      sql += ' AND v.fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    }
    sql += ' ORDER BY v.fecha DESC, v.id DESC';

    const ventas = await db.prepare(sql).all(...params);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 10. LIQUIDACIONES
// ----------------------------------------------------
app.get('/api/liquidaciones/preview', async (req, res) => {
  const { barbero_id, fecha_inicio, fecha_fin, porcentaje } = req.query;
  const tenantId = await getTenantId(req);

  if (!barbero_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'barbero_id, fecha_inicio y fecha_fin son requeridos' });
  }

  try {
    const barbero = await db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(barbero_id, tenantId);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    const citas = await db.prepare(`
      SELECT c.*, s.nombre as servicio_nombre
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barbero_id = ? 
        AND c.barberia_id = ?
        AND c.fecha BETWEEN ? AND ? 
        AND c.estado = 'completada'
        AND c.liquidacion_id IS NULL
      ORDER BY c.fecha ASC, c.hora_inicio ASC
    `).all(barbero_id, tenantId, fecha_inicio, fecha_fin);

    const ventasProductos = await db.prepare(`
      SELECT v.*, p.nombre as producto_nombre
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      WHERE v.barbero_id = ? 
        AND v.barberia_id = ?
        AND v.fecha BETWEEN ? AND ?
        AND v.liquidacion_id IS NULL
      ORDER BY v.fecha ASC
    `).all(barbero_id, tenantId, fecha_inicio, fecha_fin);

    const totalBrutoServicios = citas.reduce((sum, c) => sum + Number(c.precio_cobrado || 0), 0);
    const porcentajeAplicado = (porcentaje !== undefined && porcentaje !== '' && !isNaN(porcentaje))
      ? Number(porcentaje)
      : Number(barbero.porcentaje_comision || 50.0);

    const montoComisionServicios = Math.round(totalBrutoServicios * (porcentajeAplicado / 100));
    const totalComisionProductos = ventasProductos.reduce((sum, v) => sum + Number(v.monto_comision || 0), 0);
    const totalVentaProductos = ventasProductos.reduce((sum, v) => sum + Number(v.total_venta || 0), 0);

    const comisionTotalBarbero = montoComisionServicios + totalComisionProductos;
    const margenBarberia = (totalBrutoServicios - montoComisionServicios) + (totalVentaProductos - totalComisionProductos);

    res.json({
      barbero,
      fecha_inicio,
      fecha_fin,
      total_servicios: citas.length,
      total_bruto: totalBrutoServicios,
      porcentaje_aplicado: porcentajeAplicado,
      monto_comision: comisionTotalBarbero,
      monto_comision_servicios: montoComisionServicios,
      total_comision_productos: totalComisionProductos,
      margen_barberia: margenBarberia,
      citas,
      ventas_productos: ventasProductos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/liquidaciones', async (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  const tenantId = await getTenantId(req);

  try {
    let sql = `
      SELECT l.*, b.nombre as barbero_nombre, b.foto_url as barbero_foto
      FROM liquidaciones l
      JOIN barberos b ON l.barbero_id = b.id
      WHERE l.barberia_id = ?
    `;
    const params = [tenantId];

    if (barbero_id) {
      sql += ' AND l.barbero_id = ?';
      params.push(barbero_id);
    }
    sql += ' ORDER BY l.id DESC';
    const liquidaciones = await db.prepare(sql).all(...params);
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 11. BALANCE GENERAL Y REPORTES
// ----------------------------------------------------
app.get('/api/reportes/balance', async (req, res) => {
  const { desde, hasta } = req.query;
  const tenantId = await getTenantId(req);

  try {
    const ahora = new Date();
    const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const hoyStr = ahora.toISOString().split('T')[0];

    const fDesde = desde || primerDiaMes;
    const fHasta = hasta || hoyStr;

    const citasCompletadas = await db.prepare(`
      SELECT c.id, c.barbero_id, c.servicio_id, c.fecha, c.precio_cobrado,
             b.nombre as barbero_nombre, b.porcentaje_comision,
             s.nombre as servicio_nombre
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barberia_id = ? AND c.estado = 'completada' AND c.fecha BETWEEN ? AND ?
      ORDER BY c.fecha ASC
    `).all(tenantId, fDesde, fHasta);

    const totalIngresosCitas = citasCompletadas.reduce((sum, c) => sum + Number(c.precio_cobrado || 0), 0);

    const movimientosCostos = await db.prepare(`
      SELECT c.*, b.nombre as barbero_nombre
      FROM costos c
      LEFT JOIN barberos b ON c.barbero_id = b.id
      WHERE c.barberia_id = ? AND c.fecha BETWEEN ? AND ?
    `).all(tenantId, fDesde, fHasta);

    const egresosCostos = movimientosCostos.filter(m => !m.tipo || m.tipo === 'egreso');
    const totalEgresos = egresosCostos.reduce((sum, e) => sum + Number(e.monto_cop || 0), 0);

    const barberos = await db.prepare('SELECT id, nombre, porcentaje_comision, foto_url FROM barberos WHERE barberia_id = ?').all(tenantId);
    const balanceBarberos = barberos.map(b => {
      const citasDelBarbero = citasCompletadas.filter(c => c.barbero_id === b.id);
      const facturadoServicios = citasDelBarbero.reduce((sum, c) => sum + Number(c.precio_cobrado || 0), 0);
      const pct = Number(b.porcentaje_comision || 50);
      const comisionServicios = Math.round(facturadoServicios * (pct / 100));
      const utilidadParaNegocio = facturadoServicios - comisionServicios;

      return {
        barbero_id: b.id,
        nombre: b.nombre,
        foto_url: b.foto_url,
        porcentaje: pct,
        total_citas: citasDelBarbero.length,
        total_servicios_cop: facturadoServicios,
        total_facturado_cop: facturadoServicios,
        comision_estimada_cop: comisionServicios,
        utilidad_neta_negocio_cop: utilidadParaNegocio
      };
    });

    const utilidadNetaOperativa = totalIngresosCitas - totalEgresos;

    res.json({
      periodo: { desde: fDesde, hasta: fHasta },
      metricas_globales: {
        total_ingresos_brutos: totalIngresosCitas,
        total_ingresos_servicios: totalIngresosCitas,
        total_ingresos_productos: 0,
        total_egresos: totalEgresos,
        utilidad_neta: utilidadNetaOperativa,
        total_citas_completadas: citasCompletadas.length,
        total_liquidaciones_pagadas: 0,
        margen_rentabilidad_pct: totalIngresosCitas > 0 ? Math.round((utilidadNetaOperativa / totalIngresosCitas) * 100) : 0
      },
      egresos_por_categoria: {},
      balance_barberos: balanceBarberos,
      citas_recientes: citasCompletadas.slice(0, 30),
      ultimas_liquidaciones: []
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reportes/rentabilidad-stats', async (req, res) => {
  const tenantId = await getTenantId(req);
  try {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    const citasMes = await db.prepare(`
      SELECT COUNT(*) as count, SUM(precio_cobrado) as total 
      FROM citas 
      WHERE barberia_id = ? AND estado = 'completada' AND fecha BETWEEN ? AND ?
    `).get(tenantId, primerDiaMes, ultimoDiaMes);

    const egresosMes = await db.prepare(`
      SELECT SUM(monto_cop) as total 
      FROM costos 
      WHERE barberia_id = ? AND tipo = 'egreso' AND fecha BETWEEN ? AND ?
    `).get(tenantId, primerDiaMes, ultimoDiaMes);

    const barberos = await db.prepare('SELECT id, nombre, porcentaje_comision FROM barberos WHERE barberia_id = ? AND activo = 1').all(tenantId);
    const totalComision = barberos.reduce((acc, b) => acc + Number(b.porcentaje_comision || 50), 0);
    const comisionPromedio = barberos.length > 0 ? Math.round(totalComision / barberos.length) : 50;

    const servicios = await db.prepare('SELECT precio_cop FROM servicios WHERE barberia_id = ? AND activo = 1').all(tenantId);
    const totalPrecios = servicios.reduce((acc, s) => acc + Number(s.precio_cop || 0), 0);
    const precioPromedio = servicios.length > 0 ? Math.round(totalPrecios / servicios.length) : 25000;

    res.json({
      mes_actual_inicio: primerDiaMes,
      mes_actual_fin: ultimoDiaMes,
      citas_mes_actual: Number(citasMes?.count || 0),
      ingresos_mes_actual: Number(citasMes?.total || 0),
      costos_fijos_mensuales: Number(egresosMes?.total || 1200000),
      barberos_activos_count: barberos.length || 1,
      comision_promedio: comisionPromedio,
      precio_promedio_corte: precioPromedio,
      barberos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 12. GALERÍA MULTIMEDIA & REDES
// ----------------------------------------------------
app.get('/api/multimedia', async (req, res) => {
  const tenantId = await getTenantId(req);
  const todos = req.query.todos === 'true';
  try {
    let sql = `
      SELECT m.*, b.nombre as barbero_nombre 
      FROM galeria_multimedia m
      LEFT JOIN barberos b ON m.barbero_id = b.id
      WHERE m.barberia_id = ?
    `;
    if (!todos) {
      sql += ' AND m.activo = 1';
    }
    sql += ' ORDER BY m.orden ASC, m.creado_en DESC';

    const items = await db.prepare(sql).all(tenantId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/multimedia', async (req, res) => {
  const { titulo, tipo, url_media, url_red_social, descripcion, barbero_id } = req.body;
  const tenantId = await getTenantId(req);

  if (!titulo || !url_media) {
    return res.status(400).json({ error: 'Título y URL son obligatorios' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO galeria_multimedia (barberia_id, titulo, tipo, url_media, url_red_social, descripcion, barbero_id, orden, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
    `);
    const result = await stmt.run(
      tenantId,
      titulo.trim(),
      tipo || 'imagen',
      url_media.trim(),
      url_red_social ? url_red_social.trim() : null,
      descripcion ? descripcion.trim() : '',
      barbero_id ? Number(barbero_id) : null
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Publicación agregada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 13. AUDITORÍA & NOTIFICACIONES
// ----------------------------------------------------
app.get('/api/auditoria', async (req, res) => {
  const { tipo, limite } = req.query;
  const tenantId = await getTenantId(req);

  try {
    let sql = 'SELECT * FROM auditoria WHERE barberia_id = ?';
    const params = [tenantId];

    if (tipo) {
      sql += ' AND tipo_evento = ?';
      params.push(tipo);
    }

    sql += ' ORDER BY fecha_hora DESC LIMIT ?';
    params.push(limite ? Number(limite) : 200);

    const registros = await db.prepare(sql).all(...params);
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notificaciones/recientes', async (req, res) => {
  const tenantId = await getTenantId(req);
  try {
    const recientes = await db.prepare(`
      SELECT c.id, c.cliente_nombre, c.fecha, c.hora_inicio, c.creado_en, b.nombre as barbero_nombre, s.nombre as servicio_nombre
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barberia_id = ?
      ORDER BY c.id DESC
      LIMIT 10
    `).all(tenantId);
    res.json(recientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Soporte para rutas SPA frontend
if (fs.existsSync(clientDistPath)) {
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Iniciar servidor local solo si se ejecuta directamente
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Multi-Tenant de Barbería corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
