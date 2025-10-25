export function OnboardSkeleton() {
  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="h-10 bg-sage/20 rounded-md w-80 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-sage/20 rounded-md w-64 mx-auto mb-2 animate-pulse" />
          <div className="h-4 bg-sage/20 rounded-md w-48 mx-auto animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-sage/20 rounded-2xl p-6 animate-pulse">
              <div className="aspect-square bg-sage/30 rounded-xl mb-4" />
              <div className="h-6 bg-sage/30 rounded-md mb-2" />
              <div className="h-4 bg-sage/30 rounded-md w-3/4" />
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="h-4 bg-sage/20 rounded-md w-32 mx-auto mb-4 animate-pulse" />
          <div className="h-10 bg-sage/20 rounded-md w-48 mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  )
}
