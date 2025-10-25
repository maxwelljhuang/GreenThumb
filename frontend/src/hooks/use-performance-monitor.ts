'use client'

import { useEffect, useRef, useState } from 'react'
import { measureCoreWebVitals, getMemoryUsage } from '@/lib/performance'

interface PerformanceMetrics {
  lcp: number | null
  fid: number | null
  cls: number | null
  memory: {
    used: number
    total: number
    limit: number
  } | null
  loadTime: number
  renderTime: number
}

interface UsePerformanceMonitorOptions {
  enableCoreWebVitals?: boolean
  enableMemoryMonitoring?: boolean
  enableRenderTracking?: boolean
  reportInterval?: number
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    enableCoreWebVitals = true,
    enableMemoryMonitoring = true,
    enableRenderTracking = true,
    reportInterval = 30000, // 30 seconds
    onMetricsUpdate,
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    memory: null,
    loadTime: 0,
    renderTime: 0,
  })

  const startTime = useRef(performance.now())
  const renderStartTime = useRef(performance.now())
  const intervalRef = useRef<NodeJS.Timeout>()

  // Track page load time
  useEffect(() => {
    const handleLoad = () => {
      const loadTime = performance.now() - startTime.current
      setMetrics(prev => ({ ...prev, loadTime }))
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  // Track render time
  useEffect(() => {
    if (enableRenderTracking) {
      const renderTime = performance.now() - renderStartTime.current
      setMetrics(prev => ({ ...prev, renderTime }))
    }
  }, [enableRenderTracking])

  // Core Web Vitals monitoring
  useEffect(() => {
    if (enableCoreWebVitals) {
      let lcpValue: number | null = null
      let fidValue: number | null = null
      let clsValue = 0

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        lcpValue = lastEntry.startTime
        setMetrics(prev => ({ ...prev, lcp: lcpValue }))
      })

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          fidValue = entry.processingStart - entry.startTime
          setMetrics(prev => ({ ...prev, fid: fidValue }))
        })
      })

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            setMetrics(prev => ({ ...prev, cls: clsValue }))
          }
        })
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        fidObserver.observe({ entryTypes: ['first-input'] })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }

      return () => {
        lcpObserver.disconnect()
        fidObserver.disconnect()
        clsObserver.disconnect()
      }
    }
  }, [enableCoreWebVitals])

  // Memory monitoring
  useEffect(() => {
    if (enableMemoryMonitoring) {
      const updateMemoryMetrics = () => {
        const memory = getMemoryUsage()
        if (memory) {
          setMetrics(prev => ({ ...prev, memory }))
        }
      }

      // Initial memory reading
      updateMemoryMetrics()

      // Set up interval for memory monitoring
      intervalRef.current = setInterval(updateMemoryMetrics, reportInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [enableMemoryMonitoring, reportInterval])

  // Report metrics when they change
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics)
    }
  }, [metrics, onMetricsUpdate])

  // Performance score calculation
  const getPerformanceScore = () => {
    let score = 100

    // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
    if (metrics.lcp !== null) {
      if (metrics.lcp > 4000) score -= 30
      else if (metrics.lcp > 2500) score -= 15
    }

    // FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
    if (metrics.fid !== null) {
      if (metrics.fid > 300) score -= 25
      else if (metrics.fid > 100) score -= 10
    }

    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (metrics.cls !== null) {
      if (metrics.cls > 0.25) score -= 25
      else if (metrics.cls > 0.1) score -= 10
    }

    // Memory usage scoring
    if (metrics.memory) {
      const memoryUsagePercent = (metrics.memory.used / metrics.memory.limit) * 100
      if (memoryUsagePercent > 80) score -= 10
      else if (memoryUsagePercent > 60) score -= 5
    }

    return Math.max(0, score)
  }

  // Performance recommendations
  const getRecommendations = () => {
    const recommendations: string[] = []

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Optimize images and reduce server response time for better LCP')
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Reduce JavaScript execution time to improve FID')
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Add size attributes to images and avoid layout shifts')
    }

    if (metrics.memory && (metrics.memory.used / metrics.memory.limit) > 0.6) {
      recommendations.push('Consider implementing code splitting to reduce memory usage')
    }

    return recommendations
  }

  return {
    metrics,
    performanceScore: getPerformanceScore(),
    recommendations: getRecommendations(),
    isMonitoring: enableCoreWebVitals || enableMemoryMonitoring,
  }
}

// Hook for tracking component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef(performance.now())
  const renderCount = useRef(0)

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    renderCount.current += 1

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`)
    }

    // Warn about slow renders
    if (renderTime > 16) { // 60fps threshold
      console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`)
    }
  })

  return {
    renderCount: renderCount.current,
  }
}
