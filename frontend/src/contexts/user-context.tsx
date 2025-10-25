'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, UserPreferences } from '@/types'
import type { UserContext } from '@/types'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { enhancedApiService } from '@/lib/enhanced-api-service'

interface UserContextType {
  user: User | null
  userContext: UserContext | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (userData: Partial<User>) => Promise<void>
  logout: () => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  updateUser: (userData: Partial<User>) => void
  completeOnboarding: (moodboardIds: string[]) => Promise<void>
  getSessionId: () => string
  trackActivity: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId] = useLocalStorage('sessionId', '')
  const [lastActivity, setLastActivity] = useState<string>('')

  // Generate session ID if not exists
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('sessionId', newSessionId)
    }
  }, [sessionId])

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const storedPreferences = localStorage.getItem('userPreferences')
        const storedActivity = localStorage.getItem('lastActivity')

        if (storedUser) {
          const userData = JSON.parse(storedUser)
          const preferences = storedPreferences ? JSON.parse(storedPreferences) : {
            onboardingCompleted: false,
            selectedMoodboards: [],
          }

          setUser({
            ...userData,
            preferences,
          })
        }

        if (storedActivity) {
          setLastActivity(storedActivity)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading user data:', error)
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Track user activity
  const trackActivity = useCallback(() => {
    const now = new Date().toISOString()
    setLastActivity(now)
    localStorage.setItem('lastActivity', now)
  }, [])

  // Get current session ID
  const getSessionId = useCallback(() => {
    return sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [sessionId])

  // Login function
  const login = useCallback(async (userData: Partial<User>) => {
    try {
      setIsLoading(true)
      
      const newUser: User = {
        id: userData.id || `user_${Date.now()}`,
        email: userData.email || '',
        name: userData.name,
        avatar: userData.avatar,
        preferences: userData.preferences || {
          onboardingCompleted: false,
          selectedMoodboards: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
      localStorage.setItem('userPreferences', JSON.stringify(newUser.preferences))
      trackActivity()

      setIsLoading(false)
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      throw error
    }
  }, [trackActivity])

  // Logout function
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('userPreferences')
    localStorage.removeItem('lastActivity')
    localStorage.removeItem('sessionId')
  }, [])

  // Update user preferences
  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    if (!user) return

    const updatedPreferences = { ...user.preferences, ...preferences }
    const updatedUser = { ...user, preferences: updatedPreferences, updatedAt: new Date().toISOString() }

    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences))
    trackActivity()
  }, [user, trackActivity])

  // Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...userData, updatedAt: new Date().toISOString() }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    trackActivity()
  }, [user, trackActivity])

  // Complete onboarding with backend integration
  const completeOnboarding = useCallback(async (moodboardIds: string[]) => {
    if (!user) return

    try {
      // Complete onboarding with backend integration
      const result = await enhancedApiService.completeUserOnboarding(
        user.id,
        moodboardIds,
        user.preferences || {}
      );

      if (result.success) {
        updatePreferences({
          onboardingCompleted: true,
          selectedMoodboards: moodboardIds,
          longTermEmbedding: result.embeddings?.long_term,
        });
      }
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      // Fallback to local update
      updatePreferences({
        onboardingCompleted: true,
        selectedMoodboards: moodboardIds,
        longTermEmbedding: Array.from({ length: 128 }, () => Math.random()), // Mock embedding
      });
    }
  }, [user, updatePreferences]);

  // Create user context object
  const userContext: UserContext | null = user ? {
    id: user.id,
    isAuthenticated: true,
    sessionId: getSessionId(),
    preferences: user.preferences || {
      onboardingCompleted: false,
      selectedMoodboards: [],
    },
    lastActivity,
  } : null

  const value: UserContextType = {
    user,
    userContext,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updatePreferences,
    updateUser,
    completeOnboarding,
    getSessionId,
    trackActivity,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Hook for user context specifically
export function useUserContext() {
  const { userContext } = useUser()
  return userContext
}

// Hook for authentication status
export function useAuth() {
  const { isAuthenticated, isLoading } = useUser()
  return { isAuthenticated, isLoading }
}
