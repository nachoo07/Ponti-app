import { useState } from 'react'
import { useSignIn } from '../model/useSignIn'
import type { Session } from '../../../../entities/session/model/session.types'

type SignInFormProps = {
  onSuccess?: (session: Session) => void
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="login-input-icon" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-7 2.16-7 4.2V20h14v-1.8C19 16.16 16.2 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="login-input-icon" aria-hidden="true">
      <path
        d="M17 10h-1V8a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-6 0V8a2 2 0 1 1 4 0v2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="login-eye-icon" aria-hidden="true">
      <path
        d="M12 5c-5.5 0-9.27 5.11-9.43 5.33a1.17 1.17 0 0 0 0 1.34C2.73 11.89 6.5 17 12 17s9.27-5.11 9.43-5.33a1.17 1.17 0 0 0 0-1.34C21.27 10.11 17.5 5 12 5Zm0 9.5A3.5 3.5 0 1 1 15.5 11 3.5 3.5 0 0 1 12 14.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="login-eye-icon" aria-hidden="true">
      <path
        d="M3.7 4.76 2.28 6.18l3 3A13.7 13.7 0 0 0 2.57 10.3a1.17 1.17 0 0 0 0 1.34C2.73 11.89 6.5 17 12 17a10.5 10.5 0 0 0 4.08-.8l2.74 2.74 1.41-1.41ZM9.53 10.6l3.87 3.87A3.43 3.43 0 0 1 12 14.5 3.5 3.5 0 0 1 8.5 11a3.43 3.43 0 0 1 1.03-.4Zm11.9.37C21.27 10.11 17.5 5 12 5a10.9 10.9 0 0 0-3.15.46l1.69 1.69A5 5 0 0 1 12 7a3.5 3.5 0 0 1 3.5 3.5 4.9 4.9 0 0 1-.15 1.1l3.35 3.35a18.4 18.4 0 0 0 2.73-3.31 1.17 1.17 0 0 0 0-1.34Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const { email, password, error, isSubmitting, setEmail, setPassword, handleSubmit } = useSignIn({
    onSuccess,
  })
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label className="login-field">
        <span>Email o usuario</span>

        <div className="login-input-shell">
          <UserIcon />

          <input
            className="login-input"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            autoComplete="username"
            required
          />
        </div>
      </label>

      <label className="login-field">
        <span>Contrasena</span>

        <div className="login-input-shell">
          <LockIcon />

          <input
            className="login-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ingresa tu contrasena"
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </label>

      {error ? <p className="login-error">{error}</p> : null}

      <button type="submit" className="login-submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  )
}
