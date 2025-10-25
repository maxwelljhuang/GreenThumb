'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useUserInteractions } from './use-user-interactions'
import { enhancedApiService } from '@/lib/enhanced-api-service'
import { useIntersectionObserver } from './use-intersection-observer'

interface UseFeedbackTrackerOptions {
  enableViewTracking?: boolean
  enableInteractionTracking?: boolean
  viewThreshold?: number
  debounceMs?: number
}

export function useFeedbackTracker(options: UseFeedbackTrackerOptions = {}) {
  const {
    enableViewTracking = true,
    enableInteractionTracking = true,
    viewThreshold = 0.5,
    debounceMs = 1000,
  } = options

  const {
    trackView,
    trackLike,
    trackSave,
    trackShare,
    trackClick,
    trackRating,
    trackSearch,
    isTrackingEnabled,
  } = useUserInteractions({
    enableTracking: enableInteractionTracking,
    debounceMs,
  })

  const viewedProducts = useRef<Set<string>>(new Set())
  const intersectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Track product view when it comes into viewport
  const trackProductView = useCallback((productId: string, element: HTMLDivElement) => {
    if (!enableViewTracking || !isTrackingEnabled) return

    intersectionRefs.current.set(productId, element)
  }, [enableViewTracking, isTrackingEnabled])

  // Use intersection observer for view tracking
  const { isIntersecting } = useIntersectionObserver(
    intersectionRefs.current.get('current') || null,
    {
      threshold: viewThreshold,
      rootMargin: '0px 0px -100px 0px', // Trigger when 100px from bottom
    }
  )

  // Handle view tracking when intersection changes
  useEffect(() => {
    if (isIntersecting && isTrackingEnabled) {
      // Find which product is currently in view
      const currentProduct = Array.from(viewedProducts.current).find(productId => {
        const element = intersectionRefs.current.get(productId)
        return element && element.getBoundingClientRect().top < window.innerHeight
      })

      if (currentProduct && !viewedProducts.current.has(currentProduct)) {
        trackView(currentProduct, 'feed')
        viewedProducts.current.add(currentProduct)
      }
    }
  }, [isIntersecting, isTrackingEnabled, trackView])

  // Enhanced interaction handlers with context
  const handleLike = useCallback((productId: string, context: string = 'feed', position?: number) => {
    if (!isTrackingEnabled) return

    trackLike(productId, context, position)
  }, [isTrackingEnabled, trackLike])

  const handleSave = useCallback((productId: string, context: string = 'feed', position?: number) => {
    if (!isTrackingEnabled) return

    trackSave(productId, context, position)
  }, [isTrackingEnabled, trackSave])

  const handleShare = useCallback((productId: string, context: string = 'feed', position?: number) => {
    if (!isTrackingEnabled) return

    trackShare(productId, context, position)
  }, [isTrackingEnabled, trackShare])

  const handleClick = useCallback((productId: string, context: string = 'feed', position?: number) => {
    if (!isTrackingEnabled) return

    trackClick(productId, context, position)
  }, [isTrackingEnabled, trackClick])

  const handleRating = useCallback((productId: string, rating: number, context: string = 'feed') => {
    if (!isTrackingEnabled) return

    trackRating(productId, rating, context)
  }, [isTrackingEnabled, trackRating])

  const handleSearch = useCallback((query: string, resultsCount: number) => {
    if (!isTrackingEnabled) return

    trackSearch(query, resultsCount)
  }, [isTrackingEnabled, trackSearch])

  // Track scroll depth for engagement
  const trackScrollDepth = useCallback(() => {
    if (!isTrackingEnabled) return

    const scrollDepth = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    )

    // Track significant scroll milestones
    if (scrollDepth > 0 && scrollDepth % 25 === 0) {
      trackView('scroll_depth', 'engagement', scrollDepth)
    }
  }, [isTrackingEnabled, trackView])

  // Track time on page
  const trackTimeOnPage = useCallback(() => {
    if (!isTrackingEnabled) return

    const timeOnPage = Math.floor((Date.now() - performance.now()) / 1000)
    
    // Track time milestones (30s, 1min, 2min, 5min)
    if ([30, 60, 120, 300].includes(timeOnPage)) {
      trackView('time_on_page', 'engagement', timeOnPage)
    }
  }, [isTrackingEnabled, trackView])

  // Set up scroll and time tracking
  useEffect(() => {
    if (!isTrackingEnabled) return

    const handleScroll = () => {
      requestAnimationFrame(trackScrollDepth)
    }

    const timeInterval = setInterval(trackTimeOnPage, 30000) // Check every 30 seconds

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(timeInterval)
    }
  }, [isTrackingEnabled, trackScrollDepth, trackTimeOnPage])

  // Track page visibility changes
  useEffect(() => {
    if (!isTrackingEnabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackView('page_hidden', 'engagement')
      } else {
        trackView('page_visible', 'engagement')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTrackingEnabled, trackView])

  return {
    // View tracking
    trackProductView,
    
    // Interaction handlers
    handleLike,
    handleSave,
    handleShare,
    handleClick,
    handleRating,
    handleSearch,
    
    // Engagement tracking
    trackScrollDepth,
    trackTimeOnPage,
    
    // State
    isTrackingEnabled,
    viewedProducts: Array.from(viewedProducts.current),
  }
}
