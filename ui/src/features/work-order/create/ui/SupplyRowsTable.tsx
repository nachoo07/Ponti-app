import type { Dispatch, SetStateAction } from 'react'
import type { Supply } from '../../../../entities/supply/model/supply.types'
import type { BatchSharedSupplyFormRow } from '../model/workOrderBatchForm.types'
import { SupplySelector } from './SupplySelector'
import './WorkOrderForm.css'

const styles = {
    inputsSection: 'wof-inputsSection',
    insumoGridHead: 'wof-insumoGridHead',
    actionsCol: 'wof-actionsCol',
    insumoRow: 'wof-insumoRow',
    dangerBtn: 'wof-dangerBtn',
    secondaryBtn: 'wof-secondaryBtn',
} as const

type SupplyRowsTableProps = {
    supplyRows: BatchSharedSupplyFormRow[]
    suppliesError: string | null
    selectedProjectId: number | ''
    isLoadingSupplies: boolean
    availableSupplies: Supply[]
    supplySearchByRow: Record<string, string>
    setSupplySearchByRow: Dispatch<SetStateAction<Record<string, string>>>
    openSupplySelectorRowId: string | null
    onOpenSelector: (rowId: string) => void
    onCloseSelector: () => void
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
    updateSupplyRowFromFinalDose: (rowId: string, value: string) => void
    updateSupplyRowFromTotalUsed: (rowId: string, value: string) => void
    onRemoveSupplyRow: (rowId: string) => void
    onAddSupplyRow: () => void
}

export function SupplyRowsTable({
    supplyRows,
    suppliesError,
    selectedProjectId,
    isLoadingSupplies,
    availableSupplies,
    supplySearchByRow,
    setSupplySearchByRow,
    openSupplySelectorRowId,
    onOpenSelector,
    onCloseSelector,
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
    updateSupplyRowFromFinalDose,
    updateSupplyRowFromTotalUsed,
    onRemoveSupplyRow,
    onAddSupplyRow,
}: SupplyRowsTableProps) {
    return (
        <section className={styles.inputsSection}>
            {suppliesError ? <small>{suppliesError}</small> : null}

            <div className="wof-supplyTable">
                <div className={styles.insumoGridHead}>
                    <span>Insumo</span>
                    <span>Dosis final</span>
                    <span>Total utilizado</span>
                    <span className={styles.actionsCol}>Acción</span>
                </div>

                {supplyRows.map((row) => (
                    <div key={row.rowId} className={styles.insumoRow}>
                        <SupplySelector
                            row={row}
                            supplyRows={supplyRows}
                            openSupplySelectorRowId={openSupplySelectorRowId}
                            onOpenSelector={onOpenSelector}
                            onCloseSelector={onCloseSelector}
                            availableSupplies={availableSupplies}
                            supplySearchByRow={supplySearchByRow}
                            setSupplySearchByRow={setSupplySearchByRow}
                            setPendingSupplyName={setPendingSupplyName}
                            setPendingSupplyError={setPendingSupplyError}
                            onSelectSupply={onSelectSupply}
                            pendingSupplyRowId={pendingSupplyRowId}
                            pendingSupplyName={pendingSupplyName}
                            isCreatingPendingSupply={isCreatingPendingSupply}
                            onOpenPendingCreator={onOpenPendingCreator}
                            onClosePendingCreator={onClosePendingCreator}
                            onCreatePendingSupply={onCreatePendingSupply}
                            pendingSupplyError={pendingSupplyError}
                            selectedProjectId={selectedProjectId}
                            isLoadingSupplies={isLoadingSupplies}
                            suppliesError={suppliesError}
                        />

                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Dosis"
                            value={row.final_dose}
                            onChange={(event) =>
                                updateSupplyRowFromFinalDose(row.rowId, event.target.value)
                            }
                        />
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Total usado"
                            value={row.total_used}
                            onChange={(event) =>
                                updateSupplyRowFromTotalUsed(row.rowId, event.target.value)
                            }
                        />
                        <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => onRemoveSupplyRow(row.rowId)}
                        >
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className={`${styles.secondaryBtn} wof-addSupplyBtn`}
                onClick={onAddSupplyRow}
            >
                + Agregar insumo
            </button>
        </section>
    )
}
