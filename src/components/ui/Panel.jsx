export function Panel({ title, description, action, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-app bg-app-surface/80 shadow-[0_16px_40px_-24px_var(--app-shadow)] ring-1 ring-[color-mix(in_oklab,var(--app-text)_5%,transparent)] sm:rounded-2xl ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-app px-3.5 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            {title && <h2 className="truncate text-xs font-semibold text-app-primary sm:text-sm">{title}</h2>}
            {description && <p className="mt-0.5 text-[11px] leading-snug text-slate-400 sm:text-xs">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="p-3.5 sm:p-5">{children}</div>
    </section>
  )
}
