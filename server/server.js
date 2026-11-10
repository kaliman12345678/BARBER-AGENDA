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

// Directorio para almacenar imágenes y videos subidos por el usuario
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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
// HELPERS GENERALES Y MULTI-TENANT
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
      auditoria: false
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
      auditoria: false
    };
  } else {
    // vip
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
      auditoria: true
    };
  }
}

// Helper para extraer la barbería (tenant) a partir del request
function getTenant(req) {
  const slug = req.headers['x-barberia-slug'] || req.query.b || req.query.slug;
  const id = req.headers['x-barberia-id'] || req.query.barberia_id;

  if (id) {
    const b = db.prepare('SELECT * FROM barberias WHERE id = ?').get(id);
    if (b) return b;
  }
  if (slug) {
    const b = db.prepare('SELECT * FROM barberias WHERE slug = ?').get(slug);
    if (b) return b;
  }
  // Fallback a barberia id = 1 o primera existente
  const def = db.prepare('SELECT * FROM barberias WHERE id = 1').get() || db.prepare('SELECT * FROM barberias ORDER BY id ASC LIMIT 1').get();
  return def || {
    id: 1,
    slug: 'the-barber-club',
    nombre: 'The Barber Club',
    plan: 'vip',
    modulos_activos: JSON.stringify(getDefaultModulesForPlan('vip')),
    activo: 1,
    pin_admin: '1234'
  };
}

function getTenantId(req) {
  const tenant = getTenant(req);
  return tenant ? tenant.id : 1;
}

// Helper para registrar eventos de auditoría por barbería
function registrarAuditoria(tenantId, tipo_evento, descripcion, usuario, detalles_json) {
  try {
    db.prepare('INSERT INTO auditoria (barberia_id, tipo_evento, descripcion, usuario, detalles_json) VALUES (?, ?, ?, ?, ?)').run(
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

// Información pública y configuración de la barbería actual
app.get('/api/barberias/info', (req, res) => {
  try {
    const tenant = getTenant(req);
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

// Configuración general combinada con la barbería activa
app.get('/api/configuracion', (req, res) => {
  try {
    const tenant = getTenant(req);
    const rows = db.prepare('SELECT clave, valor FROM configuracion').all();
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
      config.color_primario = tenant.color_primario || '#2563eb';
      config.color_secundario = tenant.color_secundario || '#1e293b';
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

// Verificar PIN del Administrador (dueño de la barbería)
app.post('/api/auth/verify-pin', (req, res) => {
  const { pin } = req.body;
  try {
    const tenant = getTenant(req);
    const tenantPin = tenant && tenant.pin_admin ? tenant.pin_admin : '1234';

    // PIN Maestro SuperAdmin
    const superRow = db.prepare("SELECT valor FROM configuracion WHERE clave = 'pin_superadmin'").get();
    const superPin = superRow ? superRow.valor : '9999';

    if (String(pin).trim() === String(tenantPin).trim() || String(pin).trim() === String(superPin).trim()) {
      res.json({
        success: true,
        token: 'auth-admin-session-token',
        barberia_id: tenant.id,
        barberia_nombre: tenant.nombre,
        is_superadmin: String(pin).trim() === String(superPin).trim()
      });
    } else {
      res.status(401).json({ success: false, message: 'PIN incorrecto' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar configuración por parte del Administrador de la barbería
app.put('/api/configuracion', (req, res) => {
  const { nombre_barberia, telefono_barberia, direccion_barberia, pin_admin, color_primario, eslogan } = req.body;
  try {
    const tenantId = getTenantId(req);

    // Guardar en tabla barberias
    const stmt = db.prepare(`
      UPDATE barberias
      SET nombre = COALESCE(?, nombre),
          telefono = COALESCE(?, telefono),
          direccion = COALESCE(?, direccion),
          pin_admin = COALESCE(?, pin_admin),
          color_primario = COALESCE(?, color_primario),
          eslogan = COALESCE(?, eslogan)
      WHERE id = ?
    `);
    stmt.run(
      nombre_barberia || null,
      telefono_barberia || null,
      direccion_barberia || null,
      pin_admin || null,
      color_primario || null,
      eslogan || null,
      tenantId
    );

    // Actualizar también tabla configuracion para compatibilidad
    const update = db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)');
    if (nombre_barberia) update.run('nombre_barberia', nombre_barberia);
    if (telefono_barberia) update.run('telefono_barberia', telefono_barberia);
    if (direccion_barberia) update.run('direccion_barberia', direccion_barberia);

    res.json({ success: true, message: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar branding/personalización de la barbería
app.patch('/api/barberias/config', (req, res) => {
  try {
    const tenantId = getTenantId(req);
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
    stmt.run(
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

    const updated = db.prepare('SELECT * FROM barberias WHERE id = ?').get(tenantId);
    res.json({ success: true, message: 'Barbería actualizada', barberia: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. SUPERADMIN: GESTIÓN DE CLIENTES & PLANES (SAAS)
// ----------------------------------------------------

// Login SuperAdmin con PIN Maestro
app.post('/api/superadmin/login', (req, res) => {
  const { pin } = req.body;
  try {
    const row = db.prepare("SELECT valor FROM configuracion WHERE clave = 'pin_superadmin'").get();
    const masterPin = row ? row.valor : '9999';

    if (String(pin).trim() === String(masterPin).trim()) {
      res.json({ success: true, token: 'superadmin-master-session-token' });
    } else {
      res.status(401).json({ success: false, message: 'PIN Maestro incorrecto' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todas las barberías registradas con métricas rápidas
app.get('/api/superadmin/barberias', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM barberias ORDER BY id DESC').all();
    const result = rows.map(b => {
      let modulos = {};
      try {
        modulos = typeof b.modulos_activos === 'string' ? JSON.parse(b.modulos_activos) : (b.modulos_activos || {});
      } catch (e) {
        modulos = getDefaultModulesForPlan(b.plan);
      }
      const barberosCount = db.prepare('SELECT COUNT(*) as count FROM barberos WHERE barberia_id = ?').get(b.id).count;
      const citasCount = db.prepare('SELECT COUNT(*) as count FROM citas WHERE barberia_id = ?').get(b.id).count;
      return {
        ...b,
        modulos_activos: modulos,
        total_barberos: barberosCount,
        total_citas: citasCount
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una nueva barbería (Alta de cliente en el SaaS)
app.post('/api/superadmin/barberias', (req, res) => {
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
    pin_admin
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre de la barbería es obligatorio' });

  try {
    let finalSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : '';
    if (!finalSlug) {
      finalSlug = nombre.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    // Verificar unicidad de slug
    const existe = db.prepare('SELECT id FROM barberias WHERE slug = ?').get(finalSlug);
    if (existe) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const planElegido = plan || 'basico';
    const modulosFinales = modulos_activos ? JSON.stringify(modulos_activos) : JSON.stringify(getDefaultModulesForPlan(planElegido));

    const stmt = db.prepare(`
      INSERT INTO barberias (
        slug, nombre, eslogan, logo_url, color_primario, color_secundario,
        telefono, direccion, plan, modulos_activos, pin_admin, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
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

    const nuevaId = result.lastInsertRowid;

    // Crear 2 servicios iniciales predeterminados
    const stmtServ = db.prepare('INSERT INTO servicios (barberia_id, nombre, precio_cop, duracion_minutos, descripcion, activo) VALUES (?, ?, ?, ?, ?, 1)');
    stmtServ.run(nuevaId, 'Corte Clásico', 25000, 45, 'Corte tradicional de cabello con tijera y máquina.');
    stmtServ.run(nuevaId, 'Corte y Barba Completa', 35000, 60, 'Perfilado de barba con toalla caliente y corte.');

    // Crear 1 barbero principal inicial
    const stmtBarb = db.prepare('INSERT INTO barberos (barberia_id, nombre, telefono, email, password, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
    stmtBarb.run(nuevaId, 'Barbero Principal', telefono || '', `admin@${finalSlug}.com`, '123456', 50.0, '09:00', '20:00', '1,2,3,4,5,6');

    const nuevaBarberia = db.prepare('SELECT * FROM barberias WHERE id = ?').get(nuevaId);
    res.json({
      success: true,
      message: 'Barbería creada exitosamente con servicios y barbero inicial',
      barberia: {
        ...nuevaBarberia,
        modulos_activos: JSON.parse(nuevaBarberia.modulos_activos)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar barbería (activar/suspender, cambiar plan o módulos individuales)
app.patch('/api/superadmin/barberias/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, slug, eslogan, logo_url, color_primario, color_secundario, telefono, direccion, plan, modulos_activos, pin_admin, activo } = req.body;

  try {
    const actual = db.prepare('SELECT * FROM barberias WHERE id = ?').get(id);
    if (!actual) return res.status(404).json({ error: 'Barbería no encontrada' });

    let modulosStr = null;
    if (modulos_activos !== undefined) {
      modulosStr = typeof modulos_activos === 'string' ? modulos_activos : JSON.stringify(modulos_activos);
    } else if (plan !== undefined && plan !== actual.plan) {
      modulosStr = JSON.stringify(getDefaultModulesForPlan(plan));
    }

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

    stmt.run(
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

    const updated = db.prepare('SELECT * FROM barberias WHERE id = ?').get(id);
    res.json({
      success: true,
      message: 'Barbería actualizada correctamente',
      barberia: {
        ...updated,
        modulos_activos: JSON.parse(updated.modulos_activos || '{}')
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar barbería
app.delete('/api/superadmin/barberias/:id', (req, res) => {
  const { id } = req.params;
  if (Number(id) === 1) {
    return res.status(400).json({ error: 'No se puede eliminar la barbería principal del sistema (ID 1).' });
  }
  try {
    db.prepare('DELETE FROM citas WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM liquidaciones WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM bloqueos WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM barberos WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM servicios WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM costos WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM ventas_productos WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM productos WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM galeria_multimedia WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM auditoria WHERE barberia_id = ?').run(id);
    db.prepare('DELETE FROM barberias WHERE id = ?').run(id);

    res.json({ success: true, message: 'Barbería eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. BARBEROS (EQUIPO)
// ----------------------------------------------------
app.get('/api/barberos', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const todos = req.query.todos === 'true';
    const query = todos 
      ? 'SELECT * FROM barberos WHERE barberia_id = ? ORDER BY nombre ASC'
      : 'SELECT * FROM barberos WHERE barberia_id = ? AND activo = 1 ORDER BY nombre ASC';
    const barberos = db.prepare(query).all(tenantId);
    res.json(barberos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/barberos', (req, res) => {
  const { nombre, telefono, email, password, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    const tenantId = getTenantId(req);
    const tenant = getTenant(req);

    // Validación de cupos según el plan
    let modulos = {};
    try {
      modulos = typeof tenant.modulos_activos === 'string' ? JSON.parse(tenant.modulos_activos) : (tenant.modulos_activos || {});
    } catch (e) {}
    const maxBarberos = modulos.max_barberos || (tenant.plan === 'basico' ? 2 : tenant.plan === 'pro' ? 5 : 999);
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM barberos WHERE barberia_id = ? AND activo = 1').get(tenantId).count;

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
    const result = stmt.run(
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

app.put('/api/barberos/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const { nombre, telefono, email, password, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE barberos 
      SET nombre = COALESCE(?, nombre),
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
    stmt.run(
      nombre !== undefined ? nombre : null,
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

app.patch('/api/barberos/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const { porcentaje_comision, activo, pin, email, password } = req.body;

  try {
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    if (porcentaje_comision !== undefined) {
      db.prepare('UPDATE barberos SET porcentaje_comision = ? WHERE id = ? AND barberia_id = ?').run(Number(porcentaje_comision), id, tenantId);
    }
    if (activo !== undefined) {
      db.prepare('UPDATE barberos SET activo = ? WHERE id = ? AND barberia_id = ?').run(activo ? 1 : 0, id, tenantId);
    }
    if (pin !== undefined && pin !== '') {
      db.prepare('UPDATE barberos SET pin = ? WHERE id = ? AND barberia_id = ?').run(String(pin).trim(), id, tenantId);
    }
    if (email !== undefined && email !== '') {
      db.prepare('UPDATE barberos SET email = ? WHERE id = ? AND barberia_id = ?').run(String(email).trim().toLowerCase(), id, tenantId);
    }
    if (password !== undefined && password !== '') {
      db.prepare('UPDATE barberos SET password = ? WHERE id = ? AND barberia_id = ?').run(String(password).trim(), id, tenantId);
    }

    const actualizado = db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    res.json({ success: true, message: 'Barbero actualizado', barbero: actualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Autenticación de Barbero
app.post('/api/barberos/login', (req, res) => {
  const { email, password, barbero_id, pin } = req.body;
  const tenantId = getTenantId(req);

  try {
    let barbero;
    if (email && password) {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();
      barbero = db.prepare('SELECT * FROM barberos WHERE barberia_id = ? AND LOWER(email) = ? AND password = ?').get(tenantId, cleanEmail, cleanPass);
      if (!barbero) {
        const byId = db.prepare('SELECT * FROM barberos WHERE barberia_id = ? AND password = ?').get(tenantId, cleanPass);
        if (byId && (byId.nombre.toLowerCase().includes(cleanEmail) || byId.email.toLowerCase() === cleanEmail)) {
          barbero = byId;
        }
      }
    } else if (barbero_id) {
      barbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(barbero_id, tenantId);
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

// Ficha completa e historial de un barbero
app.get('/api/barberos/:id/record', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);

  try {
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    const totalCitas = db.prepare('SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ?').get(id, tenantId).count;
    const citasCompletadas = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(precio_cobrado), 0) as total FROM citas WHERE barbero_id = ? AND barberia_id = ? AND estado = 'completada'").get(id, tenantId);
    const citasCanceladas = db.prepare("SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ? AND estado = 'cancelada'").get(id, tenantId);
    const noAsistio = db.prepare("SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ? AND estado = 'no_asistio'").get(id, tenantId);

    const liquidaciones = db.prepare(`
      SELECT * FROM liquidaciones 
      WHERE barbero_id = ? AND barberia_id = ?
      ORDER BY fecha_fin DESC LIMIT 15
    `).all(id, tenantId);

    const totalCobradoHistorico = citasCompletadas.total || 0;
    const totalComisionesPagadas = liquidaciones.reduce((sum, l) => sum + (l.total_pagado || 0), 0);
    const utilidadGenerada = totalCobradoHistorico - totalComisionesPagadas;

    const ultimasCitas = db.prepare(`
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
        completadas: citasCompletadas.count || 0,
        canceladas: citasCanceladas.count || 0,
        no_asistio: noAsistio.count || 0,
        total_facturado: totalCobradoHistorico,
        total_comisiones_pagadas: totalComisionesPagadas,
        utilidad_neta_para_barberia: utilidadGenerada,
        efectividad_pct: totalCitas > 0 ? Math.round(((citasCompletadas.count || 0) / totalCitas) * 100) : 0
      },
      liquidaciones,
      ultimas_citas: ultimasCitas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portal de Barbero: Citas asignadas
app.get('/api/barbero-portal/citas', (req, res) => {
  const { barbero_id, fecha, desde, hasta } = req.query;
  const tenantId = getTenantId(req);

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
      WHERE c.barbero_id = ? AND c.barberia_id = ?
    `;
    const params = [barbero_id, tenantId];

    if (fecha) {
      sql += ' AND c.fecha = ?';
      params.push(fecha);
    }
    if (desde && hasta) {
      sql += ' AND c.fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    }

    sql += ' ORDER BY c.fecha DESC, c.hora_inicio ASC';
    const citas = db.prepare(sql).all(...params);
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portal de Barbero: Resumen financiero individual
app.get('/api/barbero-portal/balance', (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  const tenantId = getTenantId(req);

  if (!barbero_id) {
    return res.status(400).json({ error: 'barbero_id es obligatorio' });
  }

  try {
    const barbero = db.prepare('SELECT id, nombre, porcentaje_comision FROM barberos WHERE id = ? AND barberia_id = ?').get(barbero_id, tenantId);
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
    const citasCompletadas = db.prepare(sqlCitas).all(...paramsCitas);

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
    const ventasProductos = db.prepare(sqlVentas).all(...paramsVentas);

    const liquidaciones = db.prepare(`
      SELECT * FROM liquidaciones 
      WHERE barbero_id = ? AND barberia_id = ?
      ORDER BY fecha_pago DESC LIMIT 10
    `).all(barbero_id, tenantId);

    const totalBrutoServicios = citasCompletadas.reduce((sum, c) => sum + (c.precio_cobrado || 0), 0);
    const pct = barbero.porcentaje_comision || 50;
    const comisionServiciosEstimada = Math.round(totalBrutoServicios * (pct / 100));
    const comisionProductos = ventasProductos.reduce((sum, v) => sum + (v.monto_comision || 0), 0);

    const pendientesLiquidarCitas = citasCompletadas.filter(c => !c.liquidacion_id);
    const pendientesLiquidarVentas = ventasProductos.filter(v => !v.liquidacion_id);
    const saldoPendienteServicios = Math.round(pendientesLiquidarCitas.reduce((sum, c) => sum + (c.precio_cobrado || 0), 0) * (pct / 100));
    const saldoPendienteProductos = pendientesLiquidarVentas.reduce((sum, v) => sum + (v.monto_comision || 0), 0);
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

app.delete('/api/barberos/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  try {
    const citasCount = db.prepare('SELECT COUNT(*) as count FROM citas WHERE barbero_id = ? AND barberia_id = ?').get(id, tenantId).count;
    if (citasCount > 0) {
      db.prepare('UPDATE barberos SET activo = 0 WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Barbero desactivado (se conservó su historial de citas)' });
    } else {
      db.prepare('DELETE FROM barberos WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Barbero eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. SERVICIOS
// ----------------------------------------------------
app.get('/api/servicios', (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const todos = req.query.todos === 'true';
    const query = todos 
      ? 'SELECT * FROM servicios WHERE barberia_id = ? ORDER BY precio_cop ASC'
      : 'SELECT * FROM servicios WHERE barberia_id = ? AND activo = 1 ORDER BY precio_cop ASC';
    const servicios = db.prepare(query).all(tenantId);
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/servicios', (req, res) => {
  const { nombre, precio_cop, duracion_minutos, descripcion } = req.body;
  if (!nombre || !precio_cop) return res.status(400).json({ error: 'Nombre y precio requeridos' });

  try {
    const tenantId = getTenantId(req);
    const stmt = db.prepare(`
      INSERT INTO servicios (barberia_id, nombre, precio_cop, duracion_minutos, descripcion, activo)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(tenantId, nombre, Number(precio_cop), Number(duracion_minutos) || 45, descripcion || '');
    res.json({ id: result.lastInsertRowid, message: 'Servicio creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/servicios/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
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
    stmt.run(nombre, precio_cop, duracion_minutos, descripcion, activo, id, tenantId);
    res.json({ success: true, message: 'Servicio actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/servicios/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  try {
    const citasCount = db.prepare('SELECT COUNT(*) as count FROM citas WHERE servicio_id = ? AND barberia_id = ?').get(id, tenantId).count;
    if (citasCount > 0) {
      db.prepare('UPDATE servicios SET activo = 0 WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Servicio desactivado para conservar historial' });
    } else {
      db.prepare('DELETE FROM servicios WHERE id = ? AND barberia_id = ?').run(id, tenantId);
      res.json({ success: true, message: 'Servicio eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. MOTOR DE DISPONIBILIDAD (PREVENCIÓN DE SOLAPAMIENTOS)
// ----------------------------------------------------
app.get('/api/disponibilidad', (req, res) => {
  const { barbero_id, fecha, duracion_minutos } = req.query;
  const tenantId = getTenantId(req);

  if (!barbero_id || !fecha) {
    return res.status(400).json({ error: 'barbero_id y fecha son obligatorios' });
  }

  try {
    const duracion = Number(duracion_minutos) || 45;
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ? AND activo = 1').get(barbero_id, tenantId);

    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado o inactivo' });
    }

    const fechaObj = new Date(`${fecha}T00:00:00`);
    let diaSemana = fechaObj.getDay();
    if (diaSemana === 0) diaSemana = 7;

    const diasPermitidos = (barbero.dias_laborales || '1,2,3,4,5,6').split(',').map(Number);
    if (!diasPermitidos.includes(diaSemana)) {
      return res.json({
        disponible_dia: false,
        motivo: 'El barbero no labora este día de la semana',
        slots: []
      });
    }

    const citas = db.prepare(`
      SELECT id, hora_inicio, hora_fin, cliente_nombre 
      FROM citas 
      WHERE barbero_id = ? AND barberia_id = ? AND fecha = ? AND estado != 'cancelada'
    `).all(barbero_id, tenantId, fecha);

    const bloqueos = db.prepare(`
      SELECT id, hora_inicio, hora_fin, motivo 
      FROM bloqueos 
      WHERE (barbero_id = ? OR barbero_id IS NULL) AND barberia_id = ? AND fecha = ?
    `).all(barbero_id, tenantId, fecha);

    const inicioMin = timeToMinutes(barbero.horario_inicio || '09:00');
    const finMin = timeToMinutes(barbero.horario_fin || '20:00');
    const step = 30;

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
app.get('/api/citas', (req, res) => {
  const { fecha, barbero_id, estado, desde, hasta } = req.query;
  const tenantId = getTenantId(req);

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

    sql += ' ORDER BY c.fecha DESC, c.hora_inicio ASC';
    const citas = db.prepare(sql).all(...params);
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/citas', (req, res) => {
  const { barbero_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, notas } = req.body;
  const tenantId = getTenantId(req);

  if (!barbero_id || !servicio_id || !cliente_nombre || !cliente_telefono || !fecha || !hora_inicio) {
    return res.status(400).json({ error: 'Todos los campos marcados son obligatorios' });
  }

  try {
    const servicio = db.prepare('SELECT * FROM servicios WHERE id = ? AND barberia_id = ?').get(servicio_id, tenantId);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    const duracion = servicio.duracion_minutos || 45;
    const startMin = timeToMinutes(hora_inicio);
    const endMin = startMin + duracion;
    const hora_fin = minutesToTime(endMin);

    const citasExistentes = db.prepare(`
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

    const bloqueos = db.prepare(`
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

    const result = stmt.run(
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

    // Registrar en auditoría
    registrarAuditoria(
      tenantId,
      'cita_creada',
      `Nueva cita agendada para ${cliente_nombre.trim()} el ${fecha} a las ${hora_inicio}`,
      'Cliente Web',
      { cita_id: nuevaCitaId, servicio: servicio.nombre, barbero_id }
    );

    const citaCreada = db.prepare(`
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

// Reasignación de cita a otro barbero
app.patch('/api/citas/:id/reasignar', (req, res) => {
  const { id } = req.params;
  const { nuevo_barbero_id, motivo } = req.body;
  const tenantId = getTenantId(req);

  if (!nuevo_barbero_id) {
    return res.status(400).json({ error: 'Debes seleccionar el barbero destino' });
  }

  try {
    const cita = db.prepare('SELECT * FROM citas WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    const nuevoBarbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ? AND activo = 1').get(nuevo_barbero_id, tenantId);
    if (!nuevoBarbero) return res.status(404).json({ error: 'El barbero seleccionado no existe o está inactivo' });

    const citasExistentes = db.prepare(`
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

    db.prepare('UPDATE citas SET barbero_id = ? WHERE id = ? AND barberia_id = ?').run(nuevo_barbero_id, id, tenantId);

    registrarAuditoria(
      tenantId,
      'cita_reasignada',
      `Cita #${id} reasignada a ${nuevoBarbero.nombre}. Motivo: ${motivo || 'Reorganización de agenda'}`,
      'Administración',
      { cita_id: id, barbero_anterior: cita.barbero_id, barbero_nuevo: nuevo_barbero_id, motivo }
    );

    const citaActualizada = db.prepare(`
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

// Cambiar estado de cita
app.patch('/api/citas/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado, precio_cobrado } = req.body;
  const tenantId = getTenantId(req);

  const estadosValidos = ['confirmada', 'completada', 'cancelada', 'no_asistio'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  try {
    const citaActual = db.prepare('SELECT * FROM citas WHERE id = ? AND barberia_id = ?').get(id, tenantId);
    if (!citaActual) return res.status(404).json({ error: 'Cita no encontrada' });

    let stmt;
    if (precio_cobrado !== undefined) {
      stmt = db.prepare('UPDATE citas SET estado = ?, precio_cobrado = ? WHERE id = ? AND barberia_id = ?');
      stmt.run(estado, Number(precio_cobrado), id, tenantId);
    } else {
      stmt = db.prepare('UPDATE citas SET estado = ? WHERE id = ? AND barberia_id = ?');
      stmt.run(estado, id, tenantId);
    }

    registrarAuditoria(
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

app.delete('/api/citas/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  try {
    db.prepare('DELETE FROM citas WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 7. BLOQUEOS DE HORARIO
// ----------------------------------------------------
app.get('/api/bloqueos', (req, res) => {
  const { fecha, barbero_id } = req.query;
  const tenantId = getTenantId(req);

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

    const bloqueos = db.prepare(sql).all(...params);
    res.json(bloqueos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bloqueos', (req, res) => {
  const { barbero_id, fecha, hora_inicio, hora_fin, motivo } = req.body;
  const tenantId = getTenantId(req);

  if (!fecha || !hora_inicio || !hora_fin || !motivo) {
    return res.status(400).json({ error: 'Fecha, hora de inicio, fin y motivo son requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO bloqueos (barberia_id, barbero_id, fecha, hora_inicio, hora_fin, motivo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(tenantId, barbero_id ? Number(barbero_id) : null, fecha, hora_inicio, hora_fin, motivo);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Horario bloqueado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bloqueos/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  try {
    db.prepare('DELETE FROM bloqueos WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Bloqueo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 8. INGRESOS Y EGRESOS (MOVIMIENTOS DE CAJA & COSTOS)
// ----------------------------------------------------
app.get('/api/costos', (req, res) => {
  const { desde, hasta, categoria, tipo } = req.query;
  const tenantId = getTenantId(req);

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
    const movimientos = db.prepare(sql).all(...params);

    const totalEgresos = movimientos
      .filter(m => !m.tipo || m.tipo === 'egreso')
      .reduce((sum, c) => sum + c.monto_cop, 0);

    const totalIngresos = movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, c) => sum + c.monto_cop, 0);

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

app.post('/api/costos', (req, res) => {
  const { tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas } = req.body;
  const tenantId = getTenantId(req);

  if (!categoria || !descripcion || !monto_cop || !fecha) {
    return res.status(400).json({ error: 'Categoría, descripción, monto y fecha requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO costos (barberia_id, tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
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

app.delete('/api/costos/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  try {
    db.prepare('DELETE FROM costos WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 9. PRODUCTOS, INVENTARIO Y VENTAS CON COMISIÓN
// ----------------------------------------------------
app.get('/api/productos', (req, res) => {
  const tenantId = getTenantId(req);
  const todos = req.query.todos === 'true';
  try {
    const sql = todos
      ? 'SELECT * FROM productos WHERE barberia_id = ? ORDER BY nombre ASC'
      : 'SELECT * FROM productos WHERE barberia_id = ? AND activo = 1 ORDER BY nombre ASC';
    const productos = db.prepare(sql).all(tenantId);
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio_venta_cop, costo_compra_cop, stock_actual, stock_minimo, comision_barbero_fija, foto_url } = req.body;
  const tenantId = getTenantId(req);

  if (!nombre || !precio_venta_cop) {
    return res.status(400).json({ error: 'Nombre y precio de venta son requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO productos (barberia_id, nombre, descripcion, precio_venta_cop, costo_compra_cop, stock_actual, stock_minimo, comision_barbero_fija, foto_url, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      tenantId,
      nombre.trim(),
      descripcion || '',
      Number(precio_venta_cop),
      Number(costo_compra_cop) || 0,
      Number(stock_actual) || 0,
      Number(stock_minimo) || 2,
      Number(comision_barbero_fija) || 0,
      foto_url || ''
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Producto registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const { nombre, descripcion, precio_venta_cop, costo_compra_cop, stock_actual, stock_minimo, comision_barbero_fija, foto_url, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE productos
      SET nombre = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion),
          precio_venta_cop = COALESCE(?, precio_venta_cop),
          costo_compra_cop = COALESCE(?, costo_compra_cop),
          stock_actual = COALESCE(?, stock_actual),
          stock_minimo = COALESCE(?, stock_minimo),
          comision_barbero_fija = COALESCE(?, comision_barbero_fija),
          foto_url = COALESCE(?, foto_url),
          activo = COALESCE(?, activo)
      WHERE id = ? AND barberia_id = ?
    `);
    stmt.run(nombre, descripcion, precio_venta_cop, costo_compra_cop, stock_actual, stock_minimo, comision_barbero_fija, foto_url, activo, id, tenantId);
    res.json({ success: true, message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  try {
    db.prepare('UPDATE productos SET activo = 0 WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Producto desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar venta de producto
app.post('/api/ventas-productos', (req, res) => {
  const { producto_id, barbero_id, cantidad, precio_unitario, metodo_pago, fecha } = req.body;
  const tenantId = getTenantId(req);

  if (!producto_id || !cantidad || Number(cantidad) <= 0) {
    return res.status(400).json({ error: 'Producto y cantidad válida son requeridos' });
  }

  try {
    const transaction = db.transaction(() => {
      const producto = db.prepare('SELECT * FROM productos WHERE id = ? AND barberia_id = ?').get(producto_id, tenantId);
      if (!producto) throw new Error('Producto no encontrado');

      const cant = Number(cantidad);
      if (producto.stock_actual < cant) {
        throw new Error(`Stock insuficiente. Solo quedan ${producto.stock_actual} unidades disponibles.`);
      }

      const pUnit = precio_unitario ? Number(precio_unitario) : producto.precio_venta_cop;
      const totalVenta = pUnit * cant;
      const comisionUnitaria = producto.comision_barbero_fija || 0;
      const montoComision = barbero_id ? (comisionUnitaria * cant) : 0;
      const fechaVenta = fecha || new Date().toISOString().split('T')[0];

      const stmtVenta = db.prepare(`
        INSERT INTO ventas_productos (barberia_id, producto_id, barbero_id, cantidad, precio_unitario, total_venta, comision_barbero, monto_comision, fecha, metodo_pago)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const resVenta = stmtVenta.run(
        tenantId,
        producto_id,
        barbero_id ? Number(barbero_id) : null,
        cant,
        pUnit,
        totalVenta,
        comisionUnitaria,
        montoComision,
        fechaVenta,
        metodo_pago || 'Efectivo'
      );

      // Descontar inventario
      db.prepare('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ? AND barberia_id = ?').run(cant, producto_id, tenantId);

      // Registrar ingreso automático en caja
      db.prepare(`
        INSERT INTO costos (barberia_id, tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas)
        VALUES (?, 'ingreso', 'Venta Producto', ?, ?, ?, ?, ?, ?)
      `).run(
        tenantId,
        `Venta: ${cant}x ${producto.nombre}`,
        totalVenta,
        fechaVenta,
        metodo_pago || 'Efectivo',
        barbero_id ? Number(barbero_id) : null,
        `Venta ID #${resVenta.lastInsertRowid}`
      );

      return { venta_id: resVenta.lastInsertRowid, total_venta: totalVenta, monto_comision: montoComision };
    });

    const outcome = transaction();
    res.status(201).json({
      success: true,
      message: 'Venta registrada, inventario descontado e ingreso sumado a caja',
      ...outcome
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/ventas-productos', (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  const tenantId = getTenantId(req);

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

    const ventas = db.prepare(sql).all(...params);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 10. PLANTILLA DE LIQUIDACIÓN Y PAGOS POR PORCENTAJE
// ----------------------------------------------------
app.get('/api/liquidaciones/preview', (req, res) => {
  const { barbero_id, fecha_inicio, fecha_fin, porcentaje } = req.query;
  const tenantId = getTenantId(req);

  if (!barbero_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'barbero_id, fecha_inicio y fecha_fin son requeridos' });
  }

  try {
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND barberia_id = ?').get(barbero_id, tenantId);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    const citas = db.prepare(`
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

    const ventasProductos = db.prepare(`
      SELECT v.*, p.nombre as producto_nombre
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      WHERE v.barbero_id = ? 
        AND v.barberia_id = ?
        AND v.fecha BETWEEN ? AND ?
        AND v.liquidacion_id IS NULL
      ORDER BY v.fecha ASC
    `).all(barbero_id, tenantId, fecha_inicio, fecha_fin);

    const totalBrutoServicios = citas.reduce((sum, c) => sum + (c.precio_cobrado || 0), 0);
    const porcentajeAplicado = (porcentaje !== undefined && porcentaje !== '' && !isNaN(porcentaje))
      ? Number(porcentaje)
      : (barbero.porcentaje_comision || 50.0);

    const montoComisionServicios = Math.round(totalBrutoServicios * (porcentajeAplicado / 100));
    const totalComisionProductos = ventasProductos.reduce((sum, v) => sum + (v.monto_comision || 0), 0);
    const totalVentaProductos = ventasProductos.reduce((sum, v) => sum + (v.total_venta || 0), 0);

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

app.post('/api/liquidaciones', (req, res) => {
  const { barbero_id, fecha_inicio, fecha_fin, porcentaje_aplicado, deducciones, metodo_pago, notas, citas_ids, ventas_ids } = req.body;
  const tenantId = getTenantId(req);

  const arrayCitas = Array.isArray(citas_ids) ? citas_ids : [];
  const arrayVentas = Array.isArray(ventas_ids) ? ventas_ids : [];

  if (!barbero_id || !fecha_inicio || !fecha_fin || (arrayCitas.length === 0 && arrayVentas.length === 0)) {
    return res.status(400).json({ error: 'Faltan datos o no hay servicios ni ventas seleccionadas' });
  }

  const transaction = db.transaction(() => {
    let totalBruto = 0;
    let comisionServicios = 0;
    const pct = Number(porcentaje_aplicado);

    if (arrayCitas.length > 0) {
      const placeholders = arrayCitas.map(() => '?').join(',');
      const citas = db.prepare(`SELECT id, precio_cobrado FROM citas WHERE id IN (${placeholders}) AND barberia_id = ?`).all(...arrayCitas, tenantId);
      totalBruto = citas.reduce((sum, c) => sum + c.precio_cobrado, 0);
      comisionServicios = Math.round(totalBruto * (pct / 100));
    }

    let comisionProductos = 0;
    if (arrayVentas.length > 0) {
      const placeholdersVentas = arrayVentas.map(() => '?').join(',');
      const ventas = db.prepare(`SELECT id, monto_comision FROM ventas_productos WHERE id IN (${placeholdersVentas}) AND barberia_id = ?`).all(...arrayVentas, tenantId);
      comisionProductos = ventas.reduce((sum, v) => sum + v.monto_comision, 0);
    }

    const comisionTotal = comisionServicios + comisionProductos;
    const ded = Number(deducciones) || 0;
    const totalPagado = Math.max(0, comisionTotal - ded);

    const stmt = db.prepare(`
      INSERT INTO liquidaciones (
        barberia_id, barbero_id, fecha_inicio, fecha_fin, total_servicios, total_bruto,
        porcentaje_aplicado, monto_comision, deducciones, total_pagado, metodo_pago, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tenantId,
      barbero_id,
      fecha_inicio,
      fecha_fin,
      arrayCitas.length,
      totalBruto,
      pct,
      comisionTotal,
      ded,
      totalPagado,
      metodo_pago || 'Efectivo',
      notas || ''
    );

    const liquidacionId = result.lastInsertRowid;

    if (arrayCitas.length > 0) {
      const placeholders = arrayCitas.map(() => '?').join(',');
      db.prepare(`UPDATE citas SET liquidacion_id = ? WHERE id IN (${placeholders}) AND barberia_id = ?`).run(liquidacionId, ...arrayCitas, tenantId);
    }

    if (arrayVentas.length > 0) {
      const placeholdersVentas = arrayVentas.map(() => '?').join(',');
      db.prepare(`UPDATE ventas_productos SET liquidacion_id = ? WHERE id IN (${placeholdersVentas}) AND barberia_id = ?`).run(liquidacionId, ...arrayVentas, tenantId);
    }

    const barbero = db.prepare('SELECT nombre FROM barberos WHERE id = ? AND barberia_id = ?').get(barbero_id, tenantId);
    const barberoNombre = barbero ? barbero.nombre : `Barbero #${barbero_id}`;

    db.prepare(`
      INSERT INTO costos (barberia_id, tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas)
      VALUES (?, 'egreso', 'Comisión Barbero', ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      `Liquidación comisiones (${fecha_inicio} a ${fecha_fin}): ${barberoNombre}`,
      totalPagado,
      new Date().toISOString().split('T')[0],
      metodo_pago || 'Efectivo',
      barbero_id,
      `Liquidación ID #${liquidacionId}`
    );

    return {
      liquidacion_id: liquidacionId,
      barbero_nombre: barberoNombre,
      total_pagado: totalPagado
    };
  });

  try {
    const outcome = transaction();
    res.status(201).json({
      success: true,
      message: 'Liquidación generada con éxito y registrada en el Balance General',
      ...outcome
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/liquidaciones', (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  const tenantId = getTenantId(req);

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
    if (desde && hasta) {
      sql += ' AND l.fecha_pago BETWEEN ? AND ?';
      params.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
    }

    sql += ' ORDER BY l.id DESC';
    const liquidaciones = db.prepare(sql).all(...params);
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/liquidaciones/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);

  try {
    const liquidacion = db.prepare(`
      SELECT l.*, b.nombre as barbero_nombre, b.telefono as barbero_telefono
      FROM liquidaciones l
      JOIN barberos b ON l.barbero_id = b.id
      WHERE l.id = ? AND l.barberia_id = ?
    `).get(id, tenantId);

    if (!liquidacion) return res.status(404).json({ error: 'Liquidación no encontrada' });

    const citas = db.prepare(`
      SELECT c.*, s.nombre as servicio_nombre
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.liquidacion_id = ? AND c.barberia_id = ?
    `).all(id, tenantId);

    const ventas = db.prepare(`
      SELECT v.*, p.nombre as producto_nombre
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      WHERE v.liquidacion_id = ? AND v.barberia_id = ?
    `).all(id, tenantId);

    res.json({
      ...liquidacion,
      citas,
      ventas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 11. REPORTES: BALANCE GENERAL Y ESTADÍSTICAS FINANCIERAS
// ----------------------------------------------------
app.get('/api/reportes/balance', (req, res) => {
  const { desde, hasta } = req.query;
  const tenantId = getTenantId(req);

  try {
    const ahora = new Date();
    const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
    const hoyStr = ahora.toISOString().split('T')[0];

    const fDesde = desde || primerDiaMes;
    const fHasta = hasta || hoyStr;

    // 1. Citas completadas en el periodo
    const citasCompletadas = db.prepare(`
      SELECT c.id, c.barbero_id, c.servicio_id, c.fecha, c.precio_cobrado,
             b.nombre as barbero_nombre, b.porcentaje_comision,
             s.nombre as servicio_nombre
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barberia_id = ? AND c.estado = 'completada' AND c.fecha BETWEEN ? AND ?
      ORDER BY c.fecha ASC
    `).all(tenantId, fDesde, fHasta);

    const totalIngresosCitas = citasCompletadas.reduce((sum, c) => sum + (c.precio_cobrado || 0), 0);

    // 2. Ventas de productos
    const ventasProductos = db.prepare(`
      SELECT v.*, p.nombre as producto_nombre, b.nombre as barbero_nombre
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      LEFT JOIN barberos b ON v.barbero_id = b.id
      WHERE v.barberia_id = ? AND v.fecha BETWEEN ? AND ?
    `).all(tenantId, fDesde, fHasta);

    const totalIngresosProductos = ventasProductos.reduce((sum, v) => sum + (v.total_venta || 0), 0);
    const totalComisionProductos = ventasProductos.reduce((sum, v) => sum + (v.monto_comision || 0), 0);

    // 3. Movimientos de costos (egresos e ingresos manuales)
    const movimientosCostos = db.prepare(`
      SELECT c.*, b.nombre as barbero_nombre
      FROM costos c
      LEFT JOIN barberos b ON c.barbero_id = b.id
      WHERE c.barberia_id = ? AND c.fecha BETWEEN ? AND ?
    `).all(tenantId, fDesde, fHasta);

    const egresosCostos = movimientosCostos.filter(m => !m.tipo || m.tipo === 'egreso');
    const totalEgresos = egresosCostos.reduce((sum, e) => sum + e.monto_cop, 0);

    // Egresos desglosados por categoría
    const egresosPorCategoria = {};
    egresosCostos.forEach(e => {
      const cat = e.categoria || 'Varios';
      egresosPorCategoria[cat] = (egresosPorCategoria[cat] || 0) + e.monto_cop;
    });

    // 4. Liquidaciones pagadas
    const liquidacionesPagadas = db.prepare(`
      SELECT l.*, b.nombre as barbero_nombre
      FROM liquidaciones l
      JOIN barberos b ON l.barbero_id = b.id
      WHERE l.barberia_id = ? AND substr(l.fecha_pago, 1, 10) BETWEEN ? AND ?
    `).all(tenantId, fDesde, fHasta);

    const totalComisionesPagadas = liquidacionesPagadas.reduce((sum, l) => sum + (l.total_pagado || 0), 0);

    // 5. Rentabilidad desglosada por barbero
    const barberos = db.prepare('SELECT id, nombre, porcentaje_comision, foto_url FROM barberos WHERE barberia_id = ?').all(tenantId);
    const balanceBarberos = barberos.map(b => {
      const citasDelBarbero = citasCompletadas.filter(c => c.barbero_id === b.id);
      const facturadoServicios = citasDelBarbero.reduce((sum, c) => sum + (c.precio_cobrado || 0), 0);
      const ventasDelBarbero = ventasProductos.filter(v => v.barbero_id === b.id);
      const facturadoProductos = ventasDelBarbero.reduce((sum, v) => sum + (v.total_venta || 0), 0);
      const comisionProd = ventasDelBarbero.reduce((sum, v) => sum + (v.monto_comision || 0), 0);
      const pct = b.porcentaje_comision || 50;
      const comisionServicios = Math.round(facturadoServicios * (pct / 100));
      const comisionTotalGenerada = comisionServicios + comisionProd;
      const utilidadParaNegocio = (facturadoServicios + facturadoProductos) - comisionTotalGenerada;

      return {
        barbero_id: b.id,
        nombre: b.nombre,
        foto_url: b.foto_url,
        porcentaje: pct,
        total_citas: citasDelBarbero.length,
        total_servicios_cop: facturadoServicios,
        total_productos_cop: facturadoProductos,
        total_facturado_cop: facturadoServicios + facturadoProductos,
        comision_estimada_cop: comisionTotalGenerada,
        utilidad_neta_negocio_cop: utilidadParaNegocio
      };
    });

    const totalIngresosBrutos = totalIngresosCitas + totalIngresosProductos;
    const utilidadNetaOperativa = totalIngresosBrutos - totalEgresos;

    res.json({
      periodo: { desde: fDesde, hasta: fHasta },
      metricas_globales: {
        total_ingresos_brutos: totalIngresosBrutos,
        total_ingresos_servicios: totalIngresosCitas,
        total_ingresos_productos: totalIngresosProductos,
        total_egresos: totalEgresos,
        utilidad_neta: utilidadNetaOperativa,
        total_citas_completadas: citasCompletadas.length,
        total_liquidaciones_pagadas: totalComisionesPagadas,
        margen_rentabilidad_pct: totalIngresosBrutos > 0 ? Math.round((utilidadNetaOperativa / totalIngresosBrutos) * 100) : 0
      },
      egresos_por_categoria: egresosPorCategoria,
      balance_barberos: balanceBarberos,
      citas_recientes: citasCompletadas.slice(0, 30),
      ultimas_liquidaciones: liquidacionesPagadas
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para estadísticas del simulador de rentabilidad & punto de equilibrio
app.get('/api/reportes/rentabilidad-stats', (req, res) => {
  const tenantId = getTenantId(req);
  try {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    const citasMes = db.prepare(`
      SELECT COUNT(*) as count, SUM(precio_cobrado) as total 
      FROM citas 
      WHERE barberia_id = ? AND estado = 'completada' AND fecha BETWEEN ? AND ?
    `).get(tenantId, primerDiaMes, ultimoDiaMes);

    const egresosMes = db.prepare(`
      SELECT SUM(monto_cop) as total 
      FROM costos 
      WHERE barberia_id = ? AND tipo = 'egreso' AND fecha BETWEEN ? AND ?
    `).get(tenantId, primerDiaMes, ultimoDiaMes);

    const egresosTotales = db.prepare(`
      SELECT SUM(monto_cop) as total, COUNT(DISTINCT substr(fecha, 1, 7)) as meses_count 
      FROM costos 
      WHERE barberia_id = ? AND tipo = 'egreso'
    `).get(tenantId);

    let costosFijosEstimados = egresosMes.total || 0;
    if (costosFijosEstimados === 0 && egresosTotales && egresosTotales.total > 0) {
      const meses = Math.max(1, egresosTotales.meses_count || 1);
      costosFijosEstimados = Math.round(egresosTotales.total / meses);
    }
    if (costosFijosEstimados === 0) {
      costosFijosEstimados = 1200000;
    }

    const barberos = db.prepare('SELECT id, nombre, porcentaje_comision FROM barberos WHERE barberia_id = ? AND activo = 1').all(tenantId);
    const totalComision = barberos.reduce((acc, b) => acc + (b.porcentaje_comision || 50), 0);
    const comisionPromedio = barberos.length > 0 ? Math.round(totalComision / barberos.length) : 50;

    const servicios = db.prepare('SELECT precio_cop FROM servicios WHERE barberia_id = ? AND activo = 1').all(tenantId);
    const totalPrecios = servicios.reduce((acc, s) => acc + (s.precio_cop || 0), 0);
    const precioPromedio = servicios.length > 0 ? Math.round(totalPrecios / servicios.length) : 25000;

    res.json({
      mes_actual_inicio: primerDiaMes,
      mes_actual_fin: ultimoDiaMes,
      citas_mes_actual: citasMes ? (citasMes.count || 0) : 0,
      ingresos_mes_actual: citasMes ? (citasMes.total || 0) : 0,
      costos_fijos_mensuales: costosFijosEstimados,
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
// 12. GALERÍA MULTIMEDIA & REDES SOCIALES
// ----------------------------------------------------
app.get('/api/multimedia', (req, res) => {
  const tenantId = getTenantId(req);
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

    const items = db.prepare(sql).all(tenantId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/multimedia', (req, res) => {
  const { titulo, tipo, url_media, url_red_social, descripcion, barbero_id } = req.body;
  const tenantId = getTenantId(req);

  if (!titulo || !url_media) {
    return res.status(400).json({ error: 'Título y URL de multimedia o red social son obligatorios' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO galeria_multimedia (barberia_id, titulo, tipo, url_media, url_red_social, descripcion, barbero_id, orden, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
    `);
    const result = stmt.run(
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

app.put('/api/multimedia/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  const { titulo, tipo, url_media, url_red_social, descripcion, barbero_id, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE galeria_multimedia
      SET titulo = COALESCE(?, titulo),
          tipo = COALESCE(?, tipo),
          url_media = COALESCE(?, url_media),
          url_red_social = COALESCE(?, url_red_social),
          descripcion = COALESCE(?, descripcion),
          barbero_id = ?,
          activo = COALESCE(?, activo)
      WHERE id = ? AND barberia_id = ?
    `);
    stmt.run(
      titulo,
      tipo,
      url_media,
      url_red_social,
      descripcion,
      barbero_id !== undefined ? (barbero_id ? Number(barbero_id) : null) : null,
      activo,
      id,
      tenantId
    );
    res.json({ success: true, message: 'Publicación actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/multimedia/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = getTenantId(req);
  try {
    db.prepare('DELETE FROM galeria_multimedia WHERE id = ? AND barberia_id = ?').run(id, tenantId);
    res.json({ success: true, message: 'Publicación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 13. AUDITORÍA E HISTORIAL TOTAL DE MOVIMIENTOS
// ----------------------------------------------------
app.get('/api/auditoria', (req, res) => {
  const { tipo, desde, hasta, limite } = req.query;
  const tenantId = getTenantId(req);

  try {
    let sql = 'SELECT * FROM auditoria WHERE barberia_id = ?';
    const params = [tenantId];

    if (tipo) {
      sql += ' AND tipo_evento = ?';
      params.push(tipo);
    }
    if (desde && hasta) {
      sql += ' AND fecha_hora BETWEEN ? AND ?';
      params.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
    }

    sql += ' ORDER BY fecha_hora DESC LIMIT ?';
    params.push(limite ? Number(limite) : 200);

    const registros = db.prepare(sql).all(...params);
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notificaciones en vivo de citas para la campana de alertas
app.get('/api/notificaciones/recientes', (req, res) => {
  const tenantId = getTenantId(req);
  try {
    const recientes = db.prepare(`
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Multi-Tenant de Barbería corriendo en http://localhost:${PORT}`);
});
