import { WorkOrderForm } from './WorkOrderForm'
import './WorkOrderDrawer.css'

type WorkOrderDrawerProps = {
  open: boolean
  title: string
  onClose: () => void
}

export function WorkOrderDrawer({
  open,
  title,
  onClose,
}: WorkOrderDrawerProps) {
  return (
    <div className={`work-order-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button
        type="button"
        className={`work-order-drawer-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-label="Cerrar formulario"
      />

      <aside className={`work-order-drawer-panel ${open ? 'is-open' : ''}`}>
        <header className="work-order-drawer-header">
          <h2>{title}</h2>
          <button type="button" className="work-order-drawer-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="work-order-drawer-body">
          <WorkOrderForm />
        </div>
      </aside>
    </div>
  )
}
