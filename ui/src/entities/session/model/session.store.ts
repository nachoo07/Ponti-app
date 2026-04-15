import { getStorageItem, removeStorageItem, setStorageItem } from '../../../shared/lib/storage'
import type { Session } from './session.types'

const SESSION_KEY = `ponti.session.${window.location.host}`

export function getSession(): Session | null {
  return getStorageItem<Session>(SESSION_KEY)
}

export function setSession(session: Session): void {
  setStorageItem(SESSION_KEY, session)
}

export function clearSession(): void {
  removeStorageItem(SESSION_KEY)
}

