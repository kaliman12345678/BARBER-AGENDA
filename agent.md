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

### Las 5 Fases Planificadas para EXAKTA (Modular y sin romper lo actual):
1. **Fase 1 (Google Reviews Flex):** Captación automática de calificaciones de 5 estrellas en Google Maps tras cada corte vía WhatsApp.
2. **Fase 2 (Tirilla Digital Recibo POS):** Comprobante térmico digital con desglose de servicios, productos y código QR para enviar al cliente.
3. **Fase 3 (Ficha Técnica de Estilo CRM):** Ficha técnica con fórmula de corte del cliente (número de máquina, peinado, barba y fotos antes/después).
4. **Fase 4 (Tarjeta VIP Digital con QR):** Monedero de fidelización digital en el móvil del cliente sin requerir tarjetas de cartón.
5. **Fase 5 (Asistente de Reactivación con IA):** Detección de clientes inactivos (> 20 días) y generación de mensajes persuasivos automáticos.

---

## 9. Próximas Tareas Pendientes

Cuando el usuario lo solicite, el trabajo debe orientarse a:
1. **Landing Page Comercial de Presentación de Dolores + Panel de Gestión de Contenido (CMS):**
   * Crear una página independiente (ej. `/landing` o componente comercial) enfocada en los dolores que resuelve EXAKTA frente a la competencia (comisiones desordenadas, inasistencias de clientes, costos abusivos en dólares de WeiBook/BEWE, y caja ciega).
   * **Requisito Fundamental:** Debe incluir un bloque o panel de administración para que el SuperAdmin pueda editar todo el contenido de la landing (textos del hero, dolores, soluciones, planes, enlace de WhatsApp comercial, testimonios, etc.) directamente desde la interfaz, guardándose en base de datos (`configuracion` en Supabase), **sin necesidad de entrar al código**.
2. **Implementación de la Fase 1 (Google Reviews) y Fase 2 (Tirilla POS).**

> **RECUERDA:** Antes de hacer modificaciones a la base de datos o a la lógica de reservas, consulta este documento y preserva el soporte multi-tenant de Supabase.
