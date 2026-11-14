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
