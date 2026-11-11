const fs = require('fs');
const path = require('path');

const STORE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'exakta_store.json')
  : path.resolve(__dirname, 'exakta_store.json');

const DEFAULT_BARBERIAS = [
  {
    id: 1,
    slug: 'the-barber-club',
    nombre: 'The Barber Club',
    eslogan: 'Cortes clásicos y modernos con estilo profesional',
    logo_url: '',
    color_primario: '#2563eb',
    color_secundario: '#1e293b',
    email: 'admin@thebarberclub.com',
    telefono: '3001234567',
    direccion: 'Calle 100 # 15-20, Bogotá',
    plan: 'vip',
    precio_mensual_cop: 320000,
    modulos_activos: {
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
    },
    pin_admin: 'BarberClub2026*',
    activo: 1,
    total_barberos: 3,
    total_citas: 0
  },
  {
    id: 1794434400000,
    slug: 'bip-barber-clib',
    nombre: 'BIP BARBER CLUB',
    eslogan: 'Tu estilo en las mejores manos',
    logo_url: '',
    color_primario: '#2563eb',
    color_secundario: '#1e293b',
    telefono: '3000000000',
    email: 'hellenaiza@gmail.com',
    direccion: 'Sede Principal',
    plan: 'pro',
    precio_mensual_cop: 180000,
    modulos_activos: {
      agenda: true,
      max_barberos: 5,
      portal_barberos: true,
      liquidaciones: true,
      costos: true,
      notificaciones_audio: true,
      productos: true,
      rentabilidad: true,
      galeria: true,
      auditoria: true,
      fidelizacion_clientes: true
    },
    pin_admin: 'Vipadmin#1',
    activo: 1,
    total_barberos: 1,
    total_citas: 0
  }
];

const DEFAULT_BARBEROS = [
  { 
    id: 1, 
    barberia_id: 1, 
    nombre: 'Carlos "El Patrón"', 
    especialidad: 'Degradados & Barbas', 
    telefono: '3001112233', 
    email: 'carlos@thebarberclub.com', 
    password: 'Carlos2026*', 
    activo: 1, 
    foto_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300', 
    porcentaje_comision: 50,
    horario_inicio: '09:00',
    horario_fin: '20:00',
    dias_laborales: '1,2,3,4,5,6'
  },
  { 
    id: 2, 
    barberia_id: 1, 
    nombre: 'Mateo Fade', 
    especialidad: 'Cortes Clásicos & Diseños', 
    telefono: '3002223344', 
    email: 'mateo@thebarberclub.com', 
    password: 'Mateo2026*', 
    activo: 1, 
    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', 
    porcentaje_comision: 50,
    horario_inicio: '10:00',
    horario_fin: '19:00',
    dias_laborales: '1,2,3,4,5,6'
  },
  { 
    id: 3, 
    barberia_id: 1, 
    nombre: 'Andrés Tijeras', 
    especialidad: 'Tratamientos Capilares & Barba VIP', 
    telefono: '3003334455', 
    email: 'andres@thebarberclub.com', 
    password: 'Andres2026*', 
    activo: 1, 
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', 
    porcentaje_comision: 50,
    horario_inicio: '09:00',
    horario_fin: '20:00',
    dias_laborales: '1,2,3,4,5,6,7'
  },
  {
    id: 1794434400001,
    barberia_id: 1794434400000,
    nombre: 'Barbero Principal',
    especialidad: 'Estilos Generales & Barba',
    telefono: '3000000000',
    email: 'hellenaiza@gmail.com',
    password: 'Vipadmin#1',
    activo: 1,
    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    porcentaje_comision: 50,
    horario_inicio: '09:00',
    horario_fin: '20:00',
    dias_laborales: '1,2,3,4,5,6'
  }
];

const DEFAULT_SERVICIOS = [
  { id: 1, barberia_id: 1, nombre: 'Corte Clásico / Fade', precio_cop: 25000, duracion_minutos: 30, activo: 1, descripcion: 'Corte con degradado, perfilado de patillas y lavado exprés' },
  { id: 2, barberia_id: 1, nombre: 'Arreglo de Barba & Toalla Caliente', precio_cop: 18000, duracion_minutos: 20, activo: 1, descripcion: 'Perfilado con navaja, toalla caliente y aceites hidratantes' },
  { id: 3, barberia_id: 1, nombre: 'Combo VIP: Corte + Barba + Mascarilla', precio_cop: 40000, duracion_minutos: 50, activo: 1, descripcion: 'Servicio completo con exfoliación y masaje capilar' },
  { id: 1794434400010, barberia_id: 1794434400000, nombre: 'Corte Clásico / Fade', precio_cop: 25000, duracion_minutos: 45, activo: 1, descripcion: 'Corte tradicional de cabello con tijera y máquina.' },
  { id: 1794434400011, barberia_id: 1794434400000, nombre: 'Corte y Barba Completa', precio_cop: 35000, duracion_minutos: 60, activo: 1, descripcion: 'Perfilado de barba con toalla caliente y corte.' }
];

const DEFAULT_RESENAS = [
  {
    id: 101,
    barberia_id: 1,
    cliente_nombre: 'Alejandro Giraldo',
    calificacion: 5,
    comentario: '¡Excelente servicio! Carlos me hizo el mejor degradado que he tenido, y la atención con bebida y música es de 10 estrellas.',
    servicio_nombre: 'Corte Clásico / Fade',
    fecha: '2026-11-08',
    aprobada: 1
  },
  {
    id: 102,
    barberia_id: 1,
    cliente_nombre: 'David Morales',
    calificacion: 5,
    comentario: 'Puntuales, pulcros y el arreglo de barba con navaja caliente es una experiencia premium. Muy recomendado.',
    servicio_nombre: 'Arreglo de Barba VIP',
    fecha: '2026-11-05',
    aprobada: 1
  },
  {
    id: 103,
    barberia_id: 1,
    cliente_nombre: 'Camilo Torres',
    calificacion: 4,
    comentario: 'Gran ambiente y barberos muy capacitados. La reserva por la app fue súper rápida y sin filas.',
    servicio_nombre: 'Combo Corte + Barba',
    fecha: '2026-11-04',
    aprobada: 1
  }
];

class StoreManager {
  constructor() {
    this.barberias = [...DEFAULT_BARBERIAS];
    this.barberos = [...DEFAULT_BARBEROS];
    this.servicios = [...DEFAULT_SERVICIOS];
    this.citas = [];
    this.bloqueos = [];
    this.resenas = [...DEFAULT_RESENAS];
    this.notificaciones_superadmin = [];
    this.configuracion = {};
    this.cargarDesdeDisco();
  }

  cargarDesdeDisco() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.barberias) && parsed.barberias.length > 0) {
          this.barberias = parsed.barberias;
        }
        if (Array.isArray(parsed.barberos)) {
          this.barberos = parsed.barberos;
        }
        if (Array.isArray(parsed.servicios)) {
          this.servicios = parsed.servicios;
        }
        if (Array.isArray(parsed.citas)) {
          this.citas = parsed.citas;
        }
        if (Array.isArray(parsed.bloqueos)) {
          this.bloqueos = parsed.bloqueos;
        }
        if (Array.isArray(parsed.resenas)) {
          this.resenas = parsed.resenas;
        }
        if (Array.isArray(parsed.notificaciones_superadmin)) {
          this.notificaciones_superadmin = parsed.notificaciones_superadmin;
        }
        if (parsed.configuracion && typeof parsed.configuracion === 'object') {
          this.configuracion = parsed.configuracion;
        }
      }
    } catch (err) {
      console.warn('Advertencia cargando store:', err.message);
    }
  }

  guardarEnDisco() {
    try {
      const data = {
        barberias: this.barberias,
        barberos: this.barberos,
        servicios: this.servicios,
        citas: this.citas,
        bloqueos: this.bloqueos,
        resenas: this.resenas,
        notificaciones_superadmin: this.notificaciones_superadmin,
        configuracion: this.configuracion,
        actualizado: new Date().toISOString()
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Advertencia guardando store:', err.message);
    }
  }

  obtenerBarberiaPorSlug(slug) {
    if (!slug) return null;
    const clean = String(slug).trim().toLowerCase();
    return this.barberias.find(b => b.slug.toLowerCase() === clean) || null;
  }

  obtenerBarberiaPorId(id) {
    if (!id) return null;
    return this.barberias.find(b => String(b.id) === String(id)) || null;
  }

  agregarBarberia(nuevaBarberia) {
    const idx = this.barberias.findIndex(b => b.slug === nuevaBarberia.slug);
    if (idx >= 0) {
      this.barberias[idx] = { ...this.barberias[idx], ...nuevaBarberia };
    } else {
      this.barberias.unshift(nuevaBarberia);
    }

    // Asegurar que tenga al menos un barbero propio si no tiene
    const tieneBarberos = this.barberos.some(b => String(b.barberia_id) === String(nuevaBarberia.id));
    if (!tieneBarberos) {
      this.barberos.push({
        id: Date.now() + 1,
        barberia_id: nuevaBarberia.id,
        nombre: 'Barbero Principal',
        especialidad: 'Estilos Generales & Barba',
        telefono: nuevaBarberia.telefono || '',
        email: `contacto@${nuevaBarberia.slug}.com`,
        password: '123',
        activo: 1,
        foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        porcentaje_comision: 50,
        horario_inicio: '09:00',
        horario_fin: '20:00',
        dias_laborales: '1,2,3,4,5,6'
      });
    }

    // Asegurar que tenga al menos servicios propios si no tiene
    const tieneServicios = this.servicios.some(s => String(s.barberia_id) === String(nuevaBarberia.id));
    if (!tieneServicios) {
      this.servicios.push(
        { id: Date.now() + 10, barberia_id: nuevaBarberia.id, nombre: 'Corte Tradicional', precio_cop: 25000, duracion_minutos: 35, activo: 1, descripcion: 'Corte a máquina y tijera con peinado' },
        { id: Date.now() + 11, barberia_id: nuevaBarberia.id, nombre: 'Arreglo de Barba', precio_cop: 18000, duracion_minutos: 25, activo: 1, descripcion: 'Perfilado de barba con toalla caliente' }
      );
    }

    this.guardarEnDisco();
    return nuevaBarberia;
  }

  actualizarBarberia(id, datos) {
    const idx = this.barberias.findIndex(b => String(b.id) === String(id));
    if (idx >= 0) {
      this.barberias[idx] = { ...this.barberias[idx], ...datos };
      this.guardarEnDisco();
      return this.barberias[idx];
    }
    return null;
  }

  eliminarBarberia(id) {
    const idx = this.barberias.findIndex(b => String(b.id) === String(id));
    if (idx >= 0) {
      const eliminada = this.barberias.splice(idx, 1)[0];
      this.barberos = this.barberos.filter(b => String(b.barberia_id) !== String(id));
      this.servicios = this.servicios.filter(s => String(s.barberia_id) !== String(id));
      this.bloqueos = this.bloqueos.filter(b => String(b.barberia_id) !== String(id));
      this.resenas = this.resenas.filter(r => String(r.barberia_id) !== String(id));
      this.guardarEnDisco();
      return eliminada;
    }
    return null;
  }

  agregarBarbero(nuevoBarbero) {
    if (!this.barberos) this.barberos = [];
    const idx = this.barberos.findIndex(b => String(b.id) === String(nuevoBarbero.id));
    if (idx >= 0) {
      this.barberos[idx] = { ...this.barberos[idx], ...nuevoBarbero };
    } else {
      this.barberos.push(nuevoBarbero);
    }
    this.guardarEnDisco();
  }

  obtenerBarberos(barberiaId, soloActivos = true) {
    return this.barberos.filter(b => {
      const match = String(b.barberia_id) === String(barberiaId);
      return soloActivos ? (match && b.activo === 1) : match;
    });
  }

  obtenerServicios(barberiaId, soloActivos = true) {
    return this.servicios.filter(s => {
      const match = String(s.barberia_id) === String(barberiaId);
      return soloActivos ? (match && s.activo === 1) : match;
    });
  }

  obtenerBloqueos(barberiaId, fecha, barberoId) {
    return this.bloqueos.filter(b => {
      if (String(b.barberia_id) !== String(barberiaId)) return false;
      if (fecha && b.fecha !== fecha) return false;
      if (barberoId && b.barbero_id && String(b.barbero_id) !== String(barberoId)) return false;
      return true;
    });
  }

  agregarBloqueo(bloqueo) {
    const nuevo = { id: Date.now(), ...bloqueo };
    this.bloqueos.unshift(nuevo);
    this.guardarEnDisco();
    return nuevo;
  }

  eliminarBloqueo(id, barberiaId) {
    const idx = this.bloqueos.findIndex(b => String(b.id) === String(id) && String(b.barberia_id) === String(barberiaId));
    if (idx !== -1) {
      const el = this.bloqueos.splice(idx, 1)[0];
      this.guardarEnDisco();
      return el;
    }
    return null;
  }

  obtenerResenas(barberiaId, todas = false) {
    return this.resenas.filter(r => {
      if (String(r.barberia_id) !== String(barberiaId)) return false;
      if (!todas) {
        return r.aprobada === 1 || r.aprobada === true;
      }
      return true;
    });
  }

  agregarResena(resena) {
    const nueva = { id: Date.now(), fecha: new Date().toISOString().split('T')[0], aprobada: 0, ...resena };
    this.resenas.unshift(nueva);
    this.guardarEnDisco();
    return nueva;
  }

  actualizarResena(id, barberiaId, datos) {
    const r = this.resenas.find(item => String(item.id) === String(id) && String(item.barberia_id) === String(barberiaId));
    if (r) {
      Object.assign(r, datos);
      this.guardarEnDisco();
      return r;
    }
    return null;
  }

  eliminarResena(id, barberiaId) {
    const idx = this.resenas.findIndex(r => String(r.id) === String(id) && String(r.barberia_id) === String(barberiaId));
    if (idx !== -1) {
      const el = this.resenas.splice(idx, 1)[0];
      this.guardarEnDisco();
      return el;
    }
    return null;
  }

  agregarNotificacionSuperAdmin(notif) {
    const item = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      leida: false,
      ...notif
    };
    this.notificaciones_superadmin.unshift(item);
    if (this.notificaciones_superadmin.length > 50) {
      this.notificaciones_superadmin = this.notificaciones_superadmin.slice(0, 50);
    }
    this.guardarEnDisco();
    return item;
  }

  obtenerNotificacionesSuperAdmin() {
    return this.notificaciones_superadmin;
  }

  marcarNotificacionLeida(id) {
    const notif = this.notificaciones_superadmin.find(n => String(n.id) === String(id));
    if (notif) {
      notif.leida = true;
      this.guardarEnDisco();
      return notif;
    }
    return null;
  }

  obtenerConfiguracion(clave, fallback = null) {
    if (!this.configuracion) this.configuracion = {};
    return this.configuracion[clave] !== undefined ? this.configuracion[clave] : fallback;
  }

  guardarConfiguracion(clave, valor) {
    if (!this.configuracion) this.configuracion = {};
    this.configuracion[clave] = valor;
    this.guardarEnDisco();
  }
}

const store = new StoreManager();
module.exports = store;
