import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthContext'
import styles from './Navbar.module.css'

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/work-order-drafts/')) {
    return 'Detalle de orden'
  }

  if (pathname.startsWith('/work-order-drafts')) {
    return 'Ordenes digitales'
  }

  if (pathname.startsWith('/work-orders')) {
    return 'Nueva OT'
  }

  return 'Inicio'
}

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, session, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pageTitle = getPageTitle(location.pathname)

  function handleLogout() {
    logout()
    setIsMenuOpen(false)
    navigate('/', { replace: true })
  }

  function handleNavigate() {
    setIsMenuOpen(false)
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.topRow}>
          <div className={styles.brandGroup}>
            <NavLink to="/home" className={styles.brand} onClick={handleNavigate}>
              <span className={styles.brandMark}>
                <img src="/ponti.svg" alt="" aria-hidden="true" />
              </span>

              <span className={styles.brandText}>
                <strong>Ponti</strong>
                <small>Operacion digital</small>
              </span>
            </NavLink>

            <span className={styles.brandDivider} aria-hidden="true" />
            <span className={styles.pageTitle}>{pageTitle}</span>
          </div>

          <button
            type="button"
            className={styles.menuToggle}
            aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div
          id="main-navigation"
          className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ''}`}
        >
          <div className={styles.navLinks}>
            <NavLink
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              to="/home"
              onClick={handleNavigate}
            >
              Inicio
            </NavLink>

            {isAuthenticated ? (
              <NavLink
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                to="/work-orders"
                onClick={handleNavigate}
              >
                Nueva OT
              </NavLink>
            ) : null}

            {isAuthenticated ? (
              <NavLink
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                to="/work-order-drafts"
                onClick={handleNavigate}
              >
                Ver ordenes
              </NavLink>
            ) : null}
          </div>

          {isAuthenticated ? (
            <div className={styles.userSection}>
              <span className={styles.userInfo}>
                <span className={styles.userLabel}>Sesión activa</span>
                <strong>{session?.user.name || session?.user.email || 'Usuario autenticado'}</strong>
              </span>

              <button type="button" className={styles.linkButton} onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  )
}
