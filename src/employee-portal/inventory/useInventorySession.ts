/**
 * useInventorySession - Hook for managing inventory counting sessions
 *
 * Handles session creation, item fetching, and count saving with debounce
 */

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/shared/supabase-client'
import type { CountSession, InventoryItem, StockCount } from './types'

interface UseInventorySessionReturn {
  session: CountSession | null
  items: InventoryItem[]
  counts: Map<string, StockCount>
  loading: boolean
  saving: Map<string, boolean>
  startSession: (location: 'calder' | 'beaver', employeeId: string) => Promise<void>
  resumeSession: (sessionData: CountSession) => Promise<void>
  endSession: () => void
  saveCount: (itemId: string, quantity: number, unitType: string, saveType: 'count' | 'need', orderUnit?: string) => void
  fetchItems: (location: 'calder' | 'beaver') => Promise<void>
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>
}

export function useInventorySession(): UseInventorySessionReturn {
  const [session, setSession] = useState<CountSession | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [counts, setCounts] = useState<Map<string, StockCount>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<Map<string, boolean>>(new Map())

  // Debounce timers for each item
  const saveTimers = useRef<Map<string, number>>(new Map())

  /**
   * Start a new counting session
   */
  const startSession = async (location: 'calder' | 'beaver', employeeId: string) => {
    try {
      setLoading(true)

      // Create new session
      const { data: newSession, error } = await supabase
        .schema('inventory')
        .from('count_sessions')
        .insert({
          employee_id: employeeId,
          location,
          status: 'draft'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating session:', error)
        throw error
      }

      setSession(newSession)

      // Load items for this location
      await fetchItems(location)

      // Load any existing counts for this session
      await loadExistingCounts(newSession.id)
    } catch (error) {
      console.error('Start Session Error:', error)
      alert('Failed to start counting session')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Resume an existing session
   */
  const resumeSession = async (sessionData: CountSession) => {
    setSession(sessionData)
    await fetchItems(sessionData.location as 'calder' | 'beaver')
    await loadExistingCounts(sessionData.id)
  }

  /**
   * End/close the current session
   */
  const endSession = () => {
    // Clear all pending save timers
    saveTimers.current.forEach(timer => clearTimeout(timer))
    saveTimers.current.clear()

    setSession(null)
    setItems([])
    setCounts(new Map())
    setSaving(new Map())
  }

  /**
   * Fetch items for a specific location
   */
  const fetchItems = async (location: 'calder' | 'beaver') => {
    try {
      // Query items where location_[location] is true
      const locationColumn = `location_${location}`

      const { data, error } = await supabase
        .schema('inventory')
        .from('items')
        .select('*')
        .eq(locationColumn, true)
        .order('category', { ascending: true })
        .order('base_item', { ascending: true })

      if (error) {
        console.error('Error fetching items:', error)
        return
      }

      setItems(data || [])
    } catch (err) {
      console.error('Failed to fetch items:', err)
    }
  }

  /**
   * Load existing counts for a session
   */
  const loadExistingCounts = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .schema('inventory')
        .from('stock_counts')
        .select('*')
        .eq('session_id', sessionId)

      if (error) {
        console.error('Error loading counts:', error)
        return
      }

      // Convert to Map for easy lookup (one record per item)
      const countsMap = new Map<string, StockCount>()
      data?.forEach(count => {
        // Key format: itemId (simplified - one record per item)
        countsMap.set(count.item_id, count)
      })

      setCounts(countsMap)
    } catch (err) {
      console.error('Failed to load existing counts:', err)
    }
  }

  /**
   * Save a count with debouncing (500ms delay)
   * saveType: 'count' updates count_quantity + count_type, 'need' updates quantity_needed + order_unit
   */
  const saveCount = useCallback((itemId: string, value: number, unitType: string, saveType: 'count' | 'need', orderUnit?: string) => {
    if (!session) return

    // Simplified key: one record per item (not per unit type)
    const key = itemId

    // Update local state IMMEDIATELY (no lag in UI)
    setCounts(prev => {
      const newMap = new Map(prev)
      const existingCount = newMap.get(key)

      if (existingCount) {
        // Update existing count locally
        const updated = { ...existingCount }
        if (saveType === 'count') {
          updated.count_quantity = value
          updated.count_type = unitType
        } else {
          updated.quantity_needed = value
          updated.order_unit = orderUnit
        }
        newMap.set(key, updated)
      } else {
        // Create temporary local count
        const tempCount: StockCount = {
          id: `temp-${key}`,
          session_id: session.id,
          item_id: itemId,
          count_quantity: saveType === 'count' ? value : 0,
          count_type: unitType,
          quantity_needed: saveType === 'need' ? value : undefined,
          order_unit: saveType === 'need' ? orderUnit : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        newMap.set(key, tempCount)
      }

      return newMap
    })

    // Clear existing timer for this item
    const existingTimer = saveTimers.current.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Show saving indicator immediately
    setSaving(prev => new Map(prev).set(key, true))

    // Set new timer for debounced save
    const timer = setTimeout(async () => {
      try {
        // Check if we already have a count record for this item
        const existingCount = counts.get(key)

        if (existingCount && !existingCount.id.startsWith('temp-')) {
          // Update existing count
          const updateData: Record<string, number | string | undefined> = {
            updated_at: new Date().toISOString()
          }
          if (saveType === 'count') {
            updateData.count_quantity = value
            updateData.count_type = unitType
          } else {
            updateData.quantity_needed = value
            updateData.order_unit = orderUnit
          }

          const { data, error } = await supabase
            .schema('inventory')
            .from('stock_counts')
            .update(updateData)
            .eq('id', existingCount.id)
            .select()
            .single()

          if (error) {
            console.error('Error updating count:', error)
            return
          }

          // Update local state
          setCounts(prev => {
            const newMap = new Map(prev)
            newMap.set(key, data)
            return newMap
          })
        } else {
          // Insert new count
          const insertData: Record<string, string | number | undefined> = {
            session_id: session.id,
            item_id: itemId,
            count_quantity: saveType === 'count' ? value : 0,
            count_type: unitType
          }
          if (saveType === 'need') {
            insertData.quantity_needed = value
            insertData.order_unit = orderUnit
          }

          const { data, error } = await supabase
            .schema('inventory')
            .from('stock_counts')
            .insert(insertData)
            .select()
            .single()

          if (error) {
            console.error('Error inserting count:', error)
            return
          }

          // Update local state
          setCounts(prev => {
            const newMap = new Map(prev)
            newMap.set(key, data)
            return newMap
          })
        }

        // Hide saving indicator after a brief moment
        setTimeout(() => {
          setSaving(prev => {
            const newMap = new Map(prev)
            newMap.delete(key)
            return newMap
          })
        }, 1000)

      } catch (err) {
        console.error('Failed to save count:', err)
        // Hide saving indicator on error
        setSaving(prev => {
          const newMap = new Map(prev)
          newMap.delete(key)
          return newMap
        })
      }
    }, 500) // 500ms debounce

    saveTimers.current.set(key, timer)
  }, [session, counts])

  /**
   * Update an item's details (name, variety, valid_units)
   * Returns true on success, false on error
   */
  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .schema('inventory')
        .from('items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating item:', error)
        return false
      }

      // Update local state so UI refreshes immediately
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...data } : item
      ))

      return true
    } catch (err) {
      console.error('Failed to update item:', err)
      return false
    }
  }, [])

  return {
    session,
    items,
    counts,
    loading,
    saving,
    startSession,
    resumeSession,
    endSession,
    saveCount,
    fetchItems,
    updateItem
  }
}