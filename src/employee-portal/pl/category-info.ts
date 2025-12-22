/**
 * P&L Category Explanations
 *
 * Rationale for why things are categorized the way they are.
 * Sourced from Business Profile documentation.
 */

export interface CategoryInfo {
  name: string
  description: string
  examples?: string[]
  taxLine?: string
}

export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  // === REVENUE ===
  'Revenue': {
    name: 'Revenue',
    description: 'All money coming IN from customer sales. Includes in-store sales (Square), LionCash (Penn State students), RedCard (Penn State athletes), and DoorDash orders.',
    examples: ['Square deposits', 'LionCash deposits', 'RedCard deposits', 'DoorDash deposits'],
    taxLine: 'Schedule C Line 1: Gross Receipts'
  },
  'Lioncash': {
    name: 'LionCash',
    description: 'Penn State student payment system. Parents deposit money → Penn State holds funds → Students spend via LionCash card at approved vendors like Bagel Crust.',
    taxLine: 'Schedule C Line 1: Gross Receipts'
  },
  'Red Card': {
    name: 'RedCard',
    description: 'Penn State athlete payment system. University funds athlete accounts for food/necessities. Athletes swipe RedCard at approved vendors.',
    taxLine: 'Schedule C Line 1: Gross Receipts'
  },
  'DoorDash': {
    name: 'DoorDash',
    description: 'DEPOSITS = Customers ordered Bagel Crust via DoorDash app (income). CHARGES = We ordered food for employees (expense - employee meals).',
    taxLine: 'Schedule C Line 1 (deposits) or Line 31 Meals (charges)'
  },
  'Square': {
    name: 'Square',
    description: 'Our POS system. Deposits are customer sales at BC Calder or BC Beaver. Note: Charges starting with "SQ *" are purchases from OTHER Square merchants.',
    taxLine: 'Schedule C Line 1: Gross Receipts'
  },

  // === COST OF GOODS (COGS) ===
  'Cost of Goods': {
    name: 'Cost of Goods Sold (COGS)',
    description: 'Direct costs of products we sell. Ingredients that go INTO bagels, sandwiches, smoothies, etc. NOT operating supplies like cleaning products.',
    examples: ['Flour, eggs, milk', 'Deli meats, cheese', 'Coffee beans, drink supplies'],
    taxLine: 'Schedule C-1: Cost of Goods Sold'
  },
  'Food and Beverage': {
    name: 'Food and Beverage',
    description: 'All ingredients for products we sell. Includes wholesale (Sysco, Brenntag) AND retail (Sam\'s Club, Walmart). Sam\'s is often cheaper than Sysco delivery!',
    examples: ['Brenntag - bagel dough ingredients', 'Sysco - bulk supplies', 'Sam\'s Club - milk, eggs, bacon'],
    taxLine: 'Schedule C-1: COGS'
  },
  'Brenntag': {
    name: 'Brenntag (formerly JM Swank)',
    description: 'Specialty bagel dough ingredients - NOT pre-made dough, but ingredients to make dough from scratch. Dough conditioners, yeast, flavorings.',
    taxLine: 'Schedule C-1: COGS'
  },
  'Sysco': {
    name: 'Sysco',
    description: 'Major food distributor. Bulk restaurant supplies delivered on schedule.',
    taxLine: 'Schedule C-1: COGS'
  },
  'Meyer Dairy': {
    name: 'Meyer Dairy',
    description: 'Dairy products - cream cheese, milk, butter. Used in sandwiches, omelets, and sold as beverages.',
    taxLine: 'Schedule C-1: COGS'
  },
  "Sam's Club": {
    name: "Sam's Club",
    description: 'Bulk food, beverages, supplies. Often CHEAPER than Sysco delivery! Employee drives to pickup instead of paying delivery fees. Still COGS because items go into products we sell.',
    examples: ['Milk, eggs, cheese', 'Bacon, deli meat', 'Beverages for resale'],
    taxLine: 'Schedule C-1: COGS'
  },
  'Walmart': {
    name: 'Walmart',
    description: 'Groceries, supplies, emergency items. When we need something fast and can\'t wait for wholesale delivery.',
    taxLine: 'Schedule C-1: COGS (food) or Operating Supplies (other)'
  },

  // === EXPENSES ===
  'Expenses': {
    name: 'Operating Expenses',
    description: 'Costs to run the business that are NOT directly in products sold. Rent, utilities, repairs, advertising, etc.',
    taxLine: 'Various Schedule C lines (6, 10, 17, 25, 26, etc.)'
  },
  'Advertising': {
    name: 'Advertising & Marketing',
    description: 'Costs to attract customers. Includes paid ads (TikTok, Instagram, Facebook), website, food photography props, video production wardrobe.',
    examples: ['TikTok/Instagram ads', 'Marshalls props for food photos', 'Website hosting (Square Weebly)'],
    taxLine: 'Schedule C Line 6: Advertising'
  },
  'Bank Charges': {
    name: 'Bank Charges',
    description: 'Bank fees, merchant processing fees, payment processor charges. Includes Square fees, RedCard merchant fees, etc.',
    taxLine: 'Schedule C Line 9 or Line 37'
  },
  'Car and Truck': {
    name: 'Car and Truck Expenses',
    description: 'Company van expenses. Vans used 100% for business: daily bagel delivery (Calder → Beaver), supply runs, catering deliveries.',
    examples: ['Fuel (Shell, Sheetz)', 'Maintenance/repairs', 'Parking'],
    taxLine: 'Schedule C Line 10: Car and Truck'
  },
  'Insurance': {
    name: 'Insurance',
    description: 'Business insurance premiums. General liability, vehicle insurance, property insurance.',
    taxLine: 'Schedule C Line 17: Insurance'
  },
  'Rent': {
    name: 'Rent',
    description: 'Commercial lease payments for BC Calder and BC Beaver locations.',
    taxLine: 'Schedule C Line 25: Rent on Business Property'
  },
  'Repairs and Maintenance': {
    name: 'Repairs and Maintenance',
    description: 'Equipment repairs and facility maintenance. Ovens, toasters, refrigeration, coffee machines, building repairs.',
    examples: ['Oven motor repair', 'Toaster replacement', 'Plumbing fixes'],
    taxLine: 'Schedule C Line 26: Repairs and Maintenance'
  },
  'Utilities': {
    name: 'Utilities',
    description: 'Electric, gas, water, sewer, trash. BC Calder has higher costs (ovens running daily).',
    taxLine: 'Schedule C Line 32: Utilities'
  },
  'Wages': {
    name: 'Wages',
    description: 'Employee payroll. ~20 employees total across both locations. W-2 employees have taxes withheld.',
    taxLine: 'Schedule C Line 33: Wages'
  },
  'Contract Labor': {
    name: 'Contract Labor',
    description: '1099 contractors - occasional workers, independent contractors, project-based. Must issue 1099-NEC forms.',
    taxLine: 'Schedule C Line 27: Contract Labor'
  },
  'Meals': {
    name: 'Meals (Employee)',
    description: 'Employee meals during shifts. DoorDash orders for employees who can\'t leave during shifts. 100% deductible if on premises for convenience of employer.',
    taxLine: 'Schedule C Line 31: Meals (50% or 100%)'
  },
  'Taxes and Licenses': {
    name: 'Taxes and Licenses',
    description: 'Business licenses, permits, vehicle registration, local taxes (not income tax).',
    taxLine: 'Schedule C Line 23: Taxes and Licenses'
  },
  'Supplies': {
    name: 'Operating Supplies',
    description: 'Items used IN the business but not sold to customers. Cleaning supplies, office supplies, kitchen tools.',
    examples: ['Cleaning products', 'Paper towels', 'Kitchen utensils'],
    taxLine: 'Schedule C Line 28: Supplies'
  },
  'Travel': {
    name: 'Travel',
    description: 'Business travel for expansion research, location scouting, broker meetings. Flights, hotels, rental cars for trips to CA, FL, DE.',
    taxLine: 'Schedule C Line 31: Travel'
  },
  'Depreciation': {
    name: 'Depreciation',
    description: 'Large asset purchases spread over time. Vans, ovens, major equipment. Not expensed all at once.',
    examples: ['Company vans (309 Motors)', 'Commercial ovens', 'Major equipment'],
    taxLine: 'Schedule C Line 13a: Depreciation'
  }
}

/**
 * Find category info by name (case-insensitive, partial match)
 */
export function getCategoryInfo(categoryName: string): CategoryInfo | null {
  // Exact match first
  if (CATEGORY_INFO[categoryName]) {
    return CATEGORY_INFO[categoryName]
  }

  // Case-insensitive match
  const lowerName = categoryName.toLowerCase()
  for (const [key, info] of Object.entries(CATEGORY_INFO)) {
    if (key.toLowerCase() === lowerName) {
      return info
    }
  }

  // Partial match (category name contains key or vice versa)
  for (const [key, info] of Object.entries(CATEGORY_INFO)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return info
    }
  }

  return null
}
