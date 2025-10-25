import { Suspense } from 'react'
import { ProfileContent } from '@/components/profile/profile-content'
import { ProfileSkeleton } from '@/components/profile/profile-skeleton'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-sand">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  )
}
