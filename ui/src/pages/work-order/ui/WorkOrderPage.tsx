import { Link } from 'react-router-dom'
import { WorkOrderBatchForm } from '../../../features/work-order/create/ui/WorkOrderBatchForm'
import './WorkOrdersPage.css'

export function WorkOrdersPage() {
  return (
    <main className="work-order-create-page">
      <section className="work-order-create-shell">
        <header className="work-order-create-header">
          <div className="work-order-create-copy">
            <h1 className="work-order-create-title">Nueva Orden de Trabajo</h1>
          </div>

          <div className="work-order-create-actions">
            <Link to="/work-order-drafts" className="work-order-create-link">
              Ver ordenes
            </Link>
          </div>
        </header>

        <section className="work-order-create-formCard">
          <WorkOrderBatchForm />
        </section>
      </section>
    </main>
  )
}