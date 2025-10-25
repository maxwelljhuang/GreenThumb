'use client'

import { motion } from 'framer-motion'
import { OnboardingHero } from './onboarding-hero'
import { MoodboardSelection } from './moodboard-grid'
import { OnboardingProgress } from './onboarding-progress'
import { OnboardingNavigation } from './onboarding-navigation'
import { MOODBOARDS, ONBOARDING_CONFIG } from '@/data/moodboards'
import { useOnboarding } from '@/hooks/use-onboarding'
import { useState } from 'react'

export function OnboardingSteps() {
  const {
    currentStep,
    selectedMoodboards,
    preferences,
    validation,
    canProceed,
    canGoBack,
    isLastStep,
    nextStep,
    prevStep,
    toggleMoodboard,
    updatePreferences,
    completeOnboarding,
    resetOnboarding,
  } = useOnboarding()

  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNext = async () => {
    if (isLastStep) {
      await completeOnboarding()
    } else {
      setIsTransitioning(true)
      setTimeout(() => {
        nextStep()
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleBack = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      prevStep()
      setIsTransitioning(false)
    }, 300)
  }

  const handleStart = () => {
    nextStep()
  }

  const handleRestart = () => {
    resetOnboarding()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed) {
      handleNext()
    }
  }

  return (
    <div className="min-h-screen bg-sand" onKeyDown={handleKeyDown}>
      <div className="container-custom py-8">
        {/* Progress Indicator */}
        {currentStep > 0 && (
          <OnboardingProgress
            currentStep={currentStep + 1}
            totalSteps={ONBOARDING_CONFIG.totalSteps}
            selectedCount={selectedMoodboards.length}
            minSelection={ONBOARDING_CONFIG.minSelection}
            maxSelection={ONBOARDING_CONFIG.maxSelection}
            className="mb-8"
          />
        )}

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[60vh] flex items-center justify-center"
        >
          {currentStep === 0 && (
            <OnboardingHero onStart={handleStart} />
          )}

          {currentStep === 1 && (
            <MoodboardSelection
              moodboards={MOODBOARDS}
              selectedIds={selectedMoodboards}
              onToggle={toggleMoodboard}
              validation={validation}
              className="w-full max-w-6xl"
            />
          )}

          {currentStep === 2 && (
            <PreferencesStep
              preferences={preferences}
              onUpdate={updatePreferences}
              selectedMoodboards={selectedMoodboards}
            />
          )}
        </motion.div>

        {/* Navigation */}
        {currentStep > 0 && (
          <OnboardingNavigation
            onBack={handleBack}
            onNext={handleNext}
            canGoBack={canGoBack}
            canGoNext={canProceed}
            isLastStep={isLastStep}
            nextLabel={isLastStep ? 'Complete Setup' : 'Continue'}
            onSkip={currentStep === 1 ? handleNext : undefined}
          />
        )}

        {/* Restart Option */}
        {currentStep > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleRestart}
              className="text-sm text-dune hover:text-forest transition-colors"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface PreferencesStepProps {
  preferences: {
    priceRange: [number, number]
    categories: string[]
    brands: string[]
  }
  onUpdate: (updates: any) => void
  selectedMoodboards: string[]
}

function PreferencesStep({ preferences, onUpdate, selectedMoodboards }: PreferencesStepProps) {
  const selectedMoodboardData = MOODBOARDS.filter(m => selectedMoodboards.includes(m.id))
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      <h2 className="text-3xl font-bold text-forest mb-4">
        Almost There!
      </h2>
      <p className="text-dune mb-8">
        Let's refine your preferences to give you the best recommendations.
      </p>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-dune/20">
        <h3 className="text-xl font-semibold text-forest mb-6">
          Your Style Selection
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          {selectedMoodboardData.map((moodboard) => (
            <div key={moodboard.id} className="text-center">
              <div className="aspect-square bg-sage/20 rounded-xl mb-2" />
              <p className="font-medium text-forest">{moodboard.name}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-forest mb-2">
              Price Range
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-dune">$0</span>
              <input
                type="range"
                min="0"
                max="1000"
                value={preferences.priceRange[1]}
                onChange={(e) => onUpdate({
                  priceRange: [preferences.priceRange[0], parseInt(e.target.value)]
                })}
                className="flex-1"
              />
              <span className="text-dune">${preferences.priceRange[1]}</span>
            </div>
          </div>

          <div className="text-left">
            <p className="text-sm text-dune">
              We'll use your style preferences to find products that match your taste.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
