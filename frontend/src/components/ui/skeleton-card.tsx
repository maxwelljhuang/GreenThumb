export function FeedSkeletonCard() {
  return (
    <div className="bg-sage/20 rounded-2xl p-4 animate-pulse">
      <div className="aspect-square bg-sage/30 rounded-xl mb-4" />
      <div className="h-4 bg-sage/30 rounded-md mb-2" />
      <div className="h-3 bg-sage/30 rounded-md w-3/4 mb-2" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-sage/30 rounded-full" />
        <div className="h-3 bg-sage/30 rounded-md w-20" />
      </div>
    </div>
  )
}
