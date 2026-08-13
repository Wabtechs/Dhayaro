'use client'

import { useCallback, useEffect, useState } from 'react'

export type PwaStatus = 'installed' | 'installable' | 'ios' | 'unsupported' | 'unavailable'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface PwaState {
  status: PwaStatus
  isStandalone: boolean
  updateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

export function usePwa(): PwaState & {
  promptInstall: () => Promise<boolean>
  updateApp: () => Promise<void>
  checkForUpdates: () => Promise<boolean>
  clearCache: () => Promise<boolean>
} {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [status, setStatus] = useState<PwaStatus>(() => {
    if (typeof window === 'undefined') return 'unavailable'
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    if (standalone) return 'installed'
    if (!('serviceWorker' in navigator)) return 'unsupported'
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios'
    return 'unavailable'
  })
  const [isStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    )
  })
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isStandalone) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setStatus('installable')
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setStatus('installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    const standaloneMedia = window.matchMedia('(display-mode: standalone)')
    const handleDisplayMode = (e: MediaQueryListEvent) => {
      if (e.matches) setStatus('installed')
    }
    if (standaloneMedia.addEventListener) {
      standaloneMedia.addEventListener('change', handleDisplayMode)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg)
          const handleUpdateFound = () => {
            const installing = reg.installing
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            }
          }
          reg.addEventListener('updatefound', handleUpdateFound)
        }
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (standaloneMedia.removeEventListener) {
        standaloneMedia.removeEventListener('change', handleDisplayMode)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null)
        setStatus('installed')
        return true
      }
    } catch {
      // prompt could not be shown
    }
    return false
  }, [deferredPrompt])

  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return false
    setRegistration(reg)
    await reg.update()
    return true
  }, [])

  const updateApp = useCallback(async () => {
    const reg = registration || (await navigator.serviceWorker.getRegistration())
    if (!reg || !reg.waiting) return
    reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    await new Promise<void>((resolve) => {
      const onStateChange = () => {
        if (reg.waiting?.state === 'activated' || reg.active?.state === 'activated') {
          resolve()
        }
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
      reg.waiting?.addEventListener('statechange', onStateChange)
    })
  }, [registration])

  const clearCache = useCallback(async () => {
    if (!('caches' in window)) return false
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('dhayaro')).map((key) => caches.delete(key)))
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
    }
    return true
  }, [])

  return {
    status,
    isStandalone,
    updateAvailable,
    registration,
    promptInstall,
    updateApp,
    checkForUpdates,
    clearCache,
  }
}
