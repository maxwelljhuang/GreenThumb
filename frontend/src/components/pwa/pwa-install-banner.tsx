'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWAInstallBanner } from '@/hooks/use-pwa'
import { cn } from '@/lib/utils'

interface PWAInstallBannerProps {
  className?: string
}

export function PWAInstallBanner({ className }: PWAInstallBannerProps) {
  const { showBanner, handleInstall, handleDismiss, canInstall } = usePWAInstallBanner()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (showBanner) {
      // Delay showing banner to avoid jarring experience
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [showBanner])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm',
          className
        )}
      >
        <div className="bg-white border border-sage/20 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-pine/10 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-pine" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-forest text-sm mb-1">
                Install knytt
              </h3>
              <p className="text-xs text-dune mb-3">
                Get quick access to sustainable product discovery with our app.
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={!canInstall}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Install
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-sage/20">
            <div className="flex items-center gap-4 text-xs text-dune">
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                <span>Mobile</span>
              </div>
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                <span>Desktop</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// PWA Install Button Component
export function PWAInstallButton({ 
  className,
  size = 'default',
  variant = 'outline',
  showText = true,
}: {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showText?: boolean
}) {
  const { handleInstall, canInstall } = usePWAInstallBanner()

  if (!canInstall) return null

  return (
    <Button
      onClick={handleInstall}
      size={size}
      variant={variant}
      className={cn('flex items-center gap-2', className)}
    >
      <Download className="h-4 w-4" />
      {showText && 'Install App'}
    </Button>
  )
}

// PWA Status Indicator
export function PWAStatusIndicator({ className }: { className?: string }) {
  const { capabilities } = { capabilities: { installable: false, shareable: false, notifications: false, isStandalone: false, isOnline: true } }
  const [status, setStatus] = useState<'online' | 'offline' | 'standalone'>('online')

  useEffect(() => {
    if (capabilities.isStandalone) {
      setStatus('standalone')
    } else if (capabilities.isOnline) {
      setStatus('online')
    } else {
      setStatus('offline')
    }
  }, [capabilities.isOnline, capabilities.isStandalone])

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-red-500'
      case 'standalone':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'offline':
        return 'Offline'
      case 'standalone':
        return 'App Mode'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
      <span className="text-dune">{getStatusText()}</span>
    </div>
  )
}
