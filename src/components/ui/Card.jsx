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
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-app bg-app-surface p-3.5 transition-colors hover:border-app-strong sm:rounded-2xl sm:p-5">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${selected.glow} opacity-40 blur-xl`} />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:text-[11px]">{title}</p>
        {Icon && (
          <div className={`shrink-0 rounded-lg p-1.5 sm:p-2 ${selected.badge}`}>
            <Icon size={14} strokeWidth={2} className="sm:h-[15px] sm:w-[15px]" />
          </div>
        )}
      </div>
      <p className={`relative z-10 mt-1.5 truncate font-display text-lg font-semibold tracking-tight tabular-nums sm:mt-2 sm:text-xl lg:text-2xl ${selected.text || 'text-white'}`}>{value}</p>
      {subtitle && <p className="relative z-10 mt-0.5 truncate text-[10px] text-slate-500 sm:mt-1 sm:text-[11px]">{subtitle}</p>}
    </div>
  )
}
