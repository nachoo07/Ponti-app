import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { InvestorSplit, Lot } from '../../../../entities/project/model/project.types'
import { useWorkOrderWorkspace } from '../model/useWorkOrderWorkspace'
import { getSuppliesByProject } from '../../../../entities/supply/api/getSuppliesByProject'
import { buildCreateWorkOrderDraftPayload } from '../model/buildCreateWorkOrderDraftPayload'
import { validateCreateWorkOrderDraft } from '../model/validateCreateWorkOrderDraft'
import { createWorkOrderDraft } from '../../../../entities/workOrderDraft/api/createWorkOrderDraft'
import { downloadWorkOrderDraftPdf } from '../../../../entities/workOrderDraft/api/downloadWorkOrderDraftPdf'
import { previewDigitalWorkOrderNumber } from '../../../../entities/workOrderDraft/api/previewDigitalWorkOrderNumber'
import type { Supply, SupplyRow } from '../../../../entities/supply/model/supply.types'
import type { WorkOrderDraftFormValues } from '../model/mapDraftToFormValues'
import { updateWorkOrderDraft } from '../../../../entities/workOrderDraft/api/updateWorkOrderDraft'

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

function getTodayDateInputValue(): string {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10)
}

type WorkOrderFormProps = {
  initialValues?: WorkOrderDraftFormValues
  initialDraftId?: number | null
  isReadOnly?: boolean
  hideContextFields?: boolean
  onDraftSaved?: (draftId: number) => void | Promise<void>
  onDraftSaveError?: (message: string | null) => void
}

export function WorkOrderForm({
  initialValues,
  initialDraftId,
  isReadOnly = false,
  hideContextFields = false,
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
  const buildEmptySupplyRow = (): SupplyRow => ({
    rowId: crypto.randomUUID(),
    supply_id: '',
    total_used: '',
    final_dose: '',
  })

  const [supplyRows, setSupplyRows] = useState<SupplyRow[]>(
    initialValues?.supplyRows ?? [buildEmptySupplyRow()],
  )

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
    const surface = parseDecimal(effectiveArea)

    setSupplyRows((current) =>
      current.map((row) => {
        if (row.total_used === '') {
          return { ...row, final_dose: '' }
        }

        const totalUsed = parseDecimal(row.total_used)
        const finalDose =
          surface > 0 ? formatCalculatedDecimal(totalUsed / surface) : ''

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

  function parseDecimal(value: string): number {
    const normalized = Number(value)
    return Number.isFinite(normalized) ? normalized : 0
  }

  function formatCalculatedDecimal(value: number): string {
    if (!Number.isFinite(value)) return ''
    return value.toFixed(3).replace(/\.?0+$/, '')
  }

  function normalizeDecimalInput(value: string): string {
    const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '')
    const [integerPart = '', ...decimalParts] = normalized.split('.')

    if (decimalParts.length === 0) {
      return integerPart
    }

    return `${integerPart}.${decimalParts.join('')}`
  }

  function getSupplyLabel(row: SupplyRow): string {
    const matchedSupply =
      row.supply_id === ''
        ? null
        : supplies.find((supply) => supply.id === row.supply_id) ?? null

    return row.supply_name?.trim() || matchedSupply?.name || ''
  }

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

  async function handleSaveDraft() {
    if (
      selectedCustomerId === '' ||
      selectedProjectId === '' ||
      selectedFieldId === '' ||
      selectedLotId === '' ||
      selectedLot === null ||
      selectedLaborId === ''
    ) {
      setValidationErrors(['Completá los datos obligatorios antes de guardar la orden.'])
      setSaveDraftError(null)
      setSaveDraftSuccessMessage(null)
      return
    }

    const selectedLabor = labors.find((labor) => labor.id === selectedLaborId)

    if (!selectedLabor) {
      setValidationErrors(['No se encontró la labor seleccionada.'])
      setSaveDraftError(null)
      setSaveDraftSuccessMessage(null)
      return
    }

    const payload = buildCreateWorkOrderDraftPayload({
      number: workOrderNumber,
      date: workOrderDate,
      customerId: selectedCustomerId,
      projectId: selectedProjectId,
      campaignId: selectedCampaignId === '' ? null : selectedCampaignId,
      fieldId: selectedFieldId,
      lotId: selectedLotId,
      selectedLot,
      selectedLabor,
      contractor,
      effectiveArea,
      observations,
      selectedInvestorId: selectedInvestorId === '' ? 0 : selectedInvestorId,
      splitContribution,
      investorSplits,
      supplyRows,
    })

    const errors = validateCreateWorkOrderDraft(payload)

    if (errors.length > 0) {
      setValidationErrors(errors)
      setSaveDraftError(null)
      setSaveDraftSuccessMessage(null)
      return
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
        await updateWorkOrderDraft(draftId, payload)
        setDraftId(draftId)
        setSaveDraftSuccessMessage(
          payload.number
            ? `Orden ${payload.number} actualizada correctamente.`
            : 'Orden actualizada correctamente.',
        )
        onDraftSaveError?.(null)
        await onDraftSaved?.(draftId)
      } else {
        const response = await createWorkOrderDraft(payload)
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

            <section className={styles.inputsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.subtitle}>Carga de insumos</h2>
                {!isReadOnly ? (
                  <button type="button" className={styles.secondaryBtn}>
                    + Crear Nuevo Insumo
                  </button>
                ) : null}
                {suppliesError ? <small>{suppliesError}</small> : null}
              </div>

              <div className={styles.insumoGridHead}>
                <span>Insumo</span>
                <span>Total utilizado</span>
                <span>Dosis final</span>
                <span className={styles.actionsCol}>Accion</span>
              </div>

              {supplyRows.map((row) => (
                <div key={row.rowId} className={styles.insumoRow}>
                  {isReadOnly ? (
                    <input type="text" value={getSupplyLabel(row)} readOnly />
                  ) : (
                    <select
                      value={row.supply_id}
                      onChange={(event) => {
                        const value = event.target.value
                        const nextSupplyId = value ? Number(value) : ''

                        setSupplyRows((current) =>
                          current.map((item) =>
                            item.rowId === row.rowId
                              ? {
                                  ...item,
                                  supply_id: nextSupplyId,
                                  supply_name:
                                    supplies.find((supply) => supply.id === nextSupplyId)?.name ?? '',
                                }
                              : item,
                          ),
                        )
                      }}
                      disabled={selectedProjectId === '' || isLoadingSupplies || !!suppliesError}
                    >
                      <option value="" disabled>
                        Seleccionar...
                      </option>

                      {supplies.map((supply) => {
                        const isUsedInAnotherRow = supplyRows.some(
                          (item) => item.rowId !== row.rowId && item.supply_id === supply.id,
                        )

                        return (
                          <option key={supply.id} value={supply.id} disabled={isUsedInAnotherRow}>
                            {supply.name}
                          </option>
                        )
                      })}
                    </select>
                  )}
                  <input
                    type="number"
                    placeholder="Lt/Kg/Bolsas"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={row.total_used}
                    onChange={(event) => {
                      const value = event.target.value
                      const surface = parseDecimal(effectiveArea)
                      const totalUsed = parseDecimal(value)
                      const nextDose =
                        surface > 0 && value !== ''
                          ? formatCalculatedDecimal(totalUsed / surface)
                          : ''

                      setSupplyRows((current) =>
                        current.map((item) =>
                          item.rowId === row.rowId
                            ? {
                              ...item,
                              total_used: value,
                              final_dose: nextDose,
                            }
                            : item,
                        ),
                      )
                    }}
                  />

                  <input
                    type="number"
                    placeholder="Total/superficie"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={row.final_dose}
                    onChange={(event) => {
                      const value = event.target.value
                      const surface = parseDecimal(effectiveArea)
                      const dose = parseDecimal(value)
                      const nextTotalUsed =
                        surface > 0 && value !== ''
                          ? formatCalculatedDecimal(dose * surface)
                          : ''

                      setSupplyRows((current) =>
                        current.map((item) =>
                          item.rowId === row.rowId
                            ? {
                              ...item,
                              final_dose: value,
                              total_used: nextTotalUsed,
                            }
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
                        setSupplyRows((current) =>
                          current.length === 1
                            ? current
                            : current.filter((item) => item.rowId !== row.rowId),
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
                    setSupplyRows((current) => [...current, buildEmptySupplyRow()])
                  }}
                >
                  + Agregar fila de insumo
                </button>
              ) : null}

            </section>

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
