import { Link } from 'react-router-dom'
import { WorkOrderBatchForm } from '../../../features/work-order/create/ui/WorkOrderBatchForm'
import './WorkOrdersPage.css'

export function WorkOrdersPage() {
  return (
    <main className="work-order-create-page">
      <section className="work-order-create-shell">
        <header className="work-order-create-header">
          <div className="work-order-create-copy">
            <p className="work-order-create-eyebrow">Orden digital</p>
            <h1 className="work-order-create-title">Nueva Orden de Trabajo</h1>
            <p className="work-order-create-description">
              Completa el contexto del proyecto, reparte lotes e insumos y guarda borradores listos
              para compartir.
            </p>
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
