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
      className={`${maxWidth} max-h-[90vh] sm:max-h-[85vh] w-[calc(100%-1.5rem)] sm:w-full rounded-xl border border-white/[0.08] bg-[#0e1613] p-0 text-white shadow-xl backdrop:bg-black/70 backdrop:backdrop-blur-sm overflow-hidden my-auto mx-auto`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5 sticky top-0 bg-[#0e1613] z-10">
        <h2 className="text-sm font-medium text-white pr-2 truncate">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white shrink-0"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-5 py-4 overflow-y-auto max-h-[calc(90vh-52px)] sm:max-h-[calc(85vh-52px)]">{children}</div>
    </dialog>
  )
}
