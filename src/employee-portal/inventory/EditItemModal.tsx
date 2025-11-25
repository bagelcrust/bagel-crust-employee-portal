/**
 * EditItemModal - Edit item details (name, variety, valid units)
 *
 * Units are displayed as comma-separated string, parsed back to array on save
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { InventoryItem } from './types'

interface EditItemModalProps {
  item: InventoryItem
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>
}

export function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [baseName, setBaseName] = useState('')
  const [variety, setVariety] = useState('')
  const [unitsString, setUnitsString] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Sync form state when item changes or modal opens
  useEffect(() => {
    if (isOpen && item) {
      setBaseName(item.base_item || '')
      setVariety(item.variety || '')
      setUnitsString((item.valid_units || []).join(', '))
      setError('')
    }
  }, [isOpen, item])

  if (!isOpen) return null

  const handleSave = async () => {
    // Validate
    const trimmedName = baseName.trim()
    if (!trimmedName) {
      setError('Item name is required')
      return
    }

    // Parse units: split by comma, trim whitespace, filter empty
    const parsedUnits = unitsString
      .split(',')
      .map(u => u.trim().toLowerCase())
      .filter(u => u.length > 0)

    // Default to ['case', 'unit'] if empty
    const finalUnits = parsedUnits.length > 0 ? parsedUnits : ['case', 'unit']

    setSaving(true)
    setError('')

    try {
      const success = await onSave(item.id, {
        base_item: trimmedName,
        variety: variety.trim() || undefined,
        valid_units: finalUnits
      })

      if (success) {
        onClose()
      } else {
        setError('Failed to save changes')
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Item</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Base Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Milk"
            />
          </div>

          {/* Variety */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variety
            </label>
            <input
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Whole, 2%, Almond"
            />
          </div>

          {/* Valid Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Buttons
            </label>
            <input
              type="text"
              value={unitsString}
              onChange={(e) => setUnitsString(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="case, gallon, unit"
            />
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated list of units (e.g., "case, gallon, half gal")
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
