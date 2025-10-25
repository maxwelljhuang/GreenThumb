'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MoodboardCard } from '@/components/ui/moodboard-card'
import { Moodboard } from '@/types'
import { cn } from '@/lib/utils'

interface MoodboardGridProps {
  moodboards: Moodboard[]
  selectedIds: string[]
  onToggle: (moodboardId: string) => void
  disabled?: boolean
  className?: string
}

export function MoodboardGrid({
  moodboards,
  selectedIds,
  onToggle,
  disabled = false,
  className,
}: MoodboardGridProps) {
  return (
    <div className={cn('w-full', className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {moodboards.map((moodboard, index) => (
            <motion.div
              key={moodboard.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="moodboard-item"
            >
              <MoodboardCard
                moodboard={moodboard}
                selected={selectedIds.includes(moodboard.id)}
                onToggle={onToggle}
                disabled={disabled || (!selectedIds.includes(moodboard.id) && selectedIds.length >= 4)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

interface MoodboardSelectionProps {
  moodboards: Moodboard[]
  selectedIds: string[]
  onToggle: (moodboardId: string) => void
  validation: {
    isValid: boolean
    canSelectMore: boolean
    needsMore: boolean
    count: number
    min: number
    max: number
  }
  className?: string
}

export function MoodboardSelection({
  moodboards,
  selectedIds,
  onToggle,
  validation,
  className,
}: MoodboardSelectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Selection Status */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-forest mb-2">
          Choose Your Style
        </h2>
        <p className="text-dune mb-4">
          Select {validation.min}-{validation.max} moodboards that represent your style
        </p>
        
        <div className={cn(
          'inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium',
          validation.isValid
            ? 'bg-pine/10 text-pine'
            : validation.needsMore
            ? 'bg-orange-100 text-orange-600'
            : 'bg-red-100 text-red-600'
        )}>
          <span>{validation.count} selected</span>
          {validation.isValid && (
            <span className="text-xs">✓ Perfect!</span>
          )}
          {validation.needsMore && (
            <span className="text-xs">Need {validation.min - validation.count} more</span>
          )}
          {!validation.canSelectMore && !validation.isValid && (
            <span className="text-xs">Too many selected</span>
          )}
        </div>
      </div>

      {/* Moodboard Grid */}
      <MoodboardGrid
        moodboards={moodboards}
        selectedIds={selectedIds}
        onToggle={onToggle}
        disabled={!validation.canSelectMore && !selectedIds.includes('')}
      />

      {/* Selected Moodboards Preview */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-sage/10 rounded-xl p-4"
        >
          <h3 className="font-semibold text-forest mb-3">
            Your Style Selection:
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const moodboard = moodboards.find(m => m.id === id)
              return moodboard ? (
                <span
                  key={id}
                  className="inline-flex items-center space-x-1 bg-pine text-sand px-3 py-1 rounded-full text-sm"
                >
                  <span>{moodboard.name}</span>
                  <button
                    onClick={() => onToggle(id)}
                    className="ml-1 hover:bg-pine/80 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ) : null
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
