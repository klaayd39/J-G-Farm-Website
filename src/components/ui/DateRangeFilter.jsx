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
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 p-1 backdrop-blur-md">
        <Calendar size={16} className="ml-2 text-emerald-400" />
        <div className="flex flex-wrap gap-1">
          {Object.entries(presets).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                preset === key
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 p-1.5 text-xs text-slate-300">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-white focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
