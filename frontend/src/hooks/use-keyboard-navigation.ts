'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

interface KeyboardNavigationOptions {
  enabled?: boolean
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  onSpace?: () => void
  onDelete?: () => void
  onBackspace?: () => void
  customKeys?: Record<string, () => void>
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    enabled = true,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    onSpace,
    onDelete,
    onBackspace,
    customKeys = {},
  } = options

  const [isKeyboardUser, setIsKeyboardUser] = useState(false)
  const lastKeyRef = useRef<string | null>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Track keyboard usage
    if (event.key === 'Tab') {
      setIsKeyboardUser(true)
    }

    // Store last key for key combinations
    lastKeyRef.current = event.key

    // Handle key combinations
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'k':
          event.preventDefault()
          // Focus search
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement
          if (searchInput) {
            searchInput.focus()
          }
          break
        case '/':
          event.preventDefault()
          // Toggle help
          console.log('Help toggled')
          break
      }
      return
    }

    // Handle individual keys
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        onEscape?.()
        break
      case 'Enter':
        event.preventDefault()
        onEnter?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        onArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        onArrowDown?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        onArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        onArrowRight?.()
        break
      case 'Tab':
        if (event.shiftKey) {
          event.preventDefault()
          onShiftTab?.()
        } else {
          onTab?.()
        }
        break
      case ' ':
        event.preventDefault()
        onSpace?.()
        break
      case 'Delete':
        event.preventDefault()
        onDelete?.()
        break
      case 'Backspace':
        event.preventDefault()
        onBackspace?.()
        break
      default:
        // Handle custom keys
        if (customKeys[event.key]) {
          event.preventDefault()
          customKeys[event.key]()
        }
        break
    }
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onShiftTab, onSpace, onDelete, onBackspace, customKeys])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  // Focus management
  const focusNext = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element)
    const nextElement = focusableElements[currentIndex + 1] as HTMLElement
    nextElement?.focus()
  }, [])

  const focusPrevious = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element)
    const previousElement = focusableElements[currentIndex - 1] as HTMLElement
    previousElement?.focus()
  }, [])

  const focusFirst = useCallback(() => {
    const firstElement = document.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    firstElement?.focus()
  }, [])

  const focusLast = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    lastElement?.focus()
  }, [])

  return {
    isKeyboardUser,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    lastKey: lastKeyRef.current,
  }
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const modifier = event.ctrlKey || event.metaKey ? 'ctrl+' : ''
      const shift = event.shiftKey ? 'shift+' : ''
      const alt = event.altKey ? 'alt+' : ''
      
      const shortcut = `${modifier}${shift}${alt}${key}`
      
      if (shortcuts[shortcut]) {
        event.preventDefault()
        shortcuts[shortcut]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Hook for focus trap
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isActive])

  return containerRef
}
