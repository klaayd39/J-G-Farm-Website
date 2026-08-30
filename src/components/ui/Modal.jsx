import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
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
      className={`${maxWidth} m-auto flex max-h-[min(90vh,720px)] w-[calc(100%-1rem)] flex-col overflow-hidden rounded-xl border border-[#d7ffe0]/10 bg-[#0a0a0a] p-0 text-[#d7ffe0] shadow-xl backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:w-[calc(100%-2rem)]`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#d7ffe0]/8 px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="truncate pr-3 text-sm font-medium text-white">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
    </dialog>
  )
}
