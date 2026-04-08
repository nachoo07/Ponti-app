// Guarda un valor tipado en localStorage serializado en JSON.
export function setStorageItem<T>(key: string, value: T): void {
  // Convierte el valor a string JSON y lo persiste en la clave indicada.
  localStorage.setItem(key, JSON.stringify(value))
}

// Lee un valor tipado desde localStorage y lo parsea desde JSON.
export function getStorageItem<T>(key: string): T | null {
  // Obtiene el valor crudo como string.
  const rawValue = localStorage.getItem(key)
  // Si no existe nada en storage para esa clave, retorna null.
  if (!rawValue) return null

  try {
    // Intenta parsear el JSON y devolverlo con el tipo esperado.
    return JSON.parse(rawValue) as T
  } catch {
    // Si el JSON esta corrupto o invalido, evita romper la app y retorna null.
    return null
  }
}

// Elimina una clave especifica de localStorage.
export function removeStorageItem(key: string): void {
  // Borra definitivamente el valor guardado en esa clave.
  localStorage.removeItem(key)
}
