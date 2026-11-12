# 💈 EXAKTA — Plataforma SaaS Multi-Tenant de Gestión y Agenda para Barberías

Sistema integral de gestión, reservas y administración en la nube para barberías, optimizado para celulares y computadores. Desarrollado con arquitectura Multi-Tenant real, base de datos en Supabase PostgreSQL (Transaction Pooler) y pasarela de liquidación de comisiones con envío directo a WhatsApp.

---

> [!IMPORTANT]
> **DOCUMENTACIÓN MAESTRA PARA DESARROLLADORES E INTELIGENCIAS ARTIFICIALES:**
> Consulta el archivo [`agent.md`](./agent.md) para conocer la arquitectura completa, políticas de seguridad, roles, variables de entorno y hoja de ruta competitiva frente a WeiBook, BEWE y AgendaPro.

---

## 🚀 Inicio Rápido en Desarrollo

```bash
# 1. Instalar dependencias
npm install
npm --prefix client install

# 2. Iniciar sistema completo en modo desarrollo (Backend en 4001 y Frontend en 5173)
npm run dev
```

* **Frontend Local:** `http://localhost:5173`
* **API Backend Local:** `http://localhost:4001/api`

---

## 🔐 Accesos y Roles Principales

1. **SuperAdmin EXAKTA:**
   * **Identificador:** `admin@exakta.online` o `3114220554`
   * **Contraseña:** `Exakta#2026Master!`
   * Control global de barberías, planes con precios dinámicos en COP, auditoría y métricas.
2. **Dueños de Barbería (Admin de Local):**
   * **The Barber Club:** `the-barber-club` / Pass: `BarberClub2026*`
   * **BIP BARBER CLUB:** `hellenaiza@gmail.com` / Pass: `Vipadmin#1`
   * **VICE BARBER:** `Manuelmiran511@gmail.com` / Pass: `Vicemanu#1`
3. **Portal Móvil para Barberos:**
   * Acceso independiente con teléfono o correo para gestionar sus turnos y ver su acumulado de comisiones sin ver la facturación total del negocio.
4. **Clientes Públicos:**
   * Acceso por enlace de barbería: `/b/:slug` o `/?b=:slug` (reserva en tiempo real en 4 pasos sin registro).

---

## 🛡️ Seguridad Implementada

* **Límite Anti Fuerza Bruta:** Bloqueo automático de 15 minutos tras 4 intentos fallidos con contador regresivo en pantalla.
* **Contraseñas Alfanuméricas:** Obligatoriedad de letras y números (mínimo 6 caracteres).
* **Protección de Eliminación:** Barbería ID 1 protegida contra borrado. Requiere contraseña de SuperAdmin para borrar barberías y contraseña del dueño para retirar barberos.
* **Persistencia Nube:** Supabase PostgreSQL Pooler con tolerancia a fallos.

---

## 📦 Despliegue en Producción (Vercel)

Al hacer push a la rama `main`, Vercel compila y despliega automáticamente:
```bash
git add .
git commit -m "feat: tu cambio"
git push origin main
```
*Recuerda mantener sincronizada la carpeta `server/` con su espejo `client/server/`.*
