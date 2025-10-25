'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  selectedCount: number
  minSelection: number
  maxSelection: number
  className?: string
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  selectedCount,
  minSelection,
  maxSelection,
  className,
}: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100
  const isSelectionValid = selectedCount >= minSelection && selectedCount <= maxSelection

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-forest">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-dune">
            {Math.round(progress)}% complete
          </span>
        </div>
        
        <div className="w-full bg-sage/20 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-pine to-forest h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Selection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            isSelectionValid 
              ? 'bg-pine text-sand' 
              : 'bg-sage/20 text-dune'
          )}>
            {isSelectionValid ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="text-xs font-bold">{selectedCount}</span>
            )}
          </div>
          <span className={cn(
            'text-sm font-medium',
            isSelectionValid ? 'text-forest' : 'text-dune'
          )}>
            {selectedCount} of {maxSelection} selected
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs text-dune">
            {selectedCount < minSelection && (
              `Select at least ${minSelection} more`
            )}
            {selectedCount >= minSelection && selectedCount <= maxSelection && (
              'Perfect! Ready to continue'
            )}
            {selectedCount > maxSelection && (
              `Select ${selectedCount - maxSelection} fewer`
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center space-x-4', className)}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
            index < currentStep
              ? 'bg-pine text-sand'
              : index === currentStep
              ? 'bg-forest text-sand'
              : 'bg-sage/20 text-dune'
          )}>
            {index < currentStep ? (
              <Check className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          <span className={cn(
            'ml-2 text-sm font-medium hidden sm:block',
            index <= currentStep ? 'text-forest' : 'text-dune'
          )}>
            {step}
          </span>
          {index < steps.length - 1 && (
            <div className={cn(
              'w-8 h-0.5 mx-2',
              index < currentStep ? 'bg-pine' : 'bg-sage/20'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
