export function Panel({ title, description, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-white/8 bg-[#101916]/80 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.7)] ring-1 ring-white/4 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-white/6 px-4 sm:px-5 py-3.5 sm:py-4">
          <div>
            {title && <h2 className="text-xs sm:text-sm font-semibold text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}
