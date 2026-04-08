import { createContext, useContext } from 'react'
import type { Session } from '../../entities/session/model/session.types'

export type AuthContextValue = {
  session: Session | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  setSession: (session: Session | null) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
