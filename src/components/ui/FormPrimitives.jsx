import { cn } from '../../utils/cn'

export function FormSection({ title, description, children, className = '' }) {
  return (
    <section className={cn('space-y-3', className)}>
      {(title || description) && (
        <div className="space-y-0.5">
          {title && <h3 className="text-sm font-medium text-slate-200">{title}</h3>}
          {description && <p className="text-xs leading-relaxed text-slate-500">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

export function ComputedHint({ children }) {
  return (
    <p className="mt-1.5 text-[11px] font-medium tabular-nums text-slate-400">{children}</p>
  )
}

export function SegmentedControl({ value, onChange, options, className = '' }) {
  return (
    <div
      className={cn(
        'inline-flex w-full rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5',
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
              active
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function InventorySummary({ items }) {
  const cols = items.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
  return (
    <div className={`grid ${cols} gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.06]`}>
      {items.map((item) => (
        <div key={item.label} className="bg-[#0a0a0a] px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {item.label}
          </p>
          <p className={cn('mt-0.5 text-sm font-medium tabular-nums', item.tone || 'text-slate-200')}>
            {item.value}
          </p>
          {item.sub && <p className="mt-0.5 text-[10px] text-slate-500">{item.sub}</p>}
        </div>
      ))}
    </div>
  )
}

export function FormTotal({ label, amount, lines = [] }) {
  return (
    <div className="space-y-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3">
      {lines.length > 0 && (
        <div className="space-y-1 border-b border-white/[0.06] pb-2">
          {lines.map((line) => (
            <div key={line.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{line.label}</span>
              <span className="tabular-nums text-slate-400">{line.amount}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
        <span className="font-display text-lg font-semibold tabular-nums text-emerald-300">{amount}</span>
      </div>
    </div>
  )
}

export function FormActions({ children, className = '' }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4', className)}>
      {children}
    </div>
  )
}
