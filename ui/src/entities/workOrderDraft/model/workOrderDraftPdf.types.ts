export type PdfPrimitive = string | number | boolean | null | undefined

export type WorkOrderDraftPdfField = {
  label?: string
  name?: string
  key?: string
  value?: PdfPrimitive
  display_value?: PdfPrimitive
  displayValue?: PdfPrimitive
}

export type WorkOrderDraftPdfLot = Record<string, PdfPrimitive>

export type WorkOrderDraftPdfItem = Record<string, PdfPrimitive>

export type WorkOrderDraftPdfData = {
  title?: string
  subtitle?: string
  type?: string
  number?: PdfPrimitive
  date?: PdfPrimitive
  project?: PdfPrimitive
  project_name?: PdfPrimitive
  customer?: PdfPrimitive
  customer_name?: PdfPrimitive
  campaign?: PdfPrimitive
  campaign_name?: PdfPrimitive
  field?: PdfPrimitive
  field_name?: PdfPrimitive
  crop?: PdfPrimitive
  crop_name?: PdfPrimitive
  labor?: PdfPrimitive
  labor_name?: PdfPrimitive
  contractor?: PdfPrimitive
  effective_area?: PdfPrimitive
  effective_area_display?: PdfPrimitive
  area?: PdfPrimitive
  area_display?: PdfPrimitive
  surface_label?: PdfPrimitive
  lots_label?: PdfPrimitive
  observations?: PdfPrimitive
  footer?: PdfPrimitive
  header?: Record<string, PdfPrimitive>
  summary?: WorkOrderDraftPdfField[] | Record<string, PdfPrimitive>
  fields?: WorkOrderDraftPdfField[] | Record<string, PdfPrimitive>
  lots?: WorkOrderDraftPdfLot[]
  items?: WorkOrderDraftPdfItem[]
  supplies?: WorkOrderDraftPdfItem[]
}
