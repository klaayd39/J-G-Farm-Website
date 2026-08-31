import { X } from 'lucide-react'

export function MobileDrawer({ open, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="relative flex h-full w-[min(100%,20rem)] flex-col bg-farm-bg shadow-2xl safe-top">
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}
