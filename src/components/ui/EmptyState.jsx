export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-app bg-app-surface/60 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 rounded-2xl bg-emerald-500/10 p-3.5 text-emerald-400 ring-1 ring-emerald-400/15">
          <Icon size={28} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-display text-xl font-medium text-app-primary">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-app-secondary">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
