import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { downloadWorkOrderDraftGroupPdf } from '../../../entities/workOrderDraft/api/downloadWorkOrderDraftGroupPdf'
import { downloadWorkOrderDraftPdf } from '../../../entities/workOrderDraft/api/downloadWorkOrderDraftPdf'
import { getWorkOrderDraftById } from '../../../entities/workOrderDraft/api/getWorkOrderDraftById'
import { formatWorkOrderDraftStatus } from '../../../entities/workOrderDraft/model/formatWorkOrderDraftStatus'
import type { WorkOrderDraftDetail } from '../../../entities/workOrderDraft/model/workOrderDraftDetail.types'
import { WorkOrderForm } from '../../../features/work-order/create/ui/WorkOrderForm'
import { mapDraftToFormValues } from '../../../features/work-order/create/model/mapDraftToFormValues'
import { ApiError } from '../../../shared/api/http'
import './WorkOrderDraftDetailPage.css'

export function WorkOrderDraftDetailPage() {
  const { id } = useParams()
  const [draft, setDraft] = useState<WorkOrderDraftDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function loadDraft(draftId: number) {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getWorkOrderDraftById(draftId)
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

  async function handleDraftSaved(savedDraftId: number) {
    await loadDraft(savedDraftId)
    setSaveError(null)
    setSaveFeedback('Borrador actualizado con exito.')
    setIsEditing(false)
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
  const isGroupedDraft = /^D-\d+\.\d+$/.test(draft.number)

  return (
    <main className="work-order-draft-detail-page">
      <section className="work-order-draft-detail-shell">
        <header className="work-order-draft-detail-header">
          <div className="work-order-draft-detail-copy">
            <p className="work-order-draft-detail-eyebrow">
              {isPublished ? 'Orden digital publicada' : 'Orden digital abierta'}
            </p>
            <h1 className="work-order-draft-detail-title">
              {draft.number ? `${draft.number} · ` : ''}
              {draft.project_name}
            </h1>
          </div>

          <div className="work-order-draft-detail-actions">
            <span className={`work-order-draft-detail-status is-${draft.status}`}>
              {formatWorkOrderDraftStatus(draft.status)}
            </span>
            <button
              type="button"
              className="work-order-draft-detail-editBtn"
              onClick={handleShareDraftPdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf
                ? 'Preparando PDF...'
                : isGroupedDraft
                  ? 'Compartir PDF completo'
                  : 'Compartir PDF'}
            </button>
            <button
              type="button"
              className="work-order-draft-detail-editBtn"
              onClick={handleDownloadDraftPdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf
                ? 'Descargando PDF...'
                : isGroupedDraft
                  ? 'Descargar PDF completo'
                  : 'Descargar PDF'}
            </button>
            {!isPublished ? (
              <button
                type="button"
                className="work-order-draft-detail-editBtn"
                onClick={() => {
                  setSaveFeedback(null)
                  setSaveError(null)
                  setPdfError(null)
                  setIsEditing((current) => !current)
                }}
              >
                {isEditing ? 'Cancelar edición' : 'Editar'}
              </button>
            ) : null}
            <Link to="/work-order-drafts" className="work-order-draft-detail-link">
              Volver a ordenes
            </Link>
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

        <section className="work-order-draft-detail-metaCard">
          <div className="work-order-draft-detail-metaGrid">
            <article className="work-order-draft-detail-metaItem">
              <span>Cliente</span>
              <strong>{draft.customer_name ?? `Cliente #${draft.customer_id}`}</strong>
            </article>
            <article className="work-order-draft-detail-metaItem">
              <span>Proyecto</span>
              <strong>{draft.project_name}</strong>
            </article>
            <article className="work-order-draft-detail-metaItem">
              <span>Campaña</span>
              <strong>{draft.campaign_name ?? 'Sin campaña'}</strong>
            </article>
            <article className="work-order-draft-detail-metaItem">
              <span>Campo</span>
              <strong>{draft.field_name}</strong>
            </article>
          </div>
        </section>

        <section className="work-order-draft-detail-formCard">
          <WorkOrderForm
            key={`${draft.id}-${draft.updated_at}-${isEditing ? 'editing' : 'readonly'}`}
            initialValues={initialValues}
            initialDraftId={draft.id}
            isReadOnly={isPublished || !isEditing}
            hideContextFields
            onDraftSaved={handleDraftSaved}
            onDraftSaveError={setSaveError}
          />
        </section>
      </section>
    </main>
  )
}
