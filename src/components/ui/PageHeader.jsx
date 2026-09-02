export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-app-muted sm:text-[11px]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-xl font-medium tracking-tight text-app-primary sm:text-2xl lg:text-[1.65rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-app-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="w-full min-w-0 shrink-0 lg:max-w-[min(100%,36rem)] lg:flex-1 lg:basis-[min(100%,36rem)]">
          {actions}
        </div>
      )}
    </header>
  )
}
