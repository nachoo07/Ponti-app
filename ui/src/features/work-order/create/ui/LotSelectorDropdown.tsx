import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { Lot } from '../../../../entities/project/model/project.types'
import type { BatchSelectedLotFormRow } from '../model/workOrderBatchForm.types'
import './WorkOrderForm.css'

type LotSelectorDropdownProps = {
    lotSelectorRef: RefObject<HTMLDivElement | null>
    selectedFieldId: number | ''
    uniqueLotNames: string[]
    isLotSelectorOpen: boolean
    setIsLotSelectorOpen: Dispatch<SetStateAction<boolean>>
    availableLots: Lot[]
    selectedLots: BatchSelectedLotFormRow[]
    handleToggleLot: (lot: Lot, checked: boolean) => void
}

export function LotSelectorDropdown({
    lotSelectorRef,
    selectedFieldId,
    uniqueLotNames,
    isLotSelectorOpen,
    setIsLotSelectorOpen,
    availableLots,
    selectedLots,
    handleToggleLot,
}: LotSelectorDropdownProps) {
    return (
        <div
            ref={lotSelectorRef}
            className="wof-field wof-lotSelectorField wof-workLots"
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
                                            onChange={(event) =>
                                                handleToggleLot(lot, event.target.checked)
                                            }
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
    )
}
