'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingNavigationProps {
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
  canGoBack: boolean
  canGoNext: boolean
  isLastStep: boolean
  nextLabel?: string
  className?: string
}

export function OnboardingNavigation({
  onBack,
  onNext,
  onSkip,
  canGoBack,
  canGoNext,
  isLastStep,
  nextLabel,
  className,
}: OnboardingNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center justify-between pt-8 border-t border-dune/20',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {canGoBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        )}
        
        {onSkip && !isLastStep && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-dune hover:text-forest"
          >
            Skip for now
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {!isLastStep && (
          <div className="text-sm text-dune">
            Press <kbd className="px-2 py-1 bg-sage/20 rounded text-xs">Enter</kbd> to continue
          </div>
        )}
        
        <Button
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            'flex items-center space-x-2 px-6',
            isLastStep && 'bg-gradient-to-r from-pine to-forest hover:from-forest hover:to-pine'
          )}
        >
          <span>
            {nextLabel || (isLastStep ? 'Complete Setup' : 'Continue')}
          </span>
          {isLastStep ? (
            <Check className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.div>
  )
}

interface OnboardingActionsProps {
  onRestart: () => void
  onSaveProgress: () => void
  hasProgress: boolean
  className?: string
}

export function OnboardingActions({
  onRestart,
  onSaveProgress,
  hasProgress,
  className,
}: OnboardingActionsProps) {
  return (
    <div className={cn('flex items-center justify-center space-x-4', className)}>
      {hasProgress && (
        <Button
          variant="outline"
          onClick={onSaveProgress}
          className="text-dune hover:text-forest"
        >
          Save Progress
        </Button>
      )}
      
      <Button
        variant="ghost"
        onClick={onRestart}
        className="text-dune hover:text-forest"
      >
        Start Over
      </Button>
    </div>
  )
}
