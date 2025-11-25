/**
 * ActiveCountView - The main counting interface
 *
 * Groups items by category with search and category navigation
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import { InventoryItemRow } from './InventoryItemRow'
import type { CountSession, InventoryItem, StockCount } from './types'

interface ActiveCountViewProps {
  session: CountSession
  items: InventoryItem[]
  counts: Map<string, StockCount>
  saving: Map<string, boolean>
  onSaveCount: (itemId: string, value: number, unitType: string, saveType: 'count' | 'need', orderUnit?: string) => void
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>
  onExit: () => void
}

export function ActiveCountView({
  items,
  counts,
  saving,
  onSaveCount,
  onUpdateItem,
  onExit
}: ActiveCountViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.toLowerCase()
    return items.filter(item =>
      item.base_item.toLowerCase().includes(term) ||
      (item.variety && item.variety.toLowerCase().includes(term))
    )
  }, [items, searchTerm])

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>()

    items.forEach(item => {
      const category = item.category || 'Uncategorized'
      if (!groups.has(category)) {
        groups.set(category, [])
      }
      groups.get(category)!.push(item)
    })

    // Sort categories alphabetically
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchTerm('')
  }

  // Track which category is in view using IntersectionObserver
  // (Can't use window.scroll because parent container has overflow-y-auto)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry that's intersecting (visible in detection zone)
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const category = entry.target.getAttribute('data-category-section')
            if (category && category !== activeCategory) {
              setActiveCategory(category)

              // Auto-scroll pill into view horizontally
              const pill = document.querySelector(`[data-category="${category}"]`)
              pill?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
            }
          }
        }
      },
      {
        // Detection zone: top 20% of screen
        // -10% from top, -80% from bottom = 10-20% band at top
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0
      }
    )

    // Observe each category section
    categoryRefs.current.forEach((element, category) => {
      element.setAttribute('data-category-section', category)
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [activeCategory])

  return (
    <div className="space-y-3">
      {/* Combined Header: Back | Categories/Search | Search Icon | Cloud */}
      <div className="sticky top-0 bg-white border-b border-slate-200 -mx-4 px-2 pt-1 pb-2 z-10">
        <div className="flex items-center gap-2">
          {/* Back Arrow */}
          <button
            onClick={onExit}
            className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Middle: Either Categories or Search Input */}
          {searchOpen ? (
            /* Search Input - slides over categories */
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={closeSearch}
                className="p-1.5 text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* Category Pills - scrollable */
            <>
              <div className="flex-1 overflow-x-auto flex gap-2 scrollbar-hide">
                {itemsByCategory.map(([category]) => {
                  const isActive = activeCategory === category
                  return (
                    <button
                      key={category}
                      data-category={category}
                      onClick={() => {
                        const element = document.getElementById(`category-${category.replace(/\s+/g, '-')}`)
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className={`px-3 py-1.5 border-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700'
                      }`}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>

              {/* Search Icon Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Items List */}
      {searchTerm.trim() ? (
        /* Search Results - flat list */
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items found for "{searchTerm}"
            </div>
          ) : (
            filteredItems.map(item => (
              <InventoryItemRow
                key={item.id}
                item={item}
                stockCount={counts.get(item.id)}
                saving={saving.get(item.id) || false}
                onSaveCount={onSaveCount}
                onUpdateItem={onUpdateItem}
              />
            ))
          )}
        </div>
      ) : (
        /* Category Groups - when not searching */
        <div className="space-y-6">
          {itemsByCategory.map(([category, categoryItems]) => (
            <div
              key={category}
              id={`category-${category.replace(/\s+/g, '-')}`}
              ref={(el) => {
                if (el) categoryRefs.current.set(category, el)
              }}
            >
              {/* Items in Category - no header */}
              <div className="space-y-4">
                {categoryItems.map(item => (
                  <InventoryItemRow
                    key={item.id}
                    item={item}
                    stockCount={counts.get(item.id)}
                    saving={saving.get(item.id) || false}
                    onSaveCount={onSaveCount}
                    onUpdateItem={onUpdateItem}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom padding to ensure last items aren't cut off */}
      <div className="h-8" />
    </div>
  )
}
