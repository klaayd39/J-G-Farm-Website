import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className={cn(
        maxWidth,
        'm-auto max-h-[min(90dvh,720px)] w-[calc(100%-0.75rem)] flex-col overflow-hidden rounded-xl border border-app bg-app-surface p-0 text-app shadow-xl backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:w-[calc(100%-2rem)]',
        open ? 'flex' : 'hidden'
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-app px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="truncate pr-3 text-sm font-medium text-app-primary">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        {open ? children : null}
      </div>
    </dialog>
  )
}
