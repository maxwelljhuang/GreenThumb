import { FeedSkeletonCard } from '@/components/ui/skeleton-card'

export function FeedSkeleton() {
  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <div className="h-10 bg-sage/20 rounded-md w-80 mb-2 animate-pulse" />
        <div className="h-6 bg-sage/20 rounded-md w-64 animate-pulse" />
      </div>

      <div className="masonry">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="masonry-item">
            <FeedSkeletonCard />
          </div>
        ))}
      </div>
    </div>
  )
}
