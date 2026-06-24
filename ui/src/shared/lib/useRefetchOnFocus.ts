import { useEffect } from 'react'

export function useRefetchOnFocus(callback: () => void) {
  useEffect(() => {
    function handleFocus() {
      if (document.visibilityState === 'visible') {
        callback()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [callback])
}