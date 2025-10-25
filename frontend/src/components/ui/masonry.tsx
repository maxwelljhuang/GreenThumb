'use client'

import { useEffect, useRef, useState } from 'react'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

interface MasonryProps<T> {
  items: T[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  renderItem: (item: T) => React.ReactNode
  className?: string
}

export function Masonry<T>({
  items,
  loading = false,
  onLoadMore,
  hasMore = true,
  renderItem,
  className = '',
}: MasonryProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
  })

  useEffect(() => {
    if (isIntersecting && hasMore && !loading && !isLoadingMore && onLoadMore) {
      setIsLoadingMore(true)
      onLoadMore()
      // Reset loading state after a delay
      setTimeout(() => setIsLoadingMore(false), 1000)
    }
  }, [isIntersecting, hasMore, loading, isLoadingMore, onLoadMore])

  return (
    <div className={`masonry ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="masonry-item">
          {renderItem(item)}
        </div>
      ))}
      
      {hasMore && (
        <div ref={loadMoreRef} className="masonry-item">
          <div className="h-4" />
        </div>
      )}
    </div>
  )
}
