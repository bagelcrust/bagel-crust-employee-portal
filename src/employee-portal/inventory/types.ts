/**
 * Type definitions for Inventory feature
 * Based on new inventory schema with counting support
 */

/**
 * Represents an inventory item from inventory.items table
 */
export interface InventoryItem {
  id: string
  base_item: string           // e.g., "Flour"
  variety?: string            // e.g., "All Purpose"
  category?: string           // e.g., "Dry Goods"
  location_calder?: boolean   // Available at Calder location
  location_beaver?: boolean   // Available at Beaver location
  notes?: string
  alternative_names?: string[]
  // New counting fields
  count_unit?: string         // e.g., "Gallon", "Bag"
  order_unit?: string         // e.g., "Case", "Box"
  conversion_ratio?: number   // e.g., 4 gallons per case
  par_level?: number         // Target quantity on hand
  valid_units?: string[]      // Available unit buttons, e.g., ["case", "gallon", "unit"]
}

/**
 * Represents a counting session from inventory.count_sessions table
 */
export interface CountSession {
  id: string
  employee_id: string
  location: 'calder' | 'beaver'
  started_at: string          // ISO timestamp
  completed_at?: string       // ISO timestamp when finalized
  status: 'draft' | 'submitted'
  notes?: string
}

/**
 * Represents an individual item count from inventory.stock_counts table
 */
export interface StockCount {
  id: string
  session_id: string
  item_id: string
  count_quantity: number      // The number they typed (on hand)
  quantity_needed?: number    // The number they need to order
  count_type: string          // On hand unit (e.g., "case", "gallon", "unit")
  order_unit?: string         // Order unit (e.g., "case", "gallon", "unit")
  created_at: string
  updated_at: string
}

/**
 * Order item for summary display
 */
export interface OrderItem {
  item_id: string
  base_item: string
  variety?: string
  quantity_needed: number
  order_unit?: string
}

/**
 * Combined view for display purposes
 */
export interface CountSessionWithDetails extends CountSession {
  employee_name?: string      // Joined from employees table
  item_count?: number         // Number of items counted
  total_items?: number        // Total items available to count
  order_items?: OrderItem[]   // Items with quantity_needed > 0
}

/**
 * Combined view for counting UI
 */
export interface ItemWithCount extends InventoryItem {
  current_count?: StockCount   // Current count in this session
}