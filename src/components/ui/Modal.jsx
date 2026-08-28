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
      className={`${maxWidth} max-h-[90vh] sm:max-h-[85vh] w-[calc(100%-1.5rem)] sm:w-full rounded-2xl border border-white/10 bg-[#121c18] p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md overflow-hidden my-auto mx-auto`}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-4 sm:px-6 py-3.5 sm:py-4 sticky top-0 bg-[#121c18] z-10">
        <h2 className="font-display text-base sm:text-lg font-medium tracking-tight pr-2 truncate">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white shrink-0"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto max-h-[calc(90vh-60px)] sm:max-h-[calc(85vh-65px)]">{children}</div>
    </dialog>
  )
}
