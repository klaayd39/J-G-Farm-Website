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
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e1613] p-4 sm:p-5 transition-colors hover:border-white/[0.12]">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${selected.glow} opacity-40 blur-xl`} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <div className={`rounded-lg p-2 ${selected.badge}`}>
            <Icon size={15} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className={`relative z-10 mt-2 font-display text-xl font-semibold tracking-tight tabular-nums ${selected.text || 'text-white'}`}>{value}</p>
      {subtitle && <p className="relative z-10 mt-1 text-[11px] text-slate-500">{subtitle}</p>}
    </div>
  )
}
