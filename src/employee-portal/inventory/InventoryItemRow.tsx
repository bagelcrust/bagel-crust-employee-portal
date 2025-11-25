/**
 * InventoryItemRow - Compact side-by-side grid layout
 *
 * Row 1: Item name + description
 * Row 2: On Hand (left) | Order (right), each with stepper + unit buttons
 *
 * Units come from item.valid_units (falls back to ['case', 'unit'])
 * Selected units persist to database via count_type and order_unit
 */

import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { InventoryStepper } from './InventoryStepper'
import { EditItemModal } from './EditItemModal'
import type { InventoryItem, StockCount } from './types'

// Default units if item.valid_units is null/empty
const DEFAULT_UNITS = ['case', 'unit']

interface InventoryItemRowProps {
  item: InventoryItem
  stockCount?: StockCount
  saving: boolean
  onSaveCount: (itemId: string, value: number, unitType: string, saveType: 'count' | 'need', orderUnit?: string) => void
  onUpdateItem?: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>
}

export function InventoryItemRow({
  item,
  stockCount,
  saving,
  onSaveCount,
  onUpdateItem
}: InventoryItemRowProps) {
  // Get valid units from item or use defaults
  const validUnits = item.valid_units?.length ? item.valid_units : DEFAULT_UNITS

  // Initialize state from saved data or defaults
  const [onHandValue, setOnHandValue] = useState<number>(0)
  const [orderValue, setOrderValue] = useState<number>(0)
  const [onHandUnit, setOnHandUnit] = useState<string>(validUnits[0])
  const [orderUnit, setOrderUnit] = useState<string>(validUnits[0])
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Sync state from stockCount when it loads/changes
  useEffect(() => {
    if (stockCount) {
      setOnHandValue(stockCount.count_quantity || 0)
      setOrderValue(stockCount.quantity_needed || 0)
      // Restore saved units, falling back to first valid unit
      if (stockCount.count_type && validUnits.includes(stockCount.count_type)) {
        setOnHandUnit(stockCount.count_type)
      }
      if (stockCount.order_unit && validUnits.includes(stockCount.order_unit)) {
        setOrderUnit(stockCount.order_unit)
      }
    }
  }, [stockCount, validUnits])

  // Handle on hand value change
  const handleOnHandChange = (value: number) => {
    setOnHandValue(value)
    onSaveCount(item.id, value, onHandUnit, 'count')
  }

  // Handle order value change
  const handleOrderChange = (value: number) => {
    setOrderValue(value)
    onSaveCount(item.id, value, onHandUnit, 'need', orderUnit)
  }

  // Handle on hand unit change - also saves current value with new unit
  const handleOnHandUnitChange = (unit: string) => {
    setOnHandUnit(unit)
    if (onHandValue > 0) {
      onSaveCount(item.id, onHandValue, unit, 'count')
    }
  }

  // Handle order unit change - also saves current value with new unit
  const handleOrderUnitChange = (unit: string) => {
    setOrderUnit(unit)
    if (orderValue > 0) {
      onSaveCount(item.id, orderValue, onHandUnit, 'need', unit)
    }
  }

  const itemName = item.variety
    ? `${item.base_item} - ${item.variety}`
    : item.base_item

  // Item is "active" if any count has been entered
  const isActive = onHandValue > 0 || orderValue > 0

  return (
    <div className={`rounded-xl shadow-sm overflow-hidden ${
      isActive
        ? 'bg-orange-50 border-2 border-orange-400'
        : 'bg-white border border-slate-200'
    }`}>
      {/* Row 1: Item Name + Description + Edit Button */}
      <div className="p-3 relative">
        <div className="text-xl font-bold text-slate-900 pr-8">{itemName}</div>
        {item.category && (
          <div className="text-xs text-slate-500 mt-0.5">{item.category}</div>
        )}
        {/* Edit Button */}
        {onUpdateItem && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row 2: Controls Grid */}
      <div className="grid grid-cols-2">
        {/* Left: On Hand */}
        <div className="border-t border-slate-100 p-3 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            On Hand
          </span>
          <InventoryStepper
            value={onHandValue}
            onChange={handleOnHandChange}
            color="gray"
            saving={saving}
            saved={false}
          />

          {/* On Hand Unit Buttons */}
          <div className="flex gap-1 flex-wrap justify-center">
            {validUnits.map((unit) => (
              <button
                key={unit}
                onClick={() => handleOnHandUnitChange(unit)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  onHandUnit === unit
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Order */}
        <div className="border-t border-l border-slate-100 p-3 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Order
          </span>
          <InventoryStepper
            value={orderValue}
            onChange={handleOrderChange}
            color="gray"
            saving={saving}
            saved={false}
          />

          {/* Order Unit Buttons */}
          <div className="flex gap-1 flex-wrap justify-center">
            {validUnits.map((unit) => (
              <button
                key={unit}
                onClick={() => handleOrderUnitChange(unit)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  orderUnit === unit
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Item Modal */}
      {onUpdateItem && (
        <EditItemModal
          item={item}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={onUpdateItem}
        />
      )}
    </div>
  )
}
