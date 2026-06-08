import { ArrowRight, ClipboardList, FilePlus2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import './HomePage.css'

const actions = [
  {
    to: '/work-orders',
    label: 'Crear nueva OT',
    copy: 'Iniciá una orden de trabajo nueva.',
    cta: 'Iniciar carga',
    icon: FilePlus2,
    primary: true,
  },
  {
    to: '/work-order-drafts',
    label: 'Ver órdenes',
    copy: 'Consultá órdenes cargadas y su estado.',
    cta: 'Ver órdenes',
    icon: ClipboardList,
    primary: false,
  },
]

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-shell">
        <h1 className="home-title">Centro operativo</h1>

        <section className="home-grid" aria-label="Acciones principales">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <article
                key={action.to}
                className={`home-card ${action.primary ? 'is-primary' : 'is-secondary'}`}
              >
                <Link to={action.to} className="home-card-link">
                  <div className="home-card-content">
                    <div className="home-card-main">
                      <div className="home-card-heading">
                        <h2>{action.label}</h2>

                        <span className="home-card-icon" aria-hidden="true">
                          <Icon />
                        </span>
                      </div>

                      <p>{action.copy}</p>
                    </div>

                    <span className="home-card-cta">
                      {action.cta}
                      <ArrowRight aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </article>
            )
          })}
        </section>
      </section>
    </main>
  )
}
