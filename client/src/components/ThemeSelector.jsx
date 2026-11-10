import React from 'react';
import { Palette, Check, Sun, Moon, Sparkles } from 'lucide-react';

export const THEMES = [
  {
    id: 'claro',
    nombre: 'Minimal Claro',
    icon: Sun,
    primaryColor: '#2563eb',
    bgPreview: 'bg-white',
    badge: 'bg-slate-100 text-slate-800',
    containerClass: 'bg-[#f8fafc] text-slate-800',
    cardClass: 'bg-white border-slate-200/90 text-slate-800 shadow-xs',
    sidebarClass: 'bg-white border-slate-200/90 text-slate-700',
    headerClass: 'bg-white border-slate-200/90 text-slate-900',
    inputClass: 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white',
    accentClass: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    id: 'oscuro',
    nombre: 'Obsidian Dark',
    icon: Moon,
    primaryColor: '#38bdf8',
    bgPreview: 'bg-slate-950',
    badge: 'bg-slate-800 text-slate-200',
    containerClass: 'bg-slate-950 text-slate-100',
    cardClass: 'bg-slate-900 border-slate-800 text-slate-100 shadow-lg',
    sidebarClass: 'bg-slate-900 border-slate-800 text-slate-300',
    headerClass: 'bg-slate-900/90 border-slate-800 text-white',
    inputClass: 'bg-slate-950 border-slate-800 text-white focus:bg-slate-900',
    accentClass: 'text-sky-400 bg-sky-950/60 border-sky-800'
  },
  {
    id: 'vintage',
    nombre: 'Barber Gold',
    icon: Sparkles,
    primaryColor: '#d97706',
    bgPreview: 'bg-stone-950',
    badge: 'bg-amber-950 text-amber-200',
    containerClass: 'bg-[#0c0a09] text-amber-50',
    cardClass: 'bg-[#1c1917] border-amber-900/40 text-amber-50 shadow-lg',
    sidebarClass: 'bg-[#1c1917] border-amber-900/30 text-amber-200/80',
    headerClass: 'bg-[#1c1917]/95 border-amber-900/40 text-amber-100',
    inputClass: 'bg-[#0c0a09] border-amber-900/50 text-amber-100 focus:bg-[#1c1917]',
    accentClass: 'text-amber-400 bg-amber-950/60 border-amber-800/80'
  },
  {
    id: 'cyber',
    nombre: 'Cyber Indigo',
    icon: Palette,
    primaryColor: '#818cf8',
    bgPreview: 'bg-[#030712]',
    badge: 'bg-indigo-950 text-indigo-200',
    containerClass: 'bg-[#030712] text-slate-100',
    cardClass: 'bg-[#0f172a] border-indigo-900/40 text-slate-100 shadow-lg',
    sidebarClass: 'bg-[#0f172a] border-indigo-900/40 text-indigo-200/80',
    headerClass: 'bg-[#0f172a]/95 border-indigo-900/40 text-white',
    inputClass: 'bg-[#030712] border-indigo-900/50 text-white focus:bg-[#0f172a]',
    accentClass: 'text-indigo-400 bg-indigo-950/60 border-indigo-800'
  }
];

export default function ThemeSelector({ temaActual, onCambiarTema, className = '' }) {
  const [desplegado, setDesplegado] = React.useState(false);
  const temaObj = THEMES.find(t => t.id === temaActual) || THEMES[0];
  const Icono = temaObj.icon;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setDesplegado(!desplegado)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold transition-all shadow-xs hover:scale-105"
        style={{ borderColor: 'rgba(150, 150, 150, 0.25)' }}
        title="Cambiar tema visual del panel"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
          style={{ backgroundColor: temaObj.primaryColor }}
        />
        <Icono className="w-3.5 h-3.5 opacity-80" />
        <span className="hidden sm:inline text-[11px]">{temaObj.nombre}</span>
      </button>

      {desplegado && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDesplegado(false)}
          />
          <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-slideIn">
            <span className="block px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Tema del Panel
            </span>

            {THEMES.map(t => {
              const TIco = t.icon;
              const isSelected = t.id === temaActual;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onCambiarTema(t.id);
                    setDesplegado(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: t.primaryColor }}
                    />
                    <TIco className="w-3.5 h-3.5 opacity-70" />
                    <span>{t.nombre}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
