import 'dotenv/config'

function isTruthyEnvString(value: string | undefined): boolean {
  if (!value || value.trim() === '') {
    return false
  }

  const normalizedValue = value.trim().toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(normalizedValue)
}

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`)
  }

  return value
}

const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'local'
const localDevAuth = isTruthyEnvString(process.env.LOCAL_DEV_AUTH)
const allowLocalDevAuth = localDevAuth && isLocalLikeEnv(appEnv)

function requireIdentityEnv(name: string): string {
  if (allowLocalDevAuth) {
    return process.env[name] ?? ''
  }

  return requireEnv(name)
}

function isLocalLikeEnv(value: string): boolean {
  switch (value.trim().toLowerCase()) {
    case '':
    case 'local':
    case 'localhost':
    case 'dev':
    case 'development':
    case 'test':
    case 'testing':
      return true
    default:
      return false
  }
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  appEnv,
  baseManagerApi: requireEnv('BASE_MANAGER_API'),
  xApiKey: requireEnv('X_API_KEY'),
  identityPlatformApiKey: requireIdentityEnv('IDENTITY_PLATFORM_API_KEY'),
  identityPlatformProjectId: requireIdentityEnv('IDENTITY_PLATFORM_PROJECT_ID'),
  localDevAuth,
  localDevUserId: process.env.LOCAL_DEV_USER_ID || '1',
  localDevPassword: process.env.LOCAL_DEV_PASSWORD || '',
  allowLocalDevAuth,
}
