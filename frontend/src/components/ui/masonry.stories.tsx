import type { Meta, StoryObj } from '@storybook/react'
import { Masonry } from './masonry'
import { PinCard } from './pin-card'
import { Product } from '@/types'

const meta: Meta<typeof Masonry> = {
  title: 'UI/Masonry',
  component: Masonry,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const mockProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: `product-${i + 1}`,
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

export const Default: Story = {
  args: {
    items: mockProducts,
    renderItem: (product) => (
      <PinCard
        product={product}
        onLike={(id) => console.log('Liked:', id)}
        onSave={(id) => console.log('Saved:', id)}
        onShare={(id) => console.log('Shared:', id)}
        onView={(id) => console.log('Viewed:', id)}
      />
    ),
  },
}

export const WithLoadMore: Story = {
  args: {
    items: mockProducts,
    hasMore: true,
    loading: false,
    onLoadMore: () => console.log('Load more triggered'),
    renderItem: (product) => (
      <PinCard
        product={product}
        onLike={(id) => console.log('Liked:', id)}
        onSave={(id) => console.log('Saved:', id)}
        onShare={(id) => console.log('Shared:', id)}
        onView={(id) => console.log('Viewed:', id)}
      />
    ),
  },
}

export const Loading: Story = {
  args: {
    items: mockProducts,
    hasMore: true,
    loading: true,
    onLoadMore: () => console.log('Load more triggered'),
    renderItem: (product) => (
      <PinCard
        product={product}
        onLike={(id) => console.log('Liked:', id)}
        onSave={(id) => console.log('Saved:', id)}
        onShare={(id) => console.log('Shared:', id)}
        onView={(id) => console.log('Viewed:', id)}
      />
    ),
  },
}

export const NoMoreItems: Story = {
  args: {
    items: mockProducts,
    hasMore: false,
    loading: false,
    renderItem: (product) => (
      <PinCard
        product={product}
        onLike={(id) => console.log('Liked:', id)}
        onSave={(id) => console.log('Saved:', id)}
        onShare={(id) => console.log('Shared:', id)}
        onView={(id) => console.log('Viewed:', id)}
      />
    ),
  },
}
