import './ConfirmDialog.css'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="confirm-dialog-backdrop"
        onClick={onCancel}
        aria-label="Cerrar"
        disabled={isConfirming}
      />
      <div className="confirm-dialog-panel">
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">{title}</h2>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn is-secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-dialog-btn is-danger"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}