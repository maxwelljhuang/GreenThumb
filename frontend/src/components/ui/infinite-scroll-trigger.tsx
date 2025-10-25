'use client'

import { useEffect, useRef } from 'react'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
  className?: string
  children?: React.ReactNode
}

export function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  loading,
  className,
  children,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const { isIntersecting } = useIntersectionObserver(triggerRef, {
    threshold: 0.1,
  })

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore()
    }
  }, [isIntersecting, hasMore, loading, onLoadMore])

  if (!hasMore) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-dune text-sm">
          You've reached the end! Check back later for more recommendations.
        </p>
      </div>
    )
  }

  return (
    <div ref={triggerRef} className={cn('flex justify-center py-8', className)}>
      {children || (
        <div className="flex items-center space-x-2">
          {loading && <LoadingSpinner size="sm" />}
          <span className="text-dune text-sm">
            {loading ? 'Loading more...' : 'Scroll for more'}
          </span>
        </div>
      )}
    </div>
  )
}

interface InfiniteScrollWrapperProps {
  children: React.ReactNode
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
  className?: string
}

export function InfiniteScrollWrapper({
  children,
  onLoadMore,
  hasMore,
  loading,
  className,
}: InfiniteScrollWrapperProps) {
  return (
    <div className={className}>
      {children}
      <InfiniteScrollTrigger
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        loading={loading}
      />
    </div>
  )
}
