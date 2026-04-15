// Importa solo el tipo de props nativo de un input HTML desde React.
import type { InputHTMLAttributes } from 'react'

// Define un alias de tipo para reutilizar todas las props de <input>.
type InputProps = InputHTMLAttributes<HTMLInputElement>

// Componente base reutilizable para inputs del proyecto.
export function Input(props: InputProps) {
  // Reenvia todas las props recibidas al input nativo.
  return <input {...props} />
}
