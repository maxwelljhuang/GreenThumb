/**
 * API Types - Aligned with Backend Schemas
 * These types match the FastAPI/Pydantic models in the backend
 */

// Search API Types
export interface SearchRequest {
  query: string
  user_id?: number
  filters?: FilterParams
  offset?: number
  limit?: number
  use_ranking?: boolean
  enable_diversity?: boolean
}

export interface SearchResponse {
  results: ProductResult[]
  total: number
  offset: number
  limit: number
  page: number
  query: string
  user_id?: number
  search_time_ms: number
  total_time_ms: number
  personalized: boolean
  cached: boolean
  filters_applied: boolean
  ranking_applied: boolean
}

// Recommendation API Types
export interface RecommendRequest {
  user_id: number
  context: RecommendationContext
  offset?: number
  limit?: number
  filters?: FilterParams
  search_query?: string
  product_id?: number
  category_id?: number
  use_session_context?: boolean
  enable_diversity?: boolean
}

export interface RecommendResponse {
  results: ProductResult[]
  total: number
  offset: number
  limit: number
  page: number
  user_id: number
  context: string
  recommendation_time_ms: number
  total_time_ms: number
  personalized: boolean
  cached: boolean
  filters_applied: boolean
  diversity_applied: boolean
  has_long_term_profile: boolean
  has_session_context: boolean
  blend_weights: Record<string, number>
}

// Feedback API Types
export interface FeedbackRequest {
  user_id: number
  product_id: number
  interaction_type: InteractionType
  rating?: number
  context?: string
  query?: string
  position?: number
  session_id?: string
  update_session?: boolean
  update_embeddings?: boolean
}

export interface FeedbackResponse {
  success: boolean
  message: string
  interaction_id?: number
  user_id: number
  product_id: number
  interaction_type: string
  embeddings_updated: boolean
  session_updated: boolean
  cache_invalidated: boolean
  recorded_at: string
  processing_time_ms: number
}

// Common Types
export interface FilterParams {
  min_price?: number
  max_price?: number
  in_stock?: boolean
  merchant_ids?: number[]
  category_ids?: number[]
  brand_ids?: number[]
}

export interface ProductResult {
  product_id: number
  title: string
  description?: string
  price: number
  currency: string
  image_url?: string
  merchant_id?: number
  merchant_name?: string
  brand?: string
  brand_id?: number
  in_stock: boolean
  stock_quantity?: number
  category_id?: number
  category_name?: string
  product_url?: string
  rrp_price?: number
  colour?: string
  fashion_category?: string
  fashion_size?: string
  quality_score?: number
  rating?: number
  review_count?: number
  similarity: number
  rank: number
  final_score?: number
  popularity_score?: number
  price_affinity_score?: number
  brand_match_score?: number
}

export type RecommendationContext = 'feed' | 'search' | 'similar' | 'category'

export type InteractionType = 'view' | 'like' | 'save' | 'share' | 'click' | 'rating'

// Health Check Types
export interface HealthResponse {
  status: string
  timestamp: string
  version?: string
  uptime?: number
}

// Error Types
export interface ApiErrorResponse {
  message: string
  code?: string
  details?: Record<string, any>
  status_code: number
}

// Cache Types
export interface CacheStats {
  hits: number
  misses: number
  hit_rate: number
  total_requests: number
}

// User Embedding Types
export interface UserEmbeddings {
  long_term?: number[]
  session?: number[]
  last_updated: string
  ttl_seconds?: number
}

// Search Analytics Types
export interface SearchAnalytics {
  query: string
  user_id?: number
  results_count: number
  search_time_ms: number
  personalized: boolean
  cached: boolean
  timestamp: string
}
