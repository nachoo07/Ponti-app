import type { Dispatch, SetStateAction } from 'react'
import type { Supply } from '../../../../entities/supply/model/supply.types'
import type { BatchSharedSupplyFormRow } from '../model/workOrderBatchForm.types'
import './WorkOrderForm.css'

const styles = {
    dangerBtn: 'wof-dangerBtn',
    secondaryBtn: 'wof-secondaryBtn',
} as const

type SupplySelectorProps = {
    row: BatchSharedSupplyFormRow
    supplyRows: BatchSharedSupplyFormRow[]
    openSupplySelectorRowId: string | null
    onOpenSelector: (rowId: string) => void
    onCloseSelector: () => void
    availableSupplies: Supply[]
    supplySearchByRow: Record<string, string>
    setSupplySearchByRow: Dispatch<SetStateAction<Record<string, string>>>
    setPendingSupplyName: (value: string) => void
    setPendingSupplyError: (value: string | null) => void
    onSelectSupply: (rowId: string, supply: Supply) => void
    pendingSupplyRowId: string | null
    pendingSupplyName: string
    isCreatingPendingSupply: boolean
    onOpenPendingCreator: (rowId: string) => void
    onClosePendingCreator: () => void
    onCreatePendingSupply: () => Promise<void>
    pendingSupplyError: string | null
    selectedProjectId: number | ''
    isLoadingSupplies: boolean
    suppliesError: string | null
}

function formatAvailableQty(value: number): string {
    return value.toFixed(2).replace(/\.?0+$/, '')
}

function getStockLabel(supply: Supply): string {
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

export function SupplySelector({
    row,
    supplyRows,
    openSupplySelectorRowId,
    onOpenSelector,
    onCloseSelector,
    availableSupplies,
    supplySearchByRow,
    setSupplySearchByRow,
    setPendingSupplyName,
    setPendingSupplyError,
    onSelectSupply,
    pendingSupplyRowId,
    pendingSupplyName,
    isCreatingPendingSupply,
    onOpenPendingCreator,
    onClosePendingCreator,
    onCreatePendingSupply,
    pendingSupplyError,
    selectedProjectId,
    isLoadingSupplies,
    suppliesError,
}: SupplySelectorProps) {
    const isOpen = openSupplySelectorRowId === row.rowId
    const isPendingCreatorOpen = pendingSupplyRowId === row.rowId

    const search = (supplySearchByRow[row.rowId] ?? '').trim().toLowerCase()
    const filteredSupplies = search
        ? availableSupplies.filter((s) => s.name.toLowerCase().includes(search))
        : availableSupplies

    const selectedSupply = row.supply_id !== ''
        ? (availableSupplies.find((s) => s.id === row.supply_id) ?? null)
        : null

    const supplyLabel = row.supply_id !== ''
        ? (row.supply_name?.trim() || selectedSupply?.name || '')
        : ''

    const triggerStockLabel = selectedSupply ? getStockLabel(selectedSupply) : ''

    return (
        <div className="wof-supplySelectorCell">
            <div className="wof-supplySelectorField">
                <button
                    type="button"
                    className="wof-supplySelectorTrigger"
                    onClick={() =>
                        isOpen ? onCloseSelector() : onOpenSelector(row.rowId)
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
                                {supplyLabel || 'Seleccionar...'}
                            </span>
                            {triggerStockLabel ? (
                                <span
                                    className={`wof-supplyTriggerStock ${
                                        Number(selectedSupply?.available_stock ?? 0) < 0
                                            ? 'is-negative'
                                            : ''
                                    }`}
                                >
                                    {triggerStockLabel}
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        <span className="wof-supplyTriggerPlaceholder">
                            Seleccionar insumo
                        </span>
                    )}
                </button>

                {isOpen ? (
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
                                onOpenPendingCreator(row.rowId)
                                setPendingSupplyName(
                                    (supplySearchByRow[row.rowId] ?? '').trim(),
                                )
                            }}
                            disabled={selectedProjectId === ''}
                        >
                            + Crear nuevo insumo
                        </button>

                        {isPendingCreatorOpen ? (
                            <div className="wof-pendingSupplyCard">
                                <input
                                    type="text"
                                    placeholder="Nombre del insumo"
                                    value={pendingSupplyName}
                                    onChange={(event) => {
                                        setPendingSupplyName(event.target.value)
                                        setPendingSupplyError(null)
                                    }}
                                    autoFocus
                                />

                                <div className="wof-pendingSupplyActions">
                                    <button
                                        type="button"
                                        className={styles.dangerBtn}
                                        onClick={onClosePendingCreator}
                                        disabled={isCreatingPendingSupply}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        onClick={onCreatePendingSupply}
                                        disabled={isCreatingPendingSupply}
                                    >
                                        {isCreatingPendingSupply ? 'Creando...' : 'Guardar'}
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
                            {filteredSupplies.map((supply) => {
                                const isUsedInAnotherRow = supplyRows.some(
                                    (item) =>
                                        item.rowId !== row.rowId &&
                                        item.supply_id === supply.id,
                                )
                                const stockLabel = getStockLabel(supply)

                                return (
                                    <button
                                        key={supply.id}
                                        type="button"
                                        className="wof-supplyOption"
                                        onClick={() => onSelectSupply(row.rowId, supply)}
                                        disabled={isUsedInAnotherRow}
                                    >
                                        <span className="wof-supplyOptionName">
                                            {supply.name}
                                            {supply.is_pending ? ' (Pendiente)' : ''}
                                        </span>

                                        {stockLabel ? (
                                            <span
                                                className={`wof-supplyOptionStock ${
                                                    Number(supply.available_stock ?? 0) < 0
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

                            {filteredSupplies.length === 0 ? (
                                <p className="wof-inlineHint">
                                    No hay insumos para mostrar.
                                </p>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
