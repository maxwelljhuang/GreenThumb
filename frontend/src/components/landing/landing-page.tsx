'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Target, Zap, Search } from 'lucide-react'

export function LandingPage() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboardingStatus = () => {
      try {
        const preferences = localStorage.getItem('greenthumb_user_preferences')
        if (preferences) {
          const parsed = JSON.parse(preferences)
          setHasCompletedOnboarding(parsed.onboardingCompleted === true)
        } else {
          setHasCompletedOnboarding(false)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setHasCompletedOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [])

  const handleGetStarted = () => {
    router.push('/onboard')
  }

  const handleGoToFeed = () => {
    router.push('/feed')
  }

  // Show loading while checking onboarding status
  if (hasCompletedOnboarding === null) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pine" />
      </div>
    )
  }

  // If user has completed onboarding, redirect to feed
  if (hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-forest mb-4">Welcome back!</h1>
          <Button onClick={handleGoToFeed} size="lg">
            Go to Feed
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Show landing page for new users
  return (
    <div className="min-h-screen bg-sand">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container-custom py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pine to-forest rounded-2xl mb-6">
                <Sparkles className="h-10 w-10 text-sand" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-forest mb-6"
            >
              Discover Your
              <span className="block bg-gradient-to-r from-pine to-forest bg-clip-text text-transparent">
                Perfect Style
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-dune mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              AI-powered product discovery that learns your style preferences 
              and shows you products you'll actually love.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
              >
                Start Style Quiz
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <p className="text-sm text-dune">
                Takes less than 2 minutes
              </p>
            </motion.div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-sage/10 to-pine/5" />
          <div className="absolute top-20 left-10 w-32 h-32 bg-pine/10 rounded-full blur-xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-forest/10 rounded-full blur-xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-forest mb-4">
                How It Works
              </h2>
              <p className="text-xl text-dune max-w-2xl mx-auto">
                Our AI learns your style preferences to deliver personalized recommendations
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-sage/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-pine" />
                </div>
                <h3 className="text-xl font-semibold text-forest mb-3">
                  Tell Us Your Style
                </h3>
                <p className="text-dune">
                  Complete our quick style quiz to help us understand your preferences
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-sage/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-pine" />
                </div>
                <h3 className="text-xl font-semibold text-forest mb-3">
                  AI Learns Your Taste
                </h3>
                <p className="text-dune">
                  Our AI analyzes your preferences to understand your unique style
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-sage/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-pine" />
                </div>
                <h3 className="text-xl font-semibold text-forest mb-3">
                  Discover Products
                </h3>
                <p className="text-dune">
                  Get personalized product recommendations that match your style
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pine to-forest">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-sand mb-4">
              Ready to Find Your Style?
            </h2>
            <p className="text-xl text-sand/90 mb-8">
              Join thousands of users who've discovered their perfect style with GreenThumb
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-sand text-forest hover:bg-sand/90 px-8 py-4 text-lg font-semibold"
            >
              Start Your Style Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
