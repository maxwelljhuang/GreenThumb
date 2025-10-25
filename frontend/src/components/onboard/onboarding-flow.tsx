'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingWrapper } from './onboarding-wrapper'

interface OnboardingFlowProps {
  children: React.ReactNode
}

export function OnboardingFlow({ children }: OnboardingFlowProps) {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkOnboardingStatus = () => {
      try {
        // Check if user has completed onboarding
        const preferences = localStorage.getItem('greenthumb_user_preferences')
        const onboardingData = localStorage.getItem('greenthumb_onboarding')
        
        if (preferences) {
          const parsed = JSON.parse(preferences)
          setShowOnboarding(!parsed.onboardingCompleted)
        } else if (onboardingData) {
          // User is in the middle of onboarding
          setShowOnboarding(true)
        } else {
          // New user, show onboarding
          setShowOnboarding(true)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setShowOnboarding(true) // Default to showing onboarding
      }
    }

    checkOnboardingStatus()
  }, [])

  // Show loading while checking
  if (showOnboarding === null) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pine mx-auto mb-4" />
          <p className="text-dune">Loading...</p>
        </div>
      </div>
    )
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <OnboardingWrapper />
  }

  // Show main app content
  return <>{children}</>
}

// Hook to check onboarding status
export function useOnboardingStatus() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null)

  useEffect(() => {
    const checkStatus = () => {
      try {
        const preferences = localStorage.getItem('greenthumb_user_preferences')
        if (preferences) {
          const parsed = JSON.parse(preferences)
          setIsOnboardingComplete(parsed.onboardingCompleted === true)
        } else {
          setIsOnboardingComplete(false)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setIsOnboardingComplete(false)
      }
    }

    checkStatus()
  }, [])

  return isOnboardingComplete
}
