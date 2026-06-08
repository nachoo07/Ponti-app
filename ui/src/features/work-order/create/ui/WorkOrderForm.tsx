import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { InvestorSplit, Lot } from '../../../../entities/project/model/project.types'
import { useWorkOrderWorkspace } from '../model/useWorkOrderWorkspace'
import { getSuppliesByProject } from '../../../../entities/supply/api/getSuppliesByProject'
import { createPendingSupply } from '../../../../entities/supply/api/createPendingSupply'
import { buildCreateWorkOrderDraftPayload } from '../model/buildCreateWorkOrderDraftPayload'
import { validateCreateWorkOrderDraft } from '../model/validateCreateWorkOrderDraft'
import { createWorkOrderDraft } from '../../../../entities/workOrderDraft/api/createWorkOrderDraft'
import { downloadWorkOrderDraftPdf } from '../../../../entities/workOrderDraft/api/downloadWorkOrderDraftPdf'
import { previewDigitalWorkOrderNumber } from '../../../../entities/workOrderDraft/api/previewDigitalWorkOrderNumber'
import type { Supply } from '../../../../entities/supply/model/supply.types'
import type { WorkOrderDraftFormValues } from '../model/mapDraftToFormValues'
import { updateWorkOrderDraft } from '../../../../entities/workOrderDraft/api/updateWorkOrderDraft'
import type {
  CreateWorkOrderDraftPayload,
  UpdateWorkOrderDraftGroupPayload,
} from '../../../../entities/workOrderDraft/model/workOrderDraft.types'
import { buildUpdateWorkOrderDraftGroupPayload } from '../model/buildUpdateWorkOrderDraftGroupPayload'
import type { BatchSharedSupplyFormRow } from '../model/workOrderBatchForm.types'
import {
  getTodayDateInputValue,
  parseDecimal,
  formatCalculatedDecimal,
  formatDoseDecimal,
  normalizeDecimalInput,
  normalizeDoseInput,
  buildEmptySupplyRow,
} from '../model/workOrderBatchForm.helpers'
import { SupplyRowsTable } from './SupplyRowsTable'
import './WorkOrderForm.css'

const styles = {
  page: 'wof-page',
  card: 'wof-card',
  header: 'wof-header',
  title: 'wof-title',
  form: 'wof-form',
  grid3: 'wof-grid3',
  field: 'wof-field',
  box: 'wof-box',
  boxHeader: 'wof-boxHeader',
  subtitle: 'wof-subtitle',
  checkRow: 'wof-checkRow',
  splitList: 'wof-splitList',
  splitRow: 'wof-splitRow',
  dangerBtn: 'wof-dangerBtn',
  secondaryBtn: 'wof-secondaryBtn',
  inputsSection: 'wof-inputsSection',
  sectionHeader: 'wof-sectionHeader',
  insumoGridHead: 'wof-insumoGridHead',
  actionsCol: 'wof-actionsCol',
  insumoRow: 'wof-insumoRow',
  footerActions: 'wof-footerActions',
  primaryBtn: 'wof-primaryBtn',
} as const

type WorkOrderFormProps = {
  initialValues?: WorkOrderDraftFormValues
  initialDraftId?: number | null
  isReadOnly?: boolean
  hideContextFields?: boolean
  isGroupedDraft?: boolean
  onUpdateDraft?: (
    draftId: number,
    payload: CreateWorkOrderDraftPayload | UpdateWorkOrderDraftGroupPayload,
  ) => Promise<void>
  onDraftSaved?: (draftId: number) => void | Promise<void>
  onDraftSaveError?: (message: string | null) => void
}

export function WorkOrderForm({
  initialValues,
  initialDraftId,
  isReadOnly = false,
  hideContextFields = false,
  isGroupedDraft = false,
  onUpdateDraft,
  onDraftSaved,
  onDraftSaveError,
}: WorkOrderFormProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<number | ''>(
    initialValues?.selectedFieldId ?? '',
  )
  const [lots, setLots] = useState<Lot[]>([])
  const [selectedLotId, setSelectedLotId] = useState<number | ''>(
    initialValues?.selectedLotId ?? '',
  )
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)

  const [selectedLaborId, setSelectedLaborId] = useState<number | ''>(
    initialValues?.selectedLaborId ?? '',
  )

  const [contractor, setContractor] = useState(initialValues?.contractor ?? '')
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | ''>(
    initialValues?.selectedInvestorId ?? '',
  )
  const [splitContribution, setSplitContribution] = useState(
    initialValues?.splitContribution ?? false,
  )
  const [investorSplits, setInvestorSplits] = useState<InvestorSplit[]>(
    initialValues?.investorSplits ?? [{ investor_id: '', percentage: '' }],
  )

  const [supplies, setSupplies] = useState<Supply[]>([])
  const [isLoadingSupplies, setIsLoadingSupplies] = useState(false)
  const [suppliesError, setSuppliesError] = useState<string | null>(null)

  const [supplyRows, setSupplyRows] = useState<BatchSharedSupplyFormRow[]>(
    initialValues?.supplyRows ?? [buildEmptySupplyRow()],
  )

  const [openSupplySelectorRowId, setOpenSupplySelectorRowId] = useState<string | null>(null)
  const [supplySearchByRow, setSupplySearchByRow] = useState<Record<string, string>>({})
  const [pendingSupplyRowId, setPendingSupplyRowId] = useState<string | null>(null)
  const [pendingSupplyName, setPendingSupplyName] = useState('')
  const [pendingSupplyError, setPendingSupplyError] = useState<string | null>(null)
  const [isCreatingPendingSupply, setIsCreatingPendingSupply] = useState(false)
  const shouldRecalculateDoseOnAreaChange = useRef(!initialValues)

  const [effectiveArea, setEffectiveArea] = useState(initialValues?.effectiveArea ?? '')
  const [observations, setObservations] = useState(initialValues?.observations ?? '')
  const [workOrderNumber, setWorkOrderNumber] = useState(initialValues?.workOrderNumber ?? '')
  const [workOrderDate, setWorkOrderDate] = useState(
    initialValues?.workOrderDate ?? getTodayDateInputValue(),)
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | ''>(
    initialValues?.selectedCampaignId ?? '',
  )
  const [isLoadingNumberPreview, setIsLoadingNumberPreview] = useState(false)
  const [numberPreviewError, setNumberPreviewError] = useState<string | null>(null)

  const [draftId, setDraftId] = useState<number | null>(initialDraftId ?? null)
  const [lastCreatedDraftId, setLastCreatedDraftId] = useState<number | null>(null)
  const [lastCreatedDraftNumber, setLastCreatedDraftNumber] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [saveDraftError, setSaveDraftError] = useState<string | null>(null)
  const [saveDraftSuccessMessage, setSaveDraftSuccessMessage] = useState<string | null>(null)
  const [pdfActionError, setPdfActionError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const resetProjectDependentSelections = () => {
    setSelectedFieldId('')
    setLots([])
    setSelectedLotId('')
    setSelectedLot(null)
    setSelectedCampaignId('')
    setSelectedLaborId('')
    setContractor('')
    setSelectedInvestorId('')
    setSplitContribution(false)
    setInvestorSplits([{ investor_id: '', percentage: '' }])
    setSupplies([])
    setSuppliesError(null)
    setSupplyRows([buildEmptySupplyRow()])
    setObservations('')
    setWorkOrderNumber('')
    setNumberPreviewError(null)
  }

  const resetFormAfterCreate = () => {
    setSelectedFieldId('')
    setLots([])
    setSelectedLotId('')
    setSelectedLot(null)
    setSelectedCampaignId('')
    setSelectedLaborId('')
    setContractor('')
    setSelectedInvestorId('')
    setSplitContribution(false)
    setInvestorSplits([{ investor_id: '', percentage: '' }])
    setSupplies([])
    setSuppliesError(null)
    setSupplyRows([buildEmptySupplyRow()])
    setEffectiveArea('')
    setObservations('')
    setWorkOrderDate(getTodayDateInputValue())
    setWorkOrderNumber('')
    setSaveDraftError(null)
    setNumberPreviewError(null)
    setValidationErrors([])
    setDraftId(null)
  }

  const {
    customers,
    isLoadingCustomers,
    customersError,
    selectedCustomerId,
    handleCustomerChange,
    projects,
    isLoadingProjects,
    projectsError,
    selectedProjectId,
    selectedProject,
    handleProjectChange,
    campaigns,
    isLoadingCampaigns,
    campaignsError,
    selectedProjectDetail,
    isLoadingProjectDetail,
    projectDetailError,
    labors,
    isLoadingLabors,
    laborsError,
  } = useWorkOrderWorkspace({
    onCustomerChange: resetProjectDependentSelections,
    onProjectChange: resetProjectDependentSelections,
    initialCustomerId: initialValues?.selectedCustomerId,
    initialProjectId: initialValues?.selectedProjectId,
  })

  useEffect(() => {
    if (selectedProjectId === '') return

    const projectId = selectedProjectId
    let cancelled = false

    async function loadSupplies() {
      setIsLoadingSupplies(true)
      setSuppliesError(null)

      try {
        const data = await getSuppliesByProject({
          projectId,
        })
        if (cancelled || selectedProjectId !== projectId) return
        setSupplies(data)
      } catch (error) {
        if (cancelled || selectedProjectId !== projectId) return
        const message = error instanceof Error ? error.message : 'Error cargando insumos'
        setSupplies([])
        setSuppliesError(message)
      } finally {
        if (!cancelled && selectedProjectId === projectId) {
          setIsLoadingSupplies(false)
        }
      }
    }

    void loadSupplies()

    return () => {
      cancelled = true
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (selectedProjectId === '' || draftId) return

    let cancelled = false

    async function loadPreviewNumber() {
      setIsLoadingNumberPreview(true)
      setNumberPreviewError(null)

      try {
        const response = await previewDigitalWorkOrderNumber({
          project_id: Number(selectedProjectId),
        })

        if (cancelled) return
        setWorkOrderNumber(response.number)
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error ? error.message : 'No se pudo obtener el numero sugerido'
        setNumberPreviewError(message)
      } finally {
        if (!cancelled) {
          setIsLoadingNumberPreview(false)
        }
      }
    }

    void loadPreviewNumber()

    return () => {
      cancelled = true
    }
  }, [selectedProjectId, draftId])


  useEffect(() => {
    if (!shouldRecalculateDoseOnAreaChange.current) {
      return
    }

    const surface = parseDecimal(effectiveArea)

    setSupplyRows((current) =>
      current.map((row) => {
        if (row.total_used === '') {
          return { ...row, final_dose: '' }
        }

        const totalUsed = parseDecimal(row.total_used)
        const finalDose =
          surface > 0 ? formatDoseDecimal(totalUsed / surface) : ''

        return {
          ...row,
          final_dose: finalDose,
        }
      }),
    )
  }, [effectiveArea])

  useEffect(() => {
    if (!selectedProjectDetail || selectedFieldId === '') return

    const selectedField =
      selectedProjectDetail.fields?.find((field) => field.id === selectedFieldId) ?? null

    const nextLots = selectedField?.lots ?? []
    setLots(nextLots)

    if (selectedLotId === '') return

    const nextSelectedLot =
      nextLots.find((lot) => lot.id === selectedLotId) ?? null

    setSelectedLot(nextSelectedLot)
  }, [selectedProjectDetail, selectedFieldId, selectedLotId])

  const projectInvestors = selectedProjectDetail?.investors ?? []

  function handleNumberBlur() {
    if (selectedProjectId === '') return

    void (async () => {
      setIsLoadingNumberPreview(true)
      setNumberPreviewError(null)

      try {
        const response = await previewDigitalWorkOrderNumber({
          project_id: Number(selectedProjectId),
          ...(workOrderNumber.trim() ? { number: workOrderNumber.trim() } : {}),
        })
        setWorkOrderNumber(response.number)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo validar el numero sugerido'
        setNumberPreviewError(message)
      } finally {
        setIsLoadingNumberPreview(false)
      }
    })()
  }

  const availableSupplies = useMemo(() => supplies, [supplies])

  function updateSupplyRow(rowId: string, updates: Partial<BatchSharedSupplyFormRow>) {
    setSupplyRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, ...updates } : row)),
    )
  }

  function handleOpenSupplySelector(rowId: string) {
    setOpenSupplySelectorRowId(rowId)
    setPendingSupplyRowId(null)
    setPendingSupplyError(null)
  }

  function handleCloseSupplySelector() {
    setOpenSupplySelectorRowId(null)
    setPendingSupplyRowId(null)
    setPendingSupplyName('')
    setPendingSupplyError(null)
  }

  function handleSelectSupply(rowId: string, supply: Supply) {
    updateSupplyRow(rowId, { supply_id: supply.id, supply_name: supply.name })
    setOpenSupplySelectorRowId(null)
  }

  function handleOpenPendingSupplyCreator(rowId: string) {
    setPendingSupplyRowId(rowId)
    setPendingSupplyName('')
    setPendingSupplyError(null)
  }

  function handleClosePendingSupplyCreator() {
    setPendingSupplyRowId(null)
    setPendingSupplyName('')
    setPendingSupplyError(null)
  }

  async function handleCreatePendingSupply() {
    if (selectedProjectId === '' || pendingSupplyRowId === null) return

    const normalizedName = pendingSupplyName.trim()
    if (!normalizedName) {
      setPendingSupplyError('Ingresá un nombre para el insumo.')
      return
    }

    setIsCreatingPendingSupply(true)
    setPendingSupplyError(null)

    try {
      const response = await createPendingSupply({
        project_id: selectedProjectId as number,
        name: normalizedName,
      })

      const nextSupply: Supply = {
        id: response.id,
        name: response.name,
        is_pending: response.is_pending,
        price: '0',
        category_name: '',
        type_name: '',
      }

      setSupplies((current) => {
        if (current.some((item) => item.id === nextSupply.id)) return current
        return [...current, nextSupply].sort((a, b) => a.name.localeCompare(b.name))
      })

      updateSupplyRow(pendingSupplyRowId, {
        supply_id: response.id,
        supply_name: response.name,
      })

      handleCloseSupplySelector()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el insumo pendiente.'
      setPendingSupplyError(message)
    } finally {
      setIsCreatingPendingSupply(false)
    }
  }

  function updateSupplyRowFromTotalUsed(rowId: string, value: string) {
    const normalized = normalizeDecimalInput(value)
    const area = parseDecimal(effectiveArea)
    setSupplyRows((current) =>
      current.map((row) => {
        if (row.rowId !== rowId) return row
        const dose = area > 0 && normalized !== ''
          ? formatDoseDecimal(parseDecimal(normalized) / area).replace('.', ',')
          : ''
        return { ...row, total_used: normalized, final_dose: dose, last_edited_field: 'total_used' as const }
      }),
    )
  }

  function updateSupplyRowFromFinalDose(rowId: string, value: string) {
    const normalized = normalizeDoseInput(value)
    const area = parseDecimal(effectiveArea)
    setSupplyRows((current) =>
      current.map((row) => {
        if (row.rowId !== rowId) return row
        const doseNum = parseDecimal(normalized.replace(',', '.'))
        const total = area > 0 && normalized !== ''
          ? formatCalculatedDecimal(doseNum * area)
          : ''
        return { ...row, final_dose: normalized, total_used: total, last_edited_field: 'final_dose' as const }
      }),
    )
  }

  function handleRemoveSupplyRow(rowId: string) {
    setSupplyRows((current) => {
      const next = current.filter((row) => row.rowId !== rowId)
      return next.length === 0 ? [buildEmptySupplyRow()] : next
    })
    setSupplySearchByRow((current) => {
      const next = { ...current }
      delete next[rowId]
      return next
    })
    if (openSupplySelectorRowId === rowId) handleCloseSupplySelector()
  }

  function handleAddSupplyRow() {
    setSupplyRows((current) => [...current, buildEmptySupplyRow()])
  }

  async function handleSaveDraft() {
    const missingBaseFields =
      selectedCustomerId === '' ||
      selectedProjectId === '' ||
      selectedFieldId === '' ||
      selectedLaborId === ''

    const missingSingleLotFields = !isGroupedDraft && (selectedLotId === '' || selectedLot === null)

    if (missingBaseFields || missingSingleLotFields) {
      setValidationErrors(['Completá los datos obligatorios antes de guardar la orden.'])
      setSaveDraftError(null)
      setSaveDraftSuccessMessage(null)
      return
    }

    const customerId = selectedCustomerId as number
    const projectId = selectedProjectId as number
    const fieldId = selectedFieldId as number
    const lotId = selectedLotId as number
    const selectedLabor = labors.find((labor) => labor.id === selectedLaborId)

    if (!selectedLabor) {
      setValidationErrors(['No se encontró la labor seleccionada.'])
      setSaveDraftError(null)
      setSaveDraftSuccessMessage(null)
      return
    }

    const payload: CreateWorkOrderDraftPayload | UpdateWorkOrderDraftGroupPayload = isGroupedDraft
      ? buildUpdateWorkOrderDraftGroupPayload({
        number: workOrderNumber,
        date: workOrderDate,
        customerId,
        projectId,
        campaignId: selectedCampaignId === '' ? null : selectedCampaignId,
        fieldId,
        cropId: initialValues?.selectedCropId || selectedLot?.current_crop_id || 0,
        selectedLabor,
        contractor,
        observations,
        selectedInvestorId: selectedInvestorId === '' ? 0 : selectedInvestorId,
        splitContribution,
        investorSplits,
        supplyRows,
      })
      : buildCreateWorkOrderDraftPayload({
        number: workOrderNumber,
        date: workOrderDate,
        customerId,
        projectId,
        campaignId: selectedCampaignId === '' ? null : selectedCampaignId,
        fieldId,
        lotId,
        selectedLot: selectedLot!,
        selectedLabor,
        contractor,
        effectiveArea,
        observations,
        selectedInvestorId: selectedInvestorId === '' ? 0 : selectedInvestorId,
        splitContribution,
        investorSplits,
        supplyRows,
      })

    if (!isGroupedDraft) {
      const errors = validateCreateWorkOrderDraft(payload as CreateWorkOrderDraftPayload)

      if (errors.length > 0) {
        setValidationErrors(errors)
        setSaveDraftError(null)
        setSaveDraftSuccessMessage(null)
        return
      }
    }

    setPdfActionError(null)
    setIsSavingDraft(true)
    if (draftId) {
      setLastCreatedDraftId(null)
      setLastCreatedDraftNumber(null)
    }
    setValidationErrors([])
    setSaveDraftError(null)
    setSaveDraftSuccessMessage(null)

    try {
      if (draftId) {
        if (onUpdateDraft) {
          await onUpdateDraft(draftId, payload)
        } else {
          await updateWorkOrderDraft(draftId, payload as CreateWorkOrderDraftPayload)
        }

        setDraftId(draftId)
        setSaveDraftSuccessMessage(
          payload.number
            ? `Orden ${payload.number} actualizada correctamente.`
            : 'Orden actualizada correctamente.',
        )
        onDraftSaveError?.(null)
        await onDraftSaved?.(draftId)
      } else {
        const response = await createWorkOrderDraft(payload as CreateWorkOrderDraftPayload)
        setLastCreatedDraftId(response.id)
        setLastCreatedDraftNumber(payload.number ?? null)
        setPdfActionError(null)
        setSaveDraftSuccessMessage(
          payload.number
            ? `Orden ${payload.number} creada como borrador en Ponti.`
            : 'Orden creada como borrador en Ponti.',
        )
        onDraftSaveError?.(null)
        await onDraftSaved?.(response.id)
        resetFormAfterCreate()
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error guardando orden'
      setSaveDraftError(message)
      onDraftSaveError?.(message)
    } finally {
      setIsSavingDraft(false)
    }
  }

  async function handleDownloadDraftPdf() {
    if (!lastCreatedDraftId) return

    setIsDownloadingPdf(true)
    setPdfActionError(null)

    try {
      const { blob, fileName } = await downloadWorkOrderDraftPdf(lastCreatedDraftId)
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo descargar el PDF.'
      setPdfActionError(message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  async function handleShareDraftPdf() {
    if (!lastCreatedDraftId) return

    setIsDownloadingPdf(true)
    setPdfActionError(null)

    try {
      const { blob, fileName } = await downloadWorkOrderDraftPdf(lastCreatedDraftId)
      const file = new File([blob], fileName, { type: 'application/pdf' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: lastCreatedDraftNumber
            ? `Borrador ${lastCreatedDraftNumber}`
            : 'Borrador de orden digital',
        })
        return
      }

      setPdfActionError('Este dispositivo no soporta compartir archivos desde el navegador.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo compartir el PDF.'
      setPdfActionError(message)
    } finally {
      setIsDownloadingPdf(false)
    }
  }


  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {validationErrors.length > 0 ? (
          <section className="wof-errorCard">
            <strong>Revisá estos datos antes de continuar:</strong>
            <ul className="wof-errorList">
              {validationErrors.map((validationError) => (
                <li key={validationError}>{validationError}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {saveDraftError && !onDraftSaveError ? (
          <section className="wof-errorCard">
            <strong>No se pudo guardar la orden.</strong>
            <p>{saveDraftError}</p>
          </section>
        ) : null}

        <form className={styles.form}>
          <fieldset className="wof-fieldset" disabled={isReadOnly}>
            <div className={styles.grid3}>
              <label className={styles.field}>
                <span>Nro. Orden</span>
                <input
                  type="text"
                  placeholder={
                    selectedProjectId === ''
                      ? 'Seleccioná un proyecto primero'
                      : isLoadingNumberPreview
                        ? 'Buscando numero sugerido...'
                        : 'Ingresar numero'
                  }
                  value={workOrderNumber}
                  onChange={(event) => {
                    setWorkOrderNumber(event.target.value)
                    setNumberPreviewError(null)
                  }}
                  onBlur={handleNumberBlur}
                  disabled={selectedProjectId === ''}
                />
                {numberPreviewError ? <small>{numberPreviewError}</small> : null}
              </label>
              <label className={styles.field}>
                <span>Fecha</span>
                <input
                  type="date"
                  value={workOrderDate}
                  onChange={(event) => {
                    setWorkOrderDate(event.target.value)
                  }}
                />
              </label>
            </div>
            {!hideContextFields ? (
              <>
                <div className={styles.grid3}>
                  <label className={styles.field}>
                    <span>Cliente</span>
                    <select
                      value={selectedCustomerId}
                      onChange={(event) => {
                        handleCustomerChange(event.target.value)
                      }}
                      disabled={isLoadingCustomers || !!customersError}
                    >
                      <option value="" disabled>
                        Seleccionar...
                      </option>

                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    {customersError ? <small>{customersError}</small> : null}
                  </label>

                  <label className={styles.field}>
                    <span>Proyecto</span>
                    <select
                      value={selectedProjectId}
                      onChange={(event) => {
                        handleProjectChange(event.target.value)
                      }}
                      disabled={!selectedCustomerId || isLoadingProjects || !!projectsError}
                    >
                      <option value="" disabled>
                        Seleccionar...
                      </option>

                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {projectsError ? <small>{projectsError}</small> : null}
                  </label>

                  <label className={styles.field}>
                    <span>Campaña</span>
                    <select
                      value={selectedCampaignId}
                      onChange={(event) => {
                        const value = event.target.value
                        setSelectedCampaignId(value ? Number(value) : '')
                      }}
                      disabled={!selectedProject || isLoadingCampaigns || !!campaignsError}
                    >
                      <option value="">
                        Seleccionar...
                      </option>

                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                    {campaignsError ? <small>{campaignsError}</small> : null}
                  </label>
                </div>

                <div className={styles.grid3}>
                  <label className={styles.field}>
                    <span>Campo</span>
                    <select
                      value={selectedFieldId}
                      onChange={(event) => {
                        const value = event.target.value
                        const fieldId = value ? Number(value) : ''
                        const field =
                          selectedProjectDetail?.fields?.find((item) => item.id === Number(value)) ?? null

                        setSelectedFieldId(fieldId)
                        setLots(field?.lots ?? [])
                        setSelectedLotId('')
                        setSelectedLot(null)
                      }}
                      disabled={!selectedProjectId || isLoadingProjectDetail || !!projectDetailError}
                    >
                      <option value="" disabled>
                        Seleccionar...
                      </option>

                      {(selectedProjectDetail?.fields ?? []).map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.name}
                        </option>
                      ))}
                    </select>
                    {projectDetailError ? <small>{projectDetailError}</small> : null}
                  </label>
                </div>
              </>
            ) : null}

            <div className={styles.grid3}>
              <label className={styles.field}>
                <span>Lote</span>
                {(isGroupedDraft || isReadOnly) && initialValues?.lotDisplayName ? (
                  <input
                    type="text"
                    value={initialValues.lotDisplayName}
                    placeholder="Se completa automaticamente"
                    readOnly
                  />
                ) : (
                  <select
                    value={selectedLotId}
                    onChange={(event) => {
                      const value = event.target.value
                      const lotId = value ? Number(value) : ''
                      const lot = lots.find((item) => item.id === Number(value)) ?? null

                      setSelectedLotId(lotId)
                      setSelectedLot(lot)
                    }}
                    disabled={!selectedFieldId}
                  >
                    <option value="" disabled>
                      Seleccionar...
                    </option>

                    {lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className={styles.field}>
                <span>Cultivo actual</span>
                <input
                  type="text"
                  value={selectedLot?.current_crop_name ?? ''}
                  placeholder="Se completa automaticamente"
                  readOnly
                />
              </label>
            </div>
            <div className={styles.grid3}>
              <label className={styles.field}>
                <span>Labor</span>
                <select
                  value={selectedLaborId}
                  onChange={(event) => {
                    const value = event.target.value
                    const laborId = value ? Number(value) : ''
                    const labor = labors.find((item) => item.id === Number(value)) ?? null

                    setSelectedLaborId(laborId)
                    setContractor(labor?.contractor_name ?? '')
                  }}
                  disabled={selectedProjectId === '' || isLoadingLabors || !!laborsError}
                >
                  <option value="" disabled>
                    Seleccionar...
                  </option>

                  {labors.map((labor) => (
                    <option key={labor.id} value={labor.id}>
                      {labor.name}
                    </option>
                  ))}
                </select>
                {laborsError ? <small>{laborsError}</small> : null}
              </label>

              <label className={styles.field}>
                <span>Superficie realizada</span>
                <input
                  type="text"
                  placeholder="Ingresar superficie"
                  inputMode="decimal"
                  value={effectiveArea}
                  onChange={(event) => {
                    shouldRecalculateDoseOnAreaChange.current = true
                    setEffectiveArea(normalizeDecimalInput(event.target.value))
                  }}
                />

              </label>

              <label className={styles.field}>
                <span>Contratista</span>
                <input
                  type="text"
                  value={contractor}
                  placeholder="Se completa automaticamente"
                  readOnly
                />
              </label>
            </div>

            <section className={styles.box}>
              <div className={styles.boxHeader}>
                <h2 className={styles.subtitle}>Inversor del labor</h2>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={splitContribution}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setSplitContribution(checked)
                      setSelectedInvestorId('')
                      setInvestorSplits([{ investor_id: '', percentage: '' }])
                    }}
                    disabled={selectedProjectId === ''}
                  />
                  <span>Dividir aporte</span>
                </label>
              </div>

              {!splitContribution ? (
                <label className={styles.field}>
                  <span>Inversor</span>
                  <select
                    value={selectedInvestorId}
                    onChange={(event) => {
                      const value = event.target.value
                      setSelectedInvestorId(value ? Number(value) : '')
                    }}
                    disabled={selectedProjectId === '' || projectInvestors.length === 0}
                  >
                    <option value="" disabled>
                      Seleccionar...
                    </option>

                    {projectInvestors.map((investor) => (
                      <option key={investor.id} value={investor.id}>
                        {investor.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className={styles.splitList}>
                  {investorSplits.map((split, index) => (
                    <div key={index} className={styles.splitRow}>
                      <select
                        value={split.investor_id}
                        onChange={(event) => {
                          const value = event.target.value
                          const nextInvestorId = value ? Number(value) : ''

                          setInvestorSplits((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, investor_id: nextInvestorId }
                                : item,
                            ),
                          )
                        }}
                        disabled={selectedProjectId === '' || projectInvestors.length === 0}
                      >
                        <option value="" disabled>
                          Seleccionar...
                        </option>

                        {projectInvestors.map((investor) => (
                          <option key={investor.id} value={investor.id}>
                            {investor.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="%"
                        value={split.percentage}
                        onChange={(event) => {
                          const value = event.target.value
                          setInvestorSplits((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, percentage: value }
                                : item,
                            ),
                          )
                        }}
                      />

                      {!isReadOnly ? (
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => {
                            setInvestorSplits((current) =>
                              current.length === 1
                                ? current
                                : current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }}
                        >
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                  ))}

                  {!isReadOnly ? (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => {
                        setInvestorSplits((current) => [
                          ...current,
                          { investor_id: '', percentage: '' },
                        ])
                      }}
                      disabled={selectedProjectId === ''}
                    >
                      + Agregar inversor
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            <SupplyRowsTable
              supplyRows={supplyRows}
              suppliesError={suppliesError}
              selectedProjectId={selectedProjectId}
              isLoadingSupplies={isLoadingSupplies}
              availableSupplies={availableSupplies}
              supplySearchByRow={supplySearchByRow}
              setSupplySearchByRow={setSupplySearchByRow}
              openSupplySelectorRowId={openSupplySelectorRowId}
              onOpenSelector={handleOpenSupplySelector}
              onCloseSelector={handleCloseSupplySelector}
              setPendingSupplyName={setPendingSupplyName}
              setPendingSupplyError={setPendingSupplyError}
              onSelectSupply={handleSelectSupply}
              pendingSupplyRowId={pendingSupplyRowId}
              pendingSupplyName={pendingSupplyName}
              isCreatingPendingSupply={isCreatingPendingSupply}
              onOpenPendingCreator={handleOpenPendingSupplyCreator}
              onClosePendingCreator={handleClosePendingSupplyCreator}
              onCreatePendingSupply={handleCreatePendingSupply}
              pendingSupplyError={pendingSupplyError}
              updateSupplyRowFromFinalDose={updateSupplyRowFromFinalDose}
              updateSupplyRowFromTotalUsed={updateSupplyRowFromTotalUsed}
              onRemoveSupplyRow={handleRemoveSupplyRow}
              onAddSupplyRow={handleAddSupplyRow}
            />

            <label className={styles.field}>
              <span>Observaciones</span>
              <textarea
                placeholder="Escriba observaciones"
                rows={4}
                value={observations}
                onChange={(event) => {
                  setObservations(event.target.value)
                }}
              />
            </label>
            {!isReadOnly ? (
              <div className={styles.footerActions}>
                {saveDraftSuccessMessage ? (
                  <small className="wof-inlineSuccess">{saveDraftSuccessMessage}</small>
                ) : null}
                {pdfActionError ? (
                  <small className="wof-inlineError">{pdfActionError}</small>
                ) : null}
                {lastCreatedDraftId ? (
                  <>
                    <Link
                      to={`/work-order-drafts/${lastCreatedDraftId}`}
                      className={styles.secondaryBtn}
                    >
                      Ver borrador
                    </Link>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={handleShareDraftPdf}
                      disabled={isDownloadingPdf}
                    >
                      {isDownloadingPdf ? 'Preparando PDF...' : 'Compartir PDF'}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={handleDownloadDraftPdf}
                      disabled={isDownloadingPdf}
                    >
                      {isDownloadingPdf ? 'Descargando PDF...' : 'Descargar PDF'}
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                >
                  {isSavingDraft
                    ? draftId
                      ? 'Actualizando...'
                      : 'Guardando...'
                    : draftId
                      ? 'Actualizar borrador'
                      : 'Guardar borrador'}
                </button>
              </div>
            ) : null}
          </fieldset>
        </form>
      </div>
    </div>
  )
}
