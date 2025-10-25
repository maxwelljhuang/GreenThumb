'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { analytics, useAnalytics } from '@/lib/analytics'
import { useUser } from '@/contexts/user-context'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'

interface AnalyticsContextType {
  track: (event: { name: string; properties?: Record<string, any> }) => void
  trackPageView: (page: string, properties?: Record<string, any>) => void
  trackInteraction: (action: string, target: string, properties?: Record<string, any>) => void
  trackSearch: (query: string, resultsCount: number, filters?: Record<string, any>) => void
  trackProductInteraction: (action: string, productId: string, properties?: Record<string, any>) => void
  trackError: (error: Error, context?: Record<string, any>) => void
  trackPerformance: (metric: string, value: number, properties?: Record<string, any>) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const analyticsHooks = useAnalytics()
  const { metrics, performanceScore } = usePerformanceMonitor({
    enableCoreWebVitals: true,
    enableMemoryMonitoring: true,
    enableRenderTracking: true,
  })

  // Set user ID when user changes
  useEffect(() => {
    if (user?.id) {
      analytics.setUserId(user.id)
    }
  }, [user?.id])

  // Track page views
  useEffect(() => {
    const trackPageView = () => {
      analyticsHooks.trackPageView(window.location.pathname, {
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      })
    }

    // Track initial page view
    trackPageView()

    // Track navigation changes
    const handlePopState = () => {
      trackPageView()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [analyticsHooks])

  // Track performance metrics
  useEffect(() => {
    if (metrics.lcp !== null) {
      analyticsHooks.trackPerformance('lcp', metrics.lcp)
    }
    if (metrics.fid !== null) {
      analyticsHooks.trackPerformance('fid', metrics.fid)
    }
    if (metrics.cls !== null) {
      analyticsHooks.trackPerformance('cls', metrics.cls)
    }
    if (metrics.memory) {
      analyticsHooks.trackPerformance('memory_usage', metrics.memory.used, {
        memory_total: metrics.memory.total,
        memory_limit: metrics.memory.limit,
      })
    }
  }, [metrics, analyticsHooks])

  // Track performance score
  useEffect(() => {
    analyticsHooks.trackPerformance('performance_score', performanceScore)
  }, [performanceScore, analyticsHooks])

  // Track user interactions
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const action = target.getAttribute('data-analytics-action') || 'click'
      const element = target.getAttribute('data-analytics-element') || target.tagName.toLowerCase()
      
      analyticsHooks.trackInteraction(action, element, {
        text: target.textContent?.slice(0, 100),
        href: target.getAttribute('href'),
        class: target.className,
      })
    }

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      )
      
      // Track scroll milestones
      if ([25, 50, 75, 100].includes(scrollPercent)) {
        analyticsHooks.trackInteraction('scroll', 'page', {
          scroll_percent: scrollPercent,
        })
      }
    }

    const handleResize = () => {
      analyticsHooks.trackInteraction('resize', 'window', {
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [analyticsHooks])

  // Track search interactions
  useEffect(() => {
    const handleSearch = (event: CustomEvent) => {
      analyticsHooks.trackSearch(event.detail.query, event.detail.resultsCount, event.detail.filters)
    }

    const handleProductInteraction = (event: CustomEvent) => {
      analyticsHooks.trackProductInteraction(
        event.detail.action,
        event.detail.productId,
        event.detail.properties
      )
    }

    window.addEventListener('analytics:search', handleSearch as EventListener)
    window.addEventListener('analytics:product-interaction', handleProductInteraction as EventListener)

    return () => {
      window.removeEventListener('analytics:search', handleSearch as EventListener)
      window.removeEventListener('analytics:product-interaction', handleProductInteraction as EventListener)
    }
  }, [analyticsHooks])

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analyticsHooks.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [analyticsHooks])

  // Track unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analyticsHooks.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection',
      })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [analyticsHooks])

  // Track time on page
  useEffect(() => {
    const startTime = Date.now()
    
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - startTime
      analyticsHooks.trackPerformance('time_on_page', timeOnPage)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analyticsHooks])

  // Track user engagement
  useEffect(() => {
    let engagementStart = Date.now()
    let isActive = true

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const engagementTime = Date.now() - engagementStart
        analyticsHooks.trackPerformance('engagement_time', engagementTime)
        isActive = false
      } else {
        engagementStart = Date.now()
        isActive = true
      }
    }

    const handleFocus = () => {
      if (!isActive) {
        engagementStart = Date.now()
        isActive = true
      }
    }

    const handleBlur = () => {
      if (isActive) {
        const engagementTime = Date.now() - engagementStart
        analyticsHooks.trackPerformance('engagement_time', engagementTime)
        isActive = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [analyticsHooks])

  return (
    <AnalyticsContext.Provider value={analyticsHooks}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return context
}

// Hook for tracking specific interactions
export function useInteractionTracking() {
  const analytics = useAnalyticsContext()

  const trackClick = (element: string, properties?: Record<string, any>) => {
    analytics.trackInteraction('click', element, properties)
  }

  const trackHover = (element: string, properties?: Record<string, any>) => {
    analytics.trackInteraction('hover', element, properties)
  }

  const trackFocus = (element: string, properties?: Record<string, any>) => {
    analytics.trackInteraction('focus', element, properties)
  }

  const trackSubmit = (form: string, properties?: Record<string, any>) => {
    analytics.trackInteraction('submit', form, properties)
  }

  return {
    trackClick,
    trackHover,
    trackFocus,
    trackSubmit,
  }
}

// Hook for A/B testing
export function useABTest(testName: string, variants: Record<string, any>) {
  const [variant, setVariant] = React.useState<string>('control')

  useEffect(() => {
    // Simple A/B test implementation
    const storedVariant = localStorage.getItem(`ab_test_${testName}`)
    if (storedVariant && variants[storedVariant]) {
      setVariant(storedVariant)
    } else {
      const variantNames = Object.keys(variants)
      const randomVariant = variantNames[Math.floor(Math.random() * variantNames.length)]
      setVariant(randomVariant)
      localStorage.setItem(`ab_test_${testName}`, randomVariant)
    }
  }, [testName, variants])

  const trackConversion = (conversionName: string, value?: number) => {
    const analytics = useAnalyticsContext()
    analytics.track('ab_test_conversion', {
      test_name: testName,
      variant,
      conversion_name: conversionName,
      value,
    })
  }

  return {
    variant,
    config: variants[variant] || {},
    trackConversion,
  }
}
