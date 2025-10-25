'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFeedbackTracker } from '@/hooks/use-feedback-tracker'

interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'trending' | 'suggestion'
  category?: string
  count?: number
}

interface SmartSearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  loading?: boolean
  className?: string
}

export function SmartSearchBar({
  onSearch,
  placeholder = "Search for products...",
  loading = false,
  className,
}: SmartSearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [trendingSearches, setTrendingSearches] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { handleSearch: trackSearch } = useFeedbackTracker()

  // Load search history and trending searches
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    setSearchHistory(history.slice(0, 5)) // Last 5 searches
    
    // Mock trending searches - in real app, this would come from API
    setTrendingSearches([
      'vintage leather jacket',
      'sustainable fashion',
      'minimalist home decor',
      'organic skincare',
      'eco-friendly products'
    ])
  }, [])

  // Generate suggestions based on query
  const generateSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim()) {
      return [
        ...searchHistory.map((term, index) => ({
          id: `recent-${index}`,
          text: term,
          type: 'recent' as const,
        })),
        ...trendingSearches.slice(0, 3).map((term, index) => ({
          id: `trending-${index}`,
          text: term,
          type: 'trending' as const,
        })),
      ]
    }

    const filteredHistory = searchHistory
      .filter(term => term.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((term, index) => ({
        id: `recent-${index}`,
        text: term,
        type: 'recent' as const,
      }))

    const filteredTrending = trendingSearches
      .filter(term => term.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((term, index) => ({
        id: `trending-${index}`,
        text: term,
        type: 'trending' as const,
      }))

    // Mock AI suggestions
    const aiSuggestions: SearchSuggestion[] = [
      { id: 'ai-1', text: `${searchQuery} for women`, type: 'suggestion' },
      { id: 'ai-2', text: `${searchQuery} sustainable`, type: 'suggestion' },
      { id: 'ai-3', text: `${searchQuery} vintage`, type: 'suggestion' },
    ]

    return [...filteredHistory, ...filteredTrending, ...aiSuggestions].slice(0, 8)
  }, [searchHistory, trendingSearches])

  // Update suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(query)
    setSuggestions(newSuggestions)
    setSelectedIndex(-1)
  }, [query, generateSuggestions])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length > 0 || searchHistory.length > 0)
  }, [searchHistory.length])

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Update search history
    const newHistory = [searchQuery, ...searchHistory.filter(term => term !== searchQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))

    // Track search
    trackSearch(searchQuery, 0)

    // Execute search
    onSearch(searchQuery)
    setQuery('')
    setIsOpen(false)
  }, [searchHistory, onSearch, trackSearch])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSearch(suggestions[selectedIndex].text)
        } else if (query.trim()) {
          handleSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, suggestions, selectedIndex, query, handleSearch])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text)
  }, [handleSearch])

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dune h-4 w-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 text-base"
          disabled={loading}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-sage/20 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-sage/10 transition-colors',
                    selectedIndex === index && 'bg-sage/20'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {suggestion.type === 'recent' && (
                    <Clock className="h-4 w-4 text-dune" />
                  )}
                  {suggestion.type === 'trending' && (
                    <TrendingUp className="h-4 w-4 text-pine" />
                  )}
                  {suggestion.type === 'suggestion' && (
                    <Sparkles className="h-4 w-4 text-sage" />
                  )}
                  <span className="flex-1 text-sm">{suggestion.text}</span>
                  {suggestion.type === 'trending' && (
                    <span className="text-xs text-dune bg-sage/20 px-2 py-1 rounded">
                      Trending
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
