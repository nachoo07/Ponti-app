import { WorkOrderBatchForm } from '../../../features/work-order/create/ui/WorkOrderBatchForm'
import './WorkOrdersPage.css'

export function WorkOrdersPage() {
  return (
    <main className="work-order-create-page">
      <WorkOrderBatchForm />
    </main>
  )
}