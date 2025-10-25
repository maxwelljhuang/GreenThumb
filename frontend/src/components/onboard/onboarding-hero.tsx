'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingHeroProps {
  onStart: () => void
}

export function OnboardingHero({ onStart }: OnboardingHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pine to-forest rounded-2xl mb-6">
          <Sparkles className="h-10 w-10 text-sand" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-4xl md:text-6xl font-bold text-forest mb-6"
      >
        Find Your
        <span className="block bg-gradient-to-r from-pine to-forest bg-clip-text text-transparent">
          Perfect Style
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-xl text-dune mb-8 max-w-2xl mx-auto leading-relaxed"
      >
        Discover products that match your unique taste. Select 2-4 style moodboards 
        that resonate with you, and we'll create a personalized feed just for you.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="px-8 py-3 text-lg font-semibold"
        >
          Start Style Quiz
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        <p className="text-sm text-dune">
          Takes less than 2 minutes
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎨</span>
          </div>
          <h3 className="font-semibold text-forest mb-2">Personalized</h3>
          <p className="text-sm text-dune">
            AI-powered recommendations based on your style preferences
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="font-semibold text-forest mb-2">Fast</h3>
          <p className="text-sm text-dune">
            Quick setup that gets you discovering products in minutes
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="font-semibold text-forest mb-2">Discover</h3>
          <p className="text-sm text-dune">
            Find products you'll love from brands you'll discover
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
