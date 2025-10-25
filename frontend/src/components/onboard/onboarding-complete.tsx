'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react'
import { MOODBOARDS } from '@/data/moodboards'

interface OnboardingCompleteProps {
  selectedMoodboards: string[]
  onRestart: () => void
}

export function OnboardingComplete({ selectedMoodboards, onRestart }: OnboardingCompleteProps) {
  const router = useRouter()
  const selectedMoodboardData = MOODBOARDS.filter(m => selectedMoodboards.includes(m.id))

  const handleContinue = () => {
    router.push('/feed')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-sand flex items-center justify-center p-4"
    >
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-pine to-forest rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-sand" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="h-8 w-8 text-pine animate-bounce-gentle" />
            </motion.div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-forest mb-4">
            Welcome to GreenThumb!
          </h1>
          <p className="text-xl text-dune mb-8">
            Your personalized style profile is ready. Let's start discovering products you'll love.
          </p>
        </motion.div>

        {/* Style Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-dune/20 mb-8"
        >
          <h3 className="text-lg font-semibold text-forest mb-4">
            Your Style Profile
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {selectedMoodboardData.map((moodboard) => (
              <div key={moodboard.id} className="text-center">
                <div className="aspect-square bg-sage/20 rounded-xl mb-2" />
                <p className="font-medium text-forest text-sm">{moodboard.name}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-dune/20">
            <p className="text-sm text-dune">
              We'll use these preferences to show you products that match your style.
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onClick={handleContinue}
            size="lg"
            className="px-8 py-3 text-lg font-semibold"
          >
            Start Discovering
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            onClick={onRestart}
            className="px-6 py-3"
          >
            Change Preferences
          </Button>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="font-semibold text-forest mb-2">Personalized Feed</h4>
            <p className="text-sm text-dune">
              Products curated just for your style preferences
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔍</span>
            </div>
            <h4 className="font-semibold text-forest mb-2">Smart Search</h4>
            <p className="text-sm text-dune">
              Find products with natural language descriptions
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💡</span>
            </div>
            <h4 className="font-semibold text-forest mb-2">Style Insights</h4>
            <p className="text-sm text-dune">
              Learn why we recommend each product for you
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
