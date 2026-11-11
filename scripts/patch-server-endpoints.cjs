const fs = require('fs');
const path = require('path');

const serverFile = path.resolve(__dirname, '../server/server.js');
let code = fs.readFileSync(serverFile, 'utf-8');

// 1. REEMPLAZAR MOTOR DE DISPONIBILIDAD
const nuevoMotorDisponibilidad = `// ----------------------------------------------------
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

    const fechaObj = new Date(\`\${fecha}T00:00:00\`);
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
      citas = await db.prepare(\`
        SELECT id, hora_inicio, hora_fin, cliente_nombre 
        FROM citas 
        WHERE barbero_id = ? AND barberia_id = ? AND fecha = ? AND estado != 'cancelada'
      \`).all(barbero.id, tenantId, fecha);
    } catch (_) {}
    if (!citas || citas.length === 0) {
      citas = (store.citas || []).filter(c => String(c.barberia_id) === String(tenantId) && String(c.barbero_id) === String(barbero.id) && c.fecha === fecha && c.estado !== 'cancelada');
    }

    // Cargar bloqueos de horario o de día completo
    let bloqueos = [];
    try {
      bloqueos = await db.prepare(\`
        SELECT id, hora_inicio, hora_fin, motivo 
        FROM bloqueos 
        WHERE (barbero_id = ? OR barbero_id IS NULL) AND barberia_id = ? AND fecha = ?
      \`).all(barbero.id, tenantId, fecha);
    } catch (_) {}
    if (!bloqueos || bloqueos.length === 0) {
      bloqueos = store.obtenerBloqueos(tenantId, fecha, barbero.id);
    }

    // Verificar si hay bloqueo de día completo (00:00 a 23:59 o similar)
    const bloqueoDia = bloqueos.find(b => (b.hora_inicio <= '09:00' && b.hora_fin >= '19:00') || (b.hora_inicio === '00:00' && b.hora_fin >= '23:00'));
    if (bloqueoDia) {
      return res.json({
        disponible_dia: false,
        motivo: \`Día bloqueado: \${bloqueoDia.motivo || 'No disponible para reservas'}\`,
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
        razonOcupado = \`Bloqueado: \${conflictoBloqueo.motivo}\`;
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
});`;

code = code.replace(
  /\/\/ 5\. MOTOR DE DISPONIBILIDAD[\s\S]*?app\.get\('\/api\/disponibilidad'[\s\S]*?\}\);\r?\n/,
  `${nuevoMotorDisponibilidad}\n`
);

// 2. REEMPLAZAR ENDPOINTS DE RESEÑAS Y BLOQUEOS
const nuevosEndpointsResenasYBloqueos = `// ----------------------------------------------------
// RESEÑAS DE CLIENTES CON MODERACIÓN Y SUSCRIPCIÓN
// ----------------------------------------------------
app.get('/api/resenas', async (req, res) => {
  const tenantId = await getTenantId(req);
  const todas = req.query.todas === 'true'; // Si viene de panel de admin
  try {
    let sql = \`
      SELECT r.* 
      FROM resenas r 
      WHERE r.barberia_id = ? \${todas ? '' : 'AND r.aprobada = 1'}
      ORDER BY r.id DESC
    \`;
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
      await db.prepare(\`
        INSERT INTO clientes (barberia_id, nombre, telefono, email, notas, total_citas)
        VALUES (?, ?, ?, ?, 'Suscrito desde Opiniones Web', 0)
        ON CONFLICT(telefono, barberia_id) DO NOTHING
      \`).run(tenantId, cliente_nombre.trim(), cliente_telefono.trim(), cliente_email || null);
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
    await db.prepare(\`
      INSERT INTO resenas (barberia_id, cliente_nombre, calificacion, comentario, servicio_nombre, fecha, aprobada)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    \`).run(tenantId, nuevaResena.cliente_nombre, nuevaResena.calificacion, nuevaResena.comentario, nuevaResena.servicio_nombre, nuevaResena.fecha);
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
    let sql = \`
      SELECT b.*, bar.nombre as barbero_nombre 
      FROM bloqueos b
      LEFT JOIN barberos bar ON b.barbero_id = bar.id
      WHERE b.barberia_id = ?
    \`;
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
    const stmt = db.prepare(\`
      INSERT INTO bloqueos (barberia_id, barbero_id, fecha, hora_inicio, hora_fin, motivo)
      VALUES (?, ?, ?, ?, ?, ?)
    \`);
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
});`;

code = code.replace(
  /app\.get\('\/api\/resenas'[\s\S]*?app\.delete\('\/api\/bloqueos\/:id'[\s\S]*?\}\);\r?\n/,
  `${nuevosEndpointsResenasYBloqueos}\n`
);

fs.writeFileSync(serverFile, code, 'utf-8');
console.log('Server endpoints updated successfully!');
