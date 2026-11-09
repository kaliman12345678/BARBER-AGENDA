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

// Helper para convertir HH:mm a minutos desde las 00:00
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper para convertir minutos a HH:mm
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Helper para verificar solapamiento entre dos intervalos [inicio1, fin1] y [inicio2, fin2]
function checkOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

// ----------------------------------------------------
// 1. CONFIGURACIÓN Y AUTENTICACIÓN
// ----------------------------------------------------
app.get('/api/configuracion', (req, res) => {
  try {
    const rows = db.prepare('SELECT clave, valor FROM configuracion').all();
    const config = {};
    rows.forEach(r => {
      // No exponer el pin_admin directamente
      if (r.clave !== 'pin_admin') {
        config[r.clave] = r.valor;
      }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify-pin', (req, res) => {
  const { pin } = req.body;
  try {
    const row = db.prepare('SELECT valor FROM configuracion WHERE clave = ?').get('pin_admin');
    const masterPin = row ? row.valor : '1234';
    if (String(pin).trim() === String(masterPin).trim()) {
      res.json({ success: true, token: 'auth-admin-session-token' });
    } else {
      res.status(401).json({ success: false, message: 'PIN incorrecto' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/configuracion', (req, res) => {
  const { nombre_barberia, telefono_barberia, direccion_barberia, pin_admin } = req.body;
  try {
    const update = db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)');
    if (nombre_barberia) update.run('nombre_barberia', nombre_barberia);
    if (telefono_barberia) update.run('telefono_barberia', telefono_barberia);
    if (direccion_barberia) update.run('direccion_barberia', direccion_barberia);
    if (pin_admin) update.run('pin_admin', pin_admin);
    res.json({ success: true, message: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. BARBEROS
// ----------------------------------------------------
app.get('/api/barberos', (req, res) => {
  try {
    const todos = req.query.todos === 'true';
    const query = todos 
      ? 'SELECT * FROM barberos ORDER BY nombre ASC'
      : 'SELECT * FROM barberos WHERE activo = 1 ORDER BY nombre ASC';
    const barberos = db.prepare(query).all();
    res.json(barberos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/barberos', (req, res) => {
  const { nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    const stmt = db.prepare(`
      INSERT INTO barberos (nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      nombre,
      telefono || '',
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
  const { nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE barberos 
      SET nombre = COALESCE(?, nombre),
          telefono = COALESCE(?, telefono),
          foto_url = COALESCE(?, foto_url),
          porcentaje_comision = COALESCE(?, porcentaje_comision),
          horario_inicio = COALESCE(?, horario_inicio),
          horario_fin = COALESCE(?, horario_fin),
          dias_laborales = COALESCE(?, dias_laborales),
          activo = COALESCE(?, activo)
      WHERE id = ?
    `);
    stmt.run(
      nombre !== undefined ? nombre : null,
      telefono !== undefined ? telefono : null,
      foto_url !== undefined ? foto_url : null,
      porcentaje_comision !== undefined && porcentaje_comision !== '' ? Number(porcentaje_comision) : null,
      horario_inicio !== undefined ? horario_inicio : null,
      horario_fin !== undefined ? horario_fin : null,
      dias_laborales !== undefined ? dias_laborales : null,
      activo !== undefined ? (activo ? 1 : 0) : null,
      id
    );
    res.json({ success: true, message: 'Barbero actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/barberos/:id', (req, res) => {
  const { id } = req.params;
  const { porcentaje_comision, activo, pin } = req.body;

  try {
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ?').get(id);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    if (porcentaje_comision !== undefined) {
      db.prepare('UPDATE barberos SET porcentaje_comision = ? WHERE id = ?').run(Number(porcentaje_comision), id);
    }
    if (activo !== undefined) {
      db.prepare('UPDATE barberos SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);
    }
    if (pin !== undefined && pin !== '') {
      db.prepare('UPDATE barberos SET pin = ? WHERE id = ?').run(String(pin).trim(), id);
    }

    const actualizado = db.prepare('SELECT * FROM barberos WHERE id = ?').get(id);
    res.json({ success: true, message: 'Barbero actualizado', barbero: actualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Autenticación de Barbero (Para su portal privado)
app.post('/api/barberos/login', (req, res) => {
  const { barbero_id, pin } = req.body;
  if (!barbero_id || !pin) {
    return res.status(400).json({ error: 'barbero_id y pin son requeridos' });
  }

  try {
    const barbero = db.prepare('SELECT id, nombre, telefono, foto_url, porcentaje_comision, pin, activo FROM barberos WHERE id = ?').get(barbero_id);
    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }
    if (!barbero.activo) {
      return res.status(403).json({ error: 'Esta cuenta de barbero se encuentra inactiva' });
    }

    if (String(barbero.pin || '1234') !== String(pin).trim()) {
      return res.status(401).json({ error: 'PIN incorrecto' });
    }

    // Retornar perfil sin exponer el PIN
    const { pin: _, ...perfilSeguro } = barbero;
    res.json({
      success: true,
      message: `Bienvenido ${barbero.nombre}`,
      token: `barbero_session_${barbero.id}_${Date.now()}`,
      barbero: perfilSeguro
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portal Barbero: Citas asignadas a este barbero (SIN teléfono ni datos sensibles)
app.get('/api/barbero-portal/citas', (req, res) => {
  const { barbero_id, fecha, desde, hasta } = req.query;
  if (!barbero_id) {
    return res.status(400).json({ error: 'barbero_id es requerido' });
  }

  try {
    let sql = `
      SELECT 
        c.id,
        c.fecha,
        c.hora_inicio,
        c.hora_fin,
        c.estado,
        c.precio_cobrado,
        c.notas,
        c.cliente_nombre, -- SOLO el nombre de pila
        s.nombre as servicio_nombre,
        s.duracion_minutos
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barbero_id = ?
    `;
    const params = [barbero_id];

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

// Portal Barbero: Métricas personales de utilidad y rentabilidad propia (NO ve finanzas del local)
app.get('/api/barbero-portal/balance', (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  if (!barbero_id) {
    return res.status(400).json({ error: 'barbero_id es requerido' });
  }

  try {
    const barbero = db.prepare('SELECT id, nombre, porcentaje_comision FROM barberos WHERE id = ?').get(barbero_id);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    // 1. Citas completadas de este barbero
    let sqlCitas = `SELECT COUNT(*) as count, SUM(precio_cobrado) as total FROM citas WHERE barbero_id = ? AND estado = 'completada'`;
    const paramsCitas = [barbero_id];
    if (desde && hasta) {
      sqlCitas += ' AND fecha BETWEEN ? AND ?';
      paramsCitas.push(desde, hasta);
    }
    const citasData = db.prepare(sqlCitas).get(...paramsCitas);
    const totalServicios = citasData.count || 0;
    const totalBrutoServicios = citasData.total || 0;

    // 2. Ventas de productos realizadas por este barbero
    let sqlProd = `SELECT COUNT(*) as count, SUM(total_venta) as total_venta, SUM(monto_comision) as total_comision FROM ventas_productos WHERE barbero_id = ?`;
    const paramsProd = [barbero_id];
    if (desde && hasta) {
      sqlProd += ' AND fecha BETWEEN ? AND ?';
      paramsProd.push(desde, hasta);
    }
    const prodData = db.prepare(sqlProd).get(...paramsProd);
    const totalVentasProductos = prodData.total_venta || 0;
    const comisionProductos = prodData.total_comision || 0;

    // 3. Liquidaciones recibidas/pagadas
    let sqlLiq = `SELECT SUM(total_pagado) as total_pagado, COUNT(*) as count FROM liquidaciones WHERE barbero_id = ?`;
    const paramsLiq = [barbero_id];
    if (desde && hasta) {
      sqlLiq += ' AND fecha_pago BETWEEN ? AND ?';
      paramsLiq.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
    }
    const liqData = db.prepare(sqlLiq).get(...paramsLiq);
    const totalYaPagado = liqData.total_pagado || 0;

    // 4. Citas pendientes por liquidar
    let sqlPend = `SELECT COUNT(*) as count, SUM(precio_cobrado) as total FROM citas WHERE barbero_id = ? AND estado = 'completada' AND liquidacion_id IS NULL`;
    const paramsPend = [barbero_id];
    if (desde && hasta) {
      sqlPend += ' AND fecha BETWEEN ? AND ?';
      paramsPend.push(desde, hasta);
    }
    const pendData = db.prepare(sqlPend).get(...paramsPend);
    const brutoPendiente = pendData.total || 0;
    const comisionServiciosPendiente = Math.round(brutoPendiente * ((barbero.porcentaje_comision || 50) / 100));

    const comisionServiciosTotal = Math.round(totalBrutoServicios * ((barbero.porcentaje_comision || 50) / 100));
    const gananciaTotalBarbero = comisionServiciosTotal + comisionProductos;

    res.json({
      barbero,
      total_servicios: totalServicios,
      total_bruto_generado: totalBrutoServicios + totalVentasProductos,
      total_bruto_servicios: totalBrutoServicios,
      total_bruto_productos: totalVentasProductos,
      porcentaje_comision: barbero.porcentaje_comision || 50,
      ganancia_total_barbero: gananciaTotalBarbero,
      comision_servicios: comisionServiciosTotal,
      comision_productos: comisionProductos,
      total_ya_cobrado: totalYaPagado,
      pendiente_por_cobrar: comisionServiciosPendiente,
      servicios_pendientes_count: pendData.count || 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/barberos/:id', (req, res) => {
  const { id } = req.params;
  try {
    // Si tiene citas registradas, desactivar para no perder historial
    const citasCount = db.prepare('SELECT COUNT(*) as count FROM citas WHERE barbero_id = ?').get(id).count;
    if (citasCount > 0) {
      db.prepare('UPDATE barberos SET activo = 0 WHERE id = ?').run(id);
      res.json({ success: true, message: 'Barbero desactivado (se conservó su historial de citas)' });
    } else {
      db.prepare('DELETE FROM barberos WHERE id = ?').run(id);
      res.json({ success: true, message: 'Barbero eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. SERVICIOS
// ----------------------------------------------------
app.get('/api/servicios', (req, res) => {
  try {
    const todos = req.query.todos === 'true';
    const query = todos 
      ? 'SELECT * FROM servicios ORDER BY precio_cop ASC'
      : 'SELECT * FROM servicios WHERE activo = 1 ORDER BY precio_cop ASC';
    const servicios = db.prepare(query).all();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/servicios', (req, res) => {
  const { nombre, precio_cop, duracion_minutos, descripcion } = req.body;
  if (!nombre || !precio_cop) return res.status(400).json({ error: 'Nombre y precio requeridos' });

  try {
    const stmt = db.prepare(`
      INSERT INTO servicios (nombre, precio_cop, duracion_minutos, descripcion, activo)
      VALUES (?, ?, ?, ?, 1)
    `);
    const result = stmt.run(nombre, Number(precio_cop), Number(duracion_minutos) || 45, descripcion || '');
    res.json({ id: result.lastInsertRowid, message: 'Servicio creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/servicios/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio_cop, duracion_minutos, descripcion, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE servicios 
      SET nombre = COALESCE(?, nombre),
          precio_cop = COALESCE(?, precio_cop),
          duracion_minutos = COALESCE(?, duracion_minutos),
          descripcion = COALESCE(?, descripcion),
          activo = COALESCE(?, activo)
      WHERE id = ?
    `);
    stmt.run(nombre, precio_cop, duracion_minutos, descripcion, activo, id);
    res.json({ success: true, message: 'Servicio actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/servicios/:id', (req, res) => {
  const { id } = req.params;
  try {
    const citasCount = db.prepare('SELECT COUNT(*) as count FROM citas WHERE servicio_id = ?').get(id).count;
    if (citasCount > 0) {
      db.prepare('UPDATE servicios SET activo = 0 WHERE id = ?').run(id);
      res.json({ success: true, message: 'Servicio desactivado para conservar historial' });
    } else {
      db.prepare('DELETE FROM servicios WHERE id = ?').run(id);
      res.json({ success: true, message: 'Servicio eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. MOTOR DE DISPONIBILIDAD (PREVENCIÓN DE SOLAPAMIENTOS)
// ----------------------------------------------------
app.get('/api/disponibilidad', (req, res) => {
  const { barbero_id, fecha, duracion_minutos } = req.query;

  if (!barbero_id || !fecha) {
    return res.status(400).json({ error: 'barbero_id y fecha son obligatorios' });
  }

  try {
    const duracion = Number(duracion_minutos) || 45;
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND activo = 1').get(barbero_id);

    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado o inactivo' });
    }

    // Verificar día laboral (1 = Lunes, 7 = Domingo)
    const fechaObj = new Date(`${fecha}T00:00:00`);
    let diaSemana = fechaObj.getDay(); // 0 es Domingo
    if (diaSemana === 0) diaSemana = 7;

    const diasPermitidos = (barbero.dias_laborales || '1,2,3,4,5,6').split(',').map(Number);
    if (!diasPermitidos.includes(diaSemana)) {
      return res.json({
        disponible_dia: false,
        motivo: 'El barbero no labora este día de la semana',
        slots: []
      });
    }

    // Obtener citas activas del barbero en esa fecha
    const citas = db.prepare(`
      SELECT id, hora_inicio, hora_fin, cliente_nombre 
      FROM citas 
      WHERE barbero_id = ? AND fecha = ? AND estado != 'cancelada'
    `).all(barbero_id, fecha);

    // Obtener bloqueos de horario que apliquen (al barbero o globales)
    const bloqueos = db.prepare(`
      SELECT id, hora_inicio, hora_fin, motivo 
      FROM bloqueos 
      WHERE (barbero_id = ? OR barbero_id IS NULL) AND fecha = ?
    `).all(barbero_id, fecha);

    const inicioMin = timeToMinutes(barbero.horario_inicio || '09:00');
    const finMin = timeToMinutes(barbero.horario_fin || '20:00');
    const step = 30; // Granularidad de 30 minutos para opciones de inicio

    const slots = [];
    for (let m = inicioMin; m + duracion <= finMin; m += step) {
      const slotInicio = minutesToTime(m);
      const slotFin = minutesToTime(m + duracion);

      // Verificar si choca con cita
      const conflictoCita = citas.find(c => checkOverlap(slotInicio, slotFin, c.hora_inicio, c.hora_fin));

      // Verificar si choca con bloqueo
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
// 5. CITAS / TURNOS
// ----------------------------------------------------
app.get('/api/citas', (req, res) => {
  const { fecha, barbero_id, estado, desde, hasta } = req.query;
  try {
    let sql = `
      SELECT c.*, b.nombre as barbero_nombre, b.foto_url as barbero_foto, s.nombre as servicio_nombre, s.duracion_minutos
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE 1=1
    `;
    const params = [];

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

  if (!barbero_id || !servicio_id || !cliente_nombre || !cliente_telefono || !fecha || !hora_inicio) {
    return res.status(400).json({ error: 'Todos los campos marcados son obligatorios' });
  }

  try {
    const servicio = db.prepare('SELECT * FROM servicios WHERE id = ?').get(servicio_id);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    const duracion = servicio.duracion_minutos || 45;
    const startMin = timeToMinutes(hora_inicio);
    const endMin = startMin + duracion;
    const hora_fin = minutesToTime(endMin);

    // 1. Validar colisión con citas existentes que no estén canceladas
    const citasExistentes = db.prepare(`
      SELECT id, hora_inicio, hora_fin 
      FROM citas 
      WHERE barbero_id = ? AND fecha = ? AND estado != 'cancelada'
    `).all(barbero_id, fecha);

    const hayConflictoCita = citasExistentes.some(c => checkOverlap(hora_inicio, hora_fin, c.hora_inicio, c.hora_fin));
    if (hayConflictoCita) {
      return res.status(409).json({ 
        error: 'El horario seleccionado acaba de ser reservado por otro cliente. Por favor selecciona otro turno.' 
      });
    }

    // 2. Validar colisión con bloqueos
    const bloqueos = db.prepare(`
      SELECT id, hora_inicio, hora_fin, motivo 
      FROM bloqueos 
      WHERE (barbero_id = ? OR barbero_id IS NULL) AND fecha = ?
    `).all(barbero_id, fecha);

    const hayConflictoBloqueo = bloqueos.some(b => checkOverlap(hora_inicio, hora_fin, b.hora_inicio, b.hora_fin));
    if (hayConflictoBloqueo) {
      return res.status(409).json({ 
        error: 'El barbero o la barbería tiene este horario bloqueado para atención.' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO citas (barbero_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, hora_fin, estado, precio_cobrado, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada', ?, ?)
    `);

    const result = stmt.run(
      barbero_id,
      servicio_id,
      cliente_nombre.trim(),
      cliente_telefono.trim(),
      fecha,
      hora_inicio,
      hora_fin,
      servicio.precio_cop,
      notas || ''
    );

    const barberoAsignado = db.prepare('SELECT nombre FROM barberos WHERE id = ?').get(barbero_id);
    const nombreBarbero = barberoAsignado ? barberoAsignado.nombre : 'un barbero';

    // Registrar en auditoría
    try {
      db.prepare(`
        INSERT INTO auditoria (tipo_evento, descripcion, usuario, detalles_json)
        VALUES ('CITA_CREADA', ?, 'cliente', ?)
      `).run(
        `Nueva cita agendada para ${cliente_nombre.trim()} con ${nombreBarbero} (${fecha} a las ${hora_inicio})`,
        JSON.stringify({ cita_id: result.lastInsertRowid, barbero_id, servicio_id, fecha, hora_inicio })
      );
    } catch (e) {}

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Turno agendado exitosamente',
      cita: {
        id: result.lastInsertRowid,
        fecha,
        hora_inicio,
        hora_fin,
        precio_cobrado: servicio.precio_cop
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reasignar cita a otro barbero (Permite al admin cambiar de barbero a su criterio)
app.patch('/api/citas/:id/reasignar', (req, res) => {
  const { id } = req.params;
  const targetBarberoId = req.body.nuevo_barbero_id || req.body.barbero_id;
  const { motivo, usuario } = req.body;

  if (!targetBarberoId) {
    return res.status(400).json({ error: 'barbero_id o nuevo_barbero_id es requerido' });
  }

  try {
    const cita = db.prepare('SELECT c.*, b.nombre as barbero_antiguo_nombre FROM citas c JOIN barberos b ON c.barbero_id = b.id WHERE c.id = ?').get(id);
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    const nuevoBarbero = db.prepare('SELECT * FROM barberos WHERE id = ?').get(targetBarberoId);
    if (!nuevoBarbero) return res.status(404).json({ error: 'Nuevo barbero no encontrado' });

    // Actualizar barbero en la cita
    db.prepare('UPDATE citas SET barbero_id = ? WHERE id = ?').run(targetBarberoId, id);

    // Registrar en auditoría
    try {
      db.prepare(`
        INSERT INTO auditoria (tipo_evento, descripcion, usuario, detalles_json)
        VALUES ('CITA_REASIGNADA', ?, ?, ?)
      `).run(
        `Cita de ${cita.cliente_nombre} reasignada de ${cita.barbero_antiguo_nombre} a ${nuevoBarbero.nombre}. Motivo: ${motivo || 'Decisión administrativa'}`,
        usuario || 'Administrador',
        JSON.stringify({ cita_id: id, barbero_anterior: cita.barbero_id, barbero_nuevo: targetBarberoId, motivo })
      );
    } catch (e) {}

    res.json({
      success: true,
      message: `Cita reasignada a ${nuevoBarbero.nombre} con éxito`,
      nuevo_barbero: nuevoBarbero
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/citas/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado, precio_cobrado } = req.body;

  if (!['confirmada', 'completada', 'cancelada', 'no_asistio'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  try {
    if (precio_cobrado !== undefined) {
      db.prepare('UPDATE citas SET estado = ?, precio_cobrado = ? WHERE id = ?').run(estado, Number(precio_cobrado), id);
    } else {
      db.prepare('UPDATE citas SET estado = ? WHERE id = ?').run(estado, id);
    }

    try {
      const c = db.prepare('SELECT c.cliente_nombre, b.nombre as barbero_nombre FROM citas c JOIN barberos b ON c.barbero_id = b.id WHERE c.id = ?').get(id);
      if (c) {
        db.prepare('INSERT INTO auditoria (tipo_evento, descripcion, usuario, detalles_json) VALUES (?, ?, ?, ?)').run(
          'CITA_ESTADO',
          `Cita de ${c.cliente_nombre} con ${c.barbero_nombre} cambiada a estado: ${estado.toUpperCase()}`,
          'admin',
          JSON.stringify({ cita_id: id, nuevo_estado: estado })
        );
      }
    } catch (e) {}

    res.json({ success: true, message: `Estado actualizado a ${estado}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citas/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM citas WHERE id = ?').run(id);
    res.json({ success: true, message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. BLOQUEO DE HORARIOS (DESCANSOS / ALMUERZOS / FERIADOS)
// ----------------------------------------------------
app.get('/api/bloqueos', (req, res) => {
  const { fecha, barbero_id } = req.query;
  try {
    let sql = `
      SELECT b.*, bar.nombre as barbero_nombre 
      FROM bloqueos b
      LEFT JOIN barberos bar ON b.barbero_id = bar.id
      WHERE 1=1
    `;
    const params = [];
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

  if (!fecha || !hora_inicio || !hora_fin || !motivo) {
    return res.status(400).json({ error: 'Fecha, hora de inicio, fin y motivo son requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO bloqueos (barbero_id, fecha, hora_inicio, hora_fin, motivo)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(barbero_id ? Number(barbero_id) : null, fecha, hora_inicio, hora_fin, motivo);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Horario bloqueado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bloqueos/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM bloqueos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Bloqueo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 7. INGRESOS Y EGRESOS (MOVIMIENTOS DE CAJA & COSTOS)
// ----------------------------------------------------
app.get('/api/costos', (req, res) => {
  const { desde, hasta, categoria, tipo } = req.query;
  try {
    let sql = `
      SELECT c.*, b.nombre as barbero_nombre 
      FROM costos c 
      LEFT JOIN barberos b ON c.barbero_id = b.id 
      WHERE 1=1
    `;
    const params = [];

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
      total: totalEgresos // compatibilidad
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/costos', (req, res) => {
  const { tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas } = req.body;

  if (!categoria || !descripcion || !monto_cop || !fecha) {
    return res.status(400).json({ error: 'Categoría, descripción, monto y fecha requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO costos (tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
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
  try {
    db.prepare('DELETE FROM costos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Registro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 8. PRODUCTOS, INVENTARIO Y VENTAS CON COMISIÓN
// ----------------------------------------------------
app.get('/api/productos', (req, res) => {
  const todos = req.query.todos === 'true';
  try {
    const query = todos
      ? 'SELECT * FROM productos ORDER BY nombre ASC'
      : 'SELECT * FROM productos WHERE activo = 1 ORDER BY nombre ASC';
    const productos = db.prepare(query).all();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/productos', (req, res) => {
  const { nombre, foto_url, stock, precio_venta, costo_compra, porcentaje_comision, categoria, descripcion } = req.body;

  if (!nombre || precio_venta === undefined) {
    return res.status(400).json({ error: 'Nombre y precio de venta son requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO productos (nombre, foto_url, stock, precio_venta, costo_compra, porcentaje_comision, categoria, descripcion, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      nombre.trim(),
      foto_url || '',
      Number(stock) || 0,
      Number(precio_venta),
      Number(costo_compra) || 0,
      Number(porcentaje_comision) || 0,
      categoria || 'General',
      descripcion || ''
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Producto agregado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, foto_url, stock, precio_venta, costo_compra, porcentaje_comision, categoria, descripcion, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE productos
      SET nombre = COALESCE(?, nombre),
          foto_url = COALESCE(?, foto_url),
          stock = COALESCE(?, stock),
          precio_venta = COALESCE(?, precio_venta),
          costo_compra = COALESCE(?, costo_compra),
          porcentaje_comision = COALESCE(?, porcentaje_comision),
          categoria = COALESCE(?, categoria),
          descripcion = COALESCE(?, descripcion),
          activo = COALESCE(?, activo)
      WHERE id = ?
    `);
    stmt.run(nombre, foto_url, stock, precio_venta, costo_compra, porcentaje_comision, categoria, descripcion, activo, id);
    res.json({ success: true, message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM productos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar una Venta de Producto
app.post('/api/ventas-productos', (req, res) => {
  const { producto_id, cantidad, barbero_id, metodo_pago, fecha, notas } = req.body;

  if (!producto_id || !cantidad || Number(cantidad) <= 0) {
    return res.status(400).json({ error: 'Producto y cantidad válida requeridos' });
  }

  const transaction = db.transaction(() => {
    const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(producto_id);
    if (!producto) throw new Error('Producto no encontrado');

    const qty = Number(cantidad);
    if (producto.stock < qty) {
      throw new Error(`Inventario insuficiente. Stock disponible: ${producto.stock}`);
    }

    const precioUnit = producto.precio_venta;
    const costoUnit = producto.costo_compra || 0;
    const totalVenta = precioUnit * qty;
    const costoTotal = costoUnit * qty;
    const pctComision = barbero_id ? (producto.porcentaje_comision || 0) : 0;
    const montoComision = Math.round(totalVenta * (pctComision / 100));
    const gananciaNeta = totalVenta - costoTotal - montoComision;

    // 1. Descontar inventario
    db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?').run(qty, producto_id);

    // 2. Registrar venta
    const stmtVenta = db.prepare(`
      INSERT INTO ventas_productos (
        producto_id, cantidad, precio_unitario, costo_unitario, total_venta,
        porcentaje_comision, monto_comision, ganancia_neta, barbero_id, metodo_pago, fecha, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const resultVenta = stmtVenta.run(
      producto_id,
      qty,
      precioUnit,
      costoUnit,
      totalVenta,
      pctComision,
      montoComision,
      gananciaNeta,
      barbero_id ? Number(barbero_id) : null,
      metodo_pago || 'Efectivo',
      fecha || new Date().toISOString().split('T')[0],
      notas || ''
    );

    // 3. Registrar automáticamente el ingreso en caja
    db.prepare(`
      INSERT INTO costos (tipo, categoria, descripcion, monto_cop, fecha, metodo_pago, barbero_id, notas)
      VALUES ('ingreso', 'Venta de Productos', ?, ?, ?, ?, ?, ?)
    `).run(
      `Venta: ${qty}x ${producto.nombre}`,
      totalVenta,
      fecha || new Date().toISOString().split('T')[0],
      metodo_pago || 'Efectivo',
      barbero_id ? Number(barbero_id) : null,
      notas || 'Venta registrada en tienda'
    );

    return {
      id: resultVenta.lastInsertRowid,
      totalVenta,
      montoComision,
      gananciaNeta,
      nuevoStock: producto.stock - qty
    };
  });

  try {
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

// Listar historial de ventas de productos
app.get('/api/ventas-productos', (req, res) => {
  const { barbero_id, desde, hasta } = req.query;
  try {
    let sql = `
      SELECT v.*, p.nombre as producto_nombre, p.foto_url as producto_foto, b.nombre as barbero_nombre
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      LEFT JOIN barberos b ON v.barbero_id = b.id
      WHERE 1=1
    `;
    const params = [];
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
// 9. PLANTILLA DE LIQUIDACIÓN Y PAGOS POR PORCENTAJE
// ----------------------------------------------------
// Cálculo previo de comisiones antes de liquidar (acepta % personalizado del dueño)
app.get('/api/liquidaciones/preview', (req, res) => {
  const { barbero_id, fecha_inicio, fecha_fin, porcentaje } = req.query;

  if (!barbero_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'barbero_id, fecha_inicio y fecha_fin son requeridos' });
  }

  try {
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ?').get(barbero_id);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    // Citas completadas en el rango que aún NO han sido liquidadas
    const citas = db.prepare(`
      SELECT c.*, s.nombre as servicio_nombre
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barbero_id = ? 
        AND c.fecha BETWEEN ? AND ? 
        AND c.estado = 'completada'
        AND c.liquidacion_id IS NULL
      ORDER BY c.fecha ASC, c.hora_inicio ASC
    `).all(barbero_id, fecha_inicio, fecha_fin);

    // Ventas de productos realizadas por este barbero sin liquidar
    const ventasProductos = db.prepare(`
      SELECT v.*, p.nombre as producto_nombre
      FROM ventas_productos v
      JOIN productos p ON v.producto_id = p.id
      WHERE v.barbero_id = ? 
        AND v.fecha BETWEEN ? AND ?
        AND v.liquidacion_id IS NULL
      ORDER BY v.fecha ASC
    `).all(barbero_id, fecha_inicio, fecha_fin);

    const totalBrutoServicios = citas.reduce((sum, c) => sum + (c.precio_cobrado || 0), 0);

    // Porcentaje editable por el dueño (si lo escribió, se usa; si no, el del barbero)
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

// Guardar y cerrar la liquidación
app.post('/api/liquidaciones', (req, res) => {
  const { barbero_id, fecha_inicio, fecha_fin, porcentaje_aplicado, deducciones, metodo_pago, notas, citas_ids, ventas_ids } = req.body;

  const arrayCitas = Array.isArray(citas_ids) ? citas_ids : [];
  const arrayVentas = Array.isArray(ventas_ids) ? ventas_ids : [];

  if (!barbero_id || !fecha_inicio || !fecha_fin || (arrayCitas.length === 0 && arrayVentas.length === 0)) {
    return res.status(400).json({ error: 'Faltan datos o no hay servicios ni ventas seleccionadas' });
  }

  const transaction = db.transaction(() => {
    let totalBruto = 0;
    let comisionServicios = 0;
    const pct = Number(porcentaje_aplicado);

    // 1. Obtener y calcular citas si las hay
    if (arrayCitas.length > 0) {
      const placeholders = arrayCitas.map(() => '?').join(',');
      const citas = db.prepare(`SELECT id, precio_cobrado FROM citas WHERE id IN (${placeholders})`).all(...arrayCitas);
      totalBruto = citas.reduce((sum, c) => sum + c.precio_cobrado, 0);
      comisionServicios = Math.round(totalBruto * (pct / 100));
    }

    // 2. Obtener y calcular comisiones por productos
    let comisionProductos = 0;
    if (arrayVentas.length > 0) {
      const placeholdersVentas = arrayVentas.map(() => '?').join(',');
      const ventas = db.prepare(`SELECT id, monto_comision FROM ventas_productos WHERE id IN (${placeholdersVentas})`).all(...arrayVentas);
      comisionProductos = ventas.reduce((sum, v) => sum + v.monto_comision, 0);
    }

    const comisionTotal = comisionServicios + comisionProductos;
    const ded = Number(deducciones) || 0;
    const totalPagado = Math.max(0, comisionTotal - ded);

    // 3. Insertar liquidación
    const stmt = db.prepare(`
      INSERT INTO liquidaciones (
        barbero_id, fecha_inicio, fecha_fin, total_servicios, total_bruto,
        porcentaje_aplicado, monto_comision, deducciones, total_pagado,
        metodo_pago, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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

    // 4. Vincular citas
    if (arrayCitas.length > 0) {
      const placeholders = arrayCitas.map(() => '?').join(',');
      db.prepare(`UPDATE citas SET liquidacion_id = ? WHERE id IN (${placeholders})`).run(liquidacionId, ...arrayCitas);
    }

    // 5. Vincular ventas de productos
    if (arrayVentas.length > 0) {
      const placeholdersV = arrayVentas.map(() => '?').join(',');
      db.prepare(`UPDATE ventas_productos SET liquidacion_id = ? WHERE id IN (${placeholdersV})`).run(liquidacionId, ...arrayVentas);
    }

    return { liquidacionId, totalPagado };
  });

  try {
    const outcome = transaction();
    res.status(201).json({
      success: true,
      id: outcome.liquidacionId,
      message: 'Liquidación registrada y turnos/ventas marcados como pagados'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar historial de liquidaciones
app.get('/api/liquidaciones', (req, res) => {
  const { barbero_id } = req.query;
  try {
    let sql = `
      SELECT l.*, b.nombre as barbero_nombre, b.telefono as barbero_telefono
      FROM liquidaciones l
      JOIN barberos b ON l.barbero_id = b.id
      WHERE 1=1
    `;
    const params = [];
    if (barbero_id) {
      sql += ' AND l.barbero_id = ?';
      params.push(barbero_id);
    }
    sql += ' ORDER BY l.fecha_pago DESC';
    const liquidaciones = db.prepare(sql).all(...params);
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalle de liquidación con sus citas
app.get('/api/liquidaciones/:id', (req, res) => {
  const { id } = req.params;
  try {
    const liquidacion = db.prepare(`
      SELECT l.*, b.nombre as barbero_nombre, b.telefono as barbero_telefono
      FROM liquidaciones l
      JOIN barberos b ON l.barbero_id = b.id
      WHERE l.id = ?
    `).get(id);

    if (!liquidacion) return res.status(404).json({ error: 'Liquidación no encontrada' });

    const citas = db.prepare(`
      SELECT c.*, s.nombre as servicio_nombre
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.liquidacion_id = ?
      ORDER BY c.fecha ASC, c.hora_inicio ASC
    `).all(id);

    res.json({ liquidacion, citas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 9. REPORTE FINANCIERO, BALANCE GENERAL Y DETALLE POR BARBERO
// ----------------------------------------------------
app.get('/api/reportes/balance', (req, res) => {
  const { desde, hasta } = req.query;
  try {
    // 1. Ingresos brutos por citas completadas
    let sqlCitas = `SELECT SUM(precio_cobrado) as total_ingresos, COUNT(*) as cantidad_servicios FROM citas WHERE estado = 'completada'`;
    const paramsCitas = [];
    if (desde && hasta) {
      sqlCitas += ' AND fecha BETWEEN ? AND ?';
      paramsCitas.push(desde, hasta);
    }
    const citasData = db.prepare(sqlCitas).get(...paramsCitas);
    const totalIngresosServicios = citasData.total_ingresos || 0;
    const totalServicios = citasData.cantidad_servicios || 0;

    // 2. Ventas de productos
    let sqlProd = `SELECT SUM(total_venta) as total_ventas, SUM(monto_comision) as total_comisiones, COUNT(*) as count FROM ventas_productos WHERE 1=1`;
    const paramsProd = [];
    if (desde && hasta) {
      sqlProd += ' AND fecha BETWEEN ? AND ?';
      paramsProd.push(desde, hasta);
    }
    const prodData = db.prepare(sqlProd).get(...paramsProd);
    const totalVentasProductos = prodData.total_ventas || 0;

    // 3. Ingresos extras de caja (no provenientes de productos)
    let sqlIngresosExtras = `SELECT SUM(monto_cop) as total FROM costos WHERE tipo = 'ingreso' AND categoria != 'Venta de Productos'`;
    const paramsIngresosExtras = [];
    if (desde && hasta) {
      sqlIngresosExtras += ' AND fecha BETWEEN ? AND ?';
      paramsIngresosExtras.push(desde, hasta);
    }
    const ingresosExtrasData = db.prepare(sqlIngresosExtras).get(...paramsIngresosExtras);
    const totalIngresosExtras = ingresosExtrasData.total || 0;

    // 4. Liquidaciones pagadas a barberos
    let sqlLiq = `SELECT SUM(total_pagado) as total_pagado, SUM(monto_comision) as total_comisiones FROM liquidaciones WHERE 1=1`;
    const paramsLiq = [];
    if (desde && hasta) {
      sqlLiq += ' AND fecha_pago BETWEEN ? AND ?';
      paramsLiq.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
    }
    const liqData = db.prepare(sqlLiq).get(...paramsLiq);
    const totalComisionesPagadas = liqData.total_pagado || liqData.total_comisiones || 0;

    // 5. Gastos y costos operativos (tipo = 'egreso')
    let sqlCostos = `SELECT SUM(monto_cop) as total_gastos FROM costos WHERE tipo = 'egreso'`;
    const paramsCostos = [];
    if (desde && hasta) {
      sqlCostos += ' AND fecha BETWEEN ? AND ?';
      paramsCostos.push(desde, hasta);
    }
    const costosData = db.prepare(sqlCostos).get(...paramsCostos);
    const totalCostosOperativos = costosData.total_gastos || 0;

    // Totales consolidados
    const totalIngresos = totalIngresosServicios + totalVentasProductos + totalIngresosExtras;
    const margenBruto = totalIngresos - totalComisionesPagadas;
    const gananciaNeta = margenBruto - totalCostosOperativos;

    // 6. DESGLOSE INDEPENDIENTE POR CADA BARBERO
    const todosBarberos = db.prepare('SELECT id, nombre, telefono, foto_url, porcentaje_comision, activo FROM barberos ORDER BY id ASC').all();

    const barberosDetalle = todosBarberos.map(b => {
      // Citas completadas de este barbero
      let sqlBCitas = `SELECT COUNT(*) as count, SUM(precio_cobrado) as total FROM citas WHERE barbero_id = ? AND estado = 'completada'`;
      const paramsBCitas = [b.id];
      if (desde && hasta) {
        sqlBCitas += ' AND fecha BETWEEN ? AND ?';
        paramsBCitas.push(desde, hasta);
      }
      const bCitas = db.prepare(sqlBCitas).get(...paramsBCitas);
      const serviciosCount = bCitas.count || 0;
      const totalBrutoServicios = bCitas.total || 0;

      // Ventas de productos por este barbero
      let sqlBProd = `SELECT COUNT(*) as count, SUM(total_venta) as total_venta, SUM(monto_comision) as total_comision FROM ventas_productos WHERE barbero_id = ?`;
      const paramsBProd = [b.id];
      if (desde && hasta) {
        sqlBProd += ' AND fecha BETWEEN ? AND ?';
        paramsBProd.push(desde, hasta);
      }
      const bProd = db.prepare(sqlBProd).get(...paramsBProd);
      const ventasProdCount = bProd.count || 0;
      const totalBrutoProd = bProd.total_venta || 0;
      const comisionProd = bProd.total_comision || 0;

      // Liquidaciones pagadas a este barbero
      let sqlBLiq = `SELECT SUM(total_pagado) as total_pagado, SUM(monto_comision) as total_comision FROM liquidaciones WHERE barbero_id = ?`;
      const paramsBLiq = [b.id];
      if (desde && hasta) {
        sqlBLiq += ' AND fecha_pago BETWEEN ? AND ?';
        paramsBLiq.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
      }
      const bLiq = db.prepare(sqlBLiq).get(...paramsBLiq);
      const totalLiquidado = bLiq.total_pagado || 0;

      // Citas completadas pendientes por liquidar
      let sqlBPend = `SELECT SUM(precio_cobrado) as total_pendiente, COUNT(*) as count_pendiente FROM citas WHERE barbero_id = ? AND estado = 'completada' AND liquidacion_id IS NULL`;
      const paramsBPend = [b.id];
      if (desde && hasta) {
        sqlBPend += ' AND fecha BETWEEN ? AND ?';
        paramsBPend.push(desde, hasta);
      }
      const bPend = db.prepare(sqlBPend).get(...paramsBPend);
      const brutoServiciosPendiente = bPend.total_pendiente || 0;
      const comisionServiciosPendiente = Math.round(brutoServiciosPendiente * ((b.porcentaje_comision || 50) / 100));

      const totalBrutoGenerado = totalBrutoServicios + totalBrutoProd;
      
      // Total asignado al barbero (lo pagado + lo pendiente por pagar)
      const totalGanadoBarbero = totalLiquidado > 0 ? (totalLiquidado + comisionServiciosPendiente) : (comisionServiciosPendiente + comisionProd);
      // Lo que le queda a la barbería generado por este barbero
      const retenidoBarberia = totalBrutoGenerado - totalGanadoBarbero;
      const margenRetenidoPct = totalBrutoGenerado > 0 
        ? Math.round((retenidoBarberia / totalBrutoGenerado) * 100) 
        : Math.round(100 - (b.porcentaje_comision || 50));

      return {
        id: b.id,
        nombre: b.nombre,
        foto_url: b.foto_url,
        telefono: b.telefono,
        porcentaje_comision: b.porcentaje_comision || 50,
        activo: b.activo,
        servicios_realizados: serviciosCount,
        total_bruto_servicios: totalBrutoServicios,
        ventas_productos_count: ventasProdCount,
        total_bruto_productos: totalBrutoProd,
        total_bruto_generado: totalBrutoGenerado,
        total_pagado_liquidaciones: totalLiquidado,
        comisiones_pendientes: comisionServiciosPendiente,
        total_ganado_barbero: totalGanadoBarbero,
        retenido_barberia: retenidoBarberia,
        porcentaje_retenido_barberia: margenRetenidoPct
      };
    });

    res.json({
      total_ingresos: totalIngresos,
      total_ingresos_servicios: totalIngresosServicios,
      total_ventas_productos: totalVentasProductos,
      total_ingresos_extras: totalIngresosExtras,
      total_servicios: totalServicios,
      total_comisiones_pagadas: totalComisionesPagadas,
      total_costos_operativos: totalCostosOperativos,
      margen_barberia: margenBruto,
      ganancia_neta: gananciaNeta,
      barberos_detalle: barberosDetalle
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para estadísticas del simulador de rentabilidad & punto de equilibrio
app.get('/api/reportes/rentabilidad-stats', (req, res) => {
  try {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    // Citas del mes actual
    const citasMes = db.prepare(`
      SELECT COUNT(*) as count, SUM(precio_cobrado) as total 
      FROM citas 
      WHERE estado = 'completada' AND fecha BETWEEN ? AND ?
    `).get(primerDiaMes, ultimoDiaMes);

    // Egresos del mes actual (Costos fijos reales registrados)
    const egresosMes = db.prepare(`
      SELECT SUM(monto_cop) as total 
      FROM costos 
      WHERE tipo = 'egreso' AND fecha BETWEEN ? AND ?
    `).get(primerDiaMes, ultimoDiaMes);

    // Todos los egresos registrados (para promedio mensual en caso de no tener egresos en este mes aún)
    const egresosTotales = db.prepare(`
      SELECT SUM(monto_cop) as total, COUNT(DISTINCT substr(fecha, 1, 7)) as meses_count 
      FROM costos 
      WHERE tipo = 'egreso'
    `).get();

    let costosFijosEstimados = egresosMes.total || 0;
    if (costosFijosEstimados === 0 && egresosTotales.total > 0) {
      const meses = Math.max(1, egresosTotales.meses_count || 1);
      costosFijosEstimados = Math.round(egresosTotales.total / meses);
    }
    if (costosFijosEstimados === 0) {
      costosFijosEstimados = 1200000; // Valor de referencia estándar (arriendo + servicios)
    }

    // Barberos activos y comisiones
    const barberos = db.prepare('SELECT id, nombre, porcentaje_comision FROM barberos WHERE activo = 1').all();
    const totalComision = barberos.reduce((acc, b) => acc + (b.porcentaje_comision || 50), 0);
    const comisionPromedio = barberos.length > 0 ? Math.round(totalComision / barberos.length) : 50;

    // Servicios activos y precio promedio
    const servicios = db.prepare('SELECT precio_cop FROM servicios WHERE activo = 1').all();
    const totalPrecios = servicios.reduce((acc, s) => acc + (s.precio_cop || 0), 0);
    const precioPromedio = servicios.length > 0 ? Math.round(totalPrecios / servicios.length) : 25000;

    res.json({
      mes_actual_inicio: primerDiaMes,
      mes_actual_fin: ultimoDiaMes,
      citas_mes_actual: citasMes.count || 0,
      ingresos_mes_actual: citasMes.total || 0,
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
// 10. GALERÍA MULTIMEDIA & REDES SOCIALES
// ----------------------------------------------------
app.get('/api/multimedia', (req, res) => {
  const todos = req.query.todos === 'true';
  try {
    let sql = `
      SELECT m.*, b.nombre as barbero_nombre 
      FROM galeria_multimedia m
      LEFT JOIN barberos b ON m.barbero_id = b.id
    `;
    if (!todos) {
      sql += ' WHERE m.activo = 1';
    }
    sql += ' ORDER BY m.orden ASC, m.creado_en DESC';

    const items = db.prepare(sql).all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/multimedia', (req, res) => {
  const { titulo, tipo, url_media, url_red_social, descripcion, barbero_id } = req.body;

  if (!titulo || !url_media) {
    return res.status(400).json({ error: 'Título y URL de multimedia o red social son obligatorios' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO galeria_multimedia (titulo, tipo, url_media, url_red_social, descripcion, barbero_id, orden, activo)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1)
    `);
    const result = stmt.run(
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
      WHERE id = ?
    `);
    stmt.run(
      titulo,
      tipo,
      url_media,
      url_red_social,
      descripcion,
      barbero_id !== undefined ? (barbero_id ? Number(barbero_id) : null) : null,
      activo,
      id
    );
    res.json({ success: true, message: 'Publicación actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/multimedia/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM galeria_multimedia WHERE id = ?').run(id);
    res.json({ success: true, message: 'Publicación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 11. AUDITORÍA E HISTORIAL TOTAL DE MOVIMIENTOS
// ----------------------------------------------------
app.get('/api/auditoria', (req, res) => {
  const { tipo, desde, hasta, limite } = req.query;
  try {
    let sql = 'SELECT * FROM auditoria WHERE 1=1';
    const params = [];

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

// Endpoint SSE / Long-Polling para Notificaciones en Vivo de Nuevas Citas
app.get('/api/notificaciones/recientes', (req, res) => {
  try {
    // Últimas citas creadas en las últimas 24 horas
    const recientes = db.prepare(`
      SELECT c.id, c.cliente_nombre, c.fecha, c.hora_inicio, c.creado_en, b.nombre as barbero_nombre, s.nombre as servicio_nombre
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      ORDER BY c.id DESC
      LIMIT 10
    `).all();
    res.json(recientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Soporte para rutas en SPA frontend
if (fs.existsSync(clientDistPath)) {
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de Barbería corriendo en http://localhost:${PORT}`);
});
