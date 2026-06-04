import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useWorkOrderWorkspace } from '../model/useWorkOrderWorkspace'
import { validateCreateBatchWorkOrderDraft } from '../model/validateCreateBatchWorkOrderDraft'
import type { BatchSelectedLotFormRow, BatchSharedSupplyFormRow, } from '../model/workOrderBatchForm.types'
import './WorkOrderForm.css'

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

function getTodayDateInputValue(): string {
    const today = new Date()
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
    return today.toISOString().slice(0, 10)
}

function roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

function formatDose(value: number): string {
    if (!Number.isFinite(value)) return ''
    return roundTo(value, 4).toFixed(4).replace(/\.?0+$/, '').replace('.', ',')
}

function formatTotalUsedFromDose(value: number): string {
    if (!Number.isFinite(value)) return ''
    return roundTo(value, 4).toFixed(4).replace(/\.?0+$/, '')
}

function formatCalculatedDecimal(value: number, maxDecimals = 4): string {
    if (!Number.isFinite(value)) return ''
    return value.toFixed(maxDecimals).replace(/\.?0+$/, '')
}

function buildEmptySupplyRow(): BatchSharedSupplyFormRow {
    return {
        rowId: crypto.randomUUID(),
        supply_id: '',
        total_used: '',
        final_dose: '',
        last_edited_field: 'total_used',
    }
}

function buildInitialSupplyRows(): BatchSharedSupplyFormRow[] {
    return [buildEmptySupplyRow(), buildEmptySupplyRow(), buildEmptySupplyRow()]
}

function buildSelectedLotFormRow(lot: Lot): BatchSelectedLotFormRow {
    return {
        rowId: crypto.randomUUID(),
        lot_id: lot.id,
        lot_name: lot.name,
        effective_area: lot.hectares ?? '',
        crop_id: lot.current_crop_id,
        crop_name: lot.current_crop_name,
    }
}

export function WorkOrderBatchForm() {
    const [selectedFieldId, setSelectedFieldId] = useState<number | ''>('')
    const [availableLots, setAvailableLots] = useState<Lot[]>([])
    const [isLotSelectorOpen, setIsLotSelectorOpen] = useState(false)
    const lotSelectorRef = useRef<HTMLDivElement | null>(null)
    const formTopRef = useRef<HTMLDivElement | null>(null)
    const confirmationHeadingRef = useRef<HTMLHeadingElement | null>(null)
    const navigate = useNavigate()

    const [selectedLaborId, setSelectedLaborId] = useState<number | ''>('')
    const [contractor, setContractor] = useState('')
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
    const [, setIsLoadingNumberPreview] = useState(false)
    const [numberPreviewError, setNumberPreviewError] = useState<string | null>(null)

    const [isSavingDraft, setIsSavingDraft] = useState(false)
    const [isDownloadingGroupPdf, setIsDownloadingGroupPdf] = useState(false)
    const [saveDraftError, setSaveDraftError] = useState<string | null>(null)
    const [groupPdfError, setGroupPdfError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [createdDrafts, setCreatedDrafts] = useState<CreatedBatchDraft[]>([])
    const [preciseDoseByRow, setPreciseDoseByRow] = useState<Record<string, number>>({})

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
        isLoadingLabors,
        laborsError,
        resetWorkspaceSelection,
    } = useWorkOrderWorkspace({
        onCustomerChange: resetProjectDependentSelections,
        onProjectChange: resetProjectDependentSelections,
    })

    function resetProjectDependentSelections() {
        setSelectedFieldId('')
        setAvailableLots([])
        setIsLotSelectorOpen(false)
        setSelectedLots([])
        setSelectedLaborId('')
        setContractor('')
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
            setIsLoadingNumberPreview(true)
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
        if (createdDrafts.length > 0) {
            confirmationHeadingRef.current?.focus()
        }
    }, [createdDrafts.length])

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

    function getFilteredSupplies(rowId: string): Supply[] {
        const search = (supplySearchByRow[rowId] ?? '').trim().toLowerCase()

        if (!search) {
            return availableSupplies
        }

        return availableSupplies.filter((supply) =>
            supply.name.toLowerCase().includes(search),
        )
    }

    function formatAvailableQty(value: number): string {
        return value.toFixed(2).replace(/\.?0+$/, '')
    }

    function getSupplyStockLabel(supply: Supply): string {
        if (typeof supply.available_stock !== 'string' || supply.available_stock.trim() === '') {
            return ''
        }

        const numericStock = Number(supply.available_stock)
        const formattedStock = Number.isFinite(numericStock)
            ? formatAvailableQty(numericStock)
            : supply.available_stock

        const unit = supply.available_unit?.trim() || supply.unit_name?.trim() || ''
        return unit ? `${formattedStock} ${unit}` : formattedStock
    }


    function normalizeDecimalInput(value: string): string {
        const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '')
        const [integerPart = '', ...decimalParts] = normalized.split('.')

        if (decimalParts.length === 0) {
            return integerPart
        }

        return `${integerPart}.${decimalParts.join('')}`
    }

    function normalizeDoseInput(value: string): string {
        const normalized = value.replace(/[^0-9,.]/g, '').replace(/[,.]/g, ',')
        const [integerPart = '', ...decimalParts] = normalized.split(',')

        if (decimalParts.length === 0) {
            return integerPart
        }

        return `${integerPart},${decimalParts.join('')}`
    }

    function handleNumberBlur() {
        if (selectedProjectId === '') return

        void (async () => {
            setIsLoadingNumberPreview(true)
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
            } finally {
                setIsLoadingNumberPreview(false)
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

    function getSupplyLabel(row: BatchSharedSupplyFormRow): string {
        if (row.supply_id === '') return ''

        const matchedSupply = supplies.find((supply) => supply.id === row.supply_id) ?? null
        return row.supply_name?.trim() || matchedSupply?.name || ''
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
    }

    function handleSelectSupply(rowId: string, supply: Supply) {
        updateSupplyRow(rowId, {
            supply_id: supply.id,
            supply_name: supply.name,
        })
        setOpenSupplySelectorRowId(null)
    }

    function handleRemoveSupplyRow(rowId: string) {
        setSupplyRows((current) =>
            current.length <= 3 ? current : current.filter((row) => row.rowId !== rowId),
        )
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

            setSupplies((current) => {
                const alreadyExists = current.some((item) => item.id === nextSupply.id)

                if (alreadyExists) {
                    return current
                }

                return [...current, nextSupply].sort((a, b) => a.name.localeCompare(b.name))
            })

            updateSupplyRow(pendingSupplyRowId, {
                supply_id: response.id,
                supply_name: response.name,
            })

            handleClosePendingSupplyCreator()
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'No se pudo crear el insumo pendiente.'
            setPendingSupplyError(message)
        } finally {
            setIsCreatingPendingSupply(false)
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
            resetFormAfterCreate()
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

    return (
        <div className={styles.page}>
            <div ref={formTopRef} />
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
                {createdDrafts.length > 0 ? (
                    <section className="wof-confirmation">
                        {/*
                          El anuncio a lectores de pantalla lo da el foco en el <h2>
                          (tabIndex={-1} + .focus()). No usamos role="status"/aria-live
                          en el contenedor para evitar el doble anuncio (live-region +
                          movimiento de foco sobre el mismo bloque recién insertado).
                        */}
                        <div className="wof-confirmationIcon" aria-hidden="true">
                            ✅
                        </div>
                        <h2
                            ref={confirmationHeadingRef}
                            tabIndex={-1}
                            className="wof-confirmationTitle"
                        >
                            {createdDrafts.length === 1
                                ? 'Orden cargada correctamente'
                                : 'Órdenes cargadas correctamente'}
                        </h2>
                        <p className="wof-confirmationSubtitle">
                            {createdDrafts.length === 1
                                ? '1 orden digital generada'
                                : `${createdDrafts.length} órdenes digitales generadas`}
                        </p>
                        <div className="wof-confirmationActions">
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={handleCreateNewOrder}
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
                    </section>
                ) : (
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
                        <div className={styles.grid3}>
                            <label className={styles.field}>
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

                            <div
                                ref={lotSelectorRef}
                                className={`${styles.field} wof-lotSelectorField`}
                            >
                                <span>Lotes</span>
                                <button
                                    type="button"
                                    className="wof-lotSelectorTrigger"
                                    onClick={() => setIsLotSelectorOpen((current) => !current)}
                                    disabled={!selectedFieldId}
                                >
                                    {uniqueLotNames.length > 0
                                        ? uniqueLotNames.join(', ')
                                        : 'Seleccionar lotes'}
                                </button>

                                {isLotSelectorOpen ? (
                                    <div className="wof-lotSelectorPopover">
                                        <p className="wof-lotSelectorTitle">LOTES</p>

                                        <div className="wof-lotChecklist">
                                            {availableLots.length === 0 ? (
                                                <p className="wof-inlineHint">No hay lotes para mostrar.</p>
                                            ) : (
                                                availableLots.map((lot) => {
                                                    const checked = selectedLots.some((item) => item.lot_id === lot.id)

                                                    return (
                                                        <label
                                                            key={lot.id}
                                                            className={`wof-lotOption ${checked ? 'is-selected' : ''}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={(event) => handleToggleLot(lot, event.target.checked)}
                                                            />
                                                            <span className="wof-lotOptionLabel">{lot.name}</span>
                                                        </label>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="wof-summaryGrid">
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

                            <label className={`${styles.field} wof-fixedField wof-summaryLabor`}>
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

                            <label className={`${styles.field} wof-fixedField wof-summaryContractor`}>
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
                                        </div>
                                    ))}

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
                                </div>
                            )}
                        </section>

                        <section className={styles.inputsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.subtitle}>Carga de insumos</h2>
                                {suppliesError ? <small>{suppliesError}</small> : null}
                            </div>

                            <div className={styles.insumoGridHead}>
                                <span>Insumo</span>
                                <span>Dosis final</span>
                                <span>Total utilizado</span>
                                <span className={styles.actionsCol}>Accion</span>
                            </div>
                            {supplyRows.map((row) => {
                                return (
                                    <div key={row.rowId} className={styles.insumoRow}>
                                        <div className="wof-supplySelectorCell">
                                            <div className="wof-supplySelectorField">
                                                <button
                                                    type="button"
                                                    className="wof-supplySelectorTrigger"
                                                    onClick={() =>
                                                        openSupplySelectorRowId === row.rowId
                                                            ? handleCloseSupplySelector()
                                                            : handleOpenSupplySelector(row.rowId)
                                                    }
                                                    disabled={
                                                        selectedProjectId === '' ||
                                                        isLoadingSupplies ||
                                                        !!suppliesError
                                                    }
                                                >
                                                    {row.supply_id !== '' ? (
                                                        <span className="wof-supplyTriggerValue">
                                                            <span className="wof-supplyTriggerName">
                                                                {getSupplyLabel(row) || 'Seleccionar...'}
                                                            </span>
                                                            {(() => {
                                                                const selectedSupply =
                                                                    availableSupplies.find(
                                                                        (supply) => supply.id === row.supply_id,
                                                                    ) ?? null

                                                                const stockLabel = selectedSupply
                                                                    ? getSupplyStockLabel(selectedSupply)
                                                                    : ''

                                                                return stockLabel ? (
                                                                    <span
                                                                        className={`wof-supplyTriggerStock ${Number(
                                                                            selectedSupply?.available_stock ?? 0,
                                                                        ) < 0
                                                                            ? 'is-negative'
                                                                            : ''
                                                                            }`}
                                                                    >
                                                                        {stockLabel}
                                                                    </span>
                                                                ) : null
                                                            })()}
                                                        </span>
                                                    ) : (
                                                        <span className="wof-supplyTriggerPlaceholder">
                                                            Seleccionar insumo
                                                        </span>
                                                    )}
                                                </button>
                                                {openSupplySelectorRowId === row.rowId ? (
                                                    <div className="wof-supplySelectorPopover">
                                                        <input
                                                            type="text"
                                                            className="wof-supplySearchInput"
                                                            placeholder="Buscar insumo..."
                                                            value={supplySearchByRow[row.rowId] ?? ''}
                                                            onChange={(event) => {
                                                                const value = event.target.value
                                                                setSupplySearchByRow((current) => ({
                                                                    ...current,
                                                                    [row.rowId]: value,
                                                                }))
                                                                setPendingSupplyName(value)
                                                                setPendingSupplyError(null)
                                                            }}
                                                            autoFocus
                                                        />

                                                        <button
                                                            type="button"
                                                            className="wof-supplyCreateAction"
                                                            onClick={() => {
                                                                handleOpenPendingSupplyCreator(row.rowId)
                                                                setPendingSupplyName(
                                                                    (supplySearchByRow[row.rowId] ?? '').trim(),
                                                                )
                                                            }}
                                                            disabled={selectedProjectId === ''}
                                                        >
                                                            + Crear nuevo insumo
                                                        </button>
                                                        {pendingSupplyRowId === row.rowId ? (
                                                            <div className="wof-pendingSupplyCard">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nombre del insumo"
                                                                    value={pendingSupplyName}
                                                                    onChange={(event) => {
                                                                        setPendingSupplyName(
                                                                            event.target.value,
                                                                        )
                                                                        setPendingSupplyError(null)
                                                                    }}
                                                                    autoFocus
                                                                />

                                                                <div className="wof-pendingSupplyActions">
                                                                    <button
                                                                        type="button"
                                                                        className={styles.secondaryBtn}
                                                                        onClick={handleCreatePendingSupply}
                                                                        disabled={isCreatingPendingSupply}
                                                                    >
                                                                        {isCreatingPendingSupply
                                                                            ? 'Creando...'
                                                                            : 'Guardar'}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className={styles.dangerBtn}
                                                                        onClick={handleClosePendingSupplyCreator}
                                                                        disabled={isCreatingPendingSupply}
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>

                                                                {pendingSupplyError ? (
                                                                    <small className="wof-inlineError">
                                                                        {pendingSupplyError}
                                                                    </small>
                                                                ) : null}
                                                            </div>
                                                        ) : null}

                                                        <div className="wof-supplyOptionList">
                                                            {getFilteredSupplies(row.rowId).map((supply) => {
                                                                const isUsedInAnotherRow = supplyRows.some(
                                                                    (item) =>
                                                                        item.rowId !== row.rowId &&
                                                                        item.supply_id === supply.id,
                                                                )

                                                                const stockLabel = getSupplyStockLabel(supply)

                                                                return (
                                                                    <button
                                                                        key={supply.id}
                                                                        type="button"
                                                                        className="wof-supplyOption"
                                                                        onClick={() =>
                                                                            handleSelectSupply(row.rowId, supply)
                                                                        }
                                                                        disabled={isUsedInAnotherRow}
                                                                    >
                                                                        <span className="wof-supplyOptionName">
                                                                            {supply.name}
                                                                            {supply.is_pending
                                                                                ? ' (Pendiente)'
                                                                                : ''}
                                                                        </span>

                                                                        {stockLabel ? (
                                                                            <span
                                                                                className={`wof-supplyOptionStock ${Number(
                                                                                    supply.available_stock ?? 0,
                                                                                ) < 0
                                                                                    ? 'is-negative'
                                                                                    : ''
                                                                                    }`}
                                                                            >
                                                                                {stockLabel}
                                                                            </span>
                                                                        ) : null}
                                                                    </button>
                                                                )
                                                            })}

                                                            {getFilteredSupplies(row.rowId).length === 0 ? (
                                                                <p className="wof-inlineHint">
                                                                    No hay insumos para mostrar.
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="Dosis"
                                            value={row.final_dose}
                                            onChange={(event) => {
                                                updateSupplyRowFromFinalDose(row.rowId, event.target.value)
                                            }}
                                        />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="Total usado"
                                            value={row.total_used}
                                            onChange={(event) => {
                                                updateSupplyRowFromTotalUsed(row.rowId, event.target.value)
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className={styles.dangerBtn}
                                            onClick={() => handleRemoveSupplyRow(row.rowId)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                )
                            })}
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={handleAddSupplyRow}
                            >
                                + Agregar insumo
                            </button>
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
                        <div className={styles.footerActions}>
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={handleSaveBatchDraft}
                                disabled={isSavingDraft}
                            >
                                {isSavingDraft ? 'Guardando...' : 'Guardar borradores'}
                            </button>
                        </div>
                    </fieldset>
                </form>
                    </>
                )}
            </div>
        </div>
    )
}
