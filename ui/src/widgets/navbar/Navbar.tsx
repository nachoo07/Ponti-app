import { useState } from 'react'
import { ClipboardList, FilePlus2, Home, LogOut, Menu, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthContext'
import styles from './Navbar.module.css'

const navItems = [
  {
    to: '/home',
    label: 'Inicio',
    icon: Home,
  },
  {
    to: '/work-orders',
    label: 'Nueva OT',
    icon: FilePlus2,
  },
  {
    to: '/work-order-drafts',
    label: 'Ver órdenes',
    icon: ClipboardList,
  },
]

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHomePage = location.pathname === '/home'
  const { isAuthenticated, session, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    setIsMenuOpen(false)
    navigate('/', { replace: true })
  }

  function handleNavigate() {
    setIsMenuOpen(false)
  }

  const userName = session?.user.name || session?.user.email || 'Usuario autenticado'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/home" className={styles.brand} onClick={handleNavigate}>
          <span className={styles.brandMark}>
            <img src="/ponti.svg" alt="" aria-hidden="true" />
          </span>

          <span className={styles.brandText}>
            <strong>Ponti</strong>
            <small>Operación digital</small>
          </span>
        </NavLink>

        {!isHomePage ? (
          <nav className={styles.desktopNav} aria-label="Principal">
            {navItems.map((item) => {
              const Icon = item.icon

              if (!isAuthenticated && item.to !== '/home') {
                return null
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  onClick={handleNavigate}
                >
                  <Icon className={styles.navIcon} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        ) : null}

        {isAuthenticated ? (
          <div className={styles.desktopSession}>
            <span className={styles.userInfo}>
              <span className={styles.userLabel}>Sesión activa</span>
              <strong>{userName}</strong>
            </span>

            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              <LogOut className={styles.navIcon} aria-hidden="true" />
              <span>Salir</span>
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className={styles.menuToggle}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? (
            <X className={styles.menuIcon} aria-hidden="true" />
          ) : (
            <Menu className={styles.menuIcon} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        id="main-navigation"
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}
      >
        <nav className={styles.mobileNav} aria-label="Menú móvil">
          {!isHomePage
            ? navItems.map((item) => {
              const Icon = item.icon

              if (!isAuthenticated && item.to !== '/home') {
                return null
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
                  }
                  onClick={handleNavigate}
                >
                  <Icon className={styles.navIcon} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })
            : null}

          {isAuthenticated ? (
            <button type="button" className={styles.mobileLogoutButton} onClick={handleLogout}>
              <LogOut className={styles.navIcon} aria-hidden="true" />
              <span>Salir</span>
            </button>
          ) : null}
                  {isAuthenticated ? (
          <span className={styles.mobileUserInfo}>
            <span className={styles.userLabel}>Sesión activa</span>
            <strong>{userName}</strong>
          </span>
        ) : null}
        </nav>
      </div>
    </header>
  )
}
