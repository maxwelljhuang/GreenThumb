'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface VoiceSearchOptions {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

export function useVoiceSearch(options: VoiceSearchOptions = {}) {
  const {
    onResult,
    onError,
    onStart,
    onEnd,
    language = 'en-US',
    continuous = false,
    interimResults = true,
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      onStart?.()
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript)
        onResult?.(finalTranscript)
      }

      if (interimTranscript) {
        setInterimTranscript(interimTranscript)
      }
    }

    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error)
      setError(errorMessage)
      setIsListening(false)
      onError?.(errorMessage)
    }

    recognition.onend = () => {
      setIsListening(false)
      onEnd?.()
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isSupported, continuous, interimResults, language, onResult, onError, onStart, onEnd])

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return

    try {
      setTranscript('')
      setInterimTranscript('')
      setError(null)
      recognitionRef.current.start()
    } catch (error) {
      setError('Failed to start voice recognition')
      onError?.('Failed to start voice recognition')
    }
  }, [isListening, onError])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Auto-stop after timeout
  const startListeningWithTimeout = useCallback((timeoutMs: number = 10000) => {
    startListening()
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      stopListening()
    }, timeoutMs)
  }, [startListening, stopListening])

  // Get error message from speech recognition error
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'no-speech':
        return 'No speech was detected. Please try again.'
      case 'audio-capture':
        return 'No microphone was found. Please check your microphone.'
      case 'not-allowed':
        return 'Microphone access was denied. Please allow microphone access.'
      case 'network':
        return 'Network error occurred. Please check your connection.'
      case 'aborted':
        return 'Speech recognition was aborted.'
      case 'language-not-supported':
        return 'Language not supported.'
      default:
        return `Speech recognition error: ${error}`
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    startListeningWithTimeout,
  }
}

// Hook for voice search with search integration
export function useVoiceSearchWithSearch(onSearch: (query: string) => void) {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
  } = useVoiceSearch({
    onResult: (transcript) => {
      if (transcript.trim()) {
        onSearch(transcript.trim())
      }
    },
    onError: (error) => {
      console.error('Voice search error:', error)
    },
  })

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}

// Voice search button component hook
export function useVoiceSearchButton(onSearch: (query: string) => void) {
  const {
    isListening,
    isSupported,
    transcript,
    error,
    toggleListening,
  } = useVoiceSearchWithSearch(onSearch)

  const buttonProps = {
    onClick: toggleListening,
    disabled: !isSupported,
    'aria-label': isListening ? 'Stop listening' : 'Start voice search',
    title: isSupported 
      ? (isListening ? 'Stop voice search' : 'Start voice search')
      : 'Voice search not supported',
  }

  return {
    buttonProps,
    isListening,
    isSupported,
    transcript,
    error,
  }
}
