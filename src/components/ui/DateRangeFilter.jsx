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
    <div className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-app bg-app-surface px-2.5 py-2 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:rounded-2xl sm:px-3">
        <Calendar size={14} className="hidden shrink-0 text-emerald-400 sm:block" />
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <label className="sr-only" htmlFor="date-from">
            From date
          </label>
          <input
            id="date-from"
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="field-input min-w-0 w-full text-xs"
          />
          <span className="text-center text-[11px] font-medium text-app-muted sm:px-1">to</span>
          <label className="sr-only" htmlFor="date-to">
            To date
          </label>
          <input
            id="date-to"
            type="date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(e) => setCustomTo(e.target.value)}
            className="field-input min-w-0 w-full text-xs"
          />
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-1 rounded-xl border border-app bg-app-surface p-1 shadow-lg backdrop-blur-md sm:flex-nowrap sm:overflow-x-auto sm:rounded-2xl no-scrollbar">
        {Object.entries(presets).map(([key, label]) => {
          const isActive = preset === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`min-w-[calc(50%-0.25rem)] flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all duration-200 sm:min-w-0 sm:flex-none sm:px-2.5 sm:py-1.5 sm:text-[11px] md:px-3 md:text-xs ${
                isActive ? 'pill-active' : 'pill-inactive'
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
