import { Suspense } from 'react'
import { CollectionsContent } from '@/components/collections/collections-content'
import { CollectionsSkeleton } from '@/components/collections/collections-skeleton'

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-sand">
      <Suspense fallback={<CollectionsSkeleton />}>
        <CollectionsContent />
      </Suspense>
    </div>
  )
}
