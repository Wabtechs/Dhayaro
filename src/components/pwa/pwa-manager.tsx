'use client'

import { useEffect } from 'react'

export function PwaManager() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // registration can fail in private mode or unsupported environments
      })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
    }
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
