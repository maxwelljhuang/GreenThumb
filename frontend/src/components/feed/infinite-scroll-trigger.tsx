'use client'

import { motion } from 'framer-motion'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfiniteScrollTriggerProps {
  loading: boolean
  hasMore: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function InfiniteScrollTrigger({
  loading,
  hasMore,
  error,
  onRetry,
  className,
}: InfiniteScrollTriggerProps) {
  if (!hasMore && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('text-center py-8', className)}
      >
        <div className="text-dune text-sm">
          <p>You've reached the end! Check back later for more recommendations.</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('text-center py-8', className)}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Failed to load more items</span>
          </div>
          <p className="text-dune text-sm max-w-md">
            {error}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex justify-center py-8', className)}
      >
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="sm" />
          <span className="text-dune text-sm">Loading more recommendations...</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('text-center py-8', className)}
    >
      <div className="text-dune text-sm">
        <p>Scroll down for more recommendations</p>
      </div>
    </motion.div>
  )
}

interface LoadMoreButtonProps {
  loading: boolean
  hasMore: boolean
  onClick: () => void
  className?: string
}

export function LoadMoreButton({
  loading,
  hasMore,
  onClick,
  className,
}: LoadMoreButtonProps) {
  if (!hasMore) return null

  return (
    <div className={cn('text-center py-8', className)}>
      <Button
        onClick={onClick}
        disabled={loading}
        className="px-8 py-3"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Loading...
          </>
        ) : (
          'Load More'
        )}
      </Button>
    </div>
  )
}

interface ScrollToTopProps {
  show: boolean
  onClick: () => void
  className?: string
}

export function ScrollToTop({ show, onClick, className }: ScrollToTopProps) {
  if (!show) return null

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={onClick}
      className={cn(
        'fixed bottom-8 right-8 z-50 bg-pine text-sand rounded-full p-3 shadow-lg hover:bg-forest transition-colors',
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </motion.button>
  )
}
