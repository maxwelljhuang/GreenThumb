import { Moodboard } from '@/types'

export const MOODBOARDS: Moodboard[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, simple, modern aesthetic',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
    tags: ['clean', 'modern', 'simple', 'monochrome'],
    category: 'lifestyle',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5), // Mock embedding
  },
  {
    id: 'cottagecore',
    name: 'Cottagecore',
    description: 'Rustic, cozy, natural vibes',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center',
    tags: ['rustic', 'cozy', 'natural', 'vintage'],
    category: 'lifestyle',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Gadgets, innovation, sleek design',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center',
    tags: ['gadgets', 'innovation', 'sleek', 'futuristic'],
    category: 'technology',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    description: 'Adventure, nature, hiking gear',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop&crop=center',
    tags: ['adventure', 'nature', 'hiking', 'outdoor'],
    category: 'lifestyle',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro, classic, timeless pieces',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
    tags: ['retro', 'classic', 'timeless', 'antique'],
    category: 'fashion',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    description: 'Eclectic, artistic, free-spirited',
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop&crop=center',
    tags: ['eclectic', 'artistic', 'free-spirited', 'colorful'],
    category: 'fashion',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Urban, raw, edgy aesthetic',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
    tags: ['urban', 'raw', 'edgy', 'metallic'],
    category: 'lifestyle',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Beach, nautical, light and airy',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center',
    tags: ['beach', 'nautical', 'light', 'airy'],
    category: 'lifestyle',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium, sophisticated, high-end',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
    tags: ['premium', 'sophisticated', 'high-end', 'elegant'],
    category: 'fashion',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'sustainable',
    name: 'Sustainable',
    description: 'Eco-friendly, conscious, green living',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center',
    tags: ['eco-friendly', 'conscious', 'green', 'sustainable'],
    category: 'lifestyle',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Creative, expressive, unique pieces',
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop&crop=center',
    tags: ['creative', 'expressive', 'unique', 'artistic'],
    category: 'fashion',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Health, mindfulness, self-care',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center',
    tags: ['health', 'mindfulness', 'self-care', 'wellness'],
    category: 'lifestyle',
    embedding: Array.from({ length: 384 }, () => Math.random() - 0.5),
  },
]

export const MOODBOARD_CATEGORIES = [
  'lifestyle',
  'fashion',
  'technology',
] as const

export const ONBOARDING_CONFIG = {
  minSelection: 2,
  maxSelection: 4,
  totalSteps: 3,
  steps: [
    'Choose Your Style',
    'Refine Preferences',
    'Complete Setup',
  ],
} as const

export function getMoodboardsByCategory(category: string) {
  return MOODBOARDS.filter(moodboard => moodboard.category === category)
}

export function getRandomMoodboards(count: number = 8) {
  const shuffled = [...MOODBOARDS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export function validateMoodboardSelection(selectedIds: string[]) {
  const { minSelection, maxSelection } = ONBOARDING_CONFIG
  return {
    isValid: selectedIds.length >= minSelection && selectedIds.length <= maxSelection,
    canSelectMore: selectedIds.length < maxSelection,
    needsMore: selectedIds.length < minSelection,
    count: selectedIds.length,
    min: minSelection,
    max: maxSelection,
  }
}
