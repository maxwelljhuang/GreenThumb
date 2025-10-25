import { Suspense } from 'react'
import { SearchContent } from '@/components/search/search-content'
import { SearchSkeleton } from '@/components/search/search-skeleton'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-sand">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchContent />
      </Suspense>
    </div>
  )
}
