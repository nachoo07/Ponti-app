import 'dotenv/config'

function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`)
  }

  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  baseManagerApi: requireEnv('BASE_MANAGER_API'),
  xApiKey: requireEnv('X_API_KEY'),
  identityPlatformApiKey: requireEnv('IDENTITY_PLATFORM_API_KEY'),
  identityPlatformProjectId: requireEnv('IDENTITY_PLATFORM_PROJECT_ID'),
}
