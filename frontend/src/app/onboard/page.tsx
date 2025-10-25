import { Suspense } from 'react'
import { OnboardContent } from '@/components/onboard/onboard-content'
import { OnboardSkeleton } from '@/components/onboard/onboard-skeleton'

export default function OnboardPage() {
  return (
    <div className="min-h-screen bg-sand">
      <Suspense fallback={<OnboardSkeleton />}>
        <OnboardContent />
      </Suspense>
    </div>
  )
}
