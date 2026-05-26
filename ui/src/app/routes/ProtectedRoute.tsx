import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthContext'
import { useTenant } from '../providers/TenantContext'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()
  const { tenantId, loading, initialized, error, refreshTenantContext } = useTenant()
  const location = useLocation()

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`

    return <Navigate to="/login" replace state={{ from }} />
  }

  if (loading || !initialized) {
    return <main>Cargando workspace...</main>
  }

  if (!tenantId) {
    return (
      <main>
        <p>{error ?? 'Tu usuario no tiene un workspace activo.'}</p>
        <button type="button" onClick={() => void refreshTenantContext()}>
          Reintentar
        </button>
      </main>
    )
  }

  return <>{children}</>
}
