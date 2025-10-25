'use client'

import { Masonry } from '@/components/ui/masonry'
import { PinCard } from '@/components/ui/pin-card'
import { SearchResult } from '@/types'

interface SearchResultsProps {
  query: string
  results: SearchResult[]
  loading: boolean
  onLike: (productId: string) => void
  onSave: (productId: string) => void
  onShare: (productId: string) => void
  onView: (productId: string) => void
}

export function SearchResults({
  query,
  results,
  loading,
  onLike,
  onSave,
  onShare,
  onView,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="masonry">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="masonry-item">
            <div className="bg-sage/20 rounded-2xl p-4 animate-pulse">
              <div className="aspect-square bg-sage/30 rounded-xl mb-4" />
              <div className="h-4 bg-sage/30 rounded-md mb-2" />
              <div className="h-3 bg-sage/30 rounded-md w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-forest mb-2">
          No results found
        </h3>
        <p className="text-dune">
          Try adjusting your search terms or filters
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-forest mb-2">
          Searching for "{query}"
        </h2>
        <p className="text-dune">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <Masonry
        items={results}
        renderItem={(result) => (
          <PinCard
            key={result.product.id}
            product={result.product}
            explanation={result.explanation}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onView={onView}
          />
        )}
      />
    </div>
  )
}
