'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Heart, Tag, TrendingUp } from 'lucide-react'
import { Explanation } from '@/types'

interface ExplanationChipProps {
  explanation: Explanation
  className?: string
}

export function ExplanationChip({ explanation, className }: ExplanationChipProps) {
  if (explanation.type === 'because' && explanation.becauseOfPinId) {
    return (
      <div className={cn(
        'inline-flex items-center space-x-1 bg-sage/20 text-forest px-3 py-1 rounded-full text-xs font-medium',
        className
      )}>
        <Heart className="h-3 w-3" />
        <span>Because you liked</span>
        {explanation.score && (
          <span className="text-pine font-semibold">
            ({Math.round(explanation.score * 100)}%)
          </span>
        )}
      </div>
    )
  }

  if (explanation.type === 'matched' && explanation.matchedTags) {
    const topTags = explanation.matchedTags.slice(0, 2)
    return (
      <div className={cn(
        'inline-flex items-center space-x-1 bg-pine/10 text-forest px-3 py-1 rounded-full text-xs font-medium',
        className
      )}>
        <Tag className="h-3 w-3" />
        <span>Matched:</span>
        <span className="text-pine font-semibold">
          {topTags.map(tag => tag.tag).join(', ')}
        </span>
      </div>
    )
  }

  if (explanation.type === 'trending') {
    return (
      <div className={cn(
        'inline-flex items-center space-x-1 bg-dune/20 text-forest px-3 py-1 rounded-full text-xs font-medium',
        className
      )}>
        <TrendingUp className="h-3 w-3" />
        <span>Trending now</span>
      </div>
    )
  }

  if (explanation.reason) {
    return (
      <div className={cn(
        'inline-flex items-center space-x-1 bg-sage/20 text-forest px-3 py-1 rounded-full text-xs font-medium',
        className
      )}>
        <span>{explanation.reason}</span>
      </div>
    )
  }

  return null
}

interface ExplanationTooltipProps {
  explanation: Explanation
  children: React.ReactNode
}

export function ExplanationTooltip({ explanation, children }: ExplanationTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-forest text-sand text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
          <ExplanationChip explanation={explanation} />
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-forest" />
        </div>
      )}
    </div>
  )
}
