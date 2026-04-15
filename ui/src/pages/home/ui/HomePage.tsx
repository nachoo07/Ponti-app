import { Link } from 'react-router-dom'
import './HomePage.css'

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-shell">
        <header className="home-header">
          <p className="home-kicker">Inicio</p>
          <h1 className="home-title">Ordenes de trabajo</h1>
          <p className="home-description">Elegí una acción para continuar.</p>
        </header>

        <section className="home-grid">
          <article className="home-card">
            <Link to="/work-orders" className="home-card-link">
              Crear nueva OT
            </Link>
          </article>

          <article className="home-card">
            <Link to="/work-order-drafts" className="home-card-link">
              Ver órdenes cargadas
            </Link>
          </article>
        </section>
      </section>
    </main>
  )
}
