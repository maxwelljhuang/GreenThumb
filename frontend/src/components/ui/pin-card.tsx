'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { PinCardProps } from '@/types'
import { Heart, Bookmark, Share2, MoreHorizontal, Eye, ExternalLink, Copy } from 'lucide-react'
import { formatPrice, formatNumber } from '@/lib/utils'
import { ExplanationChip } from '@/components/ui/explanation-chip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function PinCard({ product, explanation, onLike, onSave, onShare, onView }: PinCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    onLike?.(product.id)
  }, [isLiked, onLike, product.id])

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSaved(!isSaved)
    onSave?.(product.id)
  }, [isSaved, onSave, product.id])

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.(product.id)
  }, [onShare, product.id])

  const handleView = useCallback(() => {
    onView?.(product.id)
  }, [onView, product.id])

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false)
  }, [])

  const handleCopyLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(window.location.origin + `/product/${product.id}`)
  }, [product.id])

  const handleOpenProduct = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`/product/${product.id}`, '_blank')
  }, [product.id])

  return (
    <motion.div
      className="pin-card group cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleView}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="relative overflow-hidden rounded-2xl">
        {/* Image with loading state */}
        <div className="relative">
          {isImageLoading && (
            <div className="absolute inset-0 bg-sage/20 animate-pulse rounded-2xl" />
          )}
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={product.width}
            height={product.height}
            className={`w-full h-auto rounded-2xl transition-opacity duration-300 ${
              isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onLoad={handleImageLoad}
            priority={false}
          />
        </div>

        {/* Hover overlay with actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-forest/20 rounded-2xl flex items-end justify-end p-4"
            >
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isLiked ? "default" : "secondary"}
                  onClick={handleLike}
                  className="bg-white/90 hover:bg-white text-forest shadow-lg"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant={isSaved ? "default" : "secondary"}
                  onClick={handleSave}
                  className="bg-white/90 hover:bg-white text-forest shadow-lg"
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShare}
                  className="bg-white/90 hover:bg-white text-forest shadow-lg"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white text-forest shadow-lg"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleOpenProduct}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Product
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View count overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: showActions ? 1 : 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm"
        >
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatNumber(product.stats.views)}
          </div>
        </motion.div>

        {/* Price overlay */}
        {product.price && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: showActions ? 1 : 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-4 bg-white/90 text-forest text-sm font-semibold px-3 py-1 rounded-full backdrop-blur-sm"
          >
            {formatPrice(product.price, product.currency)}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-forest text-sm mb-1 line-clamp-2 group-hover:text-pine transition-colors">
            {product.title}
          </h3>
          {product.description && (
            <p className="text-xs text-dune line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Creator info */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center overflow-hidden">
            <Image
              src={product.creator.avatarUrl}
              alt={product.creator.name}
              width={24}
              height={24}
              className="rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-dune truncate">{product.creator.name}</span>
            {product.creator.verified && (
              <div className="inline-flex items-center ml-1">
                <div className="w-3 h-3 bg-pine rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-sand rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-dune">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(product.stats.likes)}
          </div>
          <div className="flex items-center gap-1">
            <Bookmark className="h-3 w-3" />
            {formatNumber(product.stats.saves)}
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            {formatNumber(product.stats.shares)}
          </div>
        </div>

        {/* Explanation chip */}
        {explanation && (
          <div className="pt-2">
            <ExplanationChip explanation={explanation} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
