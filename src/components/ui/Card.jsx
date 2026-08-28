export function Card({ title, value, subtitle, icon: Icon, color = 'emerald' }) {
  const accent = {
    emerald: {
      badge: 'text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-400/25',
      glow: 'from-emerald-500/10 via-transparent to-transparent',
      text: 'text-emerald-300',
    },
    red: {
      badge: 'text-rose-300 bg-rose-500/15 ring-1 ring-rose-400/25',
      glow: 'from-rose-500/10 via-transparent to-transparent',
      text: 'text-rose-300',
    },
    blue: {
      badge: 'text-sky-300 bg-sky-500/15 ring-1 ring-sky-400/25',
      glow: 'from-sky-500/10 via-transparent to-transparent',
      text: 'text-sky-300',
    },
    amber: {
      badge: 'text-amber-300 bg-amber-500/15 ring-1 ring-amber-400/25',
      glow: 'from-amber-500/10 via-transparent to-transparent',
      text: 'text-amber-300',
    },
  }

  const selected = accent[color] || accent.emerald

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#111e19]/90 to-[#0c1613]/90 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:shadow-emerald-950/20 hover:-translate-y-0.5">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${selected.glow} opacity-60 blur-xl transition-opacity group-hover:opacity-100`} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
        {Icon && (
          <div className={`rounded-xl p-2.5 shadow-inner transition-transform duration-300 group-hover:scale-105 ${selected.badge}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="relative z-10 mt-3 font-display text-[1.75rem] font-semibold tracking-tight text-white">{value}</p>
      {subtitle && <p className="relative z-10 mt-1 text-xs font-medium text-slate-400">{subtitle}</p>}
    </div>
  )
}
