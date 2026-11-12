// Configuración predeterminada de la Landing Page de EXAKTA
const DEFAULT_LANDING_CONFIG = {
  general: {
    whatsapp_comercial: '573114220554',
    whatsapp_mensaje_demo: 'Hola EXAKTA, quiero solicitar una demostración y conocer cómo digitalizar mi barbería.',
    demo_slug: 'the-barber-club',
    email_contacto: 'admin@exakta.online'
  },
  hero: {
    badge_superior: '💈 SaaS Multi-Tenant Especializado para Barberías',
    titulo_principal: 'Deja de perder dinero en desorden y comisiones en papel.',
    titulo_resaltado: 'Digitaliza tu barbería en minutos.',
    subtitulo: 'La plataforma todo-en-uno que automatiza tus citas 24/7, liquida a tus barberos en 1 clic con comprobante a WhatsApp y te muestra tu ganancia neta real sin pagar en dólares ni tarifas sorpresa.',
    cta_principal_texto: 'Solicitar Demo por WhatsApp',
    cta_secundario_texto: 'Ver Barbería Demo en Vivo',
    badges_confianza: [
      'Multi-tenant 100% en la Nube',
      '$0 Costo extra por mensajes de WhatsApp',
      'Precios transparentes en Pesos Colombianos ($ COP)',
      'Cero descargas de apps para tus clientes'
    ]
  },
  dolores: [
    {
      id: 'comisiones',
      icono: 'ReceiptText',
      etiqueta: 'Dolor 1: El Caos de las Comisiones',
      dolor_titulo: 'Planillas de papel, calculadora manual y discusiones los sábados',
      dolor_desc: 'Pasar horas sumando recibos arrugados genera desconfianza en los barberos, errores en los porcentajes y pérdidas de dinero.',
      solucion_titulo: 'Liquidación Automática en 1 Clic',
      solucion_desc: 'Cada corte queda registrado. El sistema calcula comisiones al instante (%) y envía el comprobante oficial detallado al WhatsApp personal del barbero.',
      impacto: 'Ahorra más de 4 horas cada fin de semana y elimina discusiones con el equipo.'
    },
    {
      id: 'inasistencias',
      icono: 'CalendarX2',
      etiqueta: 'Dolor 2: Inasistencias (No-Shows)',
      dolor_titulo: 'Clientes que olvidan su cita y dejan sillas vacías perdiendo ingresos',
      dolor_desc: 'Los agendamientos por chat manual se olvidan con facilidad. Un hueco de 45 minutos es dinero que jamás se recupera.',
      solucion_titulo: 'Agenda Online 24/7 + Recordatorios en 1 Toque',
      solucion_desc: 'Tus clientes agendan en tiempo real desde el móvil sin descargar apps. Notificaciones instantáneas y recordatorio directo a WhatsApp.',
      impacto: 'Reduce el ausentismo hasta en un 75% y llena los horarios muertos.'
    },
    {
      id: 'cobros_dolares',
      icono: 'Coins',
      etiqueta: 'Dolor 3: Cobros Abusivos en Dólares',
      dolor_titulo: 'Plataformas extranjeras a US$ 89 - 99/mes y tarifas sorpresa por mensaje',
      dolor_desc: 'WeiBook a US$ 99/mes (~$390.000 COP), BEWE a US$ 89/mes y AgendaPro cobrando paquetes de mensajes de WhatsApp que inflan tu factura.',
      solucion_titulo: 'Tarifa Fija en COP con WhatsApp Nativo Ilimitado',
      solucion_desc: 'Pagas una suscripción justa en Pesos Colombianos ($ COP) sin comisiones por reserva y sin pagar ni un solo peso extra por mensajes de WhatsApp.',
      impacto: 'Ahorras hasta un 60% mensual comparado con softwares extranjeros.'
    },
    {
      id: 'caja_ciega',
      icono: 'TrendingDown',
      etiqueta: 'Dolor 4: Caja Ciega y Descontrol',
      dolor_titulo: 'Facturas todo el día pero no sabes cuánto dinero queda limpio al final del mes',
      dolor_desc: 'Ingresan pagos en efectivo y transferencias, pero entre arriendo, productos y servicios no tienes claridad del beneficio neto.',
      solucion_titulo: 'Control de Egresos y Rentabilidad Neta en Tiempo Real',
      solucion_desc: 'Módulo de caja diaria, categorización de egresos y balance instantáneo que te muestra la utilidad neta real de tu negocio.',
      impacto: 'Decisiones financieras con números exactos en lugar de intuiciones.'
    }
  ],
  flujo: [
    {
      paso: '01',
      titulo: 'El Cliente Reserva Online',
      desc: 'Accede a tu enlace exclusivo (ej. exakta.online/b/tu-barberia) desde su celular. Elige barbero, servicio, fecha y hora sin descargar nada.'
    },
    {
      paso: '02',
      titulo: 'El Barbero Recibe el Turno',
      desc: 'El barbero visualiza su agenda del día en su portal móvil exclusivo, sin ver las cuentas globales de la barbería.'
    },
    {
      paso: '03',
      titulo: 'Servicio & Galería de Estilos',
      desc: 'Atención impecable. Puedes consultar la galería multimedia para inspirar al cliente con los mejores cortes de tu estudio.'
    },
    {
      paso: '04',
      titulo: 'Cobro, Caja y Liquidación en 1 Clic',
      desc: 'Al terminar la jornada o quincena, el dueño liquida comisiones con un clic y envía el comprobante a WhatsApp con total transparencia.'
    }
  ],
  comparativa: {
    titulo: '¿Por qué las barberías eligen EXAKTA?',
    subtitulo: 'Comparativa transparente frente a los softwares del mercado',
    criterios: [
      {
        nombre: 'Moneda de Cobro',
        exakta: 'Pesos Colombianos ($ COP)',
        weibook: 'Dólares (US$ 99/mes)',
        bewe: 'Dólares (US$ 89/mes)',
        agendapro: 'COP Alto ($350k - $510k)',
        aionclock: 'Pesos ($29.900/mes)'
      },
      {
        nombre: 'Costo por Mensajes de WhatsApp',
        exakta: '$0 COP (Incluido / Ilimitado)',
        weibook: 'Cobro extra o limitado',
        bewe: 'Consumo por créditos IA',
        agendapro: 'Cobro por paquetes de SMS/WA',
        aionclock: 'Básico'
      },
      {
        nombre: 'Liquidación Automática de Comisiones %',
        exakta: 'Sí, con comprobante a WhatsApp',
        weibook: 'Complejo de configurar',
        bewe: 'Intermedio',
        agendapro: 'Sí, con curvas de aprendizaje altas',
        aionclock: 'No disponible'
      },
      {
        nombre: 'Portal Móvil Independiente para Barberos',
        exakta: 'Sí, vista limpia y privada',
        weibook: 'App pesada requerida',
        bewe: 'App requerida',
        agendapro: 'App requerida',
        aionclock: 'No disponible'
      },
      {
        nombre: 'Multi-Tenant Real (Link propio /b/tu-nombre)',
        exakta: 'Sí, marca propia y colores',
        weibook: 'Subdominio',
        bewe: 'Genérico',
        agendapro: 'Directorio compartido',
        aionclock: 'Genérico'
      },
      {
        nombre: 'Control de Egresos y Rentabilidad Neta',
        exakta: 'Sí, integrado en la caja',
        weibook: 'Módulo costoso',
        bewe: 'Módulo avanzado',
        agendapro: 'Solo en planes superiores',
        aionclock: 'No disponible'
      },
      {
        nombre: 'Cliente no descarga apps',
        exakta: '100% Web Móvil ultra-rápida',
        weibook: 'Parcial',
        bewe: 'Parcial',
        agendapro: 'Web/App',
        aionclock: 'Web'
      }
    ]
  },
  planes: [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      precio_cop: 80000,
      periodo: 'mes',
      descripcion: 'Para barberos independientes o estudios pequeños que quieren ordenar su agenda.',
      caracteristicas: [
        'Hasta 2 Barberos activos',
        'Agenda Online 24/7 sin límites',
        'Enlace personalizado de tu barbería',
        'Recordatorios de citas directos a WhatsApp',
        'Soporte técnico por WhatsApp'
      ],
      destacado: false,
      badge: 'Para Empezar'
    },
    {
      id: 'pro',
      nombre: 'Plan Profesional',
      precio_cop: 180000,
      periodo: 'mes',
      descripcion: 'El preferido por barberías en crecimiento con equipo y alto flujo de clientes.',
      caracteristicas: [
        'Hasta 6 Barberos activos',
        'Portal móvil independiente para cada barbero',
        'Liquidación automática de comisiones (%)',
        'Envío de comprobante oficial a WhatsApp',
        'Control diario de gastos y egresos',
        'Cálculo de rentabilidad neta',
        'Soporte prioritario'
      ],
      destacado: true,
      badge: 'Más Elegido'
    },
    {
      id: 'vip',
      nombre: 'Plan VIP Ilimitado',
      precio_cop: 320000,
      periodo: 'mes',
      descripcion: 'Para estudios premium y cadenas de barberías que buscan control total sin restricciones.',
      caracteristicas: [
        'Barberos ilimitados',
        'Módulo completo de comisiones y caja',
        'Galería multimedia de estilos y cortes',
        'Auditoría y registro de eventos en vivo',
        'Módulo de fidelización de clientes',
        'Personalización total de colores y marca',
        'Acompañamiento VIP 1 a 1'
      ],
      destacado: false,
      badge: 'Sin Límites'
    }
  ],
  testimonios: [
    {
      nombre: 'Carlos Mario Ospina',
      rol: 'Dueño de The Barber Club (Bogotá)',
      texto: 'Antes perdía los domingos sumando cuentas en cuadernos y los barberos siempre tenían dudas de las comisiones. Con EXAKTA liquido a los 5 barberos en 2 minutos y les llega el recibo directo a su WhatsApp. Cero discusiones.',
      estrellas: 5
    },
    {
      nombre: 'Manuel Miranda',
      rol: 'Fundador de Vice Barber',
      texto: 'Estuve a punto de pagar una plataforma en dólares de 90 dólares al mes. EXAKTA me da lo mismo y mejor, en pesos colombianos y sin cobrarme nada por WhatsApp. Mis clientes aman agendar desde el enlace de Instagram.',
      estrellas: 5
    },
    {
      nombre: 'Hellen Aiza',
      rol: 'Administradora de BIP Barber Club',
      texto: 'Las inasistencias eran un dolor de cabeza enorme. Desde que pusimos el agendamiento de EXAKTA los clientes confirman y el barbero sabe exactamente quién llega a cada hora en su celular.',
      estrellas: 5
    }
  ],
  faqs: [
    {
      pregunta: '¿Mis clientes tienen que descargar alguna aplicación para agendar?',
      respuesta: 'No. Tus clientes simplemente tocan el enlace de tu barbería (en tu Instagram, WhatsApp o código QR en el local) y en 20 segundos eligen su corte y barbero desde cualquier navegador sin instalar nada.'
    },
    {
      pregunta: '¿Cobran por cada mensaje de WhatsApp que se envíe?',
      respuesta: 'No. A diferencia de otras plataformas que te cobran paquetes de mensajes o créditos extra, EXAKTA utiliza integración nativa de WhatsApp con $0 costo adicional.'
    },
    {
      pregunta: '¿Puedo cambiar las tarifas de mis planes o la información de la landing?',
      respuesta: 'Sí. Todo el contenido, precios, números de contacto y textos son 100% editables en tiempo real desde el SuperAdmin de EXAKTA sin tocar una sola línea de código.'
    },
    {
      pregunta: '¿Cómo funciona la liquidación de comisiones para los barberos?',
      respuesta: 'Tú defines el porcentaje que gana cada barbero (ej. 50%, 60%). A medida que realizan servicios, el sistema acumula el valor y con un solo clic generas la liquidación y le envías el desglose exacto a su WhatsApp.'
    },
    {
      pregunta: '¿Qué formas de pago aceptan?',
      respuesta: 'Aceptamos transferencias Bancolombia, Nequi, Daviplata y pagos digitales en Pesos Colombianos ($ COP).'
    }
  ]
};

module.exports = { DEFAULT_LANDING_CONFIG };
