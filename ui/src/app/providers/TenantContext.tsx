import { createContext, useContext } from 'react'
import type { Tenant } from '../../entities/tenant/model/tenant.types'

export type TenantContextValue = {
  tenants: Tenant[]
  tenantId: string
  loading: boolean
  initialized: boolean
  error: string | null
  refreshTenantContext: () => Promise<void>
  setTenantId: (tenantId: string) => void
}

export const TenantContext = createContext<TenantContextValue | null>(null)

export function useTenant() {
  const context = useContext(TenantContext)

  if (!context) {
    throw new Error('useTenant debe usarse dentro de TenantProvider.')
  }

  return context
}
