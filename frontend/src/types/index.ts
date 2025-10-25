// User types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  preferences?: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  longTermEmbedding?: number[]
  sessionEmbedding?: number[]
  selectedMoodboards?: string[]
  onboardingCompleted: boolean
  priceRange?: {
    min: number
    max: number
  }
  preferredCategories?: string[]
  preferredBrands?: string[]
}

// User Context for API calls
export interface UserContext {
  id: string
  isAuthenticated: boolean
  sessionId?: string
  preferences: UserPreferences
  lastActivity: string
}

// Product types
export interface Product {
  id: string
  title: string
  description?: string
  imageUrl: string
  width: number
  height: number
  price?: number
  currency?: string
  brand?: string
  category?: string
  tags?: string[]
  creator: Creator
  stats: ProductStats
  embedding?: number[]
  createdAt: string
  updatedAt: string
}

export interface Creator {
  id: string
  name: string
  username: string
  avatarUrl: string
  verified?: boolean
}

export interface ProductStats {
  likes: number
  saves: number
  shares: number
  views: number
}

// Moodboard types
export interface Moodboard {
  id: string
  name: string
  description: string
  imageUrl: string
  tags: string[]
  embedding?: number[]
  category: string
}

// Search types
export interface SearchRequest {
  query: string
  filters?: SearchFilters
  offset?: number
  limit?: number
  userId?: string
}

export interface SearchFilters {
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  categories?: string[]
  brands?: string[]
  merchants?: string[]
}

export interface SearchResult {
  product: Product
  similarity: number
  rank: number
  explanation?: Explanation
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  offset: number
  limit: number
  query: string
  personalized: boolean
  searchTimeMs: number
  cached?: boolean
  filtersApplied?: boolean
  rankingApplied?: boolean
}

// Explanation types
export interface Explanation {
  type: 'because' | 'matched' | 'trending'
  becauseOfPinId?: string
  score?: number
  matchedTags?: MatchedTag[]
  reason?: string
}

export interface MatchedTag {
  tag: string
  contribution: number
}

// Recommendation types
export interface RecommendationRequest {
  userId?: string
  offset?: number
  limit?: number
  context?: RecommendationContext
  filters?: SearchFilters
  searchQuery?: string
  productId?: string
  categoryId?: string
}

export interface RecommendationResponse {
  results: SearchResult[]
  total: number
  offset: number
  limit: number
  personalized: boolean
  context: string
  searchTimeMs: number
  cached?: boolean
  filtersApplied?: boolean
  diversityApplied?: boolean
  hasLongTermProfile?: boolean
  hasSessionContext?: boolean
  blendWeights?: Record<string, number>
}

export type RecommendationContext = 'feed' | 'search' | 'similar' | 'category'

// Interaction types
export interface Interaction {
  userId: string
  productId: string
  type: InteractionType
  context?: string
  timestamp: string
  rating?: number
  position?: number
  sessionId?: string
}

export type InteractionType = 'view' | 'like' | 'save' | 'share' | 'click' | 'rating'

// Feedback API types
export interface FeedbackRequest {
  userId: string
  productId: string
  interactionType: InteractionType
  rating?: number
  context?: string
  query?: string
  position?: number
  sessionId?: string
}

export interface FeedbackResponse {
  success: boolean
  message: string
  interactionId?: string
  userId: string
  productId: string
  interactionType: string
  embeddingsUpdated: boolean
  sessionUpdated: boolean
  cacheInvalidated: boolean
  recordedAt: string
  processingTimeMs: number
}

// API types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}

// UI types
export interface PinCardProps {
  product: Product
  explanation?: Explanation
  onLike?: (productId: string) => void
  onSave?: (productId: string) => void
  onShare?: (productId: string) => void
  onView?: (productId: string) => void
}

export interface MasonryProps {
  items: Product[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  loading?: boolean
}

// Store types
export interface AppState {
  user: User | null
  preferences: UserPreferences | null
  onboardingCompleted: boolean
  searchHistory: string[]
  recentProducts: Product[]
}

export interface SearchState {
  query: string
  results: SearchResult[]
  loading: boolean
  error: string | null
  filters: SearchFilters
}

// Navigation types
export type NavigationItem = {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  current?: boolean
}

// Form types
export interface OnboardingForm {
  selectedMoodboards: string[]
  preferences: {
    priceRange: [number, number]
    categories: string[]
    brands: string[]
  }
}

// Error types
export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// Loading types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  setTheme: (theme: Theme) => void
}
