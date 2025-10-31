/**
 * User-related type definitions.
 * Based on backend/models/user.py and user modeling system.
 */

/**
 * User profile information.
 * This represents the authenticated user in the frontend.
 */
export interface User {
  id: number;
  email: string;
  created_at: string; // ISO 8601 timestamp
  onboarded: boolean; // Has completed onboarding quiz
  display_name?: string;
  avatar_url?: string;
}

/**
 * User preferences (learned from behavior, not explicit settings).
 * These are inferred by the ML model from interaction history.
 */
export interface UserPreferences {
  // Brand affinities (learned from interactions)
  favorite_brands?: string[];
  brand_scores?: Record<string, number>; // brand_name -> affinity score

  // Price preferences
  typical_price_range?: {
    min: number;
    max: number;
  };
  price_sensitivity?: number; // 0-1, how much price matters

  // Style preferences (represented as embedding vectors)
  style_embedding?: number[]; // 512-dim vector

  // Category preferences
  favorite_categories?: string[];
  category_scores?: Record<string, number>; // category -> interest score

  // Last updated
  updated_at?: string;
}

/**
 * User embedding data (for ML model).
 */
export interface UserEmbedding {
  user_id: number;
  long_term_embedding?: number[]; // 512-dim, slow-changing preferences
  session_embedding?: number[]; // 512-dim, current session intent
  embedding_version?: string;
  last_updated: string; // ISO 8601 timestamp
}

/**
 * Session context for tracking user activity.
 */
export interface SessionContext {
  session_id: string; // UUID
  user_id?: number;
  started_at: string; // ISO 8601 timestamp
  last_activity_at: string;
  page_views: number;
  interactions_count: number;
  current_page?: string;
}

/**
 * User authentication state.
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * User interaction history (for profile page).
 */
export interface UserInteraction {
  interaction_id: number;
  product_id: number;
  interaction_type: string;
  created_at: string;
  context?: string;
  product_title?: string;
  product_image_url?: string;
}

/**
 * User's saved/liked products.
 */
export interface SavedProduct {
  product_id: number;
  saved_at: string;
  note?: string;
}

/**
 * User onboarding state.
 */
export interface OnboardingState {
  completed: boolean;
  current_step?: number;
  total_steps?: number;
  selected_products?: number[];
}
