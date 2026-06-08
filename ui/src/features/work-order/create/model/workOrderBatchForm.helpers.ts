import type { BatchSelectedLotFormRow, BatchSharedSupplyFormRow, } from '../model/workOrderBatchForm.types'
import type { Lot } from '../../../../entities/project/model/project.types'

export function parseDecimal(value: string): number {
    const normalized = Number(value.replace(',', '.'))
    return Number.isFinite(normalized) ? normalized : 0
}

export function normalizeDecimalInput(value: string): string {
    const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '')
    const [integerPart = '', ...decimalParts] = normalized.split('.')
    if (decimalParts.length === 0) return integerPart
    return `${integerPart}.${decimalParts.join('')}`
}

export function normalizeDoseInput(value: string): string {
    const normalized = value.replace(/[^0-9,.]/g, '').replace(/[,.]/g, ',')
    const [integerPart = '', ...decimalParts] = normalized.split(',')
    if (decimalParts.length === 0) return integerPart
    return `${integerPart},${decimalParts.join('')}`
}

export function formatDoseDecimal(value: number): string {
    return formatCalculatedDecimal(value).replace('.', ',')
}

export function getTodayDateInputValue(): string {
    const today = new Date()
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
    return today.toISOString().slice(0, 10)
}

export function roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

export function formatDose(value: number): string {
    if (!Number.isFinite(value)) return ''
    return roundTo(value, 4).toFixed(4).replace(/\.?0+$/, '').replace('.', ',')
}

export function formatTotalUsedFromDose(value: number): string {
    if (!Number.isFinite(value)) return ''
    return roundTo(value, 4).toFixed(4).replace(/\.?0+$/, '')
}

export function formatCalculatedDecimal(value: number, maxDecimals = 4): string {
    if (!Number.isFinite(value)) return ''
    return value.toFixed(maxDecimals).replace(/\.?0+$/, '')
}

export function buildEmptySupplyRow(): BatchSharedSupplyFormRow {
    return {
        rowId: crypto.randomUUID(),
        supply_id: '',
        total_used: '',
        final_dose: '',
        last_edited_field: 'total_used',
    }
}

export function buildInitialSupplyRows(): BatchSharedSupplyFormRow[] {
    return [buildEmptySupplyRow(), buildEmptySupplyRow(), buildEmptySupplyRow()]
}

export function buildSelectedLotFormRow(lot: Lot): BatchSelectedLotFormRow {
    return {
        rowId: crypto.randomUUID(),
        lot_id: lot.id,
        lot_name: lot.name,
        effective_area: lot.hectares ?? '',
        crop_id: lot.current_crop_id,
        crop_name: lot.current_crop_name,
    }
}

export function insertSortedById<T extends { id: number; name: string }>(list: T[], item: T): T[] {
    if (list.some((existing) => existing.id === item.id)) {
        return list
    }
    return [...list, item].sort((a, b) => a.name.localeCompare(b.name))
}

