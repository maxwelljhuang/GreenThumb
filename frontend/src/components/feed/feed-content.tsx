'use client'

import { useState, useCallback, useEffect } from 'react'
import { FeedOptimized } from './feed-optimized'
import { Product, SearchResult } from '@/types'
import { enhancedApiService } from '@/lib/enhanced-api-service'
import { useUser } from '@/contexts/user-context'
import { useFeedbackTracker } from '@/hooks/use-feedback-tracker'
import { useToast } from '@/hooks/use-toast'

export function FeedContent() {
  const { user, userContext } = useUser()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    handleLike,
    handleSave,
    handleShare,
    handleClick,
    trackProductView,
    isTrackingEnabled,
  } = useFeedbackTracker({
    enableViewTracking: true,
    enableInteractionTracking: true,
  })

  // Load initial recommendations
  useEffect(() => {
    if (user && userContext) {
      loadInitialRecommendations()
    }
  }, [user, userContext])

  // Load initial recommendations
  const loadInitialRecommendations = useCallback(async () => {
    if (!user || !userContext) return

    try {
      setIsLoading(true)
      setError(null)

              const response = await enhancedApiService.getRecommendations(user.id, 'feed', {
                offset: 0,
                limit: 20,
              })

      setCurrentIndex(20)
      setHasMore(response.results.length === 20)
    } catch (error) {
      console.error('Failed to load initial recommendations:', error)
      setError(error instanceof Error ? error.message : 'Failed to load recommendations')
      toast({
        title: 'Error',
        description: 'Failed to load recommendations. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, userContext, toast])

  // Load more products from API
  const handleLoadMore = useCallback(async (): Promise<Product[]> => {
    if (!user || !userContext) {
      throw new Error('User not authenticated')
    }

    try {
      setIsLoading(true)
      setError(null)

              const response = await enhancedApiService.getRecommendations(user.id, 'feed', {
                offset: currentIndex,
                limit: 20,
              })

      setCurrentIndex(prev => prev + response.results.length)
      setHasMore(response.results.length === 20)

      // Track that we loaded more recommendations
      if (isTrackingEnabled) {
        // Track the load more action
        handleClick('load_more', 'feed', currentIndex)
      }

      return response.results.map((result: any) => result.product)
    } catch (error) {
      console.error('Failed to load more products:', error)
      setError(error instanceof Error ? error.message : 'Failed to load more products')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user, userContext, currentIndex, isTrackingEnabled, handleClick])

  // Enhanced interaction handlers with tracking
  const handleLikeWithTracking = useCallback((productId: string) => {
    handleLike(productId, 'feed')
  }, [handleLike])

  const handleSaveWithTracking = useCallback((productId: string) => {
    handleSave(productId, 'feed')
  }, [handleSave])

  const handleShareWithTracking = useCallback((productId: string) => {
    handleShare(productId, 'feed')
  }, [handleShare])

  const handleViewWithTracking = useCallback((productId: string) => {
    handleClick(productId, 'feed')
  }, [handleClick])

  // Handle product view tracking
  const handleProductView = useCallback((productId: string, element: HTMLDivElement) => {
    if (isTrackingEnabled) {
      trackProductView(productId, element)
    }
  }, [isTrackingEnabled, trackProductView])

  // Show loading state for initial load
  if (isLoading && currentIndex === 0) {
    return (
      <div className="container-custom py-8">
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pine mx-auto mb-4"></div>
            <p className="text-dune">Loading your personalized feed...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && currentIndex === 0) {
    return (
      <div className="container-custom py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-xl font-semibold text-forest mb-2">
            Something went wrong
          </h3>
          <p className="text-dune mb-6 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={loadInitialRecommendations}
            className="px-6 py-3 bg-pine text-sand rounded-lg hover:bg-forest transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-forest mb-2">
          Discover Your Style
        </h1>
        <p className="text-dune text-lg">
          Personalized recommendations just for you
        </p>
        {userContext?.preferences && (
          <p className="text-sm text-sage mt-2">
            ✨ Recommendations personalized based on your preferences
          </p>
        )}
      </div>

      <FeedOptimized
        initialProducts={[]} // Will be loaded via API
        onLoadMore={handleLoadMore}
        onLike={handleLikeWithTracking}
        onSave={handleSaveWithTracking}
        onShare={handleShareWithTracking}
        onView={handleViewWithTracking}
        className="w-full"
      />
    </div>
  )
}
