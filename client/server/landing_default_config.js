// Configuración predeterminada de la Landing Page de EXAKTA (Multi-Nicho Belleza y Bienestar)
const DEFAULT_LANDING_CONFIG = {
  general: {
    whatsapp_comercial: '573114220554',
    whatsapp_mensaje_demo: 'Hola EXAKTA, quiero solicitar una demostración y conocer cómo digitalizar mi negocio de belleza/bienestar.',
    demo_slug: 'the-barber-club',
    email_contacto: 'admin@exakta.online'
  },
  hero: {
    badge_superior: '💈 💇‍♀️ 💆 💅 Plataforma Todo-en-Uno para Negocios de Belleza & Bienestar',
    titulo_principal: 'Llena tus citas en días flojos y liquida a tu equipo',
    titulo_resaltado: 'en 1 solo clic y sin enredos.',
    subtitulo: 'La solución hecha en Colombia para Barberías, Salones de Belleza, Spas y Estudios de Uñas/Estética: reservas online 24/7 sin descargar apps, tirilla digital con QR y control de comisiones en pesos colombianos ($ COP).',
    cta_principal_texto: 'Hablar con un Asesor por WhatsApp',
    cta_secundario_texto: 'Ver Demostración en Vivo',
    badges_confianza: [
      'Barberías, Salones, Spas & Estética',
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
      dolor_titulo: 'Planillas de papel, calculadora manual y discusiones con el equipo',
      dolor_desc: 'Sumar cuentas a mano de manicuristas, estilistas, terapeutas o barberos genera errores en porcentajes, desconfianza y horas perdidas cada fin de semana.',
      solucion_titulo: 'Liquidación Automática por Colaborador en 1 Clic',
      solucion_desc: 'Cada servicio queda registrado. El sistema calcula comisiones al instante (%) más ventas de productos y propinas, enviando el comprobante oficial al WhatsApp privado del profesional.',
      impacto: 'Ahorra más de 4 horas cada fin de semana y elimina fricciones con tu equipo.'
    },
    {
      id: 'inasistencias',
      icono: 'CalendarX2',
      etiqueta: 'Dolor 2: Inasistencias y Sillas Vacías (No-Shows)',
      dolor_titulo: 'Clientes que olvidan su turno y dejan cabinas o puestos sin facturar',
      dolor_desc: 'Agendar por chats dispersos hace que el cliente lo olvide. Una cabina de spa o puesto de peluquería vacío de 1 hora es dinero que jamás se recupera.',
      solucion_titulo: 'Agenda Web 24/7 + Recordatorios Automáticos en 1 Toque',
      solucion_desc: 'Tus clientes agendan en tiempo real desde Instagram o WhatsApp sin descargar aplicaciones. Confirmaciones instantáneas y recordatorio directo a su celular.',
      impacto: 'Reduce el ausentismo hasta en un 80% y llena los horarios muertos.'
    },
    {
      id: 'cobros_dolares',
      icono: 'Coins',
      etiqueta: 'Dolor 3: Softwares Extranjeros en Dólares',
      dolor_titulo: 'Pagar US$ 89 - 99/mes y tarifas sorpresa por cada mensaje de WhatsApp',
      dolor_desc: 'Plataformas extranjeras que cobran mensualidades en dólares (~$390.000 COP) más paquetes adicionales de mensajes que encarecen tu operación.',
      solucion_titulo: 'Tarifa Fija en Pesos ($ COP) con WhatsApp Nativo Ilimitado',
      solucion_desc: 'Pagas una suscripción justa y transparente en Pesos Colombianos, sin comisiones por reserva y sin pagar ni un solo peso extra por mensajes de WhatsApp.',
      impacto: 'Ahorras entre el 40% y 60% mensual frente a softwares internacionales.'
    },
    {
      id: 'caja_ciega',
      icono: 'TrendingDown',
      etiqueta: 'Dolor 4: Caja Ciega y Descontrol de Gastos',
      dolor_titulo: 'Entra plata todo el día pero a fin de mes no sabes cuánto quedó libre',
      dolor_desc: 'Entre tintes, productos, arriendo, servicios públicos y pagos diarios, la mayoría de dueños no tienen certeza de su verdadera ganancia neta.',
      solucion_titulo: 'Control de Egresos y Rentabilidad Neta en Tiempo Real',
      solucion_desc: 'Registro rápido de gastos diarios, categorización de insumos y balance automático que te muestra con precisión matemática la plata limpia de tu negocio.',
      impacto: 'Decisiones financieras con números exactos en lugar de intuiciones.'
    }
  ],
  flujo: [
    {
      paso: '01',
      titulo: 'El Cliente Reserva Online',
      desc: 'Accede a tu enlace exclusivo (ej. exakta.online/b/tu-negocio) desde su celular. Elige profesional, servicio, fecha y hora sin descargar nada.'
    },
    {
      paso: '02',
      titulo: 'El Profesional Recibe su Cita',
      desc: 'El estilista, terapeuta o barbero ve en su portal móvil privado sus turnos asignados del día, sin ver la facturación global del local.'
    },
    {
      paso: '03',
      titulo: 'Servicio & Ficha Técnica',
      desc: 'Atención impecable. Puedes consultar la fórmula previa del cliente (tinte, tipo de piel, números de máquina o estilo de uñas).'
    },
    {
      paso: '04',
      titulo: 'Tirilla POS y Liquidación en 1 Clic',
      desc: 'Genera el recibo digital con código QR para el cliente y liquida las comisiones del equipo con total transparencia a su WhatsApp.'
    }
  ],
  comparativa: {
    titulo: '¿Por qué los negocios de belleza eligen EXAKTA?',
    subtitulo: 'Comparativa transparente frente a los softwares tradicionales',
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
        agendapro: 'Curva de aprendizaje alta',
        aionclock: 'No disponible'
      },
      {
        nombre: 'Portal Móvil para Colaboradores',
        exakta: 'Sí, vista privada por profesional',
        weibook: 'App pesada requerida',
        bewe: 'App requerida',
        agendapro: 'App requerida',
        aionclock: 'No disponible'
      },
      {
        nombre: 'Ficha Técnica CRM (Fórmulas / Estilos)',
        exakta: 'Sí, historial visual por cliente',
        weibook: 'Limitado',
        bewe: 'Módulo costoso',
        agendapro: 'Básico',
        aionclock: 'No disponible'
      },
      {
        nombre: 'Multi-Tenant (Enlace Propio /b/tu-marca)',
        exakta: 'Sí, marca propia y colores',
        weibook: 'Subdominio',
        bewe: 'Genérico',
        agendapro: 'Directorio compartido',
        aionclock: 'Genérico'
      },
      {
        nombre: 'Cliente no descarga apps',
        exakta: '100% Web Móvil en 20 segundos',
        weibook: 'Parcial',
        bewe: 'Parcial',
        agendapro: 'Web/App',
        aionclock: 'Web'
      }
    ]
  ],
  planes: [
    {
      id: 'basico',
      nombre: 'Plan Emprendedor',
      precio_cop: 80000,
      periodo: 'mes',
      descripcion: 'Para profesionales independientes, estudios de 1 a 2 puestos o cabinas que quieren ordenar sus citas.',
      caracteristicas: [
        'Hasta 2 Profesionales / Colaboradores activos',
        'Agenda Online 24/7 sin límites',
        'Enlace personalizado de tu marca',
        'Recordatorios de citas directos a WhatsApp',
        'Soporte técnico por WhatsApp'
      ],
      destacado: false,
      badge: 'Para Empezar'
    },
    {
      id: 'pro',
      nombre: 'Plan Profesional Pro',
      precio_cop: 180000,
      periodo: 'mes',
      descripcion: 'El preferido por salones, barberías y spas con equipo de trabajo y alto flujo diario de clientes.',
      caracteristicas: [
        'Hasta 6 Profesionales activos',
        '⭐️ Google Reviews Flex (Más reseñas 5 estrellas en Maps)',
        '🧾 Tirilla Digital & Recibo POS con código QR',
        '✂️ Ficha Técnica y fórmulas personalizadas de clientes',
        'Portal móvil independiente para cada colaborador',
        'Liquidación automática de comisiones (%) en 1 clic',
        'Control diario de gastos y cálculo de dinero limpio'
      ],
      destacado: true,
      badge: 'Más Elegido'
    },
    {
      id: 'vip',
      nombre: 'Plan VIP Ilimitado',
      precio_cop: 320000,
      periodo: 'mes',
      descripcion: 'Para centros de estética, spas grandes y cadenas que buscan control total sin restricciones.',
      caracteristicas: [
        'Colaboradores y cabinas ilimitadas',
        '💳 Tarjeta Digital VIP con sellos móviles para clientes',
        '🤖 Asistente de Reactivación para llenar días flojos',
        'Galería de fotos y catálogo de servicios',
        'Auditoría y registro de eventos en vivo',
        'Módulo de fidelización y métricas de rentabilidad',
        'Acompañamiento VIP prioritario 1 a 1'
      ],
      destacado: false,
      badge: 'Sin Límites'
    }
  ],
  testimonios: [
    {
      nombre: 'Carlos Mario Ospina',
      rol: 'Dueño de The Barber Club (Bogotá)',
      nicho: 'barberia',
      texto: 'Antes perdía los domingos sumando cuentas en cuadernos y los barberos siempre tenían dudas de las comisiones. Con EXAKTA liquido a los 5 barberos en 2 minutos y les llega el recibo directo a su WhatsApp. Cero discusiones.',
      estrellas: 5
    },
    {
      nombre: 'Camila Restrepo',
      rol: 'Directora de Glow Salón & Colorimetría (Medellín)',
      nicho: 'salon',
      texto: 'Manejar 8 estilistas y manicuristas con comisiones diferentes era una pesadilla. Con EXAKTA calculo tintes, productos y porcentajes en segundos. Además la ficha técnica guarda la fórmula exacta del balayage de cada clienta.',
      estrellas: 5
    },
    {
      nombre: 'Dra. Paola Benítez',
      rol: 'Fundadora de Satori Spa & Masajes (Cali)',
      nicho: 'spa',
      texto: 'Teníamos muchas inasistencias en masajes corporales y cabinas vacías los martes. Los recordatorios a WhatsApp redujeron el ausentismo y el semáforo inteligente nos llena los días flojos con promociones automáticas.',
      estrellas: 5
    }
  ],
  faqs: [
    {
      pregunta: '¿Sirve para barberías, salones de belleza, spas y centros de uñas?',
      respuesta: 'Sí, totalmente. EXAKTA fue diseñado para cualquier negocio de belleza y bienestar que maneje agenda por turnos, colaboradores con comisiones y control de caja diaria.'
    },
    {
      pregunta: '¿Mis clientes tienen que descargar alguna aplicación para agendar?',
      respuesta: 'No. Tus clientes simplemente tocan el enlace de tu negocio (en Instagram, WhatsApp o código QR en el mostrador) y en 20 segundos eligen profesional, servicio y hora desde cualquier celular sin descargar nada.'
    },
    {
      pregunta: '¿Cobran por cada mensaje de WhatsApp que se envíe?',
      respuesta: 'No. A diferencia de otras plataformas que te cobran paquetes de mensajes o créditos extra, EXAKTA utiliza integración nativa de WhatsApp con $0 costo adicional.'
    },
    {
      pregunta: '¿Mis colaboradores pueden ver la caja y facturación total del negocio?',
      respuesta: 'No. Cada estilista, terapeuta o barbero tiene su portal móvil exclusivo donde solo ve sus propios turnos y su acumulado personal de comisiones. La caja general y los egresos son 100% privados para ti como dueño.'
    },
    {
      pregunta: '¿Cómo funciona la liquidación automática de comisiones?',
      respuesta: 'Tú defines el porcentaje que gana cada profesional (ej. 50%, 60%). A medida que atienden clientes y venden productos, el sistema acumula todo. Con un solo clic generas la liquidación y le envías el comprobante oficial detallado a su WhatsApp.'
    },
    {
      pregunta: '¿Qué formas de pago aceptan?',
      respuesta: 'Aceptamos transferencias Bancolombia, Nequi, Daviplata y pagos digitales en Pesos Colombianos ($ COP).'
    }
  ]
};

module.exports = { DEFAULT_LANDING_CONFIG };
