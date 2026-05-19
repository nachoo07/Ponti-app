import type { jsPDF as JsPDF } from 'jspdf'
import type {
  PdfPrimitive,
  WorkOrderDraftPdfData,
  WorkOrderDraftPdfField,
  WorkOrderDraftPdfItem,
  WorkOrderDraftPdfLot,
} from '../model/workOrderDraftPdf.types'

import { interRegularBase64 } from './fonts/interRegularBase64'
import { interBoldBase64 } from './fonts/interBoldBase64'

type DisplayField = {
  label: string
  value: string
}

type TableColumn<T extends Record<string, PdfPrimitive>> = {
  key: keyof T & string
  label: string
}

const PAGE_WIDTH = 196.2
const MARGIN = 6.9
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const BLUE = '#3e5373'
const DIVIDER_BLUE = '#2f4564'
const TABLE_BLUE = '#445b7b'
const TEXT = '#1f2a3b'
const MUTED = '#64748b'
const LABEL = '#7e8999'
const BORDER = '#dbe3ef'
const CARD_BORDER = '#dee5f0'
const TABLE_BORDER = '#cbd5e1'
const SURFACE = '#f8fafc'
const CARD_SURFACE = '#fafbfd'
const SECTION_LINE_GAP = 4
let FONT_FAMILY = 'helvetica'
const FOOTER_TEXT =
  'Documento generado desde Ponti. Esta constancia corresponde a un borrador de orden de trabajo.'

function isUsableFontBase64(fontBase64: string): boolean {
  if (!fontBase64 || fontBase64.length < 1000 || fontBase64.includes('...')) {
    return false
  }

  try {
    const binary = atob(fontBase64.slice(0, 32))
    const signature = Array.from(binary.slice(0, 4))
      .map((character) => character.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')

    return signature === '00010000' || binary.slice(0, 4) === 'OTTO'
  } catch {
    return false
  }
}

function registerPdfFonts(doc: JsPDF): string {
  if (!isUsableFontBase64(interRegularBase64) || !isUsableFontBase64(interBoldBase64)) {
    return 'helvetica'
  }

  try {
    doc.addFileToVFS('Inter-Regular.ttf', interRegularBase64)
    doc.addFont('Inter-Regular.ttf', 'Inter', 'normal')

    doc.addFileToVFS('Inter-Bold.ttf', interBoldBase64)
    doc.addFont('Inter-Bold.ttf', 'Inter', 'bold')

    const fontList = doc.getFontList()

    if (!fontList.Inter?.includes('normal') || !fontList.Inter?.includes('bold')) {
      return 'helvetica'
    }

    return 'Inter'
  } catch {
    return 'helvetica'
  }
}

function displayValue(value: PdfPrimitive): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Si' : 'No'
  }

  return String(value)
}

function firstValue(
  data: WorkOrderDraftPdfData,
  keys: Array<keyof WorkOrderDraftPdfData>,
): PdfPrimitive {
  for (const key of keys) {
    const value = data[key]

    if (
      value !== null &&
      value !== undefined &&
      typeof value !== 'object' &&
      value !== ''
    ) {
      return value
    }
  }

  return undefined
}

function normalizeLabel(key: string): string {
  return key
    .replace(/_display$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeField(field: WorkOrderDraftPdfField): DisplayField | null {
  const label = field.label ?? field.name ?? field.key
  const value = field.display_value ?? field.displayValue ?? field.value

  if (!label) {
    return null
  }

  return {
    label,
    value: displayValue(value),
  }
}

function normalizeFields(
  fields: WorkOrderDraftPdfData['fields'] | WorkOrderDraftPdfData['summary'],
): DisplayField[] {
  if (!fields) {
    return []
  }

  if (Array.isArray(fields)) {
    return fields.flatMap((field) => {
      const normalized = normalizeField(field)
      return normalized ? [normalized] : []
    })
  }

  return Object.entries(fields).map(([key, value]) => ({
    label: normalizeLabel(key),
    value: displayValue(value),
  }))
}

function getSummaryFields(data: WorkOrderDraftPdfData): DisplayField[] {
  const providedFields = [...normalizeFields(data.summary), ...normalizeFields(data.fields)]

  if (providedFields.length > 0) {
    return orderSummaryFields(augmentSummaryFields(providedFields, data))
  }

  return orderSummaryFields([
    {
      label: 'Cliente',
      value: displayValue(firstValue(data, ['customer', 'customer_name'])),
    },
    {
      label: 'Proyecto',
      value: displayValue(firstValue(data, ['project', 'project_name'])),
    },
    {
      label: 'Campaña',
      value: displayValue(firstValue(data, ['campaign', 'campaign_name'])),
    },
    {
      label: 'Campo',
      value: displayValue(firstValue(data, ['field', 'field_name'])),
    },
    {
      label: 'Cultivo',
      value: displayValue(firstValue(data, ['crop', 'crop_name'])),
    },
    {
      label: 'Labor',
      value: displayValue(firstValue(data, ['labor', 'labor_name'])),
    },
    {
      label: 'Contratista',
      value: displayValue(data.contractor),
    },
    {
      label: 'Lote/s',
      value: getLotsDisplayValue(data),
    },
    {
      label: 'Superficie',
      value: getSurfaceDisplayValue(data),
    },
  ].filter((field) => field.value !== '-'))
}

function augmentSummaryFields(fields: DisplayField[], data: WorkOrderDraftPdfData): DisplayField[] {
  const nextFields = [...fields]
  const normalizedLabels = new Set(nextFields.map((field) => normalizeComparableLabel(field.label)))
  const surface = getSurfaceDisplayValue(data)
  const lots = getLotsDisplayValue(data)
  const labor = displayValue(firstValue(data, ['labor', 'labor_name']))

  if (!normalizedLabels.has('superficie')) {
    nextFields.push({ label: 'Superficie', value: surface })
  }

  if (!normalizedLabels.has('lotes') && !normalizedLabels.has('lote')) {
    nextFields.push({ label: 'Lote/s', value: lots })
  }

  if (!normalizedLabels.has('labor')) {
    nextFields.push({ label: 'Labor', value: labor })
  }

  return nextFields
}

function getSurfaceDisplayValue(data: WorkOrderDraftPdfData): string {
  const record = data as Record<string, PdfPrimitive>
  return displayValue(
    firstValue(data, [
      'surface_label',
      'effective_area_display',
      'area_display',
      'effective_area',
      'area',
    ]) ??
    record.surface_label ??
    record.surface_display ??
    record.surface ??
    record.superficie ??
    record.superficie_display,
  )
}

function getLotsDisplayValue(data: WorkOrderDraftPdfData): string {
  if (data.lots_label) {
    return displayValue(data.lots_label)
  }

  if (data.lots?.length) {
    return data.lots
      .map((lot) => displayValue(lot.lot_name ?? lot.name ?? lot.number))
      .filter((value) => value !== '-')
      .join(', ')
  }

  const record = data as Record<string, PdfPrimitive>
  return displayValue(record.lots_label ?? record.lot ?? record.lot_name ?? record.lots_display)
}

function normalizeComparableLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function orderSummaryFields(fields: DisplayField[]): DisplayField[] {
  const slots = [
    { label: 'Cliente', aliases: ['cliente'] },
    { label: 'Proyecto', aliases: ['proyecto'] },
    { label: 'Campaña', aliases: ['campana'] },
    { label: 'Campo', aliases: ['campo'] },
    { label: 'Cultivo', aliases: ['cultivoactual', 'cultivo'] },
    { label: 'Contratista', aliases: ['contratista'] },
    { label: 'Lote/s', aliases: ['lotes', 'lote'] },
    { label: 'Superficie', aliases: ['superficie'] },
    { label: 'Labor', aliases: ['labor'] },
  ]
  const used = new Set<number>()
  const ordered: DisplayField[] = []

  slots.forEach((slot) => {
    const index = fields.findIndex(
      (field, fieldIndex) =>
        !used.has(fieldIndex) && slot.aliases.includes(normalizeComparableLabel(field.label)),
    )

    if (index >= 0) {
      used.add(index)
      ordered.push({
        label: slot.label,
        value: fields[index].value,
      })
    } else if (slot.aliases.some((alias) => ['lotes', 'lote', 'superficie', 'labor'].includes(alias))) {
      ordered.push({
        label: slot.label,
        value: '-',
      })
    }
  })

  return ordered.slice(0, 9)
}

function buildFileName(data: WorkOrderDraftPdfData, draftId: number): string {
  const number = displayValue(data.header?.number ?? data.number)
  const suffix = number === '-' ? String(draftId) : number
  const safeSuffix = suffix.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')
  return `Orden ${safeSuffix || draftId}.pdf`
}

function setTextColor(doc: JsPDF, color: string) {
  doc.setTextColor(color)
}

function drawRoundedRect(
  doc: JsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  strokeColor: string,
) {
  doc.setFillColor(fillColor)
  doc.setDrawColor(strokeColor)
  doc.roundedRect(x, y, width, height, 2.4, 2.4, 'FD')
}

async function loadPontiLogoDataUrl(): Promise<string | null> {
  const imageUrl = `${window.location.origin}/ponti.svg`

  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || 83
      canvas.height = image.naturalHeight || 83

      const context = canvas.getContext('2d')

      if (!context) {
        resolve(null)
        return
      }

      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }

    image.onerror = () => resolve(null)
    image.src = imageUrl
  })
}

function drawFallbackPontiMark(doc: JsPDF, x: number, y: number) {
  doc.setFillColor('#547792')
  doc.circle(x + 8.5, y + 8.5, 8.5, 'F')
  doc.setFillColor('#ffffff')
  doc.triangle(x + 0.5, y + 9.4, x + 16.5, y + 7.6, x + 8.2, y + 16.6, 'F')
  doc.setFillColor('#94a3b8')
  doc.triangle(x + 8.5, y, x + 16.5, y + 7.6, x + 0.5, y + 7.6, 'F')
}

function drawHeader(doc: JsPDF, data: WorkOrderDraftPdfData, logoDataUrl: string | null): number {
  const orderNumber = displayValue(data.header?.number ?? data.number)
  const orderDate = displayValue(data.header?.date ?? data.date)
  const record = data as Record<string, PdfPrimitive>
  const username = displayValue(
    data.header?.user_name ??
      record.user_name ??
      record.username ??
      record.created_by_name ??
      record.created_by,
  )
  const title = 'Orden de trabajo'

  const headerY = MARGIN
  const headerHeight = 24

  doc.setLineWidth(0.25)
  drawRoundedRect(doc, MARGIN, headerY, CONTENT_WIDTH, headerHeight, SURFACE, BORDER)
  doc.setDrawColor(BLUE)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, headerY, PAGE_WIDTH - MARGIN, headerY)

  const logoX = MARGIN + 5

  const brandHeight = 10
  const brandY = headerY + (headerHeight - brandHeight) / 2 + 1.2

  const logoSize = brandHeight
  const logoY = brandY

  const pontiFontSize = 31
  const pontiTextY = brandY + brandHeight * 0.86

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize)
  } else {
    drawFallbackPontiMark(doc, logoX, logoY)
  }

  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(pontiFontSize)
  setTextColor(doc, TEXT)
  doc.text('Ponti', logoX + logoSize + 2.4, pontiTextY)

  const titleBlockX = 93.6
  const titleFontSize = 16
  const dateFontSize = 8
  const titleDateGap = 6.1
  const numberBoxWidth = 41.8
  const numberBoxHeight = 12
  const numberBoxX = 142
  const numberBoxY = headerY + 7
  const numberFontSize = 16
  const numberTextY = numberBoxY + numberBoxHeight / 2 + numberFontSize * 0.12
  const titleY = numberTextY
  const dateY = titleY + titleDateGap
  const usernameY = titleY - 5.8

  if (username !== '-') {
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setFontSize(6.5)
    setTextColor(doc, MUTED)
    doc.text(username, titleBlockX, usernameY)
  }
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(titleFontSize)
  setTextColor(doc, TEXT)
  doc.text(title, titleBlockX, titleY)

  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(dateFontSize)
  setTextColor(doc, MUTED)
  doc.text(`Fecha: ${orderDate}`, titleBlockX, dateY)

  doc.setLineWidth(0.25)
  drawRoundedRect(doc, numberBoxX, numberBoxY, numberBoxWidth, numberBoxHeight, SURFACE, '#cfd8e5')
  doc.setFont(FONT_FAMILY, 'bold')
  setTextColor(doc, TEXT)
  doc.setFontSize(numberFontSize)
  doc.text(`Nº ${orderNumber}`, numberBoxX + 2.9, numberTextY)
  return headerY + headerHeight + 5
}

function drawSummaryCard(doc: JsPDF, fields: DisplayField[], y: number): number {
  const columns = 3
  const gap = 3
  const cellWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns
  const cellHeight = 12
  const rowGap = 3.1
  const fieldsToDraw = fields.slice(0, 9)

  fieldsToDraw.forEach((field, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    const x = MARGIN + col * (cellWidth + gap)
    const cellY = y + row * (cellHeight + rowGap)
    const isEmphasized = row === 2

    doc.setLineWidth(isEmphasized ? 0.25 : 0.25)
    drawRoundedRect(
      doc,
      x,
      cellY,
      cellWidth,
      cellHeight,
      isEmphasized ? '#ffffff' : CARD_SURFACE,
      isEmphasized ? BLUE : CARD_BORDER,
    )

    doc.setFont(FONT_FAMILY, 'bold')
    doc.setFontSize(6.5)
    setTextColor(doc, LABEL)
    const labelY = cellY + cellHeight * 0.30
    const valueY = cellY + cellHeight * 0.70

    doc.text(field.label, x + 5, labelY)

    doc.setFont(FONT_FAMILY, 'bold')
    doc.setFontSize(resolveCardValueFontSize(field.value))
    setTextColor(doc, TEXT)
    const valueLines = doc.splitTextToSize(field.value, cellWidth - 10) as string[]
    doc.text(valueLines.slice(0, 2), x + 5, valueY)
  })

  const rows = Math.max(1, Math.ceil(fieldsToDraw.length / columns))
  return y + rows * cellHeight + (rows - 1) * rowGap + 7
}

function resolveCardValueFontSize(value: string): number {
  if (value.length > 30) {
    return 7.5
  }

  if (value.length > 20) {
    return 8.2
  }

  return 9
}

function drawTableCard<T extends Record<string, PdfPrimitive>>(
  doc: JsPDF,
  title: string,
  rows: T[],
  columns: Array<TableColumn<T>>,
  emptyMessage: string,
  y: number,
): number {
  const startY = y
  const headerHeight = 8.4
  const rowHeight = 7.6

  doc.setDrawColor(DIVIDER_BLUE)
  doc.setLineWidth(0.45)
  doc.line(MARGIN, startY, PAGE_WIDTH - MARGIN, startY)
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(14)
  setTextColor(doc, TEXT)
  doc.text(title, MARGIN, startY + 8)

  if (rows.length === 0) {
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setFontSize(9.5)
    setTextColor(doc, TEXT)
    doc.text(emptyMessage, MARGIN + 1, startY + 18)
    return startY + 25
  }

  const tableX = MARGIN
  let tableY = startY + 13.2
  const tableWidth = CONTENT_WIDTH
  const colWidths = getTableColumnWidths(columns, tableWidth)

  doc.setFillColor(TABLE_BLUE)
  doc.rect(tableX, tableY, tableWidth, headerHeight, 'F')
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(9)
  setTextColor(doc, '#ffffff')

  let currentX = tableX
  columns.forEach((column, index) => {
    const align = index === 0 ? 'left' : 'center'
    const x = align === 'left' ? currentX + 5 : currentX + colWidths[index] / 2
    const label = column.label.toUpperCase()
    doc.text(label, x, tableY + 5.4, { align })
    currentX += colWidths[index]
  })

  tableY += headerHeight

  rows.forEach((row) => {
    doc.setDrawColor(TABLE_BORDER)
    doc.setLineWidth(0.28)
    doc.setFillColor(CARD_SURFACE)
    doc.rect(tableX, tableY, tableWidth, rowHeight, 'F')
    doc.line(tableX, tableY + rowHeight, tableX + tableWidth, tableY + rowHeight)
    doc.line(tableX, tableY, tableX, tableY + rowHeight)
    doc.line(tableX + tableWidth, tableY, tableX + tableWidth, tableY + rowHeight)
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setFontSize(9.5)
    setTextColor(doc, TEXT)

    currentX = tableX
    columns.forEach((column, index) => {
      const text = displayValue(row[column.key])
      const colWidth = colWidths[index]
      const isFirst = index === 0
      const lines = doc.splitTextToSize(text, colWidth - 18) as string[]
      doc.setFontSize(isFirst && text.length > 34 ? 8 : 9)
      doc.text(lines.slice(0, 1), isFirst ? currentX + 5 : currentX + colWidth / 2, tableY + 5.8, {
        align: isFirst ? 'left' : 'center',
      })

      if (index > 0) {
        doc.line(currentX, tableY, currentX, tableY + rowHeight)
      }

      currentX += colWidth
    })

    tableY += rowHeight
  })

  doc.setDrawColor(DIVIDER_BLUE)
  doc.setLineWidth(0.55)
  doc.line(MARGIN, tableY + SECTION_LINE_GAP, PAGE_WIDTH - MARGIN, tableY + SECTION_LINE_GAP)

  return tableY + SECTION_LINE_GAP + 1.6
}

function drawObservations(doc: JsPDF, observations: string, y: number): number {
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(12)
  setTextColor(doc, TEXT)
  doc.text('Observaciones', MARGIN + 1, y + 7)

  const boxY = y + 9
  const lines = doc.splitTextToSize(observations, CONTENT_WIDTH - 8) as string[]
  const cardHeight = Math.max(16, 8 + lines.length * 5)
  doc.setLineWidth(0.25)
  drawRoundedRect(doc, MARGIN, boxY, CONTENT_WIDTH, cardHeight, CARD_SURFACE, '#e5e9f0')

  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(9)
  setTextColor(doc, '#2a3443')
  doc.text(lines, MARGIN + 4, boxY + 7)

  return boxY + cardHeight + 5
}

function drawFooter(doc: JsPDF, pageHeight: number) {
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(8)
  setTextColor(doc, '#788192')
  doc.text(FOOTER_TEXT, MARGIN + 1, pageHeight - 8)
}

function getTableColumnWidths<T extends Record<string, PdfPrimitive>>(
  columns: Array<TableColumn<T>>,
  tableWidth: number,
): number[] {
  if (columns.length === 3) {
    return [tableWidth * 0.56, tableWidth * 0.22, tableWidth * 0.22]
  }

  if (columns.length === 2) {
    return [tableWidth * 0.7, tableWidth * 0.3]
  }

  return columns.map(() => tableWidth / Math.max(1, columns.length))
}

function estimatePdfHeight(data: WorkOrderDraftPdfData, isGrouped: boolean): number {
  const lots = data.lots ?? []
  const items = data.items ?? data.supplies ?? []
  const summaryRows = Math.max(1, Math.ceil(getSummaryFields(data).length / 3))
  const headerHeight = 27 + 5
  const summaryHeight = summaryRows * 12 + (summaryRows - 1) * 3.1 + 7
  const lotsHeight = isGrouped && lots.length > 1 ? 14 + lots.length * 5.5 : 0
  const itemsHeight = items.length > 0 ? 26 + items.length * 7.6 : 25
  const observationLines = Math.max(1, displayValue(data.observations).length / 90)
  const observationsHeight = 7 + 2 + Math.max(16, 8 + Math.ceil(observationLines) * 5) + 4
  const footerHeight = 9

  const contentHeight = Math.ceil(
    MARGIN +
    headerHeight +
    summaryHeight +
    lotsHeight +
    itemsHeight +
    observationsHeight +
    footerHeight,
  )

  return Math.max(contentHeight, PAGE_WIDTH + 1)
}

function getSupplyColumns(rows: WorkOrderDraftPdfItem[]): Array<TableColumn<WorkOrderDraftPdfItem>> {
  const keys = new Set(rows.flatMap((row) => Object.keys(row)))
  const supplyKey = keys.has('supply_name') ? 'supply_name' : 'name'
  const doseKey = keys.has('final_dose_display') ? 'final_dose_display' : 'final_dose'
  const totalKey = keys.has('total_used_display') ? 'total_used_display' : 'total_used'

  return [
    { key: supplyKey, label: 'Insumo' },
    { key: doseKey, label: 'Dosis final' },
    { key: totalKey, label: 'Total utilizado' },
  ]
}

function drawLotsSection(
  doc: JsPDF,
  lots: WorkOrderDraftPdfLot[],
  y: number,
): number {
  doc.setDrawColor(DIVIDER_BLUE)
  doc.setLineWidth(0.45)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)

  let currentY = y + 7
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setFontSize(14)
  setTextColor(doc, TEXT)
  doc.text('Lotes', MARGIN + 1, currentY)

  currentY += 8
  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(10)
  setTextColor(doc, TEXT)

  lots.forEach((lot) => {
    const name = displayValue(lot.lot_name ?? lot.name ?? lot.number)
    const surface = displayValue(
      lot.surface_label ??
      lot.effective_area_display ??
      lot.effective_area ??
      lot.area_display ??
      lot.area,
    )
    const text = surface === '-' ? `· ${name}` : `· ${name} - ${surface}`
    doc.text(text, MARGIN + 1, currentY)
    currentY += 5.5
  })

  return currentY - 1.4
}

export async function generateWorkOrderDraftPdf(
  data: WorkOrderDraftPdfData,
  draftId: number,
  isGrouped: boolean,
): Promise<{ blob: Blob; fileName: string }> {
  const { jsPDF } = await import('jspdf')
  const pageHeight = estimatePdfHeight(data, isGrouped)
  const logoDataUrl = await loadPontiLogoDataUrl()
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PAGE_WIDTH, pageHeight],
  })
  FONT_FAMILY = registerPdfFonts(doc)
  doc.setFont(FONT_FAMILY, 'normal')

  const lots = data.lots ?? []
  const items = data.items ?? data.supplies ?? []
  const itemColumns = getSupplyColumns(items)

  let y = drawHeader(doc, data, logoDataUrl)
  y = drawSummaryCard(doc, getSummaryFields(data), y)

  if (isGrouped && lots.length > 1) {
    y = drawLotsSection(doc, lots, y)
  }

  y = drawTableCard(doc, 'Insumos cargados', items, itemColumns, 'Sin insumos informados.', y)
  drawObservations(doc, displayValue(data.observations), y)
  drawFooter(doc, pageHeight)

  const fileName = buildFileName(data, draftId)
  const blob = doc.output('blob')

  return { blob, fileName }
}
