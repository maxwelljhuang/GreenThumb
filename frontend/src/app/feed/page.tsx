import { Suspense } from 'react'
import { FeedContent } from '@/components/feed/feed-content'
import { FeedSkeleton } from '@/components/feed/feed-skeleton'
import { OnboardingFlow } from '@/components/onboard/onboarding-flow'

export default function FeedPage() {
  return (
    <OnboardingFlow>
      <div className="min-h-screen bg-sand">
        <Suspense fallback={<FeedSkeleton />}>
          <FeedContent />
        </Suspense>
      </div>
    </OnboardingFlow>
  )
}
