import type { Meta, StoryObj } from '@storybook/react'
import { PinCard } from './pin-card'
import { Product, Explanation } from '@/types'

const meta: Meta<typeof PinCard> = {
  title: 'UI/PinCard',
  component: PinCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const mockProduct: Product = {
  id: '1',
  title: 'Vintage Leather Jacket',
  description: 'Classic brown leather jacket with vintage styling',
  imageUrl: 'https://picsum.photos/400/500?random=1',
  width: 400,
  height: 500,
  price: 199.99,
  currency: 'USD',
  brand: 'Vintage Co',
  category: 'Fashion',
  tags: ['vintage', 'leather', 'jacket'],
  creator: {
    id: 'user-1',
    name: 'John Doe',
    username: 'johndoe',
    avatarUrl: 'https://i.pravatar.cc/150?u=1',
    verified: true,
  },
  stats: {
    likes: 1247,
    saves: 89,
    shares: 23,
    views: 5432,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockExplanation: Explanation = {
  type: 'because',
  becauseOfPinId: 'pin-123',
  score: 0.85,
}

export const Default: Story = {
  args: {
    product: mockProduct,
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}

export const WithExplanation: Story = {
  args: {
    product: mockProduct,
    explanation: mockExplanation,
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}

export const MatchedTags: Story = {
  args: {
    product: mockProduct,
    explanation: {
      type: 'matched',
      matchedTags: [
        { tag: 'vintage', contribution: 0.82 },
        { tag: 'leather', contribution: 0.76 },
        { tag: 'jacket', contribution: 0.71 },
      ],
    },
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}

export const Trending: Story = {
  args: {
    product: mockProduct,
    explanation: {
      type: 'trending',
    },
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}

export const NoPrice: Story = {
  args: {
    product: {
      ...mockProduct,
      price: undefined,
    },
    onLike: (id) => console.log('Liked:', id),
    onSave: (id) => console.log('Saved:', id),
    onShare: (id) => console.log('Shared:', id),
    onView: (id) => console.log('Viewed:', id),
  },
}
