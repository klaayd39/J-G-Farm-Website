export function Panel({ title, description, action, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-[#d7ffe0]/10 bg-[#0a0a0a]/80 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.7)] ring-1 ring-[#d7ffe0]/5 sm:rounded-2xl ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-white/6 px-3.5 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            {title && <h2 className="truncate text-xs font-semibold text-white sm:text-sm">{title}</h2>}
            {description && <p className="mt-0.5 text-[11px] leading-snug text-slate-400 sm:text-xs">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="p-3.5 sm:p-5">{children}</div>
    </section>
  )
}
