import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm leading-relaxed text-app-secondary">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Please wait…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
