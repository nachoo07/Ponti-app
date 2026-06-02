type Severity = 'INFO' | 'WARNING' | 'ERROR'

type LogFields = Record<string, unknown>

/**
 * Log estructurado en JSON a stdout/stderr. Cloud Run lo recoge en Cloud Logging,
 * que interpreta los campos `severity` y `message` automaticamente.
 * No incluir secretos (X-API-KEY, Authorization, tokens) en los campos.
 */
function emit(severity: Severity, message: string, fields: LogFields = {}): void {
  const entry = JSON.stringify({ severity, message, ...fields })

  if (severity === 'ERROR') {
    console.error(entry)
  } else {
    console.log(entry)
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit('INFO', message, fields),
  warn: (message: string, fields?: LogFields) => emit('WARNING', message, fields),
  error: (message: string, fields?: LogFields) => emit('ERROR', message, fields),
}
