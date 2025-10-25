'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingSteps } from './onboarding-steps'
import { OnboardingComplete } from './onboarding-complete'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useOnboarding } from '@/hooks/use-onboarding'

export function OnboardingWrapper() {
  const {
    isLoading,
    isCompleted,
    selectedMoodboards,
    resetOnboarding,
  } = useOnboarding()

  const router = useRouter()

  // Check if user has already completed onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem('greenthumb_user_preferences')
    if (hasCompleted && !isCompleted) {
      // User has already completed onboarding, redirect to feed
      router.push('/feed')
    }
  }, [isCompleted, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-dune">Loading your style preferences...</p>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <OnboardingComplete
        selectedMoodboards={selectedMoodboards}
        onRestart={resetOnboarding}
      />
    )
  }

  return (
    <ErrorBoundary>
      <OnboardingSteps />
    </ErrorBoundary>
  )
}

interface OnboardingGuardProps {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    const checkOnboardingStatus = () => {
      try {
        const preferences = localStorage.getItem('greenthumb_user_preferences')
        const onboardingData = localStorage.getItem('greenthumb_onboarding')
        
        if (preferences) {
          const parsed = JSON.parse(preferences)
          setHasCompletedOnboarding(parsed.onboardingCompleted === true)
        } else if (onboardingData) {
          setHasCompletedOnboarding(false) // In progress
        } else {
          setHasCompletedOnboarding(false) // Not started
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setHasCompletedOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [])

  if (hasCompletedOnboarding === null) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (hasCompletedOnboarding === false) {
    return <OnboardingWrapper />
  }

  return <>{children}</>
}
