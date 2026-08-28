export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-850/40 p-8 text-center sm:p-12">
      {Icon && (
        <div className="mb-4 rounded-2xl bg-slate-800/80 p-4 text-emerald-400 ring-1 ring-slate-700/50">
          <Icon size={36} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
