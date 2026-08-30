import { Calendar } from 'lucide-react'
import { cn } from '../../utils/cn'

export function DateRangeFilter({
  preset,
  setPreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  presets,
  className,
}) {
  return (
    <div className={cn('flex w-full flex-col gap-2 lg:w-auto lg:max-w-full', className)}>
      <div className="flex w-full items-center gap-1.5 rounded-xl border border-white/10 bg-[#0a0a0a]/90 px-2 py-1.5 shadow-lg backdrop-blur-md sm:gap-2 sm:rounded-2xl sm:px-2.5">
        <Calendar size={14} className="shrink-0 text-emerald-400" />
        <label className="sr-only" htmlFor="date-from">
          From date
        </label>
        <input
          id="date-from"
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-1.5 py-1.5 text-[11px] text-white focus:border-emerald-500 focus:outline-none sm:rounded-xl sm:px-2 sm:text-xs"
        />
        <span className="shrink-0 text-[10px] font-medium text-slate-500 sm:text-[11px]">to</span>
        <label className="sr-only" htmlFor="date-to">
          To date
        </label>
        <input
          id="date-to"
          type="date"
          value={customTo}
          min={customFrom || undefined}
          onChange={(e) => setCustomTo(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-1.5 py-1.5 text-[11px] text-white focus:border-emerald-500 focus:outline-none sm:rounded-xl sm:px-2 sm:text-xs"
        />
      </div>

      <div className="flex w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]/90 p-0.5 shadow-lg backdrop-blur-md no-scrollbar sm:rounded-2xl sm:p-1">
        {Object.entries(presets).map(([key, label]) => {
          const isActive = preset === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold transition-all duration-200 sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-[11px] md:px-3 md:text-xs ${
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
  )
}
