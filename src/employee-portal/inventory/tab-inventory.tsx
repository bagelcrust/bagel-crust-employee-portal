/**
 * InventoryTab - Container for inventory management
 *
 * Manages the session state and renders either the dashboard
 * or active counting interface.
 */

import { useState } from 'react'
import { InventoryDashboard } from './InventoryDashboard'
import { ActiveCountView } from './ActiveCountView'
import { useInventorySession } from './useInventorySession'
import { supabase } from '@/shared/supabase-client'
import type { CountSessionWithDetails } from './types'

interface InventoryTabProps {
  employee: {
    id: string
    first_name: string
    last_name: string | null
    role: string | null
  }
}

export function InventoryTab({ employee }: InventoryTabProps) {
  const [isActive, setIsActive] = useState(false)

  const {
    session,
    items,
    counts,
    loading,
    saving,
    startSession,
    resumeSession,
    endSession,
    saveCount,
    updateItem
  } = useInventorySession()


  /**
   * Handle starting a new counting session
   */
  const handleStartSession = async (location: 'calder' | 'beaver') => {
    if (!employee?.id) {
      alert('Please log in again')
      return
    }

    await startSession(location, employee.id)
    setIsActive(true)
  }

  /**
   * Handle resuming an existing session
   */
  const handleResumeSession = async (sessionData: CountSessionWithDetails) => {
    try {
      // Load the session
      const { data, error } = await supabase
        .schema('inventory')
        .from('count_sessions')
        .select('*')
        .eq('id', sessionData.id)
        .single()

      if (error) {
        console.error('Error loading session:', error)
        return
      }

      // Use the hook's resume functionality
      await resumeSession(data)
      setIsActive(true)
    } catch (err) {
      console.error('Failed to resume session:', err)
    }
  }

  /**
   * Handle exiting the counting view
   */
  const handleExit = () => {
    endSession()
    setIsActive(false)
  }

  // Show loading state
  if (loading && isActive) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        <div className="animate-pulse">Loading items...</div>
      </div>
    )
  }

  // Render active counting view if session is active
  if (isActive && session) {
    return (
      <ActiveCountView
        session={session}
        items={items}
        counts={counts}
        saving={saving}
        onSaveCount={saveCount}
        onUpdateItem={updateItem}
        onExit={handleExit}
      />
    )
  }

  // Otherwise show the dashboard
  return (
    <div className="space-y-4">
      <InventoryDashboard
        onStartSession={handleStartSession}
        onResumeSession={handleResumeSession}
      />
    </div>
  )
}