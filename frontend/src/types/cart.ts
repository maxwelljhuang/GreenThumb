/**
 * Shopping cart type definitions.
 */

import { ProductResult } from "./product";

/**
 * A single item in the shopping cart.
 */
export interface CartItem {
  product_id: number;
  product: ProductResult; // Full product details
  quantity: number;
  added_at: string; // ISO 8601 timestamp
  selected_size?: string;
  selected_color?: string;
  notes?: string;
}

/**
 * Complete shopping cart state.
 */
export interface Cart {
  items: CartItem[];
  total_items: number; // Sum of all quantities
  subtotal: number; // Sum of all item prices
  shipping_cost?: number;
  tax?: number;
  total: number; // Subtotal + shipping + tax
  currency: string; // Default: "USD"
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Actions for cart management.
 */
export interface CartActions {
  addItem: (product: ProductResult, quantity?: number) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

/**
 * Cart item update request.
 */
export interface UpdateCartItemRequest {
  product_id: number;
  quantity?: number;
  selected_size?: string;
  selected_color?: string;
}
