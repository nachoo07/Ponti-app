import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Share2, Trash2 } from 'lucide-react'
import { downloadWorkOrderDraftGroupPdf } from '../../../entities/workOrderDraft/api/downloadWorkOrderDraftGroupPdf'
import { downloadWorkOrderDraftPdf } from '../../../entities/workOrderDraft/api/downloadWorkOrderDraftPdf'
import { getWorkOrderDraftGroupById } from '../../../entities/workOrderDraft/api/getWorkOrderDraftGroupById'
import { formatWorkOrderDraftStatus } from '../../../entities/workOrderDraft/model/formatWorkOrderDraftStatus'
import { deleteWorkOrderDraft } from '../../../entities/workOrderDraft/api/deleteWorkOrderDraft'
import type { WorkOrderDraftGroupDetail } from '../../../entities/workOrderDraft/model/workOrderDraftDetail.types'
import { WorkOrderForm } from '../../../features/work-order/create/ui/WorkOrderForm'
import { mapDraftToFormValues } from '../../../features/work-order/create/model/mapDraftToFormValues'
import { ApiError } from '../../../shared/api/http'
import { updateWorkOrderDraftGroup } from '../../../entities/workOrderDraft/api/updateWorkOrderDraftGroup'
import type { UpdateWorkOrderDraftGroupPayload } from '../../../entities/workOrderDraft/model/workOrderDraft.types'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { useRefetchOnFocus } from '../../../shared/lib/useRefetchOnFocus'
import './WorkOrderDraftDetailPage.css'

function normalizeDetailDate(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-')
    return `${day}/${month}/${year}`
  }

  return trimmed || '-'
}

function displayValue(value: string | number | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined) return fallback

  const text = String(value).trim()
  return text || fallback
}

export function WorkOrderDraftDetailPage() {
  const { id } = useParams()
  const [draft, setDraft] = useState<WorkOrderDraftGroupDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  async function loadDraft(draftId: number) {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getWorkOrderDraftGroupById(draftId)
      setDraft(data)
      setIsEditing(false)
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 404) {
        setError('No se encontró la orden.')
      } else {
        setError(loadError instanceof Error ? loadError.message : 'Error cargando orden')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!id) {
      setError('Falta el ID de la orden')
      return
    }

    const draftId = Number(id)

    if (!Number.isFinite(draftId) || draftId <= 0) {
      setError('El ID de la orden es invalido')
      return
    }

    void loadDraft(draftId)
  }, [id])

   useRefetchOnFocus(() => {
    if (draft && !isEditing) {
      void loadDraft(draft.id)
    }
  })

  async function handleDraftSaved(savedDraftId: number) {
    await loadDraft(savedDraftId)
    setSaveError(null)
    setSaveFeedback('Borrador actualizado con exito.')
    setIsEditing(false)
  }

   async function handleConfirmDelete() {
    if (!draft) return

    setIsDeleting(true)
    setSaveError(null)

    try {
      // Una orden agrupada tiene un draft por lote: borramos todos.
      const draftIds = draft.lots?.length
        ? draft.lots.map((lot) => lot.draft_id)
        : [draft.id]

      for (const draftId of draftIds) {
        await deleteWorkOrderDraft(draftId)
      }

      navigate('/work-order-drafts')
    } catch (deleteError) {
      setSaveError(
        deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la orden.',
      )
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  async function handleDownloadDraftPdf() {
    if (!draft) return

    setIsDownloadingPdf(true)
    setPdfError(null)

    try {
      const downloadResult = isGroupedDraft
        ? await downloadWorkOrderDraftGroupPdf(draft.id)
        : await downloadWorkOrderDraftPdf(draft.id)

      const { blob, fileName } = downloadResult
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 1000)
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : isGroupedDraft
            ? 'No se pudo descargar el PDF completo.'
            : 'No se pudo descargar el PDF.'
      setPdfError(message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  async function handleShareDraftPdf() {
    if (!draft) return

    setIsDownloadingPdf(true)
    setPdfError(null)

    try {
      const downloadResult = isGroupedDraft
        ? await downloadWorkOrderDraftGroupPdf(draft.id)
        : await downloadWorkOrderDraftPdf(draft.id)

      const { blob, fileName } = downloadResult
      const file = new File([blob], fileName, { type: 'application/pdf' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: draft.number ? `Borrador ${draft.number}` : 'Borrador de orden digital',
        })
        return
      }

      setPdfError('Este dispositivo no soporta compartir archivos desde el navegador.')
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : 'No se pudo compartir el PDF.'
      setPdfError(message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }


  if (isLoading) {
    return (
      <main className="work-order-draft-detail-page">
        <section className="work-order-draft-detail-shell">
          <p className="work-order-draft-detail-feedback">Cargando ordenes...</p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="work-order-draft-detail-page">
        <section className="work-order-draft-detail-shell">
          <p className="work-order-draft-detail-feedback is-error">{error}</p>
        </section>
      </main>
    )
  }

  if (!draft) {
    return (
      <main className="work-order-draft-detail-page">
        <section className="work-order-draft-detail-shell">
          <p className="work-order-draft-detail-feedback">No se encontro la orden.</p>
        </section>
      </main>
    )
  }

  const initialValues = mapDraftToFormValues(draft)
  const isPublished = draft.status === 'published'
  const isGroupedDraft = Boolean(draft.lots && draft.lots.length > 1)
  const canEditGroupedDraft = !isPublished
  const lotsLabel = draft.lots?.length
    ? draft.lots.map((lot) => lot.lot_name).join(' y ')
    : displayValue(initialValues.lotDisplayName)
  const investorLabel = draft.investor_name
    ?? (draft.investor_splits?.length
      ? `${draft.investor_splits.length} inversores`
      : draft.investor_id
        ? `Inversor #${draft.investor_id}`
        : '-')

  return (
    <main className="work-order-draft-detail-page">
      <section className="work-order-draft-detail-shell">
        <Link to="/work-order-drafts" className="work-order-draft-detail-backLink">
          <ArrowLeft aria-hidden="true" />
          <span>Volver a órdenes</span>
        </Link>

        <header className="work-order-draft-detail-header">
          <div className="work-order-draft-detail-copy">
            <h1 className="work-order-draft-detail-title">
              {draft.number ?? '-'}
            </h1>
            <span className={`work-order-draft-detail-status is-${draft.status}`}>
              {formatWorkOrderDraftStatus(draft.status)}
            </span>
          </div>

          <div className="work-order-draft-detail-actions">
            <button
              type="button"
              className="work-order-draft-detail-editBtn"
              onClick={handleShareDraftPdf}
              disabled={isDownloadingPdf}
            >
              <Share2 aria-hidden="true" />
              {isDownloadingPdf
                ? 'Preparando PDF...'
                : 'Compartir PDF'}
            </button>

            <button
              type="button"
              className="work-order-draft-detail-editBtn"
              onClick={handleDownloadDraftPdf}
              disabled={isDownloadingPdf}
            >
              <Download aria-hidden="true" />
              {isDownloadingPdf
                ? 'Descargando PDF...'
                : 'Descargar PDF'}
            </button>
            {canEditGroupedDraft && !isPublished ? (
              <button
                type="button"
                className="work-order-draft-detail-editBtn is-primary"
                onClick={() => {
                  setSaveFeedback(null)
                  setSaveError(null)
                  setPdfError(null)
                  setIsEditing((current) => !current)
                }}
              >
                <Pencil aria-hidden="true" />
                {isEditing ? 'Cancelar edición' : 'Editar'}
              </button>
            ) : null}
               {!isPublished ? (
              <button
                type="button"
                className="work-order-draft-detail-editBtn is-danger"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 aria-hidden="true" />
                Eliminar
              </button>
            ) : null}
          </div>
        </header>
        {saveError ? (
          <div className="work-order-draft-detail-feedback is-error">
            <span>{saveError}</span>
            <button
              type="button"
              className="work-order-draft-detail-feedbackClose"
              onClick={() => setSaveError(null)}
              aria-label="Cerrar alerta"
            >
              ×
            </button>
          </div>
        ) : null}
        {saveFeedback ? (
          <div className="work-order-draft-detail-feedback is-success">
            <span>{saveFeedback}</span>
            <button
              type="button"
              className="work-order-draft-detail-feedbackClose"
              onClick={() => setSaveFeedback(null)}
              aria-label="Cerrar alerta"
            >
              ×
            </button>
          </div>
        ) : null}
        {pdfError ? (
          <div className="work-order-draft-detail-feedback is-error">
            <span>{pdfError}</span>
            <button
              type="button"
              className="work-order-draft-detail-feedbackClose"
              onClick={() => setPdfError(null)}
              aria-label="Cerrar alerta"
            >
              ×
            </button>
          </div>
        ) : null}

        {isEditing ? (
          <section className="work-order-draft-detail-formCard">
            <WorkOrderForm
              key={`${draft.id}-${isEditing ? 'editing' : 'readonly'}`}
              initialValues={initialValues}
              initialDraftId={draft.id}
              isReadOnly={isPublished || !isEditing}
              hideContextFields
              isGroupedDraft={isGroupedDraft}
              onUpdateDraft={async (draftId, payload) => {
                await updateWorkOrderDraftGroup(draftId, payload as UpdateWorkOrderDraftGroupPayload)
              }}
              onDraftSaved={handleDraftSaved}
              onDraftSaveError={setSaveError}
            />
          </section>
        ) : (
          <>
            <div className="work-order-draft-detail-contextGrid">
              <article className="work-order-draft-detail-contextItem">
                <span>Cliente</span>
                <strong>{draft.customer_name ?? `Cliente #${draft.customer_id}`}</strong>
              </article>
              <article className="work-order-draft-detail-contextItem">
                <span>Proyecto</span>
                <strong>{draft.project_name}</strong>
              </article>
              <article className="work-order-draft-detail-contextItem">
                <span>Campaña</span>
                <strong>{draft.campaign_name ?? 'Sin campaña'}</strong>
              </article>
              <article className="work-order-draft-detail-contextItem">
                <span>Campo</span>
                <strong>{draft.field_name}</strong>
              </article>
            </div>

            <div className="work-order-draft-detail-overviewGrid">
              <article className="work-order-draft-detail-infoCard">
                <h2>Resumen de trabajo</h2>
                <div className="work-order-draft-detail-infoGrid">
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Lotes</span>
                    <strong>{lotsLabel}</strong>
                  </div>
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Superficie</span>
                    <strong>{displayValue(draft.effective_area)} ha</strong>
                  </div>
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Fecha</span>
                    <strong>{normalizeDetailDate(draft.date)}</strong>
                  </div>
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Labor</span>
                    <strong title={displayValue(draft.labor_name)}>{displayValue(draft.labor_name)}</strong>
                  </div>
                </div>
              </article>

              <article className="work-order-draft-detail-infoCard">
                <h2>Detalle operativo</h2>
                <div className="work-order-draft-detail-infoGrid">
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Número de orden</span>
                    <strong>{displayValue(draft.number)}</strong>
                  </div>
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Contratista</span>
                    <strong>{displayValue(draft.contractor)}</strong>
                  </div>
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Cultivo actual</span>
                    <strong>{displayValue(draft.crop_name)}</strong>
                  </div>
                  <div className="work-order-draft-detail-readonlyField">
                    <span>Inversor del labor</span>
                    <strong>{investorLabel}</strong>
                  </div>
                </div>
              </article>
            </div>





            <section className="work-order-draft-detail-suppliesCard">
              <h2>Carga de insumos</h2>

              {/* Tabla — visible solo en desktop */}
              <div className="work-order-draft-detail-suppliesTableWrap">
                <table className="work-order-draft-detail-suppliesTable">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Total utilizado</th>
                      <th>Dosis final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.items.length === 0 ? (
                      <tr><td colSpan={3}>Sin insumos cargados.</td></tr>
                    ) : (
                      draft.items.map((item) => (
                        <tr key={`${item.supply_id}-${item.supply_name}`}>
                          <td>{displayValue(item.supply_name, `Insumo #${item.supply_id}`)}</td>
                          <td>{displayValue(item.total_used)}</td>
                          <td>{displayValue(item.final_dose)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cards — visible solo en mobile */}
              <div className="work-order-draft-detail-suppliesList">
                {draft.items.length === 0 ? (
                  <p className="work-order-draft-detail-suppliesEmpty">Sin insumos cargados.</p>
                ) : (
                  draft.items.map((item) => (
                    <div key={`${item.supply_id}-${item.supply_name}`} className="work-order-draft-detail-supplyItem">
                      <div className="work-order-draft-detail-readonlyField work-order-draft-detail-supplyName">
                        <span>Insumo</span>
                        <strong title={displayValue(item.supply_name, `Insumo #${item.supply_id}`)}>
                          {displayValue(item.supply_name, `Insumo #${item.supply_id}`)}
                        </strong>
                      </div>
                      <div className="work-order-draft-detail-supplyRow">
                        <div className="work-order-draft-detail-readonlyField">
                          <span>Total utilizado</span>
                          <strong>{displayValue(item.total_used)}</strong>
                        </div>
                        <div className="work-order-draft-detail-readonlyField">
                          <span>Dosis final</span>
                          <strong>{displayValue(item.final_dose)}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="work-order-draft-detail-observations">
                <span>Observaciones</span>
                <p>{draft.observations?.trim() || 'Sin observaciones cargadas.'}</p>
              </div>
            </section>
          </>
        )}

      </section>
       <ConfirmDialog
          open={isConfirmOpen}
          title="Eliminar orden"
          message="¿Eliminar esta orden? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          isConfirming={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />
    </main>
  )
}
