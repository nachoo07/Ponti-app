import type { Dispatch, SetStateAction } from 'react'
import type { Investor, InvestorSplit } from '../../../../entities/project/model/project.types'
import './WorkOrderForm.css'

const styles = {
    box: 'wof-box',
    boxHeader: 'wof-boxHeader',
    subtitle: 'wof-subtitle',
    checkRow: 'wof-checkRow',
    field: 'wof-field',
    splitList: 'wof-splitList',
    splitRow: 'wof-splitRow',
    dangerBtn: 'wof-dangerBtn',
    secondaryBtn: 'wof-secondaryBtn',
} as const

type InvestorSplitSectionProps = {
    splitContribution: boolean
    setSplitContribution: (value: boolean) => void
    selectedInvestorId: number | ''
    setSelectedInvestorId: (value: number | '') => void
    investorSplits: InvestorSplit[]
    setInvestorSplits: Dispatch<SetStateAction<InvestorSplit[]>>
    projectInvestors: Investor[]
    selectedProjectId: number | ''
}

export function InvestorSplitSection({
    splitContribution,
    setSplitContribution,
    selectedInvestorId,
    setSelectedInvestorId,
    investorSplits,
    setInvestorSplits,
    projectInvestors,
    selectedProjectId,
}: InvestorSplitSectionProps) {
    return (
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
    )
}
