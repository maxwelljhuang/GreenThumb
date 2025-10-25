'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FeedMasonry } from './feed-masonry'
import { InfiniteScrollTrigger } from './infinite-scroll-trigger'
import { ScrollToTop } from './infinite-scroll-trigger'
import { useInfiniteScroll, useFeedState } from '@/hooks/use-infinite-scroll'
import { Product } from '@/types'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useToast } from '@/hooks/use-toast'

interface FeedOptimizedProps {
  initialProducts?: Product[]
  onLoadMore: () => Promise<Product[]>
  onLike?: (productId: string) => void
  onSave?: (productId: string) => void
  onShare?: (productId: string) => void
  onView?: (productId: string) => void
  className?: string
}

export function FeedOptimized({
  initialProducts = [],
  onLoadMore,
  onLike,
  onSave,
  onShare,
  onView,
  className,
}: FeedOptimizedProps) {
  const { toast } = useToast()
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  
  const {
    items: products,
    loading,
    error,
    hasMore,
    addItems,
    setLoadingState,
    setErrorState,
    setHasMoreState,
  } = useFeedState({ initialItems: initialProducts })

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 1000)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle load more with error handling
  const handleLoadMore = useCallback(async () => {
    try {
      setLoadingState(true)
      setErrorState(null)
      
      const newProducts = await onLoadMore()
      
      if (newProducts.length === 0) {
        setHasMoreState(false)
      } else {
        addItems(newProducts)
      }
    } catch (err) {
      console.error('Error loading more products:', err)
      setErrorState(err instanceof Error ? err.message : 'Failed to load more products')
      toast({
        title: 'Error',
        description: 'Failed to load more products. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoadingState(false)
    }
  }, [onLoadMore, addItems, setLoadingState, setErrorState, setHasMoreState, toast])

  // Infinite scroll hook
  const {
    triggerRef,
    isLoadingMore,
    error: scrollError,
    retry,
    canRetry,
  } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: handleLoadMore,
    threshold: 0.1,
    rootMargin: '100px',
    delay: 500, // 500ms delay for better UX
  })

  // Memoized product interactions
  const handleLike = useCallback((productId: string) => {
    onLike?.(productId)
    toast({
      title: 'Liked!',
      description: 'Product added to your likes',
    })
  }, [onLike, toast])

  const handleSave = useCallback((productId: string) => {
    onSave?.(productId)
    toast({
      title: 'Saved!',
      description: 'Product saved to your collection',
    })
  }, [onSave, toast])

  const handleShare = useCallback((productId: string) => {
    onShare?.(productId)
    toast({
      title: 'Shared!',
      description: 'Product link copied to clipboard',
    })
  }, [onShare, toast])

  const handleView = useCallback((productId: string) => {
    onView?.(productId)
  }, [onView])

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Memoized components to prevent unnecessary re-renders
  const memoizedProducts = useMemo(() => products, [products])

  // Show loading state for initial load
  if (loading && products.length === 0) {
    return (
      <div className={className}>
        <div className="flex justify-center py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-dune">Loading your personalized feed...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state
  if (!loading && products.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon="🏠"
          title="No recommendations yet"
          description="We're working on finding products that match your style. Check back soon for personalized recommendations."
          action={{
            label: 'Refresh',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={className}>
        <FeedMasonry
          products={memoizedProducts}
          loading={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onLike={handleLike}
          onSave={handleSave}
          onShare={handleShare}
          onView={handleView}
        />

        {/* Infinite scroll trigger */}
        <div ref={triggerRef}>
          <InfiniteScrollTrigger
            loading={isLoadingMore}
            hasMore={hasMore}
            error={error || scrollError}
            onRetry={canRetry ? retry : undefined}
          />
        </div>

        {/* Scroll to top button */}
        <ScrollToTop
          show={showScrollToTop}
          onClick={handleScrollToTop}
        />
      </div>
    </ErrorBoundary>
  )
}

interface FeedSkeletonProps {
  count?: number
  className?: string
}

export function FeedSkeleton({ count = 12, className }: FeedSkeletonProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        {Array.from({ length: count }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="aspect-square bg-sage/20 rounded-xl mb-4 animate-pulse" />
            <div className="h-4 bg-sage/20 rounded-md mb-2 animate-pulse" />
            <div className="h-3 bg-sage/20 rounded-md w-3/4 animate-pulse" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

interface FeedErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

export function FeedError({ error, onRetry, className }: FeedErrorProps) {
  return (
    <div className={className}>
      <div className="text-center py-16">
        <div className="text-6xl mb-4">😞</div>
        <h3 className="text-xl font-semibold text-forest mb-2">
          Something went wrong
        </h3>
        <p className="text-dune mb-6 max-w-md mx-auto">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-pine text-sand rounded-lg hover:bg-forest transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
