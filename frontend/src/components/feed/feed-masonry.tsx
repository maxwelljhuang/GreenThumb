'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { MasonryLayout } from './masonry-layout'
import { PinCard } from '@/components/ui/pin-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Product, SearchResult } from '@/types'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

interface FeedMasonryProps {
  products: Product[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onLike?: (productId: string) => void
  onSave?: (productId: string) => void
  onShare?: (productId: string) => void
  onView?: (productId: string) => void
  className?: string
}

export function FeedMasonry({
  products,
  loading = false,
  hasMore = false,
  onLoadMore,
  onLike,
  onSave,
  onShare,
  onView,
  className,
}: FeedMasonryProps) {
  const [visibleProducts, setVisibleProducts] = useState<Set<string>>(new Set())
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
  })

  // Convert products to search results for consistent interface
  const searchResults: SearchResult[] = useMemo(() => 
    products.map((product, index) => ({
      product,
      similarity: Math.random() * 0.5 + 0.5, // Mock similarity score
      rank: index + 1,
      explanation: index % 3 === 0 ? {
        type: 'because' as const,
        becauseOfPinId: `pin-${Math.floor(Math.random() * 100)}`,
        score: Math.random() * 0.3 + 0.7,
      } : index % 3 === 1 ? {
        type: 'matched' as const,
        matchedTags: [
          { tag: 'vintage', contribution: 0.82 },
          { tag: 'leather', contribution: 0.76 },
        ],
      } : {
        type: 'trending' as const,
      },
    }))
  , [products])

  // Handle load more when intersection is observed
  useEffect(() => {
    if (isIntersecting && hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [isIntersecting, hasMore, loading, onLoadMore])

  // Track visible products for analytics
  const handleView = useCallback((productId: string) => {
    setVisibleProducts(prev => new Set([...prev, productId]))
    onView?.(productId)
  }, [onView])

  // Show empty state if no products
  if (!loading && products.length === 0) {
    return (
      <EmptyState
        icon="🏠"
        title="No recommendations yet"
        description="We're working on finding products that match your style. Check back soon for personalized recommendations."
        action={{
          label: 'Refresh',
          onClick: () => window.location.reload(),
        }}
      />
    )
  }

  return (
    <div className={className}>
      <MasonryLayout className="w-full">
        {searchResults.map((result) => (
          <PinCard
            key={result.product.id}
            product={result.product}
            explanation={result.explanation}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onView={handleView}
          />
        ))}
      </MasonryLayout>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {loading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-dune text-sm">Loading more...</span>
            </div>
          ) : (
            <div className="text-dune text-sm">
              Scroll for more recommendations
            </div>
          )}
        </div>
      )}

      {/* End of feed */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8">
          <p className="text-dune text-sm">
            You've reached the end! Check back later for more recommendations.
          </p>
        </div>
      )}
    </div>
  )
}

interface FeedGridProps {
  products: Product[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onLike?: (productId: string) => void
  onSave?: (productId: string) => void
  onShare?: (productId: string) => void
  onView?: (productId: string) => void
  className?: string
}

export function FeedGrid({
  products,
  loading = false,
  hasMore = false,
  onLoadMore,
  onLike,
  onSave,
  onShare,
  onView,
  className,
}: FeedGridProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        {products.map((product) => (
          <PinCard
            key={product.id}
            product={product}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onView={onView}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center py-8">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-pine text-sand rounded-lg hover:bg-forest transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
