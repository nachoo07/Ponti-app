import { useLocation, useNavigate } from 'react-router-dom'
import { SignInForm } from '../../../features/auth/sign-in/ui/SignInForm'
import './loginPage.css'

type LoginLocationState = {
  from?: string
}

function LoginLogo() {
  return (
    <div className="login-brand" aria-label="Ponti">
      <img
        className="login-brand-logo"
        src="/ponti.svg"
        alt="Ponti"
      />
      <h1 className="login-brand-name">Ponti</h1>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const nextPath = state?.from ?? '/home'
  function handleSuccess() {
    navigate(nextPath, { replace: true })
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-hero-inner">
          <LoginLogo />
          <p className="login-tagline">Es gestion. Es trazabilidad. Es simple.</p>
        </div>

        <p className="login-version">Ponti Software v1.0</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <h2 className="login-title">Bienvenido</h2>
          <p className="login-description">
            Ingresa con tu email o usuario y contrasena para acceder al sistema de gestion.
          </p>
          <SignInForm onSuccess={handleSuccess} />
        </div>
      </section>
    </main>
  )
}
