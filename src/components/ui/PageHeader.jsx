export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:gap-5 lg:flex-row lg:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2 pt-1 lg:pt-0">{actions}</div>}
    </div>
  )
}
