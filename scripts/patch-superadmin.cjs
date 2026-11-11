const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../client/src/components/SuperAdminDashboard.jsx');
let code = fs.readFileSync(targetFile, 'utf-8');

// 1. Add Share2 to imports if not present
if (!code.includes('Share2')) {
  code = code.replace(
    /Edit3\r?\n} from 'lucide-react';/,
    `Edit3,\n  Share2\n} from 'lucide-react';`
  );
}

// 2. Add precio_mensual_cop to nuevaBarberia
if (!code.includes("precio_mensual_cop: 180000")) {
  code = code.replace(
    /plan: 'pro',(\r?\n\s*)color_primario:/,
    `plan: 'pro',$1precio_mensual_cop: 180000,$1color_primario:`
  );
}

// 3. Add helper functions and update handleCopiarEnlace
const helperCode = `
  const getBaseAppUrl = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('exakta.online')) {
        return 'https://www.exakta.online';
      }
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return window.location.origin;
      }
      return 'https://www.exakta.online';
    }
    return 'https://www.exakta.online';
  };

  function handleCopiarEnlaceCliente(slug, e) {
    if (e) e.stopPropagation();
    const url = \`\${getBaseAppUrl()}/?b=\${slug}\`;
    navigator.clipboard.writeText(url);
    setSlugCopiado(\`cliente_\${slug}\`);
    setTimeout(() => setSlugCopiado(null), 2500);
  }

  function handleCopiarEnlaceDueno(slug, e) {
    if (e) e.stopPropagation();
    const url = \`\${getBaseAppUrl()}/?b=\${slug}&admin=1\`;
    navigator.clipboard.writeText(url);
    setSlugCopiado(\`dueno_\${slug}\`);
    setTimeout(() => setSlugCopiado(null), 2500);
  }

  function handleCompartirWhatsAppDueno(barberia, e) {
    if (e) e.stopPropagation();
    const url = \`\${getBaseAppUrl()}/?b=\${barberia.slug}&admin=1\`;
    const pin = barberia.pin_admin || '1234';
    const texto = \`¡Hola! Aquí tienes el acceso a tu plataforma EXAKTA para administrar \${barberia.nombre}:\\n\\n🔗 Enlace de Dueño: \${url}\\n🔑 PIN de Acceso: \${pin}\\n\\nDesde allí puedes gestionar tus citas, barberos, servicios y reportes.\`;
    const cleanTel = (barberia.telefono || '').replace(/[^0-9]/g, '');
    const waUrl = cleanTel ? \`https://api.whatsapp.com/send?phone=57\${cleanTel}&text=\${encodeURIComponent(texto)}\` : \`https://api.whatsapp.com/send?text=\${encodeURIComponent(texto)}\`;
    window.open(waUrl, '_blank');
  }

  function handleCompartirWhatsAppCliente(barberia, e) {
    if (e) e.stopPropagation();
    const url = \`\${getBaseAppUrl()}/?b=\${barberia.slug}\`;
    const texto = \`¡Agenda tu cita en \${barberia.nombre}! Ingresa a nuestro enlace oficial para elegir barbero, horario y servicio sin filas:\\n\\n💈 \${url}\`;
    const waUrl = \`https://api.whatsapp.com/send?text=\${encodeURIComponent(texto)}\`;
    window.open(waUrl, '_blank');
  }

  async function handleActualizarCuota(barberiaId, nuevoPrecioCop) {
    try {
      const res = await fetch(\`/api/superadmin/barberias/\${barberiaId}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio_mensual_cop: Number(nuevoPrecioCop) })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await cargarBarberias();
        if (barberiaDetalle && barberiaDetalle.barberia && barberiaDetalle.barberia.id === barberiaId) {
          setBarberiaDetalle(prev => ({
            ...prev,
            barberia: { ...prev.barberia, precio_mensual_cop: Number(nuevoPrecioCop) },
            suscripcion: { ...prev.suscripcion, precio_cop: Number(nuevoPrecioCop) }
          }));
        }
        alert(\`Cuota mensual actualizada a $\${Number(nuevoPrecioCop).toLocaleString('es-CO')} COP\`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar cuota mensual');
    }
  }
`;

// Insert helper functions before handleCopiarEnlace
if (!code.includes('handleActualizarCuota')) {
  code = code.replace(
    /function handleCopiarEnlace\(slug, e\) \{/,
    `${helperCode}\n  function handleCopiarEnlace(slug, e) {`
  );
}

// 4. Update handleAbrirModalEditar to populate precio_mensual_cop
code = code.replace(
  /plan: barberia\.plan \|\| 'pro',/,
  `plan: barberia.plan || 'pro',\n      precio_mensual_cop: barberia.precio_mensual_cop !== undefined && barberia.precio_mensual_cop !== null ? barberia.precio_mensual_cop : (barberia.plan === 'vip' ? 320000 : (barberia.plan === 'pro' ? 180000 : 80000)),`
);

// 5. Update MRR total calculation from USD to COP
code = code.replace(
  /const mrrTotalUSD = barberias\.reduce\(\(acc, b\) => \{[\s\S]*?\}, 0\);/,
  `const mrrTotalCOP = barberias.reduce((acc, b) => {
    if (b.precio_mensual_cop !== undefined && b.precio_mensual_cop !== null && b.precio_mensual_cop !== '') {
      return acc + Number(b.precio_mensual_cop);
    }
    const val = b.plan === 'vip' ? 320000 : (b.plan === 'pro' ? 180000 : (b.plan === 'personalizado' ? (b.precio_mensual_cop || 200000) : 80000));
    return acc + val;
  }, 0);`
);

// 6. Update references to mrrTotalUSD
code = code.replace(
  /<span>Facturación MRR \(\$\{mrrTotalUSD\}\)<\/span>/,
  `<span>Facturación MRR (\${mrrTotalCOP.toLocaleString('es-CO')} COP)</span>`
);

code = code.replace(
  /\$\{mrrTotalUSD\} USD/g,
  `$\${mrrTotalCOP.toLocaleString('es-CO')} COP`
);

code = code.replace(
  /<span className="text-3xl font-black text-emerald-600 block font-mono">\$\{mrrTotalUSD \* 12\} USD<\/span>/,
  `<span className="text-2xl sm:text-3xl font-black text-emerald-600 block font-mono">$\${(mrrTotalCOP * 12).toLocaleString('es-CO')} COP</span>`
);

// 7. Update plan prices in the Plans showcase
code = code.replace(/precio: '\$20 USD'/, "precio: '$80.000 COP / mes'");
code = code.replace(/precio: '\$45 USD'/, "precio: '$180.000 COP / mes'");
code = code.replace(/precio: '\$80 USD'/, "precio: '$320.000 COP / mes'");
code = code.replace(/'Precio USD\/COP negociado'/, "'Precio en COP acordado a convenir'");

// 8. Update detail modal cuota and link sections
const newCuotaAndLinks = `
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 block font-medium">Cuota mensual (COP):</span>
                        <div className="flex items-center gap-2 mt-0.5 sm:justify-end">
                          <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                            $\${(barberiaDetalle.barberia?.precio_mensual_cop || barberiaDetalle.suscripcion?.precio_cop || 0).toLocaleString('es-CO')} COP
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const actual = barberiaDetalle.barberia?.precio_mensual_cop || barberiaDetalle.suscripcion?.precio_cop || 80000;
                              const nuevo = prompt('Ingresa el nuevo valor mensual en Pesos Colombianos (COP) para esta barbería:', actual);
                              if (nuevo !== null && !isNaN(Number(nuevo)) && Number(nuevo) >= 0) {
                                handleActualizarCuota(barberiaDetalle.barberia.id, Number(nuevo));
                              }
                            }}
                            className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white transition-colors text-[10px] font-bold flex items-center gap-1 border border-slate-700 shrink-0 cursor-pointer"
                            title="Modificar precio de la cuota mensual"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN DE ENLACES OFICIALES */}
                  <div className="space-y-3">
                    {/* ENLACE PARA CLIENTES */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                            Link para Clientes (Reservar Cita)
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700 font-mono truncate block font-bold">
                          {getBaseAppUrl()}/?b={barberiaDetalle.barberia.slug}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Para poner en Instagram, WhatsApp o enviar a clientes. Abre directo la agenda de reservas.
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCopiarEnlaceCliente(barberiaDetalle.barberia.slug, e)}
                          className="py-1.5 px-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-xs font-bold text-blue-800 flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          {slugCopiado === \`cliente_\${barberiaDetalle.barberia.slug}\` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-blue-600" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCompartirWhatsAppCliente(barberiaDetalle.barberia, e)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-xs"
                          title="Compartir por WhatsApp con clientes"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>

                    {/* ENLACE PARA EL DUEÑO / ADMINISTRADOR */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                            Link para el Dueño (Panel de Control)
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-900 font-mono truncate block font-bold">
                          {getBaseAppUrl()}/?b={barberiaDetalle.barberia.slug}&admin=1
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-slate-700">
                            PIN de Acceso Dueño:
                          </span>
                          <span className="text-xs font-mono font-black text-amber-950 px-2 py-0.5 bg-white border border-amber-300 rounded-md">
                            {barberiaDetalle.barberia.pin_admin || '1234'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCopiarEnlaceDueno(barberiaDetalle.barberia.slug, e)}
                          className="py-1.5 px-3 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          {slugCopiado === \`dueno_\${barberiaDetalle.barberia.slug}\` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-amber-700" />
                              <span>Copiar Link Dueño</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCompartirWhatsAppDueno(barberiaDetalle.barberia, e)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-xs"
                          title="Enviar credenciales al dueño por WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Enviar Acceso</span>
                        </button>
                      </div>
                    </div>
                  </div>
`;

code = code.replace(
  /<div className="text-left sm:text-right">[\s\S]*?<div className="p-3\.5 rounded-2xl bg-slate-50 border border-slate-200\/80 flex items-center justify-between gap-2\.5">[\s\S]*?<\/div>\s*<\/div>/,
  newCuotaAndLinks.trim()
);

// 9. Update options in Crear Barbería form
code = code.replace(
  /<option value="basico">Básico \(\$20\)<\/option>\s*<option value="pro">Profesional \(\$45\)<\/option>\s*<option value="vip">VIP \(\$80\)<\/option>/,
  `<option value="basico">Básico ($80.000 COP)</option>
                    <option value="pro">Profesional ($180.000 COP)</option>
                    <option value="vip">VIP ($320.000 COP)</option>`
);

// Add Cuota Mensual input to Crear Barbería form
const nuevaBarberiaPlanBlock = `                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan Inicial</label>
                  <select
                    value={nuevaBarberia.plan}
                    onChange={(e) => {
                      const nuevoPlan = e.target.value;
                      const cuota = nuevoPlan === 'vip' ? 320000 : (nuevoPlan === 'pro' ? 180000 : (nuevoPlan === 'basico' ? 80000 : nuevaBarberia.precio_mensual_cop));
                      setNuevaBarberia({ ...nuevaBarberia, plan: nuevoPlan, precio_mensual_cop: cuota });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="basico">Básico ($80.000 COP)</option>
                    <option value="pro">Profesional ($180.000 COP)</option>
                    <option value="vip">VIP ($320.000 COP)</option>
                    <option value="personalizado">Personalizado (Precio libre)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cuota Mensual Acordada ($ COP)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="Ej: 180000"
                  value={nuevaBarberia.precio_mensual_cop ?? ''}
                  onChange={(e) => setNuevaBarberia({ ...nuevaBarberia, precio_mensual_cop: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Puedes fijar o cambiar el precio mensual de este cliente en cualquier momento.
                </span>
              </div>`;

code = code.replace(
  /<div>\s*<label className="block font-bold text-slate-700 mb-1">Plan Inicial<\/label>[\s\S]*?<\/select>\s*<\/div>\s*<\/div>/,
  nuevaBarberiaPlanBlock
);

// 10. Update options in Editar Barbería form
const editarPlanBlock = `                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan Asignado</label>
                  <select
                    value={barberiaAEditar.plan}
                    onChange={(e) => {
                      const nuevoPlan = e.target.value;
                      const cuota = nuevoPlan === 'vip' ? 320000 : (nuevoPlan === 'pro' ? 180000 : (nuevoPlan === 'basico' ? 80000 : barberiaAEditar.precio_mensual_cop));
                      setBarberiaAEditar({ ...barberiaAEditar, plan: nuevoPlan, precio_mensual_cop: cuota });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="basico">Básico ($80.000 COP)</option>
                    <option value="pro">Profesional ($180.000 COP)</option>
                    <option value="vip">VIP ($320.000 COP)</option>
                    <option value="personalizado">Personalizado (Precio libre)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cuota Mensual Acordada ($ COP)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="Ej: 180000"
                  value={barberiaAEditar.precio_mensual_cop ?? ''}
                  onChange={(e) => setBarberiaAEditar({ ...barberiaAEditar, precio_mensual_cop: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El SuperAdmin puede modificar el valor en COP que paga esta barbería a conveniencia.
                </span>
              </div>`;

code = code.replace(
  /<div>\s*<label className="block font-bold text-slate-700 mb-1">Plan Asignado<\/label>[\s\S]*?<\/select>\s*<\/div>\s*<\/div>/,
  editarPlanBlock
);

fs.writeFileSync(targetFile, code, 'utf-8');
console.log('SuperAdminDashboard patched successfully!');
