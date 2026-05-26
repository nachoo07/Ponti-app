import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getMeContext } from '../../entities/tenant/api/getMeContext'
import {
  clearTenantId,
  clearWorkspaceSelection,
  getTenantId,
  setTenantId as persistTenantId,
} from '../../entities/tenant/model/tenant.store'
import type { Tenant } from '../../entities/tenant/model/tenant.types'
import { useAuth } from './AuthContext'
import { TenantContext } from './TenantContext'
import type { TenantContextValue } from './TenantContext'

type TenantProviderProps = {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const { isAuthenticated } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantIdState] = useState(() => getTenantId())
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyTenant = useCallback((nextTenantId: string, clearWorkspace: boolean) => {
    const normalizedTenantId = nextTenantId.trim()
    setTenantIdState(normalizedTenantId)

    if (normalizedTenantId) {
      persistTenantId(normalizedTenantId)
    } else {
      clearTenantId()
    }

    if (clearWorkspace) {
      clearWorkspaceSelection()
      window.dispatchEvent(
        new CustomEvent('ponti:tenant-changed', { detail: normalizedTenantId }),
      )
    }
  }, [])

  const refreshTenantContext = useCallback(async () => {
    if (!isAuthenticated) {
      setTenants([])
      setTenantIdState('')
      setError(null)
      setLoading(false)
      setInitialized(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = await getMeContext()
      const items = Array.isArray(payload.tenants) ? payload.tenants : []
      const storedTenantId = getTenantId()
      const currentTenantId =
        typeof payload.current_tenant_id === 'string' ? payload.current_tenant_id : ''
      const nextTenantId =
        (storedTenantId && items.some((item) => item.id === storedTenantId)
          ? storedTenantId
          : '') ||
        currentTenantId ||
        items[0]?.id ||
        ''

      setTenants(items)
      applyTenant(nextTenantId, false)
    } catch {
      setTenants([])
      setTenantIdState('')
      setError('No se pudo cargar el workspace.')
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [applyTenant, isAuthenticated])

  useEffect(() => {
    void refreshTenantContext()
  }, [refreshTenantContext])

  const value = useMemo<TenantContextValue>(
    () => ({
      tenants,
      tenantId,
      loading,
      initialized,
      error,
      refreshTenantContext,
      setTenantId: (nextTenantId: string) =>
        applyTenant(nextTenantId, nextTenantId !== tenantId),
    }),
    [applyTenant, error, initialized, loading, refreshTenantContext, tenantId, tenants],
  )

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}
