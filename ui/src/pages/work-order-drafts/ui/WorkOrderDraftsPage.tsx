import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

function ActionIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="work-order-drafts-rowIcon">
      <path
        d="M2 8s2.4-4 6-4 6 4 6 4-2.4 4-6 4-6-4-6-4zm6 2.2A2.2 2.2 0 108 5.8a2.2 2.2 0 000 4.4z"
        fill="currentColor"
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
  const [drafts, setDrafts] = useState<WorkOrderDraftListItem[]>([])
  const [pageInfo, setPageInfo] = useState<WorkOrderDraftListPageInfo>(defaultPageInfo)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
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

  useEffect(() => {
    setPage(1)
  }, [searchNumber])

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
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [openColumnFilter])

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      return (Object.entries(columnFilters) as [ColumnKey, string[]][]).every(([key, selected]) => {
        if (!selected.length) return true

        const currentValue = getColumnDisplayValue(draft, key).toLowerCase()
        return selected.some((value) => value.toLowerCase() === currentValue)
      })
    })
  }, [drafts, columnFilters])

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
    setOpenColumnFilter((current) => (current === key ? null : key))
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

        {isFilterOpen ? (
          <div ref={filterPopoverRef} className="work-order-drafts-filterPopover">
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
                visibleOptions.map((option) => {
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
                })
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
            </div>

          </div>
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
        </header>

        <section className="work-order-drafts-filters">
          <label className="work-order-drafts-field">
            <span>Número de orden</span>
            <input
              type="text"
              placeholder="Buscar por número de orden"
              value={searchNumber}
              onChange={(event) => {
                setSearchNumber(event.target.value)
              }}
            />
          </label>

          <label className="work-order-drafts-field">
            <span>Resultados por página</span>
            <select
              className="work-order-drafts-select"
              value={perPage}
              onChange={(event) => {
                const nextPerPage = Number(event.target.value)
                setPerPage(nextPerPage)
                setPage(1)
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div className="work-order-drafts-actions">
            <Link to="/work-orders" className="work-order-drafts-link">
              + Nueva OT
            </Link>
          </div>
        </section>

        <section className="work-order-drafts-tableCard">
          <div className="work-order-drafts-tableHeader">
            <strong>Órdenes digitales cargadas</strong>
            <span className="work-order-drafts-tableMeta">
              Página {pageInfo.page} de {pageInfo.max_page} · {pageInfo.total} resultados
            </span>
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
                  <th className="work-order-drafts-actionsCol">Acción</th>
                </tr>
              </thead>

              <tbody>
                {!isLoading && sortedDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="work-order-drafts-empty">
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
                    <td className="work-order-drafts-actionsCol">
                      <Link
                        to={`/work-order-drafts/${draft.id}`}
                        className="work-order-drafts-actionIconBtn"
                        aria-label={
                          draft.status === 'published' ? 'Ver orden' : 'Ver o editar orden'
                        }
                        title={draft.status === 'published' ? 'Ver' : 'Ver / Editar'}
                      >
                        <ActionIcon />
                      </Link>
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
              Página {pageInfo.page} / {pageInfo.max_page}
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
