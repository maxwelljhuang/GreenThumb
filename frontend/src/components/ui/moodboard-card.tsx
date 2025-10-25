'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { Moodboard } from '@/types'

interface MoodboardCardProps {
  moodboard: Moodboard
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

export function MoodboardCard({ moodboard, selected, onToggle, disabled }: MoodboardCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
        selected
          ? 'ring-2 ring-pine shadow-lg transform scale-105'
          : 'hover:shadow-md hover:transform hover:scale-102'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square relative">
        <Image
          src={moodboard.imageUrl}
          alt={moodboard.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            selected
              ? 'bg-pine/20'
              : isHovered
              ? 'bg-forest/10'
              : 'bg-transparent'
          }`}
        />

        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-4 right-4 bg-pine text-sand rounded-full p-2 shadow-lg">
            <Check className="h-4 w-4" />
          </div>
        )}

        {/* Hover overlay */}
        {isHovered && !selected && (
          <div className="absolute inset-0 bg-forest/20 flex items-center justify-center">
            <div className="bg-white/90 text-forest rounded-full p-3 shadow-lg">
              <Check className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-white">
        <h3 className="font-semibold text-forest text-lg mb-1">
          {moodboard.name}
        </h3>
        <p className="text-dune text-sm mb-2">
          {moodboard.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {moodboard.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-sage/20 text-forest px-2 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
