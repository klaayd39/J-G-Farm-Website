export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-500" />
      </div>
      <p className="mt-4 text-sm text-slate-400">{text}</p>
    </div>
  )
}

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-700/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-700/50" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-700/50" />
        </div>
      ))}
    </div>
  )
}
