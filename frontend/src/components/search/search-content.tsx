'use client'

import { useState, useCallback } from 'react'
import { SmartSearchBar } from '@/components/search/smart-search-bar'
import { AdvancedFilters } from '@/components/search/advanced-filters'
import { SearchHistory } from '@/components/search/search-history'
import { Masonry } from '@/components/ui/masonry'
import { PinCard } from '@/components/ui/pin-card'
import { SearchResults } from '@/components/ui/search-results'
import { SearchFilters as SearchFiltersType, SearchResult } from '@/types'
import { enhancedApiService } from '@/lib/enhanced-api-service'
import { useUser } from '@/contexts/user-context'
import { useFeedbackTracker } from '@/hooks/use-feedback-tracker'
import { useToast } from '@/hooks/use-toast'

export function SearchContent() {
  const { user, userContext } = useUser()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFiltersType>({
    minPrice: undefined,
    maxPrice: undefined,
    inStock: true,
    categories: [],
    brands: [],
  })

  const {
    handleSearch: trackSearch,
    handleClick,
    isTrackingEnabled,
  } = useFeedbackTracker({
    enableViewTracking: true,
    enableInteractionTracking: true,
  })

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setQuery(searchQuery)
    setLoading(true)
    setError(null)

    try {
              const response = await enhancedApiService.searchProducts(searchQuery, {
                userId: user?.id,
                filters,
              })

      setResults(response.results)

      // Track search activity
      if (isTrackingEnabled) {
        trackSearch(searchQuery, response.total)
        handleClick('search', 'search', 0)
      }
    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : 'Search failed')
      toast({
        title: 'Search Error',
        description: 'Failed to search products. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [user, filters, isTrackingEnabled, trackSearch, handleClick, toast])

  const handleLike = useCallback((productId: string) => {
    if (isTrackingEnabled) {
      handleClick(productId, 'search')
    }
  }, [isTrackingEnabled, handleClick])

  const handleSave = useCallback((productId: string) => {
    if (isTrackingEnabled) {
      handleClick(productId, 'search')
    }
  }, [isTrackingEnabled, handleClick])

  const handleShare = useCallback((productId: string) => {
    if (isTrackingEnabled) {
      handleClick(productId, 'search')
    }
  }, [isTrackingEnabled, handleClick])

  const handleView = useCallback((productId: string) => {
    if (isTrackingEnabled) {
      handleClick(productId, 'search')
    }
  }, [isTrackingEnabled, handleClick])

  return (
    <div className="container-custom py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-forest mb-2">
            Search Products
          </h1>
          <p className="text-dune text-lg">
            Find exactly what you're looking for
          </p>
          {user && (
            <p className="text-sm text-sage mt-2">
              ✨ Search results personalized for you
            </p>
          )}
        </div>

        <div className="mb-8">
          <SmartSearchBar onSearch={handleSearch} loading={loading} />
        </div>

        <div className="flex gap-8">
          <div className="w-80 flex-shrink-0 space-y-6">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => setFilters({})}
            />
            <SearchHistory
              onSearch={handleSearch}
              onClearHistory={() => setResults([])}
            />
          </div>

          <div className="flex-1">
            {query && (
              <SearchResults
                query={query}
                results={results}
                loading={loading}
                error={error}
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                onView={handleView}
              />
            )}

            {!query && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-forest mb-2">
                  Start your search
                </h3>
                <p className="text-dune">
                  Enter a search term to discover products
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
