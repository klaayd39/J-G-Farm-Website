export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:gap-5 lg:flex-row lg:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl lg:text-[2.15rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 sm:mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2 pt-1 lg:pt-0">{actions}</div>}
    </div>
  )
}
