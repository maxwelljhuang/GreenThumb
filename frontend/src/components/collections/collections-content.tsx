'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Grid, List, Share2, Heart, Users, Lock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { PinCard } from '@/components/ui/pin-card'
import { Masonry } from '@/components/ui/masonry'
import { useUser } from '@/contexts/user-context'
import { Product } from '@/types'

interface Collection {
  id: string
  name: string
  description: string
  isPublic: boolean
  productCount: number
  createdAt: string
  updatedAt: string
  coverImage?: string
  products: Product[]
  followers: number
  likes: number
}

export function CollectionsContent() {
  const { user } = useUser()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Mock collections data
  const collections: Collection[] = [
    {
      id: '1',
      name: 'Sustainable Fashion',
      description: 'Eco-friendly clothing and accessories',
      isPublic: true,
      productCount: 24,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      coverImage: 'https://picsum.photos/400/300?random=1',
      products: [], // Would be populated from API
      followers: 42,
      likes: 128,
    },
    {
      id: '2',
      name: 'Minimalist Home',
      description: 'Clean, simple home decor items',
      isPublic: false,
      productCount: 18,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      coverImage: 'https://picsum.photos/400/300?random=2',
      products: [],
      followers: 0,
      likes: 0,
    },
    {
      id: '3',
      name: 'Vintage Finds',
      description: 'Unique vintage and retro items',
      isPublic: true,
      productCount: 31,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-22',
      coverImage: 'https://picsum.photos/400/300?random=3',
      products: [],
      followers: 67,
      likes: 203,
    },
  ]

  const handleCreateCollection = useCallback(() => {
    setIsCreating(true)
    // TODO: Implement collection creation
  }, [])

  const handleShareCollection = useCallback((collectionId: string) => {
    // TODO: Implement collection sharing
    console.log('Sharing collection:', collectionId)
  }, [])

  const handleLikeCollection = useCallback((collectionId: string) => {
    // TODO: Implement collection liking
    console.log('Liking collection:', collectionId)
  }, [])

  const handleFollowCollection = useCallback((collectionId: string) => {
    // TODO: Implement collection following
    console.log('Following collection:', collectionId)
  }, [])

  if (!user) {
    return (
      <div className="container-custom py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-forest mb-2">
            Please log in to view your collections
          </h3>
          <p className="text-dune">
            You need to be logged in to access your collections and create new ones.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-forest mb-2">
              Your Collections
            </h1>
            <p className="text-dune text-lg">
              Organize and share your favorite products
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleCreateCollection} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Collection
            </Button>
          </div>
        </div>

        {/* Collections Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {collections.map((collection) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === 'grid' ? (
                <CollectionCard
                  collection={collection}
                  onShare={handleShareCollection}
                  onLike={handleLikeCollection}
                  onFollow={handleFollowCollection}
                />
              ) : (
                <CollectionListItem
                  collection={collection}
                  onShare={handleShareCollection}
                  onLike={handleLikeCollection}
                  onFollow={handleFollowCollection}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Create Collection Modal */}
        <AnimatePresence>
          {isCreating && (
            <CreateCollectionModal
              onClose={() => setIsCreating(false)}
              onCreate={(collectionData) => {
                console.log('Creating collection:', collectionData)
                setIsCreating(false)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Collection Card Component
function CollectionCard({
  collection,
  onShare,
  onLike,
  onFollow,
}: {
  collection: Collection
  onShare: (id: string) => void
  onLike: (id: string) => void
  onFollow: (id: string) => void
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={collection.coverImage}
          alt={collection.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onShare(collection.id)}
            className="bg-white/90 hover:bg-white"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onLike(collection.id)}
            className="bg-white/90 hover:bg-white"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <div className="absolute top-4 left-4">
          {collection.isPublic ? (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Public
            </div>
          ) : (
            <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Private
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-forest mb-2">{collection.name}</h3>
        <p className="text-sm text-dune mb-3 line-clamp-2">{collection.description}</p>
        
        <div className="flex items-center justify-between text-sm text-dune mb-3">
          <span>{collection.productCount} items</span>
          <span>{collection.followers} followers</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFollow(collection.id)}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Follow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLike(collection.id)}
            className="flex-1"
          >
            <Heart className="h-4 w-4 mr-1" />
            {collection.likes}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Collection List Item Component
function CollectionListItem({
  collection,
  onShare,
  onLike,
  onFollow,
}: {
  collection: Collection
  onShare: (id: string) => void
  onLike: (id: string) => void
  onFollow: (id: string) => void
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <img
          src={collection.coverImage}
          alt={collection.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-forest">{collection.name}</h3>
            {collection.isPublic ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <p className="text-sm text-dune mb-2">{collection.description}</p>
          <div className="flex items-center gap-4 text-sm text-dune">
            <span>{collection.productCount} items</span>
            <span>{collection.followers} followers</span>
            <span>{collection.likes} likes</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShare(collection.id)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLike(collection.id)}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFollow(collection.id)}
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Create Collection Modal Component
function CreateCollectionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
  }

  return (
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
        <h2 className="text-xl font-semibold text-forest mb-4">Create New Collection</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-sage/20 rounded-lg focus:ring-2 focus:ring-pine focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forest mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-sage/20 rounded-lg focus:ring-2 focus:ring-pine focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="h-4 w-4 text-pine focus:ring-pine border-sage/20 rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-forest">
              Make this collection public
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Collection
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
