export function SearchSkeleton() {
  return (
    <div className="container-custom py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-10 bg-sage/20 rounded-md w-80 mb-2 animate-pulse" />
          <div className="h-6 bg-sage/20 rounded-md w-64 animate-pulse" />
        </div>

        <div className="mb-8">
          <div className="h-12 bg-sage/20 rounded-md w-full animate-pulse" />
        </div>

        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <div className="bg-sage/20 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-sage/30 rounded-md mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-sage/30 rounded-md" />
                <div className="h-4 bg-sage/30 rounded-md w-3/4" />
                <div className="h-4 bg-sage/30 rounded-md w-1/2" />
              </div>
            </div>
          </div>

          <div className="flex-1">
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
          </div>
        </div>
      </div>
    </div>
  )
}
