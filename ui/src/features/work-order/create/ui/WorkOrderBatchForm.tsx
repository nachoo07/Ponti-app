import { FilePlus2, ClipboardList, Sprout } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPendingLabor } from '../../../../entities/labor/api/createPendingLabor'
import type { Labor } from '../../../../entities/labor/model/labor.types'
import type { InvestorSplit, Lot } from '../../../../entities/project/model/project.types'
import { getProjectStock } from '../../../../entities/stock/api/getProjectStock'
import type { StockItem } from '../../../../entities/stock/model/stock.types'
import { createPendingSupply } from '../../../../entities/supply/api/createPendingSupply'
import { getSuppliesByProject } from '../../../../entities/supply/api/getSuppliesByProject'
import type { Supply } from '../../../../entities/supply/model/supply.types'
import { createBatchWorkOrderDraft } from '../../../../entities/workOrderDraft/api/createBatchWorkOrderDraft'
import { downloadWorkOrderDraftGroupPdf } from '../../../../entities/workOrderDraft/api/downloadWorkOrderDraftGroupPdf'
import { downloadWorkOrderDraftPdf } from '../../../../entities/workOrderDraft/api/downloadWorkOrderDraftPdf'
import { previewBatchDigitalWorkOrderNumber } from '../../../../entities/workOrderDraft/api/previewBatchDigitalWorkOrderNumber'
import type { CreateBatchWorkOrderDraftResponseItem } from '../../../../entities/workOrderDraft/model/workOrderDraft.responses'
import { buildCreateBatchWorkOrderDraftPayload } from '../model/buildCreateBatchWorkOrderDraftPayload'
import type { BatchSelectedLotFormRow, BatchSharedSupplyFormRow, } from '../model/workOrderBatchForm.types'
import { useWorkOrderWorkspace } from '../model/useWorkOrderWorkspace'
import { validateCreateBatchWorkOrderDraft } from '../model/validateCreateBatchWorkOrderDraft'
import './WorkOrderForm.css'
import { getTodayDateInputValue, formatDose, formatTotalUsedFromDose, formatCalculatedDecimal, buildEmptySupplyRow, buildInitialSupplyRows, buildSelectedLotFormRow, normalizeDecimalInput, normalizeDoseInput, insertSortedById } from '../model/workOrderBatchForm.helpers'
import { InvestorSplitSection } from './InvestorSplitSection'
import { LaborSelector } from './LaborSelector'
import { LotSelectorDropdown } from './LotSelectorDropdown'
import { SupplyRowsTable } from './SupplyRowsTable'

type FormStep = 1 | 2 | 3

const formSteps: Array<{ step: FormStep; label: string }> = [
    { step: 1, label: 'Cliente' },
    { step: 2, label: 'Trabajo' },
    { step: 3, label: 'Insumos' },
]

const styles = {
    page: 'wof-page',
    card: 'wof-card',
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

type CreatedBatchDraft = CreateBatchWorkOrderDraftResponseItem & {
    lot_name: string
}

export function WorkOrderBatchForm() {
    const [selectedFieldId, setSelectedFieldId] = useState<number | ''>('')
    const [availableLots, setAvailableLots] = useState<Lot[]>([])
    const [isLotSelectorOpen, setIsLotSelectorOpen] = useState(false)
    const lotSelectorRef = useRef<HTMLDivElement | null>(null)
    const formTopRef = useRef<HTMLDivElement | null>(null)
    const navigate = useNavigate()

    const [selectedLaborId, setSelectedLaborId] = useState<number | ''>('')
    const [contractor, setContractor] = useState('')
    const [isLaborSelectorOpen, setIsLaborSelectorOpen] = useState(false)
    const [laborSearch, setLaborSearch] = useState('')
    const [isCreatingLaborOpen, setIsCreatingLaborOpen] = useState(false)
    const [newLaborName, setNewLaborName] = useState('')
    const [isSavingLabor, setIsSavingLabor] = useState(false)
    const [laborCreateError, setLaborCreateError] = useState<string | null>(null)
    const [selectedInvestorId, setSelectedInvestorId] = useState<number | ''>('')
    const [splitContribution, setSplitContribution] = useState(false)
    const [investorSplits, setInvestorSplits] = useState<InvestorSplit[]>([
        { investor_id: '', percentage: '' },
    ])

    const [selectedLots, setSelectedLots] = useState<BatchSelectedLotFormRow[]>([])
    const [supplies, setSupplies] = useState<Supply[]>([])
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [isLoadingSupplies, setIsLoadingSupplies] = useState(false)
    const [suppliesError, setSuppliesError] = useState<string | null>(null)
    const [openSupplySelectorRowId, setOpenSupplySelectorRowId] = useState<string | null>(null)
    const [supplySearchByRow, setSupplySearchByRow] = useState<Record<string, string>>({})
    const [pendingSupplyRowId, setPendingSupplyRowId] = useState<string | null>(null)
    const [pendingSupplyName, setPendingSupplyName] = useState('')
    const [isCreatingPendingSupply, setIsCreatingPendingSupply] = useState(false)
    const [pendingSupplyError, setPendingSupplyError] = useState<string | null>(null)

    const [supplyRows, setSupplyRows] = useState<BatchSharedSupplyFormRow[]>(
        buildInitialSupplyRows(),
    )

    const [selectedCampaignId, setSelectedCampaignId] = useState<number | ''>('')
    const [observations, setObservations] = useState('')
    const [workOrderNumber, setWorkOrderNumber] = useState('')
    const [workOrderDate, setWorkOrderDate] = useState(getTodayDateInputValue())
    const [numberPreviewError, setNumberPreviewError] = useState<string | null>(null)

    const [isSavingDraft, setIsSavingDraft] = useState(false)
    const [isDownloadingGroupPdf, setIsDownloadingGroupPdf] = useState(false)
    const [saveDraftError, setSaveDraftError] = useState<string | null>(null)
    const [groupPdfError, setGroupPdfError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [createdDrafts, setCreatedDrafts] = useState<CreatedBatchDraft[]>([])
    const [preciseDoseByRow, setPreciseDoseByRow] = useState<Record<string, number>>({})
    const [currentStep, setCurrentStep] = useState<FormStep>(1)
    const [showSuccessScreen, setShowSuccessScreen] = useState(false)

    const toastMessage = groupPdfError ?? saveDraftError

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
        setLabors,
        isLoadingLabors,
        laborsError,
        resetWorkspaceSelection,
    } = useWorkOrderWorkspace({
        onCustomerChange: resetProjectDependentSelections,
        onProjectChange: resetProjectDependentSelections,
    })

    function resetLaborCreatorFields() {
        setIsLaborSelectorOpen(false)
        setIsCreatingLaborOpen(false)
        setNewLaborName('')
        setLaborSearch('')
        setLaborCreateError(null)
    }

    function resetProjectDependentSelections() {
        setSelectedFieldId('')
        setAvailableLots([])
        setIsLotSelectorOpen(false)
        setSelectedLots([])
        setSelectedLaborId('')
        setContractor('')
        resetLaborCreatorFields()
        setSelectedInvestorId('')
        setSplitContribution(false)
        setInvestorSplits([{ investor_id: '', percentage: '' }])
        setSupplies([])
        setStockItems([])
        setSuppliesError(null)
        setOpenSupplySelectorRowId(null)
        setSupplySearchByRow({})
        setPendingSupplyRowId(null)
        setPendingSupplyName('')
        setPendingSupplyError(null)
        setSupplyRows(buildInitialSupplyRows())
        setObservations('')
        setWorkOrderNumber('')
        setNumberPreviewError(null)
        setValidationErrors([])
        setCreatedDrafts([])
        setSaveDraftError(null)
        setGroupPdfError(null)
    }

    function resetFormAfterCreate() {
        resetWorkspaceSelection()
        setSelectedCampaignId('')
        setSelectedFieldId('')
        setAvailableLots([])
        setIsLotSelectorOpen(false)
        setSelectedLots([])
        setSelectedLaborId('')
        setContractor('')
        resetLaborCreatorFields()
        setSelectedInvestorId('')
        setSplitContribution(false)
        setInvestorSplits([{ investor_id: '', percentage: '' }])
        setSupplies([])
        setStockItems([])
        setSuppliesError(null)
        setOpenSupplySelectorRowId(null)
        setSupplySearchByRow({})
        setPendingSupplyRowId(null)
        setPendingSupplyName('')
        setPendingSupplyError(null)
        setSupplyRows(buildInitialSupplyRows())
        setObservations('')
        setWorkOrderNumber('')
        setWorkOrderDate(getTodayDateInputValue())
        setNumberPreviewError(null)
        setValidationErrors([])
        setGroupPdfError(null)
    }

    useEffect(() => {
        if (selectedProjectId === '') return

        const projectId = selectedProjectId
        let cancelled = false

        async function loadSuppliesAndStock() {
            setIsLoadingSupplies(true)
            setSuppliesError(null)

            try {
                const [suppliesData, stockData] = await Promise.all([
                    getSuppliesByProject({ projectId }),
                    getProjectStock(projectId, ''),
                ])

                if (cancelled || selectedProjectId !== projectId) return

                setSupplies(suppliesData)
                setStockItems(stockData)
            } catch (error) {
                if (cancelled || selectedProjectId !== projectId) return
                const message = error instanceof Error ? error.message : 'Error cargando insumos'
                setSupplies([])
                setStockItems([])
                setSuppliesError(message)
            } finally {
                if (!cancelled && selectedProjectId === projectId) {
                    setIsLoadingSupplies(false)
                }
            }
        }

        void loadSuppliesAndStock()

        return () => {
            cancelled = true
        }
    }, [selectedProjectId])

    useEffect(() => {
        if (selectedProjectId === '') return

        let cancelled = false

        async function loadPreviewNumber() {
            setNumberPreviewError(null)

            try {
                const response = await previewBatchDigitalWorkOrderNumber({
                    project_id: Number(selectedProjectId),
                })

                if (cancelled) return
                setWorkOrderNumber(response.number)
            } catch (error) {
                if (cancelled) return
                const message =
                    error instanceof Error ? error.message : 'No se pudo obtener el numero base sugerido'
                setNumberPreviewError(message)
            }
        }

        void loadPreviewNumber()

        return () => {
            cancelled = true
        }
    }, [selectedProjectId])

    useEffect(() => {
        if (!toastMessage) return

        const timeoutId = window.setTimeout(() => {
            setSaveDraftError(null)
            setGroupPdfError(null)
        }, 4500)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [toastMessage])

    useEffect(() => {
        if (!selectedProjectDetail || selectedFieldId === '') return

        const selectedField =
            selectedProjectDetail.fields?.find((field) => field.id === selectedFieldId) ?? null

        const nextLots = selectedField?.lots ?? []
        setAvailableLots(nextLots)
        setSelectedLots([])
        setIsLotSelectorOpen(false)
    }, [selectedProjectDetail, selectedFieldId])

    useEffect(() => {
        if (!isLotSelectorOpen) return

        function handlePointerDown(event: MouseEvent) {
            if (!lotSelectorRef.current) return

            if (!lotSelectorRef.current.contains(event.target as Node)) {
                setIsLotSelectorOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
        }
    }, [isLotSelectorOpen])

    useEffect(() => {
        if (openSupplySelectorRowId === null) return

        function handlePointerDown(event: MouseEvent) {
            const target = event.target as Element | null

            if (!target?.closest('.wof-supplySelectorField')) {
                handleCloseSupplySelector()
                handleClosePendingSupplyCreator()
            }
        }

        document.addEventListener('mousedown', handlePointerDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
        }
    }, [openSupplySelectorRowId])

    const projectInvestors = selectedProjectDetail?.investors ?? []

    const uniqueLotNames = useMemo(
        () => selectedLots.map((lot) => lot.lot_name),
        [selectedLots],
    )

    const uniqueCropNames = useMemo(
        () => [...new Set(selectedLots.map((lot) => lot.crop_name).filter(Boolean))],
        [selectedLots],
    )

    const totalEffectiveArea = useMemo(() => {
        return selectedLots.reduce((acc, lot) => {
            const value = Number(lot.effective_area)
            return Number.isFinite(value) ? acc + value : acc
        }, 0)
    }, [selectedLots])

    const cropId = selectedLots[0]?.crop_id ?? 0

    const availableSupplies = useMemo(() => {
        const stockBySupply = new Map<string, number>()

        for (const stockItem of stockItems) {
            const current = stockBySupply.get(stockItem.supply_name) || 0
            stockBySupply.set(
                stockItem.supply_name,
                current + Number(stockItem.stock_units),
            )
        }

        return supplies.map((supply) => ({
            ...supply,
            available_stock: String(stockBySupply.get(supply.name) || 0),
            available_unit: supply.unit_name ?? '',
        }))
    }, [supplies, stockItems])

    useEffect(() => {
        if (!totalEffectiveArea || totalEffectiveArea === 0) return

        setSupplyRows((current) =>
            current.map((row) => {
                if (!row.total_used || row.total_used === '') {
                    return row
                }

                const preciseDose = Number(row.total_used) / totalEffectiveArea

                setPreciseDoseByRow((prev) => ({
                    ...prev,
                    [row.rowId]: preciseDose,
                }))

                return {
                    ...row,
                    final_dose: formatDose(preciseDose),
                }
            }),
        )
    }, [totalEffectiveArea])

    function handleNumberBlur() {
        if (selectedProjectId === '') return

        void (async () => {
            setNumberPreviewError(null)

            try {
                const response = await previewBatchDigitalWorkOrderNumber({
                    project_id: Number(selectedProjectId),
                    ...(workOrderNumber.trim() ? { number: workOrderNumber.trim() } : {}),
                })
                setWorkOrderNumber(response.number)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'No se pudo validar el numero base'
                setNumberPreviewError(message)
            }
        })()
    }

    function handleToggleLot(lot: Lot, checked: boolean) {
        setCreatedDrafts([])

        if (checked) {
            setSelectedLots((current) => {
                if (current.some((item) => item.lot_id === lot.id)) {
                    return current
                }

                return [...current, buildSelectedLotFormRow(lot)]
            })
            return
        }

        setSelectedLots((current) => current.filter((item) => item.lot_id !== lot.id))
    }

    function handleUpdateLotArea(lotId: number, value: string) {
        setSelectedLots((current) =>
            current.map((lot) =>
                lot.lot_id === lotId
                    ? { ...lot, effective_area: normalizeDecimalInput(value) }
                    : lot,
            ),
        )
    }

    function handleAddSupplyRow() {
        setSupplyRows((current) => [...current, buildEmptySupplyRow()])
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
        updateSupplyRow(rowId, {
            supply_id: supply.id,
            supply_name: supply.name,
        })
        setOpenSupplySelectorRowId(null)
    }

    function handleRemoveSupplyRow(rowId: string) {
        setSupplyRows((current) => {
            const nextRows = current.filter((row) => row.rowId !== rowId)

            while (nextRows.length < 3) {
                nextRows.push(buildEmptySupplyRow())
            }

            return nextRows
        })

        setPreciseDoseByRow((current) => {
            const next = { ...current }
            delete next[rowId]
            return next
        })

        setSupplySearchByRow((current) => {
            const next = { ...current }
            delete next[rowId]
            return next
        })

        if (openSupplySelectorRowId === rowId) {
            handleCloseSupplySelector()
        }
    }

    function updateSupplyRow(
        rowId: string,
        updates: Partial<BatchSharedSupplyFormRow>,
    ) {
        setSupplyRows((current) =>
            current.map((row) => (row.rowId === rowId ? { ...row, ...updates } : row)),
        )
    }

    function updateSupplyRowFromTotalUsed(rowId: string, value: string) {
        const normalizedTotalUsed = normalizeDecimalInput(value)

        updateSupplyRows((current) =>
            current.map((row) => {
                if (row.rowId !== rowId) return row

                if (totalEffectiveArea > 0 && normalizedTotalUsed !== '') {
                    const preciseDose = Number(normalizedTotalUsed) / totalEffectiveArea

                    setPreciseDoseByRow((prev) => ({
                        ...prev,
                        [rowId]: preciseDose,
                    }))

                    return {
                        ...row,
                        total_used: normalizedTotalUsed,
                        final_dose: formatDose(preciseDose),
                        last_edited_field: 'total_used',
                    }
                }

                setPreciseDoseByRow((prev) => {
                    const next = { ...prev }
                    delete next[rowId]
                    return next
                })

                return {
                    ...row,
                    total_used: normalizedTotalUsed,
                    final_dose: '',
                    last_edited_field: 'total_used',
                }
            }),
        )
    }

    function updateSupplyRowFromFinalDose(rowId: string, value: string) {
        const normalizedFinalDose = normalizeDoseInput(value)

        updateSupplyRows((current) =>
            current.map((row) => {
                if (row.rowId !== rowId) return row

                if (totalEffectiveArea > 0 && normalizedFinalDose !== '') {
                    const preciseDose = preciseDoseByRow[rowId]

                    const doseForCalc =
                        typeof preciseDose === 'number' && formatDose(preciseDose) === normalizedFinalDose
                            ? preciseDose
                            : Number(normalizedFinalDose.replace(',', '.'))

                    return {
                        ...row,
                        final_dose: normalizedFinalDose,
                        total_used: formatTotalUsedFromDose(doseForCalc * totalEffectiveArea),
                        last_edited_field: 'final_dose',
                    }
                }

                return {
                    ...row,
                    final_dose: normalizedFinalDose,
                    total_used: '',
                    last_edited_field: 'final_dose',
                }
            }),
        )
    }

    function updateSupplyRows(
        updater: (current: BatchSharedSupplyFormRow[]) => BatchSharedSupplyFormRow[],
    ) {
        setSupplyRows((current) => updater(current))
    }

    function getPayloadTotalUsed(row: BatchSharedSupplyFormRow): string {
        return row.total_used
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
                project_id: selectedProjectId,
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

            setSupplies((current) => insertSortedById(current, nextSupply))

            updateSupplyRow(pendingSupplyRowId, {
                supply_id: response.id,
                supply_name: response.name,
            })

            handleCloseSupplySelector()
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'No se pudo crear el insumo pendiente.'
            setPendingSupplyError(message)
        } finally {
            setIsCreatingPendingSupply(false)
        }
    }

    function handleOpenLaborCreator() {
        setIsCreatingLaborOpen(true)
        setNewLaborName(laborSearch.trim())
        setLaborCreateError(null)
    }

    function handleCloseLaborCreator() {
        setIsCreatingLaborOpen(false)
        setNewLaborName('')
        setLaborCreateError(null)
    }

    async function handleCreatePendingLabor() {
        if (selectedProjectId === '') return

        const normalizedName = newLaborName.trim()
        if (!normalizedName) {
            setLaborCreateError('Ingresá un nombre para la labor.')
            return
        }

        setIsSavingLabor(true)
        setLaborCreateError(null)

        try {
            const created = await createPendingLabor({
                project_id: selectedProjectId as number,
                name: normalizedName,
            })

            const nextLabor: Labor = {
                id: created.id,
                name: created.name,
                category_id: 0,
                price: '0',
                is_partial_price: false,
                contractor_name: '',
                category_name: '',
                updated_at: '',
                is_pending: true,
            }

            setLabors((current) => insertSortedById(current, nextLabor))
            setSelectedLaborId(created.id)
            setContractor('')
            resetLaborCreatorFields()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo crear la labor.'
            setLaborCreateError(message)
        } finally {
            setIsSavingLabor(false)
        }
    }


    function scrollToFormTop() {
        if (!formTopRef.current) return

        const top =
            formTopRef.current.getBoundingClientRect().top + window.scrollY - 120

        window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth',
        })
    }

    function goToStep(nextStep: FormStep) {
        if (nextStep > currentStep) {
            for (let s = currentStep; s < nextStep; s++) {
                const errors = validateStep(s as FormStep)
                if (errors.length > 0) {
                    setValidationErrors(errors)
                    scrollToFormTop()
                    return
                }
            }
        }
        setValidationErrors([])
        setCurrentStep(nextStep)
        scrollToFormTop()
    }

    function goToPreviousStep() {
        setValidationErrors([])
        setCurrentStep((step) => {
            if (step === 1) return 1
            return (step - 1) as FormStep
        })
        scrollToFormTop()
    }

    function validateStep(step: FormStep): string[] {
        const errors: string[] = []

        if (step === 1) {
            if (typeof selectedCustomerId !== 'number') errors.push('Falta seleccionar: Cliente.')
            if (typeof selectedProjectId !== 'number') errors.push('Falta seleccionar: Proyecto.')
            if (!workOrderNumber.trim()) errors.push('Falta completar: Nro. Orden.')
            if (!workOrderDate.trim()) errors.push('Falta completar: Fecha.')
        }

        if (step === 2) {
            if (typeof selectedFieldId !== 'number') errors.push('Falta seleccionar: Campo.')
            if (selectedLots.length === 0) errors.push('Falta seleccionar al menos un lote.')
            if (typeof selectedLaborId !== 'number') errors.push('Falta seleccionar: Labor.')
            if (splitContribution) {
                const hasValidSplit = investorSplits.some(
                    (s) => s.investor_id !== '' && s.percentage !== '',
                )
                if (!hasValidSplit) errors.push('Falta completar: Contribución por inversor.')
            } else {
                if (selectedInvestorId === '') errors.push('Falta seleccionar: Inversor.')
            }
        }

        return errors
    }

    function goToNextStep() {
        const errors = validateStep(currentStep)
        if (errors.length > 0) {
            setValidationErrors(errors)
            scrollToFormTop()
            return
        }
        setValidationErrors([])
        setCurrentStep((step) => {
            if (step === 3) return 3
            return (step + 1) as FormStep
        })
        scrollToFormTop()
    }

    async function handleSaveBatchDraft() {
        const missingCommonFields: string[] = []

        const hasCustomer = typeof selectedCustomerId === 'number'
        const hasProject = typeof selectedProjectId === 'number'
        const hasField = typeof selectedFieldId === 'number'
        const hasLabor = typeof selectedLaborId === 'number'

        if (!hasCustomer) {
            missingCommonFields.push('Cliente')
        }

        if (!hasProject) {
            missingCommonFields.push('Proyecto')
        }

        if (!hasField) {
            missingCommonFields.push('Campo')
        }

        if (!hasLabor) {
            missingCommonFields.push('Labor')
        }

        if (missingCommonFields.length > 0) {
            setValidationErrors(
                missingCommonFields.map((field) => `Falta completar: ${field}.`),
            )
            setSaveDraftError(null)
            scrollToFormTop()
            return
        }

        const customerId = selectedCustomerId as number
        const projectId = selectedProjectId as number
        const fieldId = selectedFieldId as number
        const laborId = selectedLaborId as number

        const selectedLabor: Labor | undefined = labors.find((labor) => labor.id === laborId)

        if (!selectedLabor) {
            setValidationErrors(['No se encontró la labor seleccionada.'])
            setSaveDraftError(null)
            scrollToFormTop()
            return
        }

        const payload = buildCreateBatchWorkOrderDraftPayload({
            number: workOrderNumber,
            date: workOrderDate,
            customerId,
            projectId,
            campaignId: selectedCampaignId === '' ? null : selectedCampaignId,
            fieldId,
            cropId: cropId ?? 0,
            selectedLabor,
            contractor,
            observations,
            selectedInvestorId: selectedInvestorId === '' ? 0 : selectedInvestorId,
            splitContribution,
            investorSplits,
            selectedLots,
            supplyRows: supplyRows.map((row) => ({
                ...row,
                total_used: getPayloadTotalUsed(row),
            })),
        })


        const errors = validateCreateBatchWorkOrderDraft(payload)

        if (errors.length > 0) {
            setValidationErrors(errors)
            setSaveDraftError(null)
            scrollToFormTop()
            return
        }

        setIsSavingDraft(true)
        setValidationErrors([])
        setSaveDraftError(null)
        setGroupPdfError(null)

        try {
            const response = await createBatchWorkOrderDraft(payload)

            if (!response.items || response.items.length === 0) {
                // Respuesta exitosa pero sin órdenes: no reseteamos el form ni mostramos
                // la confirmación (quedaría muda). Avisamos vía toast de error.
                setSaveDraftError('No se creó ninguna orden. Revisá los datos e intentá de nuevo.')
                scrollToFormTop()
                return
            }

            const createdByLotId = new Map(selectedLots.map((lot) => [lot.lot_id, lot.lot_name]))

            setCreatedDrafts(
                response.items.map((item) => ({
                    ...item,
                    lot_name: item.lot_name ?? createdByLotId.get(item.lot_id) ?? `Lote #${item.lot_id}`,
                })),
            )
            setShowSuccessScreen(true)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Error guardando ordenes digitales'
            setSaveDraftError(message)
            scrollToFormTop()
        } finally {
            setIsSavingDraft(false)
        }

    }

    function handleCreateNewOrder() {
        setCreatedDrafts([])
        setGroupPdfError(null)
        resetFormAfterCreate()
        scrollToFormTop()
    }

    function handleGoHome() {
        navigate('/home')
    }

    async function handleDownloadCreatedPdf() {
        if (createdDrafts.length === 0) return

        setIsDownloadingGroupPdf(true)
        setGroupPdfError(null)

        try {
            const downloadResult =
                createdDrafts.length > 1
                    ? await downloadWorkOrderDraftGroupPdf(createdDrafts[0].id)
                    : await downloadWorkOrderDraftPdf(createdDrafts[0].id)

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
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : createdDrafts.length > 1
                        ? 'No se pudo descargar el PDF completo.'
                        : 'No se pudo descargar el PDF.'
            setGroupPdfError(message)
        } finally {
            setIsDownloadingGroupPdf(false)
        }
    }

    async function handleShareGroupPdf() {
        if (createdDrafts.length === 0) return

        setIsDownloadingGroupPdf(true)
        setGroupPdfError(null)

        try {
            const { blob, fileName } = await downloadWorkOrderDraftGroupPdf(createdDrafts[0].id)
            const file = new File([blob], fileName, { type: 'application/pdf' })

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'PDF completo de ordenes digitales',
                })
                return
            }

            setGroupPdfError('Este dispositivo no soporta compartir archivos desde el navegador.')
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'No se pudo compartir el PDF completo.'
            setGroupPdfError(message)
        } finally {
            setIsDownloadingGroupPdf(false)
        }
    }

    if (showSuccessScreen) {
    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className="wof-successScreen">
                    <h1 className="wof-successTitle">✅ ¡OT creada con éxito!</h1>
                    <p className="wof-successSubtitle">
                        Se {createdDrafts.length === 1 ? 'creó' : 'crearon'}{' '}
                        <strong>{createdDrafts.length}</strong>{' '}
                        {createdDrafts.length === 1 ? 'orden digital.' : 'órdenes digitales.'}
                    </p>

                    <div className="wof-confirmationActions">
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => {
                                resetFormAfterCreate()
                                setCurrentStep(1)
                                setShowSuccessScreen(false)
                            }}
                        >
                            Crear nueva OT
                        </button>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={handleGoHome}
                        >
                            Volver al inicio
                        </button>
                    </div>

                    <div className="wof-confirmationSecondary">
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={handleShareGroupPdf}
                            disabled={isDownloadingGroupPdf}
                        >
                            {isDownloadingGroupPdf ? 'Preparando PDF...' : 'Compartir PDF'}
                        </button>
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={handleDownloadCreatedPdf}
                            disabled={isDownloadingGroupPdf}
                        >
                            {isDownloadingGroupPdf ? 'Descargando PDF...' : 'Descargar PDF'}
                        </button>
                    </div>

                    {groupPdfError ? (
                        <small className="wof-inlineError">{groupPdfError}</small>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

    return (
        <div className={styles.page}>
            <div ref={formTopRef} />
            <div className="wof-topbar">
                <div className="wof-headingRow">
                    <h1 className="wof-pageTitle">Nueva OT</h1>

                    <div className="wof-stepper" aria-label="Pasos de la orden">
                        {formSteps.map((item) => {
                            const isActive = item.step === currentStep
                            const isComplete =
                                item.step === 1
                                    ? typeof selectedCustomerId === 'number' &&
                                    typeof selectedProjectId === 'number' &&
                                    workOrderNumber.trim() !== '' &&
                                    workOrderDate.trim() !== ''
                                    : item.step === 2
                                        ? typeof selectedFieldId === 'number' &&
                                        selectedLots.length > 0 &&
                                        typeof selectedLaborId === 'number' &&
                                        (splitContribution
                                            ? investorSplits.some((split) => split.investor_id !== '' && split.percentage !== '')
                                            : selectedInvestorId !== '')
                                        : supplyRows.some((row) => row.supply_id !== '' && row.total_used !== '')

                            const isIncomplete = item.step < currentStep && !isComplete

                            return (
                                <button
                                    key={item.step}
                                    type="button"
                                    className={`wof-stepperItem ${isActive ? 'is-active' : ''} ${isComplete ? 'is-completed' : ''
                                        } ${isIncomplete ? 'is-incomplete' : ''}`}
                                    onClick={() => goToStep(item.step)}
                                    aria-current={isActive ? 'step' : undefined}
                                >
                                    <span className="wof-stepperNumber">{item.step}</span>
                                    <span>{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {toastMessage ? (

                <div className="wof-toast is-error" role="status" aria-live="polite">
                    <div className="wof-toastContent">
                        <strong>Atención</strong>
                        <span>{toastMessage}</span>
                    </div>
                    <button
                        type="button"
                        className="wof-toastClose"
                        onClick={() => {
                            setSaveDraftError(null)
                            setGroupPdfError(null)
                        }}
                        aria-label="Cerrar alerta"
                    >
                        ×
                    </button>
                </div>
            ) : null}

            <div className={styles.card}>
                 <>
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
                        <form className={styles.form}>
                            <fieldset className="wof-fieldset">
                                <div className="wof-stepPanel" hidden={currentStep !== 1}>
                                    <div className="wof-stepCard">
                                        <div className="wof-panelHeader">
                                            <span className="wof-panelIcon" aria-hidden="true">
                                                <FilePlus2 />
                                            </span>
                                            <h2>Información inicial</h2>
                                        </div>
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
                                                <span>Nro. Orden</span>
                                                <input
                                                    type="text"
                                                    placeholder={
                                                        selectedProjectId === ''
                                                            ? 'Seleccioná un proyecto primero'
                                                            : 'Ej: D-8'
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
                                    </div>

                                    <div className="wof-stepActions is-end">
                                        <button type="button" className={styles.primaryBtn} onClick={goToNextStep}>
                                            Continuar
                                        </button>
                                    </div>
                                </div>
                                <div className="wof-stepPanel" hidden={currentStep !== 2}>
                                    <div className="wof-stepCard">
                                        <div className="wof-panelHeader">
                                            <span className="wof-panelIcon" aria-hidden="true">
                                                <Sprout />
                                            </span>
                                            <h2>Campo y labor</h2>
                                        </div>
                                        <div className="wof-workGrid">
                                            <label className={`${styles.field} wof-workField`}>
                                                <span>Campo</span>
                                                <select
                                                    value={selectedFieldId}
                                                    onChange={(event) => {
                                                        const value = event.target.value
                                                        setSelectedFieldId(value ? Number(value) : '')
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

                                            <LotSelectorDropdown
                                                lotSelectorRef={lotSelectorRef}
                                                selectedFieldId={selectedFieldId}
                                                uniqueLotNames={uniqueLotNames}
                                                isLotSelectorOpen={isLotSelectorOpen}
                                                setIsLotSelectorOpen={setIsLotSelectorOpen}
                                                availableLots={availableLots}
                                                selectedLots={selectedLots}
                                                handleToggleLot={handleToggleLot}
                                            />

                                            <div className={`${styles.field} wof-fixedField wof-summaryLots`}>
                                                <span>Lotes / superficie</span>

                                                {selectedLots.length > 0 ? (
                                                    <div className="wof-lotAreaEditorCompact">
                                                        {selectedLots.map((lot) => (
                                                            <label key={lot.rowId} className="wof-lotAreaChip">
                                                                <span className="wof-lotAreaChipName">{lot.lot_name}</span>
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={lot.effective_area}
                                                                    onChange={(event) =>
                                                                        handleUpdateLotArea(lot.lot_id, event.target.value)
                                                                    }
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="wof-lotAreaEmpty">Sin lotes seleccionados</div>
                                                )}
                                            </div>

                                            <label className={`${styles.field} wof-fixedField wof-summaryCultures`}>
                                                <span>Cultivos seleccionados</span>
                                                <input
                                                    type="text"
                                                    value={uniqueCropNames.join(', ')}
                                                    placeholder="Se completa según los lotes elegidos"
                                                    readOnly
                                                />
                                            </label>

                                            <label className={`${styles.field} wof-fixedField wof-summarySurface`}>
                                                <span>Superficie realizada</span>
                                                <input
                                                    type="text"
                                                    value={formatCalculatedDecimal(totalEffectiveArea)}
                                                    placeholder="Se suma automáticamente"
                                                    readOnly
                                                />
                                            </label>

                                            <div className={`${styles.field} wof-fixedField wof-summaryLabor`}>
                                                <span>Labor</span>
                                                <LaborSelector
                                                    labors={labors}
                                                    selectedLaborId={selectedLaborId}
                                                    selectedLaborName={labors.find((l) => l.id === selectedLaborId)?.name ?? ''}
                                                    isOpen={isLaborSelectorOpen}
                                                    onOpen={() => setIsLaborSelectorOpen(true)}
                                                    onClose={() => { setIsLaborSelectorOpen(false); setIsCreatingLaborOpen(false) }}
                                                    onSelect={(labor) => {
                                                        setSelectedLaborId(labor.id)
                                                        setContractor(labor.contractor_name ?? '')
                                                        setIsLaborSelectorOpen(false)
                                                        setIsCreatingLaborOpen(false)
                                                    }}
                                                    search={laborSearch}
                                                    onSearchChange={setLaborSearch}
                                                    isPendingCreatorOpen={isCreatingLaborOpen}
                                                    onOpenCreator={handleOpenLaborCreator}
                                                    onCloseCreator={handleCloseLaborCreator}
                                                    pendingName={newLaborName}
                                                    onPendingNameChange={setNewLaborName}
                                                    onCreatePending={handleCreatePendingLabor}
                                                    isCreating={isSavingLabor}
                                                    pendingError={laborCreateError}
                                                    isLoading={isLoadingLabors}
                                                    error={laborsError}
                                                    selectedProjectId={selectedProjectId}
                                                />
                                                {laborsError ? <small>{laborsError}</small> : null}
                                            </div>
                                            <label className={`${styles.field} wof-fixedField wof-summaryContractor`}>
                                                <span>Contratista</span>
                                                <input
                                                    type="text"
                                                    value={contractor}
                                                    placeholder={
                                                        labors.find((l) => l.id === selectedLaborId)?.is_pending
                                                            ? ' Pendiente de asignación '
                                                            : 'Se completa automáticamente'
                                                    }
                                                    readOnly
                                                />
                                            </label>
                                        </div>
                                        <InvestorSplitSection
                                            splitContribution={splitContribution}
                                            setSplitContribution={setSplitContribution}
                                            selectedInvestorId={selectedInvestorId}
                                            setSelectedInvestorId={setSelectedInvestorId}
                                            investorSplits={investorSplits}
                                            setInvestorSplits={setInvestorSplits}
                                            projectInvestors={projectInvestors}
                                            selectedProjectId={selectedProjectId}
                                        />
                                    </div>
                                    <div className="wof-stepActions">
                                        <button type="button" className={styles.secondaryBtn} onClick={goToPreviousStep}>
                                            Volver atrás
                                        </button>

                                        <button type="button" className={styles.primaryBtn} onClick={goToNextStep}>
                                            Continuar
                                        </button>
                                    </div>
                                </div>
                                <div className="wof-stepPanel" hidden={currentStep !== 3}>
                                    <div className="wof-stepCard">
                                        <div className="wof-panelHeader">
                                            <span className="wof-panelIcon" aria-hidden="true">
                                                <ClipboardList />
                                            </span>
                                            <h2>Carga de insumos</h2>
                                        </div>
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
                                        <label className={`${styles.field} wof-observationsField`}>
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
                                    </div>
                                    <div className={`${styles.footerActions} wof-finalActions`}>
                                        <button type="button" className={styles.secondaryBtn} onClick={goToPreviousStep}>
                                            Volver atrás
                                        </button>
                                        {createdDrafts.length > 0 ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className={styles.secondaryBtn}
                                                    onClick={handleShareGroupPdf}
                                                    disabled={isDownloadingGroupPdf}
                                                >
                                                    {isDownloadingGroupPdf ? 'Preparando PDF...' : 'Compartir PDF'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.secondaryBtn}
                                                    onClick={handleDownloadCreatedPdf}
                                                    disabled={isDownloadingGroupPdf}
                                                >
                                                    {isDownloadingGroupPdf ? 'Descargando PDF...' : 'Descargar PDF'}
                                                </button>
                                            </>
                                        ) : null}
                                        <button
                                            type="button"
                                            className={styles.primaryBtn}
                                            onClick={handleSaveBatchDraft}
                                            disabled={isSavingDraft}
                                        >
                                            {isSavingDraft ? 'Guardando...' : 'Guardar borradores'}
                                        </button>
                                    </div>
                                </div>
                            </fieldset>
                        </form>
                    </>
            </div>
        </div>
    )
}
