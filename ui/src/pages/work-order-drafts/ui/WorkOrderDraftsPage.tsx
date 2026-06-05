import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { FilePlus2, Search } from 'lucide-react'
import {
  getWorkOrderDrafts,
  type GetWorkOrderDraftsResult,
} from '../../../entities/workOrderDraft/api/getWorkOrderDrafts'
import { formatWorkOrderDraftStatus } from '../../../entities/workOrderDraft/model/formatWorkOrderDraftStatus'
import type {
  WorkOrderDraftListItem,
  WorkOrderDraftListPageInfo,
} from '../../../entities/workOrderDraft/model/workOrderDraftDetail.types'
import './WorkOrderDraftsPage.css'

const defaultPageInfo: WorkOrderDraftListPageInfo = {
  per_page: 10,
  page: 1,
  max_page: 1,
  total: 0,
}

type ColumnKey =
  | 'number'
  | 'date'
  | 'project_name'
  | 'field_name'
  | 'effective_area'
  | 'lots_count'
  | 'status'

type ColumnFilters = Record<ColumnKey, string[]>

const defaultColumnFilters: ColumnFilters = {
  number: [],
  date: [],
  project_name: [],
  field_name: [],
  effective_area: [],
  lots_count: [],
  status: [],
}

function SortIcon({
  direction,
}: {
  direction: 'asc' | 'desc' | null
}) {
  if (direction === 'asc') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="work-order-drafts-headerIcon">
        <path
          d="M8 3l4 5H9v5H7V8H4l4-5z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (direction === 'desc') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="work-order-drafts-headerIcon">
        <path
          d="M8 13l-4-5h3V3h2v5h3l-4 5z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="work-order-drafts-headerIcon">
      <path d="M8 2l3 4H9v4H7V6H5l3-4z" fill="currentColor" opacity="0.8" />
      <path d="M8 14l-3-4h2V6h2v4h2l-3 4z" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function FilterIcon({
  active,
}: {
  active: boolean
}) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="work-order-drafts-headerIcon">
      <path
        d="M2 3h12l-5 5v4l-2 1V8L2 3z"
        fill="currentColor"
        opacity={active ? 1 : 0.75}
      />
    </svg>
  )
}

function normalizeDate(value: string): string {
  const trimmed = value.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-')
    return `${day}/${month}/${year}`
  }

  return trimmed
}

function getColumnDisplayValue(draft: WorkOrderDraftListItem, key: ColumnKey): string {
  if (key === 'status') {
    return formatWorkOrderDraftStatus(draft.status)
  }

  if (key === 'date') {
    return normalizeDate(draft.date)
  }

  return String(draft[key] ?? '')
}

export function WorkOrderDraftsPage() {
  const [searchNumber, setSearchNumber] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')
  const [fieldFilter, setFieldFilter] = useState('')
  const [drafts, setDrafts] = useState<WorkOrderDraftListItem[]>([])
  const [pageInfo, setPageInfo] = useState<WorkOrderDraftListPageInfo>(defaultPageInfo)
  const [page, setPage] = useState(1)
  const perPage = 10
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(defaultColumnFilters)
  const [openColumnFilter, setOpenColumnFilter] = useState<ColumnKey | null>(null)
  const [columnFilterSearch, setColumnFilterSearch] = useState<Record<ColumnKey, string>>({
    number: '',
    date: '',
    project_name: '',
    field_name: '',
    effective_area: '',
    lots_count: '',
    status: '',
  })
  const [sortKey, setSortKey] = useState<ColumnKey | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const filterPopoverRef = useRef<HTMLDivElement | null>(null)
  const filterButtonRefs = useRef<Partial<Record<ColumnKey, HTMLButtonElement | null>>>({})
  const [filterPopoverPosition, setFilterPopoverPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    setPage(1)
  }, [campaignFilter, customerFilter, fieldFilter, projectFilter, searchNumber])

  useEffect(() => {
    let cancelled = false

    async function loadDrafts() {
      setIsLoading(true)
      setError(null)

      try {
        const result: GetWorkOrderDraftsResult = await getWorkOrderDrafts({
          number: searchNumber,
          page,
          perPage,
        })

        if (cancelled) return

        setDrafts(result.items)
        setPageInfo(result.pageInfo)
      } catch (loadError) {
        if (cancelled) return

        const message =
          loadError instanceof Error ? loadError.message : 'Error cargando ordenes'

        setDrafts([])
        setPageInfo({
          ...defaultPageInfo,
          page,
          per_page: perPage,
        })
        setError(message)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDrafts()

    return () => {
      cancelled = true
    }
  }, [searchNumber, page, perPage])

  useEffect(() => {
    if (!openColumnFilter) return

    function handlePointerDown(event: MouseEvent) {
      if (!filterPopoverRef.current) return

      if (!filterPopoverRef.current.contains(event.target as Node)) {
        setOpenColumnFilter(null)
        setFilterPopoverPosition(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [openColumnFilter])

  useEffect(() => {
    if (!openColumnFilter) return

    function updatePosition() {
      const btn = filterButtonRefs.current[openColumnFilter!]
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const popoverWidth = 240
      const margin = 8
      const maxLeft = window.innerWidth - popoverWidth - margin
      setFilterPopoverPosition({
        top: rect.bottom + margin,
        left: Math.max(margin, Math.min(rect.left, maxLeft)),
      })
    }

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [openColumnFilter])

const topFilterOptions = useMemo(() => {
  const unique = (values: Array<string | null | undefined>) =>
    [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])]
      .sort((a, b) => a.localeCompare(b))

  const byCustomer = customerFilter
    ? drafts.filter((d) => d.customer_name === customerFilter)
    : drafts

  const byCustomerAndProject = projectFilter
    ? byCustomer.filter((d) => d.project_name === projectFilter)
    : byCustomer

  const byCustomerProjectAndCampaign = campaignFilter
    ? byCustomerAndProject.filter((d) => d.campaign_name === campaignFilter)
    : byCustomerAndProject

  return {
    customers: unique(drafts.map((d) => d.customer_name)),
    projects: unique(byCustomer.map((d) => d.project_name)),
    campaigns: unique(byCustomerAndProject.map((d) => d.campaign_name)),
    fields: unique(byCustomerProjectAndCampaign.map((d) => d.field_name)),
  }
}, [drafts, customerFilter, projectFilter, campaignFilter])

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      if (customerFilter && draft.customer_name !== customerFilter) return false
      if (projectFilter && draft.project_name !== projectFilter) return false
      if (campaignFilter && draft.campaign_name !== campaignFilter) return false
      if (fieldFilter && draft.field_name !== fieldFilter) return false

      return (Object.entries(columnFilters) as [ColumnKey, string[]][]).every(([key, selected]) => {
        if (!selected.length) return true

        const currentValue = getColumnDisplayValue(draft, key).toLowerCase()
        return selected.some((value) => value.toLowerCase() === currentValue)
      })
    })
  }, [campaignFilter, columnFilters, customerFilter, drafts, fieldFilter, projectFilter])

  const sortedDrafts = useMemo(() => {
    if (!sortKey) return filteredDrafts

    const next = [...filteredDrafts]

    next.sort((a, b) => {
      const aValue = getColumnDisplayValue(a, sortKey).toLowerCase()
      const bValue = getColumnDisplayValue(b, sortKey).toLowerCase()

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return next
  }, [filteredDrafts, sortDirection, sortKey])

  function toggleSort(key: ColumnKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection('asc')
      return
    }

    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
  }

  function toggleColumnFilter(key: ColumnKey) {
    setOpenColumnFilter((current) => {
      if (current === key) {
        setFilterPopoverPosition(null)
        return null
      }
      const btn = filterButtonRefs.current[key]
      if (btn) {
        const rect = btn.getBoundingClientRect()
        const popoverWidth = 240
        const margin = 8
        const preferredLeft = rect.left
        const maxLeft = window.innerWidth - popoverWidth - margin
        setFilterPopoverPosition({
          top: rect.bottom + margin,
          left: Math.max(margin, Math.min(preferredLeft, maxLeft)),
        })
      }
      return key
    })
  }

  function handleFilterChange(key: ColumnKey, value: string, checked: boolean) {
    setColumnFilters((current) => {
      const prev = current[key]
      const next = checked ? [...prev, value] : prev.filter((item) => item !== value)

      return {
        ...current,
        [key]: next,
      }
    })
  }


  function getFilterOptions(key: ColumnKey): string[] {
    const filtersExceptCurrent: ColumnFilters = {
      ...columnFilters,
      [key]: [],
    }

    const subset = drafts.filter((draft) => {
      return (Object.entries(filtersExceptCurrent) as [ColumnKey, string[]][]).every(
        ([filterKey, selected]) => {
          if (!selected.length) return true

          const currentValue = getColumnDisplayValue(draft, filterKey).toLowerCase()
          return selected.some((value) => value.toLowerCase() === currentValue)
        },
      )
    })

    const options = [...new Set(subset.map((draft) => getColumnDisplayValue(draft, key)))]
    return options.sort((a, b) => a.localeCompare(b))
  }

  const canGoBack = pageInfo.page > 1
  const canGoForward = pageInfo.page < pageInfo.max_page
  const isRefreshingTable = isLoading && drafts.length > 0

  function handleClearColumnFilter(key: ColumnKey) {
    setColumnFilters((current) => ({
      ...current,
      [key]: [],
    }))
    setColumnFilterSearch((current) => ({
      ...current,
      [key]: '',
    }))
  }


  function renderColumnHeader(label: string, key: ColumnKey) {
    const isFilterOpen = openColumnFilter === key
    const isFilterActive = columnFilters[key].length > 0

    const options = getFilterOptions(key)
    const search = columnFilterSearch[key]?.toLowerCase() ?? ''

    const visibleOptions = options.filter((option) =>
      option.toLowerCase().includes(search),
    )

    const allChecked = visibleOptions.length > 0 && visibleOptions.every((o) => columnFilters[key].includes(o))
    const someChecked = visibleOptions.some((o) => columnFilters[key].includes(o))
    const isIndeterminate = someChecked && !allChecked

    return (
      <div className="work-order-drafts-columnHeader">
        <div className="work-order-drafts-columnHeaderTop">
          <span className="work-order-drafts-columnLabel">{label}</span>

          <div className="work-order-drafts-columnHeaderActions">
            <button
              type="button"
              className={`work-order-drafts-headerBtn ${
                sortKey === key ? 'is-active' : ''
              }`}
              onClick={() => toggleSort(key)}
              aria-label={`Ordenar columna ${label}`}
            >
              <SortIcon direction={sortKey === key ? sortDirection : null} />
            </button>

            <button
              type="button"
              ref={(el) => { filterButtonRefs.current[key] = el }}
              className={`work-order-drafts-headerBtn ${
                isFilterActive || isFilterOpen ? 'is-active' : ''
              }`}
              onClick={() => toggleColumnFilter(key)}
              aria-label={`Filtrar columna ${label}`}
            >
              <FilterIcon active={isFilterActive || isFilterOpen} />
            </button>
          </div>
        </div>

        {isFilterOpen && filterPopoverPosition
          ? createPortal(
          <div
            ref={filterPopoverRef}
            className="work-order-drafts-filterPopover"
            style={{ position: 'fixed', top: filterPopoverPosition.top, left: filterPopoverPosition.left }}
          >
            <input
              type="text"
              className="work-order-drafts-filterSearch"
              placeholder="Buscar opción..."
              value={columnFilterSearch[key]}
              onChange={(event) => {
                const value = event.target.value
                setColumnFilterSearch((current) => ({
                  ...current,
                  [key]: value,
                }))
              }}
            />

            <div className="work-order-drafts-filterOptions">
              {visibleOptions.length === 0 ? (
                <p className="work-order-drafts-filterEmpty">No hay opciones</p>
              ) : (
                <>
                  <label
                    className="work-order-drafts-filterOption"
                    style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}
                  >
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = isIndeterminate }}
                      onChange={(event) => {
                        const checked = event.target.checked
                        setColumnFilters((current) => ({
                          ...current,
                          [key]: checked
                            ? [...new Set([...current[key], ...visibleOptions])]
                            : current[key].filter((v) => !visibleOptions.includes(v)),
                        }))
                      }}
                    />
                    <span>Seleccionar todo</span>
                  </label>
                  {visibleOptions.map((option) => {
                    const checked = columnFilters[key].includes(option)

                    return (
                      <label key={option} className="work-order-drafts-filterOption">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            handleFilterChange(key, option, event.target.checked)
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    )
                  })}
                </>
              )}
            </div>

            <div className="work-order-drafts-filterInlineActions">
              <button
                type="button"
                className="work-order-drafts-filterClearLink"
                onClick={() => handleClearColumnFilter(key)}
              >
                Limpiar
              </button>
              <button
                type="button"
                className="work-order-drafts-filterApplyBtn"
                onClick={() => { setOpenColumnFilter(null); setFilterPopoverPosition(null) }}
              >
                Aplicar
              </button>
            </div>

          </div>,
          document.body
        ) : null}
      </div>
    )
  }

  return (
    <main className="work-order-drafts-page">
      <section className="work-order-drafts-shell">
        <header className="work-order-drafts-header">
          <div className="work-order-drafts-copy">
            <h1 className="work-order-drafts-title">Órdenes digitales</h1>
          </div>

          <Link to="/work-orders" className="work-order-drafts-link">
            <FilePlus2 aria-hidden="true" />
            <span>Nueva OT</span>
          </Link>
        </header>

        <section className="work-order-drafts-filters">
          <label className="work-order-drafts-field">
            <span>Cliente</span>
            <select
              className="work-order-drafts-select"
              value={customerFilter}
              onChange={(event) => {
  setCustomerFilter(event.target.value)
  setProjectFilter('')
  setCampaignFilter('')
  setFieldFilter('')
}}
            >
              <option value="">Todos los clientes</option>
              {topFilterOptions.customers.map((customer) => (
                <option key={customer} value={customer}>{customer}</option>
              ))}
            </select>
          </label>

          <label className="work-order-drafts-field">
            <span>Proyecto</span>
            <select
              className="work-order-drafts-select"
              value={projectFilter}
              onChange={(event) => {
  setProjectFilter(event.target.value)
  setCampaignFilter('')
  setFieldFilter('')
}}
            >
              <option value="">Todos los proyectos</option>
              {topFilterOptions.projects.map((project) => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </label>

          <label className="work-order-drafts-field">
            <span>Campaña</span>
            <select
              className="work-order-drafts-select"
              value={campaignFilter}
              onChange={(event) => {
  setCampaignFilter(event.target.value)
  setFieldFilter('')
}}
            >
              <option value="">Todas las campañas</option>
              {topFilterOptions.campaigns.map((campaign) => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
          </label>

          <label className="work-order-drafts-field">
            <span>Campo</span>
            <select
              className="work-order-drafts-select"
              value={fieldFilter}
              onChange={(event) => setFieldFilter(event.target.value)}
            >
              <option value="">Todos los campos</option>
              {topFilterOptions.fields.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </label>

          <label className="work-order-drafts-field work-order-drafts-searchField">
            <span>Número de orden</span>
            <div className="work-order-drafts-searchControl">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar por número"
                value={searchNumber}
                onChange={(event) => {
                  setSearchNumber(event.target.value)
                }}
              />
            </div>
          </label>
        </section>

        <section className="work-order-drafts-tableCard">
          <div className="work-order-drafts-tableHeader">
            <strong>Órdenes cargadas</strong>
            {isRefreshingTable ? (
              <span className="work-order-drafts-refreshTag">Actualizando...</span>
            ) : null}
          </div>

          {error ? <p className="work-order-drafts-feedback is-error">{error}</p> : null}
          {isLoading && drafts.length === 0 ? (
            <p className="work-order-drafts-feedback">Cargando ordenes...</p>
          ) : null}

                    <div
            className={`work-order-drafts-tableWrap ${
              isRefreshingTable ? 'is-refreshing' : ''
            } ${openColumnFilter ? 'is-filter-open' : ''}`}
          >

            {isRefreshingTable ? (
              <div className="work-order-drafts-tableOverlay" aria-hidden="true">
                <span className="work-order-drafts-spinner" />
                <span>Actualizando página...</span>
              </div>
            ) : null}

            <table className="work-order-drafts-table">
              <thead>
                <tr>
                  <th>{renderColumnHeader('Número', 'number')}</th>
                  <th>{renderColumnHeader('Fecha', 'date')}</th>
                  <th>{renderColumnHeader('Proyecto', 'project_name')}</th>
                  <th>{renderColumnHeader('Campo', 'field_name')}</th>
                  <th>{renderColumnHeader('Sup. total', 'effective_area')}</th>
                  <th>{renderColumnHeader('Lotes', 'lots_count')}</th>
                  <th>{renderColumnHeader('Estado', 'status')}</th>
                </tr>
              </thead>

              <tbody>
                {!isLoading && sortedDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="work-order-drafts-empty">
                      No hay ordenes digitales para mostrar.
                    </td>
                  </tr>
                ) : null}

                {sortedDrafts.map((draft) => (
                  <tr key={draft.id}>
                    <td>
                      <Link
                        to={`/work-order-drafts/${draft.id}`}
                        className="work-order-drafts-numberLink"
                      >
                        {draft.number}
                      </Link>
                    </td>
                    <td>{normalizeDate(draft.date)}</td>
                    <td>{draft.project_name}</td>
                    <td>{draft.field_name}</td>
                    <td>{draft.effective_area ?? '-'}</td>
                    <td>{draft.lots_count ?? '-'}</td>
                    <td>
                      <span className={`work-order-drafts-status is-${draft.status}`}>
                        {formatWorkOrderDraftStatus(draft.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="work-order-drafts-pagination">
            <button
              type="button"
              className="work-order-drafts-pageBtn"
              disabled={!canGoBack || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </button>

            <span className="work-order-drafts-pageStatus">
              {pageInfo.page} / {pageInfo.max_page}
            </span>

            <button
              type="button"
              className="work-order-drafts-pageBtn"
              disabled={!canGoForward || isLoading}
              onClick={() =>
                setPage((current) => Math.min(pageInfo.max_page, current + 1))
              }
            >
              Siguiente
            </button>
          </div>
        </section>
      </section>
    </main>
  )
}
