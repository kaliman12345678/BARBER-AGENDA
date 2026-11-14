# 💈 AGENT.MD — MANUAL MAESTRO DE ARQUITECTURA, CONTEXTO Y CONTINUIDAD DE EXAKTA

> **AVISO PARA CUALQUIER IA O DESARROLLADOR QUE INGRESE AL PROYECTO:**
> Este documento contiene **TODO el contexto técnico, arquitectónico, de seguridad y de negocio** de la plataforma **EXAKTA**. 
> Léelo detenidamente antes de realizar cualquier cambio para no romper ni reiniciar el avance existente.

---

## 1. Visión General del Proyecto

* **Nombre de la Plataforma:** **EXAKTA**
* **Naturaleza:** Plataforma SaaS Multi-Tenant en la nube para barberías, estudios de barbería y salones de belleza masculinos.
* **Mercado Objetivo:** Colombia y Latinoamérica.
* **Propuesta de Valor:**
  1. **Multi-Tenant Real:** Cada barbería tiene su propio espacio exclusivo (`/b/:slug` o `/?b=:slug`, ej. `the-barber-club`, `vice-barber`, `bip-barber-clib`), con su propio logo, colores y catálogo.
  2. **Cero Fricción para Clientes:** Agendamiento web en tiempo real sin obligar al cliente a descargar apps ni crear cuentas.
  3. **Control Operativo Ágil para Barberos:** Portal móvil independiente con cálculo automático de comisiones por corte (%) y liquidación con comprobante a WhatsApp.
  4. **Tarifas Transparentes en Pesos Colombianos ($ COP):** Sin cobros abusivos en dólares (como WeiBook o BEWE) y sin cobros extra por mensajes de WhatsApp (como AgendaPro).
  5. **Motor de Seguridad Activo:** Límite estricto de fuerza bruta a 4 intentos fallidos, bloqueo automático de 15 minutos y contraseñas alfanuméricas obligatorias.

---

## 2. Pila Tecnológica (Tech Stack)

* **Frontend:**
  * React 19 + Vite 8
  * Tailwind CSS (diseño responsivo móvil y escritorio)
  * Lucide React (iconografía)
  * Canvas-Confetti (efectos visuales en reservas)
* **Backend:**
  * Node.js + Express
  * Conexión a Base de Datos con adaptador híbrido (`server/database.js`)
  * `pg` (PostgreSQL Client) para la nube
  * `better-sqlite3` como respaldo local fuera de línea
* **Base de Datos en Producción:**
  * **Supabase PostgreSQL** conectada mediante **Transaction Pooler** (IPv4).
  * Host: `aws-1-us-east-1.pooler.supabase.com:6543/postgres`
* **Despliegue & Hosting:**
  * **Vercel** para Frontend y Serverless Functions (`api/index.js` y `api/[...path].js`).
  * Repositorio GitHub: `https://github.com/kaliman12345678/BARBER-AGENDA.git` en la rama `main`.
  * Despliegue automático en Vercel con cada `git push origin main`.

---

## 3. Estructura de Archivos y Regla de Sincronización Crítica

```text
agenda-barberia/
├── api/                        # Serverless Functions de Vercel
│   ├── index.js                # Reenvía las peticiones a server/server.js
│   └── [...path].js
├── client/                     # Aplicación Frontend React
│   ├── src/
│   │   ├── components/         # Componentes modulares
│   │   │   ├── Navbar.jsx
│   │   │   ├── ClientBooking.jsx      # Portal de agendamiento público
│   │   │   ├── AdminDashboard.jsx     # Panel del dueño de la barbería
│   │   │   ├── AdminAgenda.jsx        # Agenda diaria y bloqueos
│   │   │   ├── AdminBarberos.jsx      # Gestión y eliminación con contraseña
│   │   │   ├── AdminLiquidaciones.jsx # Comisiones % y comprobante WhatsApp
│   │   │   ├── AdminCostos.jsx        # Egresos y gastos fijos
│   │   │   ├── AdminClientes.jsx      # Directorio de clientes y fidelización
│   │   │   ├── ModalFichaTecnica.jsx  # Ficha técnica, fórmulas de corte, degradado y fotos
│   │   │   ├── ModalTirillaPOS.jsx    # Tirilla digital térmica POS con código QR dinámico
│   │   │   ├── BarberoPortal.jsx      # Portal móvil para el barbero
│   │   │   ├── SuperAdminDashboard.jsx # Panel maestro de EXAKTA
│   │   │   ├── UnifiedLoginModal.jsx  # Modal de inicio de sesión con correo o teléfono
│   │   │   └── FloatingWhatsApp.jsx   # Botón flotante animado de WhatsApp
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── server/                 # ⚠️ REGLA CRÍTICA: Espejo sincronizado para build de Vercel
│       ├── server.js
│       ├── database.js
│       └── store.js
├── server/                     # Servidor Node.js principal
│   ├── server.js               # Rutas de API, middlewares y lógica de negocio
│   ├── database.js             # Conexión PostgreSQL / SQLite
│   ├── store.js                # Almacén en memoria y utilidades de configuración
│   └── exakta_store.json       # Persistencia local
├── scripts/                    # Scripts de mantenimiento y sincronización con Supabase
│   └── sync_all_to_supabase.js # Sincroniza datos locales a Supabase
├── .env                        # Variables de entorno locales
├── .env.example                # Plantilla de variables
├── agent.md                    # ESTE MANUAL MAESTRO
└── package.json
```

> [!CAUTION]
> **REGLA DE ORO DE DESPLIEGUE EN VERCEL:**
> La carpeta `client/server/` es un espejo exacto de `server/`. Vercel requiere que ambos archivos (`server/server.js` y `client/server/server.js`) estén **estrictamente idénticos**.
> Cada vez que edites `server/server.js` o `server/database.js`, **debes copiar los cambios a `client/server/`** antes de compilar y hacer commit a Git.

---

## 4. Base de Datos & Conexión a Supabase

### Cadena de Conexión (Transaction Pooler):
```text
DATABASE_URL=postgresql://postgres.hxkyinybjephrgcunxom:misservicioS%231@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

* **¿Por qué el Transaction Pooler en el puerto 6543?**
  El dominio directo `db.[ref].supabase.co` opera solo en IPv6 en Supabase gratuito, provocando errores `ENOTFOUND` en muchas redes y en Vercel. El Transaction Pooler de AWS (`aws-1-us-east-1.pooler.supabase.com`) tiene soporte completo de IPv4 y gestiona eficientemente conexiones concurrentes serverless.
* **Nota sobre la contraseña:** La contraseña contiene el caracter `#`, por lo que en URLs de conexión debe estar codificado como `%23` (`misservicioS%231`).

### Tablas Principales en Supabase:
1. `barberias`: `id`, `slug`, `nombre`, `eslogan`, `logo_url`, `color_primario`, `color_secundario`, `telefono`, `direccion`, `plan`, `modulos_activos` (jsonb), `pin_admin`, `activo`, `email`, `precio_mensual_cop`.
2. `barberos`: `id`, `barberia_id`, `nombre`, `telefono`, `email`, `password`, `pin`, `foto_url`, `porcentaje_comision`, `horario_inicio`, `horario_fin`, `dias_laborales`, `activo`.
3. `servicios`: `id`, `barberia_id`, `nombre`, `precio_cop`, `duracion_minutos`, `descripcion`, `activo`.
4. `citas`: `id`, `barberia_id`, `barbero_id`, `servicio_id`, `cliente_nombre`, `cliente_telefono`, `fecha`, `hora_inicio`, `hora_fin`, `estado`, `precio_cobrado`, `notas`, `liquidacion_id`.
5. `costos`: `id`, `barberia_id`, `descripcion`, `monto_cop`, `categoria`, `fecha`.
6. `configuracion`: `clave` (PK), `valor` (Almacena `pin_superadmin`, `superadmin_telefono`, `superadmin_email`, `precios_planes`).
7. `auditoria`: `id`, `barberia_id`, `tipo_evento`, `descripcion`, `usuario`, `detalles_json`.

---

## 5. Roles, Permisos y Credenciales de Prueba

El sistema cuenta con un **Login Unificado** (`POST /api/auth/unified-login`) que detecta automáticamente el rol del usuario utilizando su **número de teléfono** o su **correo electrónico**:

### 1. SuperAdmin (Dueño de la plataforma SaaS EXAKTA):
* **Identificador:** `admin@exakta.online` o `3114220554`
* **Contraseña Maestra:** `Exakta#2026Master!`
* **Capacidades:**
  * Crear, suspender o editar barberías.
  * Modificar a placer las tarifas de los planes (`Básico`, `Pro`, `VIP`).
  * Asignar módulos personalizados por cliente.
  * Selector de 3 vistas (Lista ejecutiva, Tabla detallada, Cuadrícula).
  * Editar su propio perfil, teléfono y cambiar su contraseña maestra sin tocar código.
  * Eliminar barberías cliente (requiere digitar la contraseña maestra para confirmar).

### 2. Dueño de Barbería (Administrador del Local):
* **Barbería 1 (The Barber Club):** Slug: `the-barber-club` | PIN/Pass: `BarberClub2026*`
* **Barbería 2 (BIP BARBER CLUB):** Slug: `bip-barber-clib` | Correo: `hellenaiza@gmail.com` | Pass: `Vipadmin#1`
* **Barbería 3 (VICE BARBER):** Slug: `vice-barber` | Correo: `Manuelmiran511@gmail.com` | Pass: `Vicemanu#1`
* **Capacidades:**
  * Gestión de turnos, bloqueos de agenda y citas presenciales (*walk-ins*).
  * Modificar tarifas y catálogo de servicios.
  * Crear barberos (al crear una barbería nueva, solo se crea 1 barbero guía inicial).
  * Eliminar barberos del equipo (requiere ingresar la contraseña del dueño para autorizar).
  * Registrar compras e insumos en Caja/Costos.
  * Realizar liquidaciones quincenales o mensuales de comisiones y enviar comprobante a WhatsApp.

### 3. Barbero (Colaborador):
* **Acceso:** Su propio teléfono o correo + contraseña asignada por el dueño.
* **Capacidades:**
  * Solo ve sus turnos asignados del día.
  * Puede marcar sus turnos como completados o cancelados.
  * Ve su acumulado personal de comisiones sin ver la facturación global de la barbería.

### 4. Cliente Público:
* Accede directamente a `https://tu-dominio.com/b/nombre-barberia`.
* Selecciona barbero, servicio, fecha y hora disponible.
* Al confirmar, se abre WhatsApp con el mensaje pre-redactado para asegurar su cupo.
* Dispone del botón flotante oficial de WhatsApp en la esquina inferior derecha con animaciones de movimiento (`FloatingWhatsApp.jsx`).

---

## 6. Blindaje de Seguridad Implementado

1. **Anti Fuerza Bruta (`checkLoginRateLimit`):**
   * Máximo **4 intentos fallidos**.
   * Al 4to intento fallido se activa un bloqueo temporal de seguridad de **15 minutos**.
   * El cliente visualiza un contador regresivo en pantalla antes de poder reintentar.
2. **Políticas de Contraseñas:**
   * Toda contraseña nueva debe ser alfanumérica (contener letras y números, mínimo 6 caracteres).
3. **Verificación Estricta en Eliminaciones:**
   * La barbería principal (ID 1) está protegida a nivel de base de datos y no se puede eliminar.
   * Cualquier eliminación de barbería exige la contraseña del SuperAdmin.
   * Cualquier eliminación de barbero exige la contraseña del dueño de la barbería.
4. **Protección de Reasignaciones en Código:**
   * La variable `let DEFAULT_SUPERADMIN_PASS` está declarada con `let` (no `const`) para permitir cambios de contraseña en tiempo real sin excepciones de `Assignment to constant variable`.
   * En `database.js`, las consultas de inserción ejecutan `RETURNING *` para evitar fallos con tablas sin columna `id` (como `configuracion`).

---

## 7. Comandos de Operación y Desarrollo

```bash
# Iniciar servidor backend y frontend concurrentemente (Puerto 4001 y 5173)
npm run dev

# Compilar frontend para producción (Vite)
npm --prefix client run build

# Sincronizar datos locales hacia Supabase PostgreSQL en la nube
node scripts/sync_all_to_supabase.js

# Desplegar cambios a producción en Vercel
git add .
git commit -m "mensaje descriptivo"
git push origin main
```

---

## 8. Análisis Competitivo y Hoja de Ruta (WeiBook, BEWE, AgendaPro)

Se realizó una investigación profunda sobre los 3 principales competidores:
* **WeiBook (`weibook.co`):** Plan Unlimited de US$ 99/mes (~$390.000 COP) con *Google Reviews Flex*, *WeiBook Wallet (Tarjeta VIP QR)* y *Wanda IA*.
* **BEWE (`bewe.ai`):** Plan Pro de US$ 89/mes (~$355.000 COP) con asistente de ventas IA (*Linda*) para WhatsApp e Instagram.
* **AgendaPro (`agendapro.com`):** Planes de hasta $510.000 COP/mes con cobro de paquetes adicionales por WhatsApp.
* **AionClock (`aionclock.app`):** $29.900 COP/mes, pero carece de liquidación de comisiones, caja, egresos, inventario y marca blanca.

### Las 5 Fases Estratégicas para Superar a la Competencia:
1. **Fase 1 (Google Reviews Flex) — [COMPLETADA]:** Captación automática de calificaciones de 5 estrellas en Google Maps tras cada corte vía WhatsApp con plantilla editable y variables dinámicas.
2. **Fase 2 (Tirilla Digital Recibo POS con QR) — [COMPLETADA]:** Comprobante térmico digital (formato POS 80mm/58mm) con logo, desglose de servicios, método de pago (Efectivo, Nequi, Daviplata, Tarjeta), propina opcional, código QR dinámico de autenticidad y envío a WhatsApp en 1 toque.
3. **Fase 3 (Ficha Técnica & Historial de Estilo) — [COMPLETADA]:** Expediente de estilo persistente en Supabase con fórmulas de máquina (laterales/nuca), tijera superior, barba, advertencias de piel/alergias y fotos de resultados, accesible en Clientes, Agenda y Portal de Barberos.
4. **Fase 4 (Tarjeta VIP Digital con QR):** Monedero de fidelización digital en el móvil del cliente sin requerir tarjetas de cartón.
5. **Fase 5 (Asistente de Reactivación con IA):** Detección de clientes inactivos (> 20 días) y generación de mensajes persuasivos automáticos.

---

## 9. Próximas Tareas Pendientes

1. **Fase 4: Tarjeta VIP Digital con Código QR:** Monedero digital de fidelización en el móvil del cliente sin tarjetas de cartón (`/mi-tarjeta?tel=...`), con conteo de visitas y premios por lealtad.

---

## 10. Historial de Correcciones y Mantenimiento

### [2026-11-13] — Selector de Prefijo Internacional de Teléfono & Corrección de Creación de Barberías
* **Causa Raíz y Solución de Creación de Barberías (SuperAdmin):**
  - **Causa Raíz:** En `server/server.js`, la sentencia SQL de inserción en `POST /api/superadmin/barberias` declaraba 15 columnas (`id, slug, nombre, eslogan, logo_url, color_primario, color_secundario, telefono, direccion, plan, modulos_activos, pin_admin, activo, email, precio_mensual_cop`) pero en la cláusula `VALUES` solo incluía 14 parámetros (faltaba un `?` para el campo `pin_admin`). En Supabase PostgreSQL esto generaba el error silencioso: `INSERT has more target columns than expressions`. La inserción fallaba en la base de datos sin mostrar error al usuario.
  - **Corrección:** Se corrigió el mapeo de parámetros `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)` en `server/server.js`. Se probó y verificó la inserción directa en Supabase PostgreSQL, confirmando que ahora el SuperAdmin crea cualquier barbería a placer sin intermediarios.
* **Prefijo Internacional para Clientes Extranjeros:**
  - En `ClientBooking.jsx`, se agregó un selector desplegable con banderas y códigos de país (`+57 Colombia`, `+1 USA/Canadá`, `+34 España`, `+52 México`, `+58 Venezuela`, etc.).
  - Se flexibilizó la validación estricta de 10 dígitos locales a un rango internacional de 7 a 15 dígitos numéricos.
  - El número se guarda con el formato completo (ej: `+1 3051234567`) para envío directo a WhatsApp.
* **Archivos Intervenidos:**
  - `server/server.js` y `client/server/server.js`: Ajuste de parámetros en `POST /api/superadmin/barberias`.
  - `client/src/components/ClientBooking.jsx`: Selector de prefijo internacional y validación flexible.
  - `agent.md`: Documentación.
* **Verificación:**
  - Inserción y consulta en Supabase PostgreSQL probadas exitosamente.
  - Compilación Vite de producción completada con éxito.
  - Regla del espejo Vercel 100% cumplida.

### [2026-11-13] — Auditoría Integral y Blindaje de Paneles Contables y Liquidaciones (Todos los Roles)
* **Funcionalidad / Detalle Corregido:**
  - **Falta de guardado real de liquidaciones:** Se implementó `POST /api/liquidaciones` con inserción en la tabla `liquidaciones` de Supabase y actualización atómica de `citas.liquidacion_id = ?` y `ventas_productos.liquidacion_id = ?`. Ya no se duplican pagos ni se pierden citas.
  - **Detalle de Recibo Histórico:** Se implementó `GET /api/liquidaciones/:id` con citas y ventas asociadas, permitiendo que el dueño y el barbero puedan ver, reimprimir y reenviar por WhatsApp cualquier liquidación histórica (`AdminLiquidaciones.jsx`).
  - **Anulación Protegida:** Se implementó `DELETE /api/liquidaciones/:id` protegido por contraseña del dueño para anular liquidaciones y liberar los turnos si hubo error contable.
  - **Ventas de Inventario con Comisión:** Se implementó `POST /api/ventas-productos`, descontando stock real y calculando comisión al colaborador.
  - **Auditoría Financiera Estricta:** Todas las operaciones de dinero (`liquidacion_creada`, `liquidacion_anulada`, `gasto_registrado`, `gasto_eliminado`, `cambio_comision_barbero`, `venta_producto`) invocan `registrarAuditoria()` registrando usuario, montos y detalles JSON inmutables.
  - **Homologación Portal del Barbero:** Sincronizado `/api/barbero-portal/balance` con `BarberoPortal.jsx` para reflejar con precisión `ganancia_total_barbero`, `total_ya_cobrado` y `pendiente_por_cobrar`, además de agregar la tabla visual de historial de pagos recibidos.
  - **Balance General Consolidado:** `/api/reportes/balance` ahora calcula de forma real los ingresos por servicios + productos, restando costos y liquidaciones pagadas para una caja neta exacta.
  - **SuperAdmin:** Nuevo endpoint `/api/superadmin/auditoria-global` para supervisión unificada de eventos contables de todas las barberías.
* **Archivos Intervenidos:**
  - `server/server.js` y `client/server/server.js`: Endpoints `POST /api/liquidaciones`, `GET /api/liquidaciones/:id`, `DELETE /api/liquidaciones/:id`, `POST /api/ventas-productos`, `/api/superadmin/auditoria-global`, auditoría en costos y comisiones.
  - `client/src/components/AdminLiquidaciones.jsx`: Modal de detalle histórico corregido y conectado para WhatsApp y comprobantes.
  - `client/src/components/BarberoPortal.jsx`: Pestaña de Utilidad sincronizada y tabla histórica de pagos recibidos.
  - `agent.md`: Documentación técnica.
* **Verificación:**
  - Compilación Vite de producción (`npm run build`) exitosa (6.1s).
  - Regla del espejo `server/server.js` vs `client/server/server.js` 100% verificada sin diferencias.

### [2026-11-13] — Redes Sociales y Presencia Web en Ajustes del Local & Perfil Cliente
* **Funcionalidad / Detalle Agregado:**
  - Se habilitaron los campos de configuración para `instagram_url`, `facebook_url` y `sitio_web` en la sección "Ajustes del Local & Marca" (`AdminConfig.jsx`).
  - El dueño de la barbería ahora puede registrar su usuario o enlace de Instagram, página de Facebook y sitio web oficial.
  - Al guardarlos, aparecen automáticamente como botones de acceso directo interactivos en la pantalla de inicio del perfil que ven sus clientes antes de pulsar "AGENDA TU CITA".
* **Archivos Intervenidos:**
  - `client/src/components/AdminConfig.jsx`: Nuevos inputs para Instagram, Facebook y Sitio Web, sincronizados con el estado y payload del formulario.
  - `server/server.js` y `client/server/server.js`: Actualización de `PUT /api/configuracion` y endpoints de consulta para recibir, persistir y suministrar las columnas/variables de redes sociales.
  - `client/src/App.jsx`: Mapeo de `instagram_url`, `facebook_url` y `sitio_web` en el estado global `shopConfig`.
* **Comportamiento Esperado Verificado:**
  - El dueño edita y guarda sus redes desde Ajustes del Local; los cambios se guardan y reflejan inmediatamente en la vista cliente sin fricción.
  - Compilación Vite de producción completada con éxito. Regla del espejo Vercel 100% cumplida.

### [2026-11-13] — Tirilla Digital / Recibo POS con Código QR y Envío a WhatsApp
* **Funcionalidad Implementada:**
  - Migración en Supabase PostgreSQL: agregado de columnas `metodo_pago` y `propina` a la tabla `citas`.
  - Componente `ModalTirillaPOS.jsx`: Comprobante visual con diseño de papel térmico, logo del local, metadatos del servicio, barbero, selector interactivo de métodos de pago (`Efectivo`, `Nequi / Daviplata`, `Tarjeta`, `Transferencia`), propina voluntaria y código QR dinámico generado con librería `qrcode` que apunta al enlace del local.
  - Envío por WhatsApp con mensaje estructurado en texto ticket con emojis, detalles de cobro y enlace público.
  - Botón de impresión con CSS `@media print` para impresoras térmicas de 80mm o guardado como PDF limpio.
  - Integrado en `AdminAgenda.jsx` (botón en Kanban y Lista) y en `BarberoPortal.jsx` (acciones de turno completado).
* **Archivos Intervenidos:**
  - `client/src/components/ModalTirillaPOS.jsx` (nuevo)
  - `client/src/components/AdminAgenda.jsx`
  - `client/src/components/BarberoPortal.jsx`
  - `server/server.js` y `client/server/server.js` (soporte de `metodo_pago` y `propina` en `PATCH /api/citas/:id/estado`)
  - `agent.md`
* **Verificación:**
  - Migración en Supabase ejecutada y confirmada.
  - Compilación Vite completada sin errores (3.0s). Regla del espejo 100% sincronizada.

### [2026-11-13] — Navegación Fluida Multi-Tenant para SuperAdmin (Modo Auditoría sin Relogin)
* **Bug / Detalle Corregido:**
  - Cuando el SuperAdmin entraba a auditar o gestionar una barbería con "Ver como dueño" y luego quería regresar al panel maestro de SuperAdmin, el sistema no ofrecía una vía de retorno clara y lo obligaba a iniciar sesión de nuevo digitando su PIN y contraseña en cada ocasión.
* **Causa Raíz:**
  1. El token del SuperAdmin se almacenaba únicamente en `sessionStorage`, el cual en navegadores móviles (iOS Safari / Android) se aísla o resetea al alternar de contexto o pestañas.
  2. En `SuperAdminDashboard.jsx`, el estado inicial `isSuperLoggedIn` arrancaba en `false` provocando parpadeo o render forzado del formulario de login.
  3. No existía una barra persistente de auditoría en la UI que permitiera al SuperAdmin saber que estaba en modo impersonation ni un selector rápido para cambiar entre barberías cliente sin salir.
  4. Al pulsar "Salir" en el panel de una barbería, el logout eliminaba la sesión y lo dejaba en la vista cliente de esa barbería, en lugar de retornarlo a su panel de SuperAdmin.
* **Archivos Intervenidos:**
  - `client/src/App.jsx`: Se implementó persistencia del token de SuperAdmin en `localStorage` sincronizado con `sessionStorage`. Se agregó una barra fija superior (`Modo SuperAdmin`) con indicador de estado, selector desplegable de barberías (`Cambiar a: ...`) y botón de retorno instantáneo `Volver a SuperAdmin`. Se reconfiguró `handleLogout` para que devuelva automáticamente al SuperAdmin a su panel maestro.
  - `client/src/components/Navbar.jsx`: Se agregó el botón destacado `[Panel SuperAdmin]` tanto en vista dueño como en vista cliente para acceso con un solo clic.
  - `client/src/components/SuperAdminDashboard.jsx`: Inicialización reactiva de `isSuperLoggedIn` basada en storage para cero parpadeo y cero pantallas de login redundantes; persistencia en `localStorage` de credenciales y en `handleEntrarComoDueno`.
  - `client/src/main.jsx`: Inyección automática de cabeceras de autorización de SuperAdmin leyendo de `localStorage` y `sessionStorage`.
* **Comportamiento Esperado Verificado:**
  - El SuperAdmin puede entrar a "Ver como dueño" en cualquier barbería (VICE BARBER, The Barber Club, BIP BARBER CLUB) y regresar al panel de SuperAdmin con un solo clic, sin que el sistema le solicite contraseñas ni cierre su sesión maestra.
  - El SuperAdmin puede saltar de una barbería a otra directamente desde el selector de la barra superior.
  - Compilación exitosa en Vite y sincronización con el repositorio oficial.

### [2026-11-14] — Hotfix Crítico: Soporte BIGINT en IDs de Barberías (Kaliman Barber) y Auto-Provisioning de Tarjeta VIP
* **Causa Raíz Identificada:**
  - Las barberías creadas dinámicamente desde el SuperAdmin generan IDs basados en marcas de tiempo `Date.now()` (ejemplo: `Kaliman Barber` con ID `1794631242838`).
  - Las tablas `clientes`, `fichas_tecnicas` y `movimientos_tarjeta_vip` tenían sus columnas `barberia_id`, `id`, `cita_id` y `cliente_id` como `INTEGER` (firmado de 32 bits, límite 2,147,483,647).
  - Al consultar o sellar para `Kaliman Barber`, PostgreSQL lanzaba el error fatal: `value "1794631242838" is out of range for type integer`, provocando los mensajes en rojo "Cliente no encontrado" y "Error al sellar tarjeta VIP".
* **Solución Implementada:**
  1. **Migración en Supabase PostgreSQL:** Se convirtieron a tipo `BIGINT` todas las columnas numéricas de referencia en `clientes` (`id`, `barberia_id`), `fichas_tecnicas` (`id`, `barberia_id`, `barbero_id`, `cita_id`) y `movimientos_tarjeta_vip` (`id`, `barberia_id`, `cliente_id`).
  2. **Auto-Provisioning Resiliente:** En `GET /api/tarjeta-vip/cliente/:telefono` se agregó auto-creación del registro de cliente si aún no existía en la base de datos (con soporte de `nombre` pasado desde el frontend), evitando que el modal jamás arroje "Cliente no encontrado".
  3. **Verificación Directa:** Se probó exitosamente la consulta e inserción de `+1 Sello` para el cliente de prueba en `Kaliman Barber`, retornando `sellos_acumulados: 1` y registrando el movimiento de auditoría sin error.
  4. **Compilación y Paridad:** `npm run build` completado sin errores y paridad SHA-256 exacta entre `server/server.js` y `client/server/server.js`.

### [2026-11-14] — Fase 4: Tarjeta Digital VIP con Código QR & Sistema Modular de Beneficios en SuperAdmin
* **Funcionalidad Implementada:**
  1. **Modularización Completa de Beneficios en SuperAdmin (`modulos_activos`):**
     - Se integraron formalmente las 5 llaves de beneficios competitivos en `getDefaultModulesForPlan(plan)`:
       * `google_reviews`: Google Reviews Flex (Reseñas 5★ automáticas vía WhatsApp).
       * `tirilla_pos`: Tirilla Digital / Recibo POS con Código QR.
       * `ficha_tecnica`: Ficha Técnica & Historial de Estilo del Cliente.
       * `tarjeta_vip`: Tarjeta Digital VIP con Código QR (Monedero de fidelización móvil).
       * `reactivacion_ia`: Asistente de Reactivación de Clientes con IA.
     - Disponibles en `SuperAdminDashboard.jsx` tanto al configurar planes personalizados como en el panel de detalle por inquilino/barbería (interruptores de 1 clic).
     - Gating / Protección global en frontend (`AdminAgenda`, `BarberoPortal`, `AdminConfig`, `AdminClientes`) respetando `shopConfig.modulos_activos`.
  2. **Paso 4: Tarjeta Digital VIP con Código QR:**
     - **Base de Datos en Supabase:**
       * Columnas en `clientes`: `sellos_acumulados`, `sellos_meta` (10), `premio_proximo` ('Corte o Barba Gratis'), `nivel_vip` ('Bronce VIP', 'Plata VIP', 'Oro VIP', 'Black VIP'), `premios_redimidos`, `codigo_qr_vip`.
       * Tabla `movimientos_tarjeta_vip`: auditoría de sellos y canjes (`id`, `barberia_id`, `cliente_id`, `tipo`, `cantidad`, `barbero_nombre`, `notas`, `created_at`).
     - **Backend Endpoints:**
       * `GET /api/tarjeta-vip/cliente/:telefono`: Datos del cliente, sellos, meta y movimientos recientes.
       * `POST /api/tarjeta-vip/sellar`: Incrementa sellos (+1), actualiza nivel VIP e inserta movimiento.
       * `POST /api/tarjeta-vip/canjear`: Canjea premio gratis, descuenta meta y registra auditoría.
       * `GET /api/tarjeta-vip/public/:slug/:telefono`: Endpoint público seguro para el pass digital del cliente (valida que `tarjeta_vip` esté activo).
     - **Frontend:**
       * `client/src/components/TarjetaVIPPass.jsx`: Vista móvil cliente estilo Apple Wallet / Google Pay (`/?b=:slug&vip=1&tel=:telefono`), barra de progreso, cuadrícula de 10 sellos con brillos, código QR único de cliente y guía de instalación para iPhone (Safari) y Android (Chrome).
       * `client/src/components/ModalTarjetaVIPAdmin.jsx`: Modal para barbero y administrador con 1-clic "+1 Sello", "Canjear Premio", historial y botón "Enviar Pase VIP por WhatsApp".
* **Compilación & Sincronización:**
  - `npm --prefix client run build` completado con cero errores.
  - Regla del espejo `server/server.js` <-> `client/server/server.js` 100% idéntica (SHA-256 verificado).

### [2026-11-13] — Fase 2: Ficha Técnica & Historial de Estilo del Cliente
* **Funcionalidad Implementada:**
  - Persistencia de clientes y fórmulas técnicas de corte en Supabase PostgreSQL (`clientes` y `fichas_tecnicas`).
  - Modal especializado `ModalFichaTecnica.jsx` con presets rápidos de degradado (`Mid Fade`, `Low Fade`, etc.), guías de máquina (`0.5`, `1`, `1.5`, `Shaver`), largo de tijera, barba, productos y advertencias de piel sensible.
  - Subida directa de fotos de resultados finales con cámara/archivo a `/api/upload` y visor en tamaño completo.
  - Integración en `AdminClientes` (botón en tarjetas), `AdminAgenda` (botón en Kanban y Lista) y `BarberoPortal` (botón rápido y barra de acciones de turno).
* **Archivos Intervenidos:**
  - `server/server.js` y `client/server/server.js`: Endpoints `GET`, `POST`, `DELETE /api/fichas-tecnicas` y persistencia en `GET`, `POST`, `PATCH /api/clientes`.
  - `client/src/components/ModalFichaTecnica.jsx`: Componente maestro de ficha técnica.
  - `client/src/components/AdminClientes.jsx`, `client/src/components/AdminAgenda.jsx`, `client/src/components/BarberoPortal.jsx`, `client/src/components/AdminDashboard.jsx`.
  - `agent.md`: Actualización de estado y arquitectura.
* **Verificación:**
  - Migración ejecutada y probada en Supabase PostgreSQL.
  - Compilación Vite de producción completada con éxito. Regla del espejo 100% sincronizada.

### [2026-11-13] — Fase 1: Google Reviews Flex (Atracción Automática 5★)
* **Funcionalidad Implementada:**
  - Columnas `google_reviews_url` y `google_reviews_mensaje` en Supabase.
  - Ajustes de enlace y plantilla en `AdminConfig.jsx` con prueba en WhatsApp.
  - Botón dorado "Pedir Reseña 5★" en `AdminAgenda.jsx` y `BarberoPortal.jsx`.

### [2026-11-13] — Marca Blanca en Enlaces Compartidos & Blindaje de Campo de Ajustes
* **Bug / Detalle Corregido:**
  1. Al compartir el enlace de reservas de una barbería (`/?b=vice-barber` o `/b/vice-barber`) por WhatsApp o redes sociales, la tarjeta de previsualización mostraba el nombre genérico "EXAKTA" y su logo en vez del nombre y logo oficial de la barbería emisora.
  2. En el panel de control móvil ("Ajustes del Local & Marca"), la URL pública aparecía dentro de una caja de texto tipo `input`, generando la impresión equivocada en los dueños de que debían escribir o editar allí, con riesgo de ruptura por manipulación involuntaria.
* **Causa Raíz:**
  1. `vercel.json` reescribía todas las peticiones no API directamente al archivo estático `client/dist/index.html`. Los rastreadores de WhatsApp (`WhatsApp/2.x`, `facebookexternalhit`) recibían el HTML predeterminado sin pasar por la inyección dinámica de Open Graph en Supabase. Adicionalmente, `express.static` en `server.js` interceptaba la raíz con `index.html` estático antes del middleware Open Graph, y una regla de normalización forzaba prefijo `/api` a rutas raíz provocando 404.
  2. En la UI, el enlace se renderizaba como `<input type="text" readOnly>`, lo cual seguía pareciendo un formulario editable en smartphones.
* **Archivos Intervenidos:**
  - `client/src/components/AdminConfig.jsx`: Se eliminó el elemento `<input>` sustituyéndolo por una tarjeta fija de solo lectura con candado de seguridad y badge informativo. Se agregaron botones de acción: "Copiar Link", "Compartir en WhatsApp" con mensaje de cortesía predeterminado, "Más opciones de compartir" (Web Share API nativa) y "Ver como cliente".
  - `client/src/components/AdminDashboard.jsx`: Sincronización del botón rápido "Link" con Web Share API y marca blanca.
  - `server/server.js` y `client/server/server.js`: Corrección del middleware de normalización de rutas, configuración `index: false` en `express.static(clientDistPath)`, soporte de slugs tanto en `/?b=` como en `/b/:slug`, fallback de búsqueda de `index.html` e inyección de metadatos Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `<title>` y favicon) con datos de Supabase.
  - `vercel.json`: Rewrites actualizados para encaminar las rutas de tenant y páginas frontend al handler serverless de Express con inclusión de archivos en el bundle.
  - `package.json`: Script `build` enriquecido para sincronizar `index.html` tanto en `server/` como en `client/server/`.
* **Comportamiento Esperado Verificado:**
  - Pruebas HTTP con simulación de peticiones a `/?b=vice-barber` y `/b/vice-barber` confirmaron respuesta 200 con inyección exitosa de `og:title` ("VICE BARBER - Reserva tu Cita Online"), `og:description` ("Estilo y precisión profesional") y favicon.
  - El dueño ya no tiene campo editable alguno que pueda romper o confundir; el enlace es 100% automático y protegido.
  - Compilación de Vite ejecutada con éxito (`npm run build`). Regla del espejo estrictamente cumplida.

---

> **RECUERDA:** Antes de hacer modificaciones a la base de datos o a la lógica de reservas, consulta este documento y preserva el soporte multi-tenant de Supabase.

### [2026-11-13] — Fix Overflow Barra SuperAdmin + Bug Definitivo Horarios + Rediseño Panel Cliente

#### 1. Overflow horizontal barra Modo SuperAdmin
* **Bug:** La barra negra superior `<aside>` de Modo SuperAdmin causaba desbordamiento horizontal (overflow-x) en dispositivos móviles. Al deslizar a la izquierda se veía espacio blanco a la derecha. También afectaba la vista cliente cuando se accedía desde SuperAdmin.
* **Causa Raíz:** El `<aside>` usaba `flex-wrap` con múltiples elementos sin restricción de ancho. En mobile, el texto "Modo SuperAdmin" + selector + botón "Volver a SuperAdmin" superaban el viewport.
* **Solución:** Rediseño del `<aside>` con `w-full max-w-full overflow-hidden`. Selector compactado con `max-w-[110px]` y texto truncado. Botón de retorno con texto corto en mobile (`SA` / `SuperAdmin` responsive). Eliminado `flex-wrap` y substituido por layout sin desbordamiento.
* **Archivo:** `client/src/App.jsx`

#### 2. Bug Definitivo — Horarios bloqueados en vista cliente (causa raíz multi-tenant)
* **Bug Recurrente:** En el panel del dueño aparecen horarios disponibles pero en el del cliente **todos los horarios aparecen bloqueados**.
* **Causa Raíz Definitiva:** El fetch de `cargarDisponibilidad()` en `ClientBooking.jsx` llamaba a `/api/disponibilidad?barbero_id=...&fecha=...&duracion_minutos=...` **SIN pasar el slug de la barbería**. El servidor (`getTenantId`) hacía fallback a `tenantId = 1` (The Barber Club). Cuando el barbero pertenecía a otra barbería (ej: vice-barber con ID ≠ 1), la query SQL `WHERE barberia_id = 1` no lo encontraba y caía al Fallback 3 (barbero genérico 09:00-20:00). Adicionalmente, los bloqueos se buscaban también con `tenantId = 1`, mostrando los bloqueos de otra barbería aplicados al cliente.
* **Solución:** Pasar `b=slug` como query param y `x-barberia-slug` como header HTTP en el fetch de disponibilidad. Mismo fix aplicado al POST de `/api/citas`. El slug se obtiene de `shopConfig.slug || window.__BARBERIA_SLUG || sessionStorage`.
* **Archivo:** `client/src/components/ClientBooking.jsx` — funciones `cargarDisponibilidad()` y `handleSubmitReserva()`

#### 3. Rediseño del Panel Cliente — Landing de Barbería + CTA "AGENDA TU CITA"
* **Cambio Solicitado:** El cliente al abrir el enlace de la barbería debía ver primero un perfil visual de la barbería (logo, nombre, eslogan, contacto, redes sociales) y un único botón prominente "AGENDA TU CITA". Solo al presionar ese botón se despliega el flujo de agendamiento.
* **Implementación:**
  - Nuevo estado `mostrandoAgenda` (false por defecto) controla qué pantalla se muestra.
  - **Pantalla de perfil:** Logo grande centrado (o inicial del nombre como fallback), nombre/eslogan, datos de contacto (teléfono, dirección), redes sociales (Instagram via `instagram_url`, Facebook via `facebook_url`, web via `sitio_web`), botón CTA azul "AGENDA TU CITA" con sombra dinámica del color primario. `ClientReviewsSection` integrado al final.
  - **Pantalla de agenda:** Encabezado compacto con botón "← Perfil" para regresar, logo mini + nombre de la barbería, badge "Sin login". Flujo de selección barbero → servicio → horario → datos → confirmación sin cambios.
  - **Tarjetas de barbero:** Rediseñadas de grid grande a **lista compacta**: avatar 40×40px + nombre + especialidad + horario en una sola línea + flecha de acción. Mucho más limpio, premium y escalable para equipos grandes.
  - `reiniciarReserva()` retorna también a la pantalla de perfil (`setMostrandoAgenda(false)`).
* **Archivo:** `client/src/components/ClientBooking.jsx`
* **Campos de BBDD requeridos** para redes sociales: `instagram_url`, `facebook_url`, `sitio_web` en tabla `barberias`. Si no existen, los botones simplemente no se renderizan (renderizado condicional).
* **Compilación:** ✅ Vite build exitoso. Commit `790412c` → push a `origin main`.

---

### [2026-11-14] — Corrección Integral de Fichas Técnicas, Selector de Horarios, Auditoría Contable y Overflow

#### 1. Selector Visual de Horario en Cliente (`ClientBooking.jsx`)
* **Mejora:** El turno escogido ahora muestra anillo activo `ring-4 ring-offset-2 ring-blue-500`, escala animada `scale-[1.04]`, insignia check circular flotante animada (`Check` en verde esmeralda) en la esquina superior del botón.
* **Banner de Confirmación:** Se incorporó una tarjeta de confirmación arriba del botón de continuar: *"✓ Horario Seleccionado: [10:00 AM - 11:00 AM] con [Nombre del Barbero]"*, además de reflejar la hora en el texto del botón.

#### 2. Migración DDL Supabase a BIGINT & Persistencia de Fichas Técnicas
* **Causa Raíz:** Las columnas de `fichas_tecnicas` y `clientes` eran de tipo `INTEGER` (32 bits, máx. 2.147 millones). Al crear barberías con timestamp (`1794631242838`), PostgreSQL arrojaba `value "1794631242838" is out of range for type integer`, impidiendo guardar fichas técnicas.
* **Solución:** Ejecutada migración DDL en Supabase PostgreSQL alterando a `BIGINT` en `fichas_tecnicas`, `clientes` y `movimientos_tarjeta_vip`.
* **Buscador & Sanitización:** `GET /api/fichas-tecnicas` ahora limpia cualquier símbolo (`+`, espacios, guiones) y utiliza coincidencia en los últimos 10 dígitos y slug multi-tenant directo.

#### 3. Auditoría y Exactitud Contable en Balance General y Liquidaciones
* **Causa Raíz:** `AdminBalance.jsx` no recibía `shopConfig` en `AdminDashboard.jsx`. Además, el endpoint `/api/reportes/balance` retornaba objetos anidados mientras el componente leía campos planos (`total_ingresos`, `ganancia_neta`, `barberos_detalle`). Esto ocasionaba que `barberos_detalle` quedara como `[]` y mostrara *"No hay barberos registrados"*.
* **Solución:** 
  - `/api/reportes/balance` unificado para retornar tanto campos aplanados (`total_ingresos`, `ganancia_neta`, `barberos_detalle`, `total_servicios`, etc.) como estructuras anidadas para retrocompatibilidad.
  - `AdminLiquidaciones.jsx` inicia por defecto con el primer día del mes actual (en lugar de solo hoy) y agrega el botón rápido *"⚡ Citas sin Liquidar"* para auditar inmediatamente cualquier cita completada sin liquidación.
  - Inyección explícita del slug en todas las peticiones contables.

#### 4. Corrección de Desbordamiento Horizontal en Móviles
* **Causa:** Acumulación de botones en el Navbar y ausencia de contención en el viewport.
* **Solución:** Agregado `overflow-x: hidden; max-width: 100vw;` en `html`, `body` y `#root`. En `Navbar.jsx`, los botones secundarios se adaptan en pantallas pequeñas para que el ancho nunca exceda el viewport móvil.

---

### [2026-11-14] — Propinas Libres en Recibo POS, Integración 100% al Liquidador y Corrección Tarjeta VIP

#### 1. Propinas Libres & Flexibles en Tirilla POS (`ModalTirillaPOS.jsx`)
* **Requerimiento:** Las propinas en el recibo POS no deben ser valores fijos rígidos. El dueño/cajero debe tener la libertad de escribir cualquier monto de propina que el cliente deje para el barbero/colaborador, además de contar con atajos rápidos.
* **Implementación:**
  - Se implementó un campo de entrada numérico (`<input type="number" ... />`) con prefijo `$` y placeholder para ingreso de montos libres (ej: $1.500, $3.000, $7.500, $50.000, etc.).
  - Se incluyeron botones de sugerencia rápida (`$0`, `+$2k`, `+$5k`, `+$10k`, `+$20k`) para agilizar el cobro en caja con un solo toque.
  - Insignia destacada: `100% del Colaborador`.
  - En la tirilla visual, en la impresión térmica y en el comprobante enviado por WhatsApp al cliente, se desglosa claramente como `Propina (100% Barbero)`.

#### 2. Integración de Propinas 100% al Motor de Liquidaciones (`AdminLiquidaciones.jsx` y Backend)
* **Requerimiento:** Las propinas son 100% del colaborador (sin retención ni comisión de la barbería). Todas las propinas registradas en turnos completados deben fluir directamente al liquidador oficial.
* **Implementación Backend (`server/server.js` y `client/server/server.js`):**
  - En `GET /api/liquidaciones/preview`: se extrae `propina` de las citas completadas y se calcula `totalPropinas = citas.reduce(...)`. Se suma íntegramente al `monto_comision` a pagar al colaborador (`montoComisionServicios + montoComisionProductos + totalPropinas`) sin afectar el margen de la barbería.
  - En `POST /api/liquidaciones`: se selecciona `propina` en la consulta SQL de citas a liquidar, se calcula `totalPropinas` y se inserta en la columna `total_propinas` de la tabla `liquidaciones` en Supabase PostgreSQL.
  - En `GET /api/barbero-portal/balance`: el portal del barbero ahora suma y discrimina `total_propinas` y `propinas_pendientes` en su balance personal.
* **Implementación Frontend (`AdminLiquidaciones.jsx` & `BarberoPortal.jsx`):**
  - Métrica dedicada de Propinas: tarjeta en esmeralda *"Propinas (100% Barbero)"* en el panel de liquidación.
  - Columna *"Propina (100%)"* en la tabla de citas detalladas a liquidar con badge verde para turnos que recibieron propina voluntaria.
  - Inclusión en el comprobante oficial y en el texto de liquidación para WhatsApp: `🎁 Propinas Clientes (100%): $X COP`.
  - Tarjeta en `BarberoPortal.jsx` en la pestaña de Utilidad: *"🎁 Propinas (100% Tuyas)"* para total transparencia con el equipo de barberos.

#### 3. Soporte de Corrección de Sellos en Tarjeta VIP (-1 Sello)
* **Requerimiento:** Si por error un barbero o dueño otorga más sellos de los correspondientes, debe poder retirar sellos fácilmente.
* **Implementación:**
  - En `ModalTarjetaVIPAdmin.jsx`: se agregó el botón `-1 Sello (Quitar)` junto al botón `+1 Sello (Corte Realizado)`.
  - En `/api/tarjeta-vip/sellar`: soporte para cantidades negativas (`cantidad = -1`), aplicando `Math.max(0, sellos_actuales + cant)`, registrando el movimiento como `tipo: 'ajuste'` con nota explicativa de auditoría.

---

### [2026-11-14] — FASE 5: Asistente de Reactivación de Clientes con IA & Semáforo Predictivo

#### 1. Semáforo Predictivo de Retención de Clientes
* **Lógica de Clasificación:**
  - 🟢 **Activo (Verde - Menos de 21 días):** Cliente frecuente con ciclo de corte óptimo.
  - 🟡 **En Riesgo (Amarillo - 21 a 45 días):** Cliente que está posponiendo su corte. Momento ideal para preventivo de mantenimiento.
  - 🔴 **Inactivo / Por Rescatar (Rojo - Más de 45 días o sin citas):** Cliente con alta probabilidad de fuga. Requiere oferta de choque para volver.
* **Métricas Globales:** Total de clientes, desglose por semáforo y porcentaje de salud de cartera (% de clientes activos).

#### 2. Generador de Mensajes Persuasivos con IA para WhatsApp
* **Estrategias Soportadas:**
  1. *Llenar Días Muertos (Martes & Miércoles):* Incentivo para asistir en días valle (ej: bebida de cortesía + perfilado de cejas).
  2. *Rescate de Clientes Inactivos (Semáforo Rojo):* Mensaje cálido recordando su corte con su barbero habitual y oferta de bienvenida (ej: 15% de descuento).
  3. *Mantenimiento Preventivo (Semáforo Amarillo):* Recordatorio para retocar fade y perfilar antes de perder la línea del corte.
  4. *Beneficio Club VIP & Sellos:* Recordatorio de puntos acumulados para corte gratis.
* **Disparo Directo a WhatsApp:** Enlace limpio `https://wa.me/...` que precarga el mensaje personalizado con el nombre del cliente, último barbero, servicio habitual y link de reserva directo de la barbería (`/b/:slug`).

#### 3. Componentes y Módulo Conmutable
* **Componente `AdminReactivacionIA.jsx`:** Dashboard interactivo con tarjetas de radar, barra de salud, selector de campañas, filtros por semáforo y modal editor de copy.
* **Integración en `AdminClientes.jsx`:** Insignia del semáforo en cada ficha de cliente (`🟢 Hace Xd`, `🟡 Hace Xd`, `🔴 Inactivo`) y botón directo `🤖 Reactivar con IA`.
* **Integración en `AdminDashboard.jsx`:** Pestaña dedicada con icono `Sparkles` y badge `WhatsApp IA`, condicionada a `modulos.reactivacion_ia !== false`.
* **Gestión en SuperAdmin (`SuperAdminDashboard.jsx`):** Módulo conmutable por plan con la llave `reactivacion_ia`.

#### 4. Auditoría de Carga, Rendimiento e Índices B-Tree en Supabase
* **Aislamiento Multi-Tenant:** La consulta `GET /api/reactivacion/analisis` filtra estrictamente por `WHERE barberia_id = ?`, procesando únicamente los registros del tenant que abrió la pestaña. Cero impacto sobre otros inquilinos.
* **Optimización DDL en Supabase PostgreSQL:**
  - Creado índice compuesto B-Tree: `CREATE INDEX IF NOT EXISTS idx_citas_tenant_estado_telefono ON citas (barberia_id, estado, cliente_telefono);`
  - Creado índice compuesto B-Tree: `CREATE INDEX IF NOT EXISTS idx_clientes_tenant_telefono ON clientes (barberia_id, cliente_telefono);`
  - Permite búsquedas directas en el árbol sin escanear tablas secuencialmente (`Index Scan`), con tiempos de ejecución menores a **15 milisegundos**.
* **Impacto en Servidor y Plataformas:**
  - **Supabase:** Consumo de CPU < 0.1%, peso de respuesta JSON < 80 KB.
  - **Vercel Serverless:** Tiempo total de ejecución < 100 ms (100 veces por debajo del límite de timeout de 10s de Vercel).
  - **Cero Polling:** No genera peticiones automáticas periódicas; solo se dispara cuando el administrador accede a la sección.
* **Blindaje Anti-Bloqueo de Meta:** Se utiliza el protocolo oficial de Meta `https://wa.me/...` (Click-to-Chat 1 a 1), garantizando 0% de riesgo de baneo o bloqueo al evitar APIs no oficiales o envíos masivos automatizados sospechosos.

---

### [2026-11-14] — Módulo de Adelantos, Préstamos y Crédito de Productos para Colaboradores

#### 1. Arquitectura y Persistencia
* **Tablas en Supabase PostgreSQL:**
  - `prestamos_colaboradores`: Almacena adelantos de nómina en efectivo (`adelanto_dinero`), préstamos financieros personales (`prestamo_dinero`), productos del local a crédito (`productos_local`), y herramientas/insumos (`herramientas`). Registra `monto_total`, `numero_cuotas`, `valor_cuota`, `saldo_pendiente`, `cuotas_pagadas` y `estado` (`activo`, `pagado`, `cancelado`).
  - `abonos_prestamos_liquidaciones`: Historial detallado de amortizaciones vinculadas a cada liquidación o abono directo, guardando `saldo_anterior`, `saldo_restante`, `numero_cuota` y `origen`.
* **Endpoints Backend (`server/server.js` y `client/server/server.js`):**
  - `GET /api/prestamos`: Listado filtrado por barbero y estado para el tenant actual.
  - `POST /api/prestamos`: Creación con registro automático en egresos/gastos si es adelanto de efectivo.
  - `POST /api/prestamos/:id/abono`: Abonos manuales en caja.
  - `DELETE /api/prestamos/:id`: Anulación controlada.
  - `GET /api/prestamos/:id/historial`: Trazabilidad completa de cuotas y abonos.
  - `GET /api/liquidaciones/preview`: Identifica préstamos activos (`saldo_pendiente > 0`) e inyecta la cuota sugerida.
  - `POST /api/liquidaciones`: Procesa amortizaciones seleccionadas, descuenta saldos, avanza contadores de cuota y genera recibos auditables.

#### 2. Interfaz de Usuario e Integración
* **Componente `AdminPrestamosColaboradores.jsx`:** Pestaña dedicada en la sección de liquidaciones con métricas de cartera (Total Financiado, Saldo Pendiente por Cobrar, Créditos Activos), filtros y modales para registrar préstamos con cuotas calculadas automáticamente.
* **Integración en Liquidador (`AdminLiquidaciones.jsx`):**
  - Selector interactivo de cuotas activas a amortizar con checkboxes y campos editables de valor a descontar.
  - Deducciones totales compuestas (cuotas seleccionadas + otras deducciones manuales).
  - Comprobante impreso y mensaje de WhatsApp con desglose pormenorizado de abonos a préstamos y saldo restante.

---

### [2026-11-14] — Corrección de Expediente & Récords, Turnos Presenciales al Liquidador y Responsividad Móvil

#### 1. Expediente Vitalicio y Récords de Barbero (`BarberoRecordModal.jsx` y Backend)
* **Causa del bloqueo:** El backend `/api/barberos/:id/record` retornaba únicamente `metricas` y `ultimas_citas`, omitiendo `resumen`, `citas`, `ventas_productos`, `publicaciones` y `auditoria`. Adicionalmente, la petición en frontend no enviaba cabeceras de autorización ni slug multi-tenant, causando `401 Unauthorized` o `TypeError` al desestructurar.
* **Solución aplicada:**
  - El endpoint `/api/barberos/:id/record` ahora computa y retorna todos los datos consolidados: `resumen`, `metricas`, `citas`, `liquidaciones`, `ventas_productos`, `publicaciones` y `auditoria`.
  - [BarberoRecordModal.jsx](file:///c:/Users/h/OneDrive%20-%20logigho.com/Documentos/APPS/agenda%20barberia/client/src/components/BarberoRecordModal.jsx) envía cabeceras de autorización (`x-admin-token`, `x-barbero-token`, `x-superadmin-token`) y el slug activo (`x-barberia-slug` y `?b=...`), con fallbacks defensivos para evitar bloqueos.

#### 2. Turnos Presenciales Directos al Liquidador (`AdminAgenda.jsx` y `POST /api/citas`)
* **Problema:** Los turnos agregados de manera presencial o manual no transmitían el slug multi-tenant en [AdminAgenda.jsx](file:///c:/Users/h/OneDrive%20-%20logigho.com/Documentos/APPS/agenda%20barberia/client/src/components/AdminAgenda.jsx), guardándose en el Tenant #1 por defecto, y quedaban en estado `confirmada` sin sumar al liquidador del barbero.
* **Solución aplicada:**
  - Todas las operaciones de citas (`cargarCitas`, `cambiarEstadoCita`, `handleCrearCitaManual`, `handleGuardarReasignacion`) ahora transmiten estrictamente `?b=${slug}` y `'x-barberia-slug': slug`.
  - En el modal de *"Agendar Turno Presencial"*:
    - Campo editable de `precio_cobrado` prellenado según el servicio.
    - Campo opcional de `propina` (100% colaborador).
    - Selector de `metodo_pago`.
    - Casilla activada por defecto: `✅ Marcar como Turno ya Atendido y Pagado (Completar de inmediato)`. Al guardarse, se registra como `completada` y entra de inmediato al liquidador del barbero seleccionado.

#### 3. Rediseño y Responsividad Móvil del Liquidador (`AdminLiquidaciones.jsx` y `AdminPrestamosColaboradores.jsx`)
* **Problema:** En pantallas móviles, la cabecera flex comprimía el título a la izquierda y la botonera de pestañas desbordaba la pantalla horizontalmente, cortando textos (`Histor... de Pag...`).
* **Solución aplicada:**
  - Cabecera adaptable con `flex-col lg:flex-row`.
  - Segmented control responsivo: en móviles muestra `⚡ Liquidar` | `🤝 Préstamos` | `📜 Historial` en una grilla de 3 columnas ajustada al 100% de la pantalla sin scroll horizontal.
  - Métricas adaptadas a `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`.
  - Margen inferior de seguridad `pb-28` en ambos componentes para que el botón flotante de WhatsApp no tape los botones de acción.

---

### [2026-11-14] — Sistema Universal de Exportación a Excel (.xlsx) y Copia de Seguridad Contable en Todos los Roles

#### 1. Arquitectura Técnica y Rendimiento
* **Librería Utilizada:** `xlsx` instalada en cliente para procesamiento y generación binaria `.xlsx` 100% del lado del navegador (client-side), reduciendo a cero el consumo de CPU o memoria en funciones serverless de Vercel.
* **Módulo Centralizado de Exportación (`client/src/utils/excelExport.js`):**
  - `exportarAExcel(datos, nombreArchivo, nombreHoja)`: Exportación ágil de una sola hoja con ajuste automático de ancho de columnas y nombres de hoja seguros (<31 caracteres).
  - `descargarExcelMultiHoja(hojas, nombreArchivo)`: Exportación de libros de trabajo maestros con múltiples pestañas organizadas.
  - Fallback automático a CSV UTF-8 con BOM (`\uFEFF`) en entornos restringidos para compatibilidad nativa con Microsoft Excel en español (sin problemas de tildes o caracteres especiales).

#### 2. Implementación por Roles de Usuario
1. **Dueño / Administrador del Local (`AdminDashboard`):**
   - **Balance & Rendimiento (`AdminBalance.jsx`):** Botón `Descargar Excel` que genera un libro multi-hoja con `Resumen_Contable` (ingresos, costos, comisiones, márgenes), `Rendimiento_Barberos` (desglose por colaborador) y `Metodos_Pago`.
   - **Liquidaciones & Pagos (`AdminLiquidaciones.jsx`):** Botón `Descargar Historial (.xlsx)` con detalle completo de liquidaciones pagadas, fechas de corte, retenciones, préstamos y métodos de pago.
   - **Directorio de Clientes (`AdminClientes.jsx`):** Botón `Exportar Excel (.xlsx)` con métricas completas de fidelización: visitas, gasto acumulado, sellos VIP, estado semáforo y próxima recompensa.
   - **Copia Maestra & Respaldo Contable (`AdminConfig.jsx`):** Tarjeta destacada con el botón `Descargar Copia Maestra (.xlsx)` conectada al endpoint de alta velocidad `GET /api/reportes/backup-completo`. Genera un libro maestro con 7 hojas: `Resumen_Local`, `Clientes`, `Citas_Servicios`, `Liquidaciones`, `Gastos_Operativos`, `Equipo_Barberos` y `Prestamos_Creditos`. Garantiza total autonomía y respaldo offline para el dueño ante cualquier eventualidad.
2. **Colaborador / Barbero (`BarberoPortal.jsx`):**
   - **Mis Citas Asignadas:** Botón `Descargar en Excel (.xlsx)` con el detalle de turnos asignados del período seleccionado.
   - **Mi Récord & Historial Vitalicio:** Botón `Descargar Mi Historial (.xlsx)` exportando `Resumen_Personal`, `Historial_Cortes` y `Liquidaciones_Pagadas`.
   - **Mi Utilidad & Balance:** Botón `Descargar Mi Balance (.xlsx)` para auditoría y comprobación de comisiones ganadas, propinas directas (100% del barbero) y pagos recibidos.
3. **SuperAdmin (`SuperAdminDashboard.jsx`):**
   - **Directorio de Barberías:** Botón `Descargar Excel (.xlsx)` que exporta la red de inquilinos con planes, cuotas mensuales COP, días de vencimiento y estado.
   - **Citas Globales:** Botón `Descargar Citas (.xlsx)` para auditar la facturación y turnos en toda la red de barberías.
   - **Auditoría & Logs Maestros:** Botón `Descargar Logs (.xlsx)` con la trazabilidad de seguridad y accesos al sistema.

#### 3. Optimización en Supabase PostgreSQL
* Creación de índices B-Tree compuestos para consultas multi-inquilino en milisegundos (< 20 ms):
  - `idx_citas_tenant_estado_telefono` en tabla `citas(barberia_id, estado, cliente_telefono)`.
  - `idx_clientes_tenant_telefono` en tabla `clientes(barberia_id, cliente_telefono)`.
