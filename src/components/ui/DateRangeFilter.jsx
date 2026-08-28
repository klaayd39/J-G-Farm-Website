import { Calendar } from 'lucide-react'

export function DateRangeFilter({
  preset,
  setPreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  presets,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 max-w-full">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1714]/90 p-1 shadow-lg backdrop-blur-md no-scrollbar">
        <div className="flex items-center gap-1.5 pl-2 pr-1 text-emerald-400 shrink-0">
          <Calendar size={14} className="shrink-0" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:inline">Range</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {Object.entries(presets).map(([key, label]) => {
            const isActive = preset === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`whitespace-nowrap rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0d1714]/90 p-1.5 text-xs text-slate-300 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-slate-500 font-medium text-[11px]">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
