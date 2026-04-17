import { Link } from 'react-router-dom'
import './HomePage.css'

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-shell">
        <header className="home-header">
          <p className="home-kicker">Workspace</p>
          <h1 className="home-title">Centro operativo</h1>
          <p className="home-description">
            Accede rapido a la carga de ordenes o al historial digital desde una interfaz pensada
            para uso diario.
          </p>
        </header>

        <section className="home-grid">
          <article className="home-card">
            <Link to="/work-orders" className="home-card-link">
              <span className="home-card-eyebrow">Carga</span>
              <span className="home-card-title">Crear nueva OT</span>
              <span className="home-card-copy">
                Arma borradores por lote, calcula dosis y comparte PDF desde un solo flujo.
              </span>
            </Link>
          </article>

          <article className="home-card">
            <Link to="/work-order-drafts" className="home-card-link">
              <span className="home-card-eyebrow">Seguimiento</span>
              <span className="home-card-title">Ver ordenes cargadas</span>
              <span className="home-card-copy">
                Revisa borradores, detalles y estado de publicacion con filtros rapidos.
              </span>
            </Link>
          </article>
        </section>
      </section>
    </main>
  )
}
