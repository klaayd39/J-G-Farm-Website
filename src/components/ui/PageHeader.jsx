export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:text-[11px]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-xl font-medium tracking-tight text-white sm:text-2xl lg:text-[1.65rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto lg:min-w-[18rem] xl:min-w-[22rem]">
          {actions}
        </div>
      )}
    </header>
  )
}
