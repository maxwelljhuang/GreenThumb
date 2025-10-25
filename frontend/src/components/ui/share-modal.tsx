'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Share2, Mail, MessageCircle, Twitter, Facebook, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
  description?: string
  imageUrl?: string
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  url,
  description,
  imageUrl,
}: ShareModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: 'Link copied!',
        description: 'The link has been copied to your clipboard.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      })
    }
  }, [url, toast])

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(`Check out: ${title}`)
    const body = encodeURIComponent(`${description}\n\n${url}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }, [title, description, url])

  const handleTwitterShare = useCallback(() => {
    const text = encodeURIComponent(`Check out: ${title}`)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }, [title, url])

  const handleFacebookShare = useCallback(() => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }, [url])

  const handleWhatsAppShare = useCallback(() => {
    const text = encodeURIComponent(`Check out: ${title} - ${url}`)
    const whatsappUrl = `https://wa.me/?text=${text}`
    window.open(whatsappUrl, '_blank')
  }, [title, url])

  const shareOptions = [
    {
      id: 'copy',
      label: 'Copy Link',
      icon: Copy,
      action: handleCopyLink,
      variant: 'outline' as const,
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      action: handleEmailShare,
      variant: 'outline' as const,
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      action: handleTwitterShare,
      variant: 'outline' as const,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      action: handleFacebookShare,
      variant: 'outline' as const,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      action: handleWhatsAppShare,
      variant: 'outline' as const,
    },
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-forest">Share</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 p-3 bg-sage/10 rounded-lg mb-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-forest text-sm line-clamp-2">{title}</h3>
                {description && (
                  <p className="text-xs text-dune line-clamp-1">{description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                value={url}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={copied ? 'bg-green-100 text-green-700' : ''}
              >
                {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.id}
                variant={option.variant}
                onClick={option.action}
                className="flex items-center gap-2 justify-start"
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </Button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-sage/20">
            <div className="flex items-center gap-2 text-sm text-dune">
              <Link className="h-4 w-4" />
              <span>Share this link with others</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
