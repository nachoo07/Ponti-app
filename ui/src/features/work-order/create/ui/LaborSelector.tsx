import type { Labor } from '../../../../entities/labor/model/labor.types'
import './WorkOrderForm.css'

const styles = {
    dangerBtn: 'wof-dangerBtn',
    secondaryBtn: 'wof-secondaryBtn',
} as const

type LaborSelectorProps = {
    labors: Labor[]
    selectedLaborId: number | ''
    selectedLaborName: string
    isOpen: boolean
    onOpen: () => void
    onClose: () => void
    onSelect: (labor: Labor) => void
    search: string
    onSearchChange: (value: string) => void
    isPendingCreatorOpen: boolean
    onOpenCreator: () => void
    onCloseCreator: () => void
    pendingName: string
    onPendingNameChange: (value: string) => void
    onCreatePending: () => Promise<void>
    isCreating: boolean
    pendingError: string | null
    isLoading: boolean
    error: string | null
    selectedProjectId: number | ''
}

export function LaborSelector({
    labors,
    selectedLaborId,
    selectedLaborName,
    isOpen,
    onOpen,
    onClose,
    onSelect,
    search,
    onSearchChange,
    isPendingCreatorOpen,
    onOpenCreator,
    onCloseCreator,
    pendingName,
    onPendingNameChange,
    onCreatePending,
    isCreating,
    pendingError,
    isLoading,
    error,
    selectedProjectId,
}: LaborSelectorProps) {
    const filtered = search.trim()
        ? labors.filter((l) => l.name.toLowerCase().includes(search.trim().toLowerCase()))
        : labors

    return (
        <div className="wof-supplySelectorCell">
            <div className="wof-supplySelectorField">
                <button
                    type="button"
                    className="wof-supplySelectorTrigger"
                    onClick={() => (isOpen ? onClose() : onOpen())}
                    disabled={selectedProjectId === '' || isLoading || !!error}
                >
                    {selectedLaborId !== '' ? (
                        <span className="wof-supplyTriggerValue">
                            <span className="wof-supplyTriggerName">
                                {selectedLaborName || 'Seleccionar...'}
                            </span>
                        </span>
                    ) : (
                        <span className="wof-supplyTriggerPlaceholder">
                            Seleccionar labor
                        </span>
                    )}
                </button>

                {isOpen ? (
                    <div className="wof-supplySelectorPopover">
                        <input
                            type="text"
                            className="wof-supplySearchInput"
                            placeholder="Buscar labor..."
                            value={search}
                            onChange={(event) => {
                                onSearchChange(event.target.value)
                            }}
                            autoFocus
                        />

                        <button
                            type="button"
                            className="wof-supplyCreateAction"
                            onClick={onOpenCreator}
                            disabled={selectedProjectId === ''}
                        >
                            + Crear nueva labor
                        </button>

                        {isPendingCreatorOpen ? (
                            <div className="wof-pendingSupplyCard">
                                <input
                                    type="text"
                                    placeholder="Nombre de la labor"
                                    value={pendingName}
                                    onChange={(event) => {
                                        onPendingNameChange(event.target.value)
                                    }}
                                    autoFocus
                                />

                                <div className="wof-pendingSupplyActions">
                                    <button
                                        type="button"
                                        className={styles.dangerBtn}
                                        onClick={onCloseCreator}
                                        disabled={isCreating}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        onClick={onCreatePending}
                                        disabled={isCreating}
                                    >
                                        {isCreating ? 'Creando...' : 'Guardar'}
                                    </button>
                                </div>

                                {pendingError ? (
                                    <small className="wof-inlineError">{pendingError}</small>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="wof-supplyOptionList">
                            {filtered.length === 0 ? (
                                <p className="wof-inlineHint">No hay labores para mostrar.</p>
                            ) : (
                                filtered.map((labor) => (
                                    <button
                                        key={labor.id}
                                        type="button"
                                        className="wof-supplyOption"
                                        onClick={() => onSelect(labor)}
                                    >
                                        <span className="wof-supplyOptionName">
                                            {labor.name}
                                            {labor.is_pending ? ' (Pendiente)' : ''}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
