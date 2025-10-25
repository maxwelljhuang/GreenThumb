import type { Meta, StoryObj } from '@storybook/react'
import { FeedOptimized } from './feed-optimized'
import { FeedMasonry } from './feed-masonry'
import { FeedSkeleton } from './feed-optimized'
import { Product } from '@/types'

const meta: Meta<typeof FeedOptimized> = {
  title: 'Feed/FeedComponents',
  component: FeedOptimized,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data generator
const generateMockProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `pin-${i + 1}`,
    title: `Product ${i + 1}`,
    description: `Description for product ${i + 1}`,
    imageUrl: `https://picsum.photos/400/${300 + (i % 3) * 100}?random=${i}`,
    width: 400,
    height: 300 + (i % 3) * 100,
    price: Math.floor(Math.random() * 200) + 20,
    currency: 'USD',
    brand: `Brand ${i % 5 + 1}`,
    category: ['Fashion', 'Home', 'Tech', 'Beauty'][i % 4],
    tags: ['trending', 'popular', 'new'][i % 3] ? ['trending', 'popular', 'new'][i % 3] : [],
    creator: {
      id: `user-${i % 10 + 1}`,
      name: `Creator ${i % 10 + 1}`,
      username: `creator${i % 10 + 1}`,
      avatarUrl: `https://i.pravatar.cc/150?u=${i % 10 + 1}`,
      verified: i % 3 === 0,
    },
    stats: {
      likes: Math.floor(Math.random() * 1000),
      saves: Math.floor(Math.random() * 500),
      shares: Math.floor(Math.random() * 100),
      views: Math.floor(Math.random() * 5000),
    },
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

export const Default: Story = {
  args: {
    initialProducts: generateMockProducts(20),
    onLoadMore: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return generateMockProducts(10)
    },
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}

export const Loading: Story = {
  args: {
    initialProducts: [],
    onLoadMore: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return generateMockProducts(10)
    },
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}

export const Empty: Story = {
  args: {
    initialProducts: [],
    onLoadMore: async () => [],
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}

export const MasonryLayout: Story = {
  render: () => (
    <div className="p-8 bg-sand min-h-screen">
      <FeedMasonry
        products={generateMockProducts(12)}
        loading={false}
        hasMore={true}
        onLoadMore={() => console.log('Load more')}
        onLike={(id) => console.log('Liked:', id)}
        onSave={(id) => console.log('Saved:', id)}
        onShare={(id) => console.log('Shared:', id)}
        onView={(id) => console.log('Viewed:', id)}
      />
    </div>
  ),
}

export const Skeleton: Story = {
  render: () => (
    <div className="p-8 bg-sand min-h-screen">
      <FeedSkeleton count={12} />
    </div>
  ),
}
