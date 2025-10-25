'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2, Search, Star, StarOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SearchHistoryItem {
  id: string
  query: string
  timestamp: string
  resultCount: number
  isSaved: boolean
}

interface SearchHistoryProps {
  onSearch: (query: string) => void
  onClearHistory: () => void
  className?: string
}

export function SearchHistory({ onSearch, onClearHistory, className }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [savedSearches, setSavedSearches] = useState<SearchHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent')

  // Load search history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const historyData = JSON.parse(localStorage.getItem('searchHistory') || '[]')
        const savedData = JSON.parse(localStorage.getItem('savedSearches') || '[]')
        
        setHistory(historyData.map((item: any, index: number) => ({
          id: `history-${index}`,
          query: item.query,
          timestamp: item.timestamp,
          resultCount: item.resultCount || 0,
          isSaved: false,
        })))
        
        setSavedSearches(savedData.map((item: any, index: number) => ({
          id: `saved-${index}`,
          query: item.query,
          timestamp: item.timestamp,
          resultCount: item.resultCount || 0,
          isSaved: true,
        })))
      } catch (error) {
        console.error('Error loading search history:', error)
      }
    }

    loadHistory()
  }, [])

  const handleSearch = useCallback((query: string) => {
    onSearch(query)
  }, [onSearch])

  const handleSaveSearch = useCallback((item: SearchHistoryItem) => {
    const savedItem = { ...item, isSaved: true }
    const newSavedSearches = [savedItem, ...savedSearches.filter(s => s.query !== item.query)]
    setSavedSearches(newSavedSearches)
    localStorage.setItem('savedSearches', JSON.stringify(newSavedSearches))
  }, [savedSearches])

  const handleUnsaveSearch = useCallback((item: SearchHistoryItem) => {
    const newSavedSearches = savedSearches.filter(s => s.query !== item.query)
    setSavedSearches(newSavedSearches)
    localStorage.setItem('savedSearches', JSON.stringify(newSavedSearches))
  }, [savedSearches])

  const handleRemoveFromHistory = useCallback((item: SearchHistoryItem) => {
    const newHistory = history.filter(h => h.query !== item.query)
    setHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }, [history])

  const handleClearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('searchHistory')
    onClearHistory()
  }, [onClearHistory])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const currentItems = activeTab === 'recent' ? history : savedSearches

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('recent')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'recent'
                ? 'bg-pine text-sand'
                : 'text-dune hover:bg-sage/10'
            )}
          >
            <Clock className="h-4 w-4" />
            Recent
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'saved'
                ? 'bg-pine text-sand'
                : 'text-dune hover:bg-sage/10'
            )}
          >
            <Star className="h-4 w-4" />
            Saved
          </button>
        </div>
        
        {activeTab === 'recent' && history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="text-dune hover:text-forest"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Search Items */}
      <div className="space-y-2">
        <AnimatePresence>
          {currentItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="text-4xl mb-2">
                {activeTab === 'recent' ? '🔍' : '⭐'}
              </div>
              <p className="text-dune">
                {activeTab === 'recent' 
                  ? 'No recent searches yet' 
                  : 'No saved searches yet'
                }
              </p>
            </motion.div>
          ) : (
            currentItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <SearchHistoryItem
                  item={item}
                  onSearch={handleSearch}
                  onSave={handleSaveSearch}
                  onUnsave={handleUnsaveSearch}
                  onRemove={handleRemoveFromHistory}
                  showSaveButton={activeTab === 'recent'}
                  showRemoveButton={activeTab === 'recent'}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Individual Search History Item
function SearchHistoryItem({
  item,
  onSearch,
  onSave,
  onUnsave,
  onRemove,
  showSaveButton = false,
  showRemoveButton = false,
}: {
  item: SearchHistoryItem
  onSearch: (query: string) => void
  onSave: (item: SearchHistoryItem) => void
  onUnsave: (item: SearchHistoryItem) => void
  onRemove: (item: SearchHistoryItem) => void
  showSaveButton?: boolean
  showRemoveButton?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="p-3 hover:bg-sage/5 transition-colors cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSearch(item.query)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Search className="h-4 w-4 text-dune flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-forest truncate">{item.query}</p>
            <div className="flex items-center gap-2 text-xs text-dune">
              <span>{formatTimestamp(item.timestamp)}</span>
              {item.resultCount > 0 && (
                <>
                  <span>•</span>
                  <span>{item.resultCount} results</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showSaveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSave(item)
              }}
              className="h-8 w-8 p-0"
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
          
          {item.isSaved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onUnsave(item)
              }}
              className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-600"
            >
              <StarOff className="h-4 w-4" />
            </Button>
          )}
          
          {showRemoveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(item)
              }}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return date.toLocaleDateString()
}
