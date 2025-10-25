'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useIntersectionObserver } from './use-intersection-observer'

interface UseInfiniteScrollOptions {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
  delay?: number
}

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px',
  delay = 0,
}: UseInfiniteScrollOptions) {
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const { isIntersecting } = useIntersectionObserver(triggerRef, {
    threshold,
    rootMargin,
  })

  const handleLoadMore = useCallback(async () => {
    if (loading || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setError(null)

    try {
      // Add delay if specified
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      await onLoadMore()
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error('Error loading more items:', err)
      setError(err instanceof Error ? err.message : 'Failed to load more items')
      setRetryCount(prev => prev + 1)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loading, isLoadingMore, hasMore, onLoadMore, delay])

  const retry = useCallback(() => {
    setError(null)
    handleLoadMore()
  }, [handleLoadMore])

  // Trigger load more when intersection is observed
  useEffect(() => {
    if (isIntersecting && hasMore && !loading && !isLoadingMore) {
      handleLoadMore()
    }
  }, [isIntersecting, hasMore, loading, isLoadingMore, handleLoadMore])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    triggerRef,
    isLoadingMore,
    error,
    retry,
    retryCount,
    canRetry: retryCount < 3, // Allow up to 3 retries
  }
}

interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
  totalItems?: number
}

export function usePagination({
  initialPage = 1,
  pageSize = 20,
  totalItems,
}: UsePaginationOptions = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(true)

  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : undefined
  const isLastPage = totalPages ? currentPage >= totalPages : false

  useEffect(() => {
    if (totalPages) {
      setHasMore(currentPage < totalPages)
    }
  }, [currentPage, totalPages])

  const nextPage = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore])

  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage)
    setHasMore(true)
  }, [initialPage])

  return {
    currentPage,
    hasMore,
    isLastPage,
    nextPage,
    resetPagination,
    totalPages,
  }
}

interface UseFeedStateOptions {
  initialItems?: any[]
  pageSize?: number
}

export function useFeedState({ initialItems = [], pageSize = 20 }: UseFeedStateOptions = {}) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const addItems = useCallback((newItems: any[]) => {
    setItems(prev => [...prev, ...newItems])
  }, [])

  const setItemsDirectly = useCallback((newItems: any[]) => {
    setItems(newItems)
  }, [])

  const clearItems = useCallback(() => {
    setItems([])
  }, [])

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading)
  }, [])

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage)
  }, [])

  const setHasMoreState = useCallback((hasMoreItems: boolean) => {
    setHasMore(hasMoreItems)
  }, [])

  const reset = useCallback(() => {
    setItems(initialItems)
    setLoading(false)
    setError(null)
    setHasMore(true)
  }, [initialItems])

  return {
    items,
    loading,
    error,
    hasMore,
    addItems,
    setItemsDirectly,
    clearItems,
    setLoadingState,
    setErrorState,
    setHasMoreState,
    reset,
  }
}
