/**
 * InventoryDashboard - Session Manager for Stock Counting
 *
 * Two sections:
 * 1. Active Counts (status = 'draft') - resumable, deletable, submittable
 * 2. Recent History (status = 'submitted') - view only, lighter style
 *
 * Order summaries are collapsible (show 3, toggle for more)
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ArrowRight, Package, Plus, Trash2, MapPin, Send, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/shared/supabase-client'
import type { CountSessionWithDetails, OrderItem } from './types'

interface InventoryDashboardProps {
  onStartSession: (location: 'calder' | 'beaver') => void
  onResumeSession: (session: CountSessionWithDetails) => void
}

// Collapsible order summary component
function OrderSummary({ items }: { items: OrderItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const VISIBLE_COUNT = 3

  if (items.length === 0) return null

  const visibleItems = expanded ? items : items.slice(0, VISIBLE_COUNT)
  const hiddenCount = items.length - VISIBLE_COUNT

  return (
    <div className="border-t border-slate-100 px-4 py-3 bg-blue-50">
      <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
        Order Summary
      </div>
      <ul className="space-y-1">
        {visibleItems.map((item) => (
          <li key={item.item_id} className="text-sm text-gray-800">
            <span className="font-medium">{item.quantity_needed}</span>
            {' '}
            {item.order_unit || 'units'}
            {' of '}
            {item.base_item}
            {item.variety && ` (${item.variety})`}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {hiddenCount} more
            </>
          )}
        </button>
      )}
    </div>
  )
}

export function InventoryDashboard({ onStartSession, onResumeSession }: InventoryDashboardProps) {
  const [activeSessions, setActiveSessions] = useState<CountSessionWithDetails[]>([])
  const [completedSessions, setCompletedSessions] = useState<CountSessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  // Load all sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .schema('inventory')
        .from('count_sessions')
        .select(`
          *,
          stock_counts (
            id,
            item_id,
            quantity_needed,
            count_type,
            order_unit,
            items (
              base_item,
              variety,
              order_unit
            )
          )
        `)
        .order('started_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading sessions:', error)
        return
      }

      const sessions: CountSessionWithDetails[] = (data || []).map(session => {
        // Extract items with quantity_needed > 0
        const orderItems: OrderItem[] = (session.stock_counts || [])
          .filter((sc: any) => sc.quantity_needed && sc.quantity_needed > 0)
          .map((sc: any) => ({
            item_id: sc.item_id,
            base_item: sc.items?.base_item || 'Unknown',
            variety: sc.items?.variety,
            quantity_needed: sc.quantity_needed,
            order_unit: sc.order_unit || sc.items?.order_unit || sc.count_type
          }))

        return {
          ...session,
          employee_name: 'Current User',
          item_count: session.stock_counts?.length || 0,
          order_items: orderItems
        }
      })

      // Split into active vs completed
      setActiveSessions(sessions.filter(s => s.status === 'draft'))
      setCompletedSessions(sessions.filter(s => s.status === 'submitted').slice(0, 5))
    } catch (err) {
      console.error('Error in loadSessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()

    if (!confirm('Delete this draft session? All counted items will be lost.')) {
      return
    }

    setDeletingId(sessionId)

    try {
      // Delete stock counts first (foreign key constraint)
      await supabase
        .schema('inventory')
        .from('stock_counts')
        .delete()
        .eq('session_id', sessionId)

      // Delete the session
      const { error } = await supabase
        .schema('inventory')
        .from('count_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Error deleting session:', error)
        return
      }

      // Remove from local state
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (err) {
      console.error('Failed to delete session:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmitSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()

    if (!confirm('Submit this order? You can still edit it after submitting.')) {
      return
    }

    setSubmittingId(sessionId)

    try {
      const { error } = await supabase
        .schema('inventory')
        .from('count_sessions')
        .update({
          status: 'submitted',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error submitting session:', error)
        alert('Failed to submit order')
        return
      }

      // Move from active to completed
      const submitted = activeSessions.find(s => s.id === sessionId)
      if (submitted) {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
        setCompletedSessions(prev => [{ ...submitted, status: 'submitted' as const }, ...prev].slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to submit session:', err)
    } finally {
      setSubmittingId(null)
    }
  }

  const getLocationLabel = (location: string) => {
    return location === 'calder' ? 'Calder' : 'Beaver'
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, h:mm a')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        <div className="animate-pulse">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Stock Count</h1>
        </div>

        {/* New Session Button */}
        <button
          onClick={() => setShowLocationPicker(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New</span>
        </button>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Location</h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowLocationPicker(false)
                  onStartSession('calder')
                }}
                className="w-full p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Calder</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowLocationPicker(false)
                  onStartSession('beaver')
                }}
                className="w-full p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Beaver</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowLocationPicker(false)}
              className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Sessions Section */}
      {activeSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active sessions</p>
          <p className="text-sm mt-1">Tap "New" to start counting</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Active Counts
          </h2>

          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Session Header - clickable to resume */}
                <button
                  onClick={() => onResumeSession(session)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {getLocationLabel(session.location)} Count
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(session.started_at)}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* Order Summary - collapsible */}
                {session.order_items && session.order_items.length > 0 && (
                  <OrderSummary items={session.order_items} />
                )}

                {/* Action Buttons */}
                <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 flex items-center justify-between">
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    disabled={deletingId === session.id}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === session.id ? 'Deleting...' : 'Delete'}
                  </button>

                  {/* Submit Button - only show if there are items to order */}
                  {session.order_items && session.order_items.length > 0 && (
                    <button
                      onClick={(e) => handleSubmitSession(e, session.id)}
                      disabled={submittingId === session.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {submittingId === session.id ? 'Submitting...' : 'Submit Order'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sessions Section */}
      {completedSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Recent History
          </h2>

          <div className="space-y-2">
            {completedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden opacity-75"
              >
                {/* Session Header - lighter style, not clickable */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-700">
                        {getLocationLabel(session.location)} Count
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(session.completed_at || session.started_at)}
                    </span>
                  </div>
                </div>

                {/* Order Summary - collapsible, muted style */}
                {session.order_items && session.order_items.length > 0 && (
                  <div className="border-t border-slate-200 px-3 py-2 bg-slate-100">
                    <div className="text-xs text-gray-500">
                      {session.order_items.length} item{session.order_items.length !== 1 ? 's' : ''} ordered
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
