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
    telefono: '3001234567',
    direccion: 'Calle 100 # 15-20, Bogotá',
    plan: 'vip',
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
    pin_admin: '1234',
    activo: 1,
    total_barberos: 3,
    total_citas: 0
  }
];

const DEFAULT_BARBEROS = [
  { id: 1, barberia_id: 1, nombre: 'Carlos "El Patrón"', especialidad: 'Degradados & Barbas', telefono: '3001112233', email: 'carlos@thebarberclub.com', password: '123', activo: 1, foto_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300', porcentaje_comision: 50 },
  { id: 2, barberia_id: 1, nombre: 'Mateo Fade', especialidad: 'Cortes Clásicos & Diseños', telefono: '3002223344', email: 'mateo@thebarberclub.com', password: '123', activo: 1, foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', porcentaje_comision: 50 },
  { id: 3, barberia_id: 1, nombre: 'Andrés Tijeras', especialidad: 'Tratamientos Capilares & Barba VIP', telefono: '3003334455', email: 'andres@thebarberclub.com', password: '123', activo: 1, foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', porcentaje_comision: 50 }
];

const DEFAULT_SERVICIOS = [
  { id: 1, barberia_id: 1, nombre: 'Corte Clásico / Fade', precio_cop: 25000, duracion_minutos: 30, activo: 1, descripcion: 'Corte con degradado, perfilado de patillas y lavado exprés' },
  { id: 2, barberia_id: 1, nombre: 'Arreglo de Barba & Toalla Caliente', precio_cop: 18000, duracion_minutos: 20, activo: 1, descripcion: 'Perfilado con navaja, toalla caliente y aceites hidratantes' },
  { id: 3, barberia_id: 1, nombre: 'Combo VIP: Corte + Barba + Mascarilla', precio_cop: 40000, duracion_minutos: 50, activo: 1, descripcion: 'Servicio completo con exfoliación y masaje capilar' }
];

class StoreManager {
  constructor() {
    this.barberias = [...DEFAULT_BARBERIAS];
    this.barberos = [...DEFAULT_BARBEROS];
    this.servicios = [...DEFAULT_SERVICIOS];
    this.citas = [];
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
    // Si ya existe por slug, actualizarla
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
        porcentaje_comision: 50
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
      this.guardarEnDisco();
      return eliminada;
    }
    return null;
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
}

const store = new StoreManager();
module.exports = store;
