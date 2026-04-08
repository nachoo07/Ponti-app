// Importa solo el tipo de props nativo de un button HTML desde React.
import type { ButtonHTMLAttributes } from 'react'

// Define un alias de tipo para reutilizar todas las props de <button>.
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

// Componente base reutilizable para botones del proyecto.
export function Button(props: ButtonProps) {
  // Reenvia todas las props recibidas al boton nativo.
  return <button {...props} />
}
