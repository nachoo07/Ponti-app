import { AppRouter } from './routes/AppRouter'
import { useAuth } from './providers/AuthContext'

export default function App() {
  const { isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <main>Cargando sesion...</main>
  }

  return <AppRouter />
}

