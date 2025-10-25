'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MOODBOARDS, ONBOARDING_CONFIG, validateMoodboardSelection } from '@/data/moodboards'
import { Moodboard, UserPreferences } from '@/types'
import { useUser } from '@/contexts/user-context'

interface OnboardingState {
  currentStep: number
  selectedMoodboards: string[]
  preferences: {
    priceRange: [number, number]
    categories: string[]
    brands: string[]
  }
  isCompleted: boolean
}

const INITIAL_STATE: OnboardingState = {
  currentStep: 0,
  selectedMoodboards: [],
  preferences: {
    priceRange: [0, 1000],
    categories: [],
    brands: [],
  },
  isCompleted: false,
}

const STORAGE_KEY = 'greenthumb_onboarding'

export function useOnboarding() {
  const { completeOnboarding } = useUser()
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedState = JSON.parse(saved)
        setState(parsedState)
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save onboarding progress:', error)
    }
  }, [state])

  // Auto-save when state changes
  useEffect(() => {
    if (!isLoading) {
      saveProgress()
    }
  }, [state, isLoading, saveProgress])

  // Navigation functions
  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, ONBOARDING_CONFIG.totalSteps - 1),
    }))
  }, [])

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }))
  }, [])

  // Moodboard selection
  const toggleMoodboard = useCallback((moodboardId: string) => {
    setState(prev => {
      const isSelected = prev.selectedMoodboards.includes(moodboardId)
      let newSelection: string[]

      if (isSelected) {
        newSelection = prev.selectedMoodboards.filter(id => id !== moodboardId)
      } else {
        const validation = validateMoodboardSelection(prev.selectedMoodboards)
        if (!validation.canSelectMore) {
          return prev // Don't add if at max
        }
        newSelection = [...prev.selectedMoodboards, moodboardId]
      }

      return { ...prev, selectedMoodboards: newSelection }
    })
  }, [])

  // Preferences
  const updatePreferences = useCallback((updates: Partial<OnboardingState['preferences']>) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }))
  }, [])

  // Completion
  const completeOnboardingFlow = useCallback(async () => {
    try {
      // Create user preferences
      const userPreferences: UserPreferences = {
        selectedMoodboards: state.selectedMoodboards,
        onboardingCompleted: true,
        priceRange: {
          min: state.preferences.priceRange[0],
          max: state.preferences.priceRange[1],
        },
        preferredCategories: state.preferences.categories,
        preferredBrands: state.preferences.brands,
      }

      // Complete onboarding with backend integration
      await completeOnboarding(state.selectedMoodboards)
      
      // Mark onboarding as completed
      setState(prev => ({ ...prev, isCompleted: true }))
      
      // Clear onboarding progress
      localStorage.removeItem(STORAGE_KEY)
      
      // Redirect to feed
      router.push('/feed')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }, [state, completeOnboarding, router])

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setState(INITIAL_STATE)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Validation
  const validation = validateMoodboardSelection(state.selectedMoodboards)
  const canProceed = validation.isValid
  const canGoBack = state.currentStep > 0
  const isLastStep = state.currentStep === ONBOARDING_CONFIG.totalSteps - 1

  return {
    // State
    currentStep: state.currentStep,
    selectedMoodboards: state.selectedMoodboards,
    preferences: state.preferences,
    isCompleted: state.isCompleted,
    isLoading,
    
    // Validation
    validation,
    canProceed,
    canGoBack,
    isLastStep,
    
    // Actions
    goToStep,
    nextStep,
    prevStep,
    toggleMoodboard,
    updatePreferences,
    completeOnboarding: completeOnboardingFlow,
    resetOnboarding,
    saveProgress,
  }
}
