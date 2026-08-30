import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export function QueryError({ message, onRetry }) {
  if (!message) return null

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">Could not load data</p>
        <p className="mt-1 text-rose-100/90">{message}</p>
        {onRetry && (
          <Button type="button" variant="secondary" className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}
