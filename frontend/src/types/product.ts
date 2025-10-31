/**
 * Product-related type definitions.
 * Based on backend/models/product.py ProductIngestion and ProductCanonical models.
 */

/**
 * Complete product result from search and recommendation endpoints.
 * Contains all product data fields from the backend.
 */
export interface ProductResult {
  // Core Product Information
  product_id: string;
  title: string;
  description?: string;
  price: number;
  currency: string; // Default: "USD"
  rrp_price?: number; // Recommended retail price (for showing discounts)
  image_url?: string;
  additional_image_urls?: string[];
  product_url?: string;

  // Merchant & Brand
  merchant_id?: number;
  merchant_name?: string;
  brand?: string;
  brand_id?: number;

  // Availability & Stock
  in_stock: boolean;
  stock_quantity?: number;
  stock_status?: string;

  // Category & Classification
  category_id?: number;
  category_name?: string;
  google_product_category?: string;

  // Fashion-Specific Attributes
  colour?: string;
  color?: string; // Alternative spelling
  fashion_category?: string;
  fashion_size?: string;
  size?: string;
  gender?: string;
  age_group?: string;
  material?: string;
  pattern?: string;

  // Product Dimensions (if applicable)
  length?: string;
  width?: string;
  height?: string;
  weight?: string;

  // Quality & Reviews
  quality_score?: number; // 0-1, data quality metric
  rating?: number; // Product rating (e.g., 4.5 out of 5)
  review_count?: number;
  reviews?: string;

  // Relevance Scores (from ML model)
  similarity: number; // 0-1, cosine similarity score (required)
  rank: number; // Position in results (0-indexed)
  final_score?: number; // Combined ranking score
  popularity_score?: number; // Popularity ranking component
  price_affinity_score?: number; // Price preference match
  brand_match_score?: number; // Brand preference match

  // Additional Attributes
  condition?: string; // e.g., "new", "used", "refurbished"
  gtin?: string; // Global Trade Item Number
  mpn?: string; // Manufacturer Part Number
  custom_label_0?: string;
  custom_label_1?: string;
  custom_label_2?: string;
  custom_label_3?: string;
  custom_label_4?: string;

  // Shipping
  shipping_cost?: number;
  shipping_country?: string;

  // Quality & Deduplication Metadata
  is_duplicate?: boolean;
  duplicate_group_id?: string;
  quality_issues?: string[];
  deduplication_hash?: string;

  // Timestamps
  ingested_at?: string; // ISO 8601 timestamp
  updated_at?: string; // ISO 8601 timestamp
}

/**
 * Filter parameters for search and recommendation requests.
 * Used to narrow down product results.
 */
export interface FilterParams {
  // Price range
  min_price?: number;
  max_price?: number;

  // Availability
  in_stock?: boolean;

  // Merchant filtering
  merchant_ids?: number[];

  // Category filtering
  category_ids?: number[];

  // Brand filtering
  brand_ids?: number[];

  // Fashion-specific filters
  colours?: string[];
  sizes?: string[];
  genders?: string[];

  // Rating filter
  min_rating?: number;
}

/**
 * Minimal product information for display in lists/grids.
 * Use this for performance when full ProductResult is not needed.
 */
export interface ProductCardData {
  product_id: string;
  title: string;
  price: number;
  rrp_price?: number;
  currency: string;
  image_url?: string;
  brand?: string;
  in_stock: boolean;
  rating?: number;
  review_count?: number;
}

/**
 * Product embedding metadata (for debugging/admin).
 */
export interface ProductEmbedding {
  product_id: string;
  image_embedding?: number[]; // 512-dim vector
  text_embedding?: number[]; // 512-dim vector
  embedding?: number[]; // 512-dim fused embedding
  embedding_model_version?: string;
  embedding_generated_at?: string;
}
