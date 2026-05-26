import { removeStorageItem } from '../../../shared/lib/storage'

const TENANT_KEY = 'ponti:tenant_id'
const LEGACY_TENANT_KEY = 'tenant_id'
const WORKSPACE_KEYS = [
  'customer',
  'project',
  'project_id',
  'campaign',
  'field',
  'workspace_all_selection',
]

export function getTenantId(): string {
  return (readStoredTenantId(TENANT_KEY) || readStoredTenantId(LEGACY_TENANT_KEY)).trim()
}

export function setTenantId(tenantId: string): void {
  const normalizedTenantId = tenantId.trim()

  if (!normalizedTenantId) {
    clearTenantId()
    return
  }

  localStorage.setItem(TENANT_KEY, normalizedTenantId)
  localStorage.setItem(LEGACY_TENANT_KEY, normalizedTenantId)
}

export function clearTenantId(): void {
  removeStorageItem(TENANT_KEY)
  removeStorageItem(LEGACY_TENANT_KEY)
}

export function clearWorkspaceSelection(): void {
  for (const key of WORKSPACE_KEYS) {
    removeStorageItem(`ponti:${key}`)
    removeStorageItem(key)
  }
}

function readStoredTenantId(key: string): string {
  const rawValue = localStorage.getItem(key)

  if (!rawValue) {
    return ''
  }

  try {
    const parsedValue = JSON.parse(rawValue)

    if (typeof parsedValue === 'string') {
      return parsedValue
    }
  } catch {
    return rawValue
  }

  return ''
}
