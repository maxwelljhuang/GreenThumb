'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useLazyLoading } from '@/lib/performance'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onClick,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { ref, isVisible } = useLazyLoading(0.1)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (width: number, height: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, width, height)
    }
    return canvas.toDataURL()
  }

  // Optimize image URL for different screen sizes
  const getOptimizedSrc = (originalSrc: string, targetWidth?: number) => {
    if (originalSrc.startsWith('http')) {
      // Use a CDN or image optimization service
      const params = new URLSearchParams({
        w: targetWidth?.toString() || '400',
        q: quality.toString(),
        f: 'webp',
        auto: 'format',
      })
      return `${originalSrc}?${params.toString()}`
    }
    return originalSrc
  }

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
  }

  // Handle image error
  const handleError = () => {
    setHasError(true)
    setIsLoaded(false)
  }

  // Preload image if priority
  useEffect(() => {
    if (priority && src) {
      const img = new window.Image()
      img.src = getOptimizedSrc(src, width)
    }
  }, [priority, src, width])

  // Generate responsive sizes
  const responsiveSizes = sizes || `
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    (max-width: 1280px) 33vw,
    25vw
  `

  if (hasError) {
    return (
      <div
        className={cn(
          'bg-sage/20 flex items-center justify-center text-dune',
          className
        )}
        style={style}
      >
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🖼️</div>
          <div className="text-sm">Image failed to load</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref as any}
      className={cn('relative overflow-hidden', className)}
      style={style}
      onClick={onClick}
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-sage/20 animate-pulse">
          {blurDataURL && (
            <Image
              src={blurDataURL}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>
      )}

      {/* Main image */}
      {(isVisible || priority) && (
        <Image
          ref={imgRef}
          src={getOptimizedSrc(src, width)}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          quality={quality}
          priority={priority}
          sizes={responsiveSizes}
          onLoad={handleLoad}
          onError={handleError}
          placeholder={placeholder}
          blurDataURL={blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined)}
        />
      )}

      {/* Loading spinner */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pine"></div>
        </div>
      )}
    </div>
  )
}

// Lazy loaded image with intersection observer
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={false}
      {...props}
    />
  )
}

// Hero image with priority loading
export function HeroImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      priority={true}
      quality={90}
      placeholder="blur"
      {...props}
    />
  )
}

// Thumbnail image optimized for small sizes
export function ThumbnailImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      quality={60}
      sizes="(max-width: 640px) 100px, 150px"
      {...props}
    />
  )
}
