import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { isSessionExpired } from '../../entities/session/lib/session'
import {
  clearSession as clearStoredSession,
  getSession as getStoredSession,
  setSession as setStoredSession,
} from '../../entities/session/model/session.store'
import type { Session } from '../../entities/session/model/session.types'
import { refreshSession } from '../../shared/api/auth'
import { AuthContext } from './AuthContext'
import { registerAuthSessionListener } from './auth-session-bridge'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSessionState] = useState<Session | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    function syncSession(nextSession: Session | null) {
      setSessionState(nextSession)

      if (nextSession) {
        setStoredSession(nextSession)
        return
      }

      clearStoredSession()
    }

    const unregisterAuthSessionListener = registerAuthSessionListener(syncSession)

    return unregisterAuthSessionListener
  }, [])

  useEffect(() => {
    async function bootstrapSession() {
      const storedSession = getStoredSession()

      if (!storedSession) {
        setSessionState(null)
        setIsBootstrapping(false)
        return
      }

      if (!isSessionExpired(storedSession, 30)) {
        setSessionState(storedSession)
        setIsBootstrapping(false)
        return
      }

      const refreshedSession = await refreshSession()

      setSessionState(refreshedSession)
      setIsBootstrapping(false)
    }

    void bootstrapSession()
  }, [])

  function handleSetSession(nextSession: Session | null) {
    setSessionState(nextSession)

    if (nextSession) {
      setStoredSession(nextSession)
      return
    }

    clearStoredSession()
  }

  function logout() {
    handleSetSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        isBootstrapping,
        setSession: handleSetSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

