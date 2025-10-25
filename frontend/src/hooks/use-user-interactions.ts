'use client'

import { useCallback, useRef } from 'react'
import { useUser } from '@/contexts/user-context'
import { ApiService } from '@/lib/api-service'
import { InteractionType } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface UseUserInteractionsOptions {
  enableTracking?: boolean
  debounceMs?: number
}

export function useUserInteractions(options: UseUserInteractionsOptions = {}) {
  const { enableTracking = true, debounceMs = 1000 } = options
  const { user, userContext, trackActivity } = useUser()
  const { toast } = useToast()
  const debounceRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Track user activity
  const trackUserActivity = useCallback(() => {
    if (enableTracking) {
      trackActivity()
    }
  }, [enableTracking, trackActivity])

  // Record interaction with debouncing
  const recordInteraction = useCallback(async (
    productId: string,
    interactionType: InteractionType,
    options: {
      rating?: number
      context?: string
      query?: string
      position?: number
    } = {}
  ) => {
    if (!enableTracking || !user || !userContext) {
      return
    }

    const interactionKey = `${productId}_${interactionType}`
    
    // Clear existing timeout for this interaction
    const existingTimeout = debounceRefs.current.get(interactionKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        await ApiService.recordInteraction(
          user.id,
          productId,
          interactionType,
          {
            rating: options.rating,
            context: options.context,
            query: options.query,
            position: options.position,
            sessionId: userContext.sessionId,
          }
        )

        // Track activity
        trackUserActivity()

        // Show success toast for certain interactions
        if (interactionType === 'like' || interactionType === 'save') {
          toast({
            title: interactionType === 'like' ? 'Liked!' : 'Saved!',
            description: `Product ${interactionType === 'like' ? 'added to your likes' : 'saved to your collection'}`,
          })
        }
      } catch (error) {
        console.error('Failed to record interaction:', error)
        // Don't show error toast for tracking failures to avoid spam
      } finally {
        debounceRefs.current.delete(interactionKey)
      }
    }, debounceMs)

    debounceRefs.current.set(interactionKey, timeout)
  }, [enableTracking, user, userContext, debounceMs, trackUserActivity, toast])

  // Specific interaction handlers
  const trackView = useCallback((productId: string, context?: string, position?: number) => {
    return recordInteraction(productId, 'view', { context, position })
  }, [recordInteraction])

  const trackLike = useCallback((productId: string, context?: string, position?: number) => {
    return recordInteraction(productId, 'like', { context, position })
  }, [recordInteraction])

  const trackSave = useCallback((productId: string, context?: string, position?: number) => {
    return recordInteraction(productId, 'save', { context, position })
  }, [recordInteraction])

  const trackShare = useCallback((productId: string, context?: string, position?: number) => {
    return recordInteraction(productId, 'share', { context, position })
  }, [recordInteraction])

  const trackClick = useCallback((productId: string, context?: string, position?: number) => {
    return recordInteraction(productId, 'click', { context, position })
  }, [recordInteraction])

  const trackRating = useCallback((productId: string, rating: number, context?: string) => {
    return recordInteraction(productId, 'rating', { rating, context })
  }, [recordInteraction])

  // Search interaction tracking
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    if (!enableTracking || !user) return

    // Track search as a special interaction
    trackUserActivity()
    
    // Store search in local history
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const newSearch = {
      query,
      resultsCount,
      timestamp: new Date().toISOString(),
    }
    
    const updatedHistory = [newSearch, ...searchHistory.slice(0, 49)] // Keep last 50 searches
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory))
  }, [enableTracking, user, trackUserActivity])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    debounceRefs.current.forEach(timeout => clearTimeout(timeout))
    debounceRefs.current.clear()
  }, [])

  return {
    // Interaction tracking
    trackView,
    trackLike,
    trackSave,
    trackShare,
    trackClick,
    trackRating,
    trackSearch,
    
    // Utility functions
    trackUserActivity,
    cleanup,
    
    // State
    isTrackingEnabled: enableTracking && !!user,
    user,
    userContext,
  }
}
