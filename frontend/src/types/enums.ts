/**
 * Type definitions for enums used throughout the Knytt application.
 * These match the backend API enums exactly.
 */

/**
 * Types of user interactions with products.
 * Used in the feedback endpoint to track user behavior.
 *
 * Interaction weights (for ML model):
 * - view: 0.1 (lowest signal)
 * - click: 0.3
 * - share: 0.4
 * - like: 0.5
 * - add_to_cart: 0.6
 * - rating: 0.7
 * - purchase: 1.0 (strongest signal)
 */
export enum InteractionType {
  VIEW = "view",
  CLICK = "click",
  ADD_TO_CART = "add_to_cart",
  PURCHASE = "purchase",
  LIKE = "like",
  SHARE = "share",
  RATING = "rating",
}

/**
 * Contexts for recommendation requests.
 * Each context uses different blending strategies for personalization.
 *
 * Blending strategies:
 * - feed: 60% long-term profile + 40% session
 * - search: 70% query + 30% long-term profile
 * - similar: 80% product + 20% long-term profile
 * - category: 100% long-term profile + category filter
 */
export enum RecommendationContext {
  FEED = "feed",
  SEARCH = "search",
  SIMILAR = "similar",
  CATEGORY = "category",
}

/**
 * API health status levels
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}
