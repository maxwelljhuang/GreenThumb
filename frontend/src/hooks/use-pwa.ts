'use client'

import { useState, useEffect, useCallback } from 'react'

interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWACapabilities {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isStandalone: boolean
  canShare: boolean
  canNotify: boolean
}

interface UsePWAReturn {
  capabilities: PWACapabilities
  installPrompt: PWAInstallPrompt | null
  installApp: () => Promise<void>
  shareContent: (data: ShareData) => Promise<void>
  requestNotificationPermission: () => Promise<NotificationPermission>
  sendNotification: (title: string, options?: NotificationOptions) => void
  isServiceWorkerRegistered: boolean
  updateAvailable: boolean
  updateApp: () => void
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [canNotify, setCanNotify] = useState(false)
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone
      
      setIsInstalled(isStandalone || (isIOS && isInStandaloneMode))
      setIsStandalone(isStandalone)
    }

    checkInstalled()
    window.addEventListener('resize', checkInstalled)
    return () => window.removeEventListener('resize', checkInstalled)
  }, [])

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Check Web Share API support
  useEffect(() => {
    setCanShare(!!navigator.share)
  }, [])

  // Check notification support
  useEffect(() => {
    setCanNotify('Notification' in window)
  }, [])

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as any)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setIsServiceWorkerRegistered(true)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  // Install app
  const installApp = useCallback(async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const choiceResult = await installPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setInstallPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Failed to install app:', error)
    }
  }, [installPrompt])

  // Share content
  const shareContent = useCallback(async (data: ShareData) => {
    if (!navigator.share) {
      // Fallback to clipboard
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        alert('Link copied to clipboard!')
      }
      return
    }

    try {
      await navigator.share(data)
    } catch (error) {
      console.error('Failed to share content:', error)
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }, [])

  // Send notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      })
    }
  }, [])

  // Update app
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      })
    }
  }, [])

  const capabilities: PWACapabilities = {
    isInstallable,
    isInstalled,
    isOnline,
    isStandalone,
    canShare,
    canNotify,
  }

  return {
    capabilities,
    installPrompt,
    installApp,
    shareContent,
    requestNotificationPermission,
    sendNotification,
    isServiceWorkerRegistered,
    updateAvailable,
    updateApp,
  }
}

// Hook for PWA install banner
export function usePWAInstallBanner() {
  const { capabilities, installApp, installPrompt } = usePWA()
  const [showBanner, setShowBanner] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    // Show banner if app is installable and not dismissed
    if (capabilities.isInstallable && !capabilities.isInstalled && !bannerDismissed) {
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) {
        setShowBanner(true)
      }
    }
  }, [capabilities.isInstallable, capabilities.isInstalled, bannerDismissed])

  const handleInstall = async () => {
    await installApp()
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setBannerDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  return {
    showBanner,
    handleInstall,
    handleDismiss,
    canInstall: !!installPrompt,
  }
}

// Hook for offline status
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      if (wasOffline) {
        // App came back online
        console.log('App is back online')
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      setWasOffline(true)
      console.log('App went offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return {
    isOffline,
    wasOffline,
  }
}
