import type { Session } from '../../entities/session/model/session.types'

type AuthSessionListener = (session: Session | null) => void

let authSessionListener: AuthSessionListener | null = null

export function registerAuthSessionListener(listener: AuthSessionListener): () => void {
  authSessionListener = listener

  return () => {
    if (authSessionListener === listener) {
      authSessionListener = null
    }
  }
}

export function notifyAuthSessionChanged(session: Session | null): void {
  authSessionListener?.(session)
}
