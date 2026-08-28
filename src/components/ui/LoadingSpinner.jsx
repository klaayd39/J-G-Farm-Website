export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-400" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{text}</p>
    </div>
  )
}

export function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 flex-1 animate-pulse rounded bg-white/6" />
          <div className="h-4 w-24 animate-pulse rounded bg-white/6" />
          <div className="h-4 w-20 animate-pulse rounded bg-white/6" />
        </div>
      ))}
    </div>
  )
}
