'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MasonryLayoutProps {
  children: React.ReactNode[]
  className?: string
  gap?: number
  minColumnWidth?: number
}

export function MasonryLayout({ 
  children, 
  className,
  gap = 16,
  minColumnWidth = 250
}: MasonryLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      const newColumns = Math.max(1, Math.floor(containerWidth / minColumnWidth))
      const maxColumns = 6
      const finalColumns = Math.min(newColumns, maxColumns)
      
      setColumns(finalColumns)
      setIsLoading(false)
    }

    updateColumns()
    
    const resizeObserver = new ResizeObserver(updateColumns)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [minColumnWidth])

  const columnItems = Array.from({ length: columns }, (_, i) => 
    children.filter((_, index) => index % columns === i)
  )

  if (isLoading) {
    return (
      <div className={cn('masonry-loading', className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-sage/20 rounded-2xl aspect-square" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('masonry-container', className)}
      style={{
        '--columns': columns,
        '--gap': `${gap}px`,
      } as React.CSSProperties}
    >
      <div
        className="masonry-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {columnItems.map((items, columnIndex) => (
          <div key={columnIndex} className="masonry-column">
            <AnimatePresence>
              {items.map((child, itemIndex) => (
                <motion.div
                  key={`${columnIndex}-${itemIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: itemIndex * 0.1,
                    ease: 'easeOut'
                  }}
                  className="masonry-item"
                >
                  {child}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

interface MasonryItemProps {
  children: React.ReactNode
  className?: string
}

export function MasonryItem({ children, className }: MasonryItemProps) {
  return (
    <div className={cn('masonry-item-wrapper', className)}>
      {children}
    </div>
  )
}

// CSS-in-JS styles for masonry layout
export const masonryStyles = `
  .masonry-container {
    width: 100%;
  }

  .masonry-grid {
    display: grid;
    gap: var(--gap, 16px);
  }

  .masonry-column {
    display: flex;
    flex-direction: column;
    gap: var(--gap, 16px);
  }

  .masonry-item-wrapper {
    break-inside: avoid;
    margin-bottom: var(--gap, 16px);
  }

  .masonry-loading {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  @media (max-width: 640px) {
    .masonry-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: 641px) and (max-width: 768px) {
    .masonry-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .masonry-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 1025px) and (max-width: 1280px) {
    .masonry-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (min-width: 1281px) and (max-width: 1536px) {
    .masonry-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  @media (min-width: 1537px) {
    .masonry-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }
`
