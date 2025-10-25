'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceSearchButton } from '@/hooks/use-voice-search'
import { cn } from '@/lib/utils'

interface VoiceSearchButtonProps {
  onSearch: (query: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showTranscript?: boolean
  autoStop?: boolean
  timeoutMs?: number
}

export function VoiceSearchButton({
  onSearch,
  className,
  size = 'md',
  variant = 'outline',
  showTranscript = true,
  autoStop = true,
  timeoutMs = 10000,
}: VoiceSearchButtonProps) {
  const {
    buttonProps,
    isListening,
    isSupported,
    transcript,
    error,
  } = useVoiceSearchButton(onSearch)

  const [showError, setShowError] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle error display
  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Handle animation
  useEffect(() => {
    if (isListening) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isListening])

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  if (!isSupported) {
    return (
      <Button
        variant={variant}
        size={size === 'md' ? 'default' : size}
        disabled
        className={cn(className)}
        title="Voice search not supported in this browser"
      >
        <Mic className={iconSizes[size]} />
      </Button>
    )
  }

  return (
    <div className="relative">
      <motion.div
        animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.6, repeat: isListening ? Infinity : 0 }}
      >
        <Button
          {...buttonProps}
          variant={variant}
          size={size === 'md' ? 'default' : size}
          className={cn(
            'relative overflow-hidden',
            isListening && 'bg-red-500 hover:bg-red-600 text-white',
            className
          )}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <MicOff className={iconSizes[size]} />
                {size !== 'sm' && <span>Stop</span>}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <Mic className={iconSizes[size]} />
                {size !== 'sm' && <span>Voice</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Listening indicator */}
          {isListening && (
            <motion.div
              className="absolute inset-0 bg-red-500/20 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </Button>
      </motion.div>

      {/* Transcript display */}
      <AnimatePresence>
        {showTranscript && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-sage/20 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-pine" />
              <span className="text-sm font-medium text-forest">Voice Search</span>
            </div>
            <p className="text-sm text-dune">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Voice search input component
export function VoiceSearchInput({
  onSearch,
  placeholder = "Search with your voice...",
  className,
}: {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}) {
  const {
    buttonProps,
    isListening,
    isSupported,
    transcript,
    error,
  } = useVoiceSearchButton(onSearch)

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        placeholder={placeholder}
        value={transcript}
        readOnly
        className="w-full px-4 py-2 pr-12 border border-sage/20 rounded-lg focus:ring-2 focus:ring-pine focus:border-transparent"
      />
      <VoiceSearchButton
        onSearch={onSearch}
        size="sm"
        variant="ghost"
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
      />
    </div>
  )
}
