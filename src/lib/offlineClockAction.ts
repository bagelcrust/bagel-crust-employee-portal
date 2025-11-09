/**
 * OFFLINE-AWARE CLOCK ACTION
 *
 * Wraps the normal clock in/out function with offline fallback.
 * - Tries API call first (normal behavior)
 * - If fails, stores to local queue
 * - Shows optimistic success to user
 * - Background sync handles retry
 *
 * This makes the clock terminal work ALWAYS, even offline.
 */

import { clockInOut, getLastClockEvent } from '../supabase/edgeFunctions';
import { addToQueue } from './offlineQueue';
import { syncOfflineQueue } from './syncManager';

export interface ClockActionResult {
  success: boolean;
  event: {
    id: string;
    employee_id: string;
    event_type: 'in' | 'out';
    event_timestamp: string;
  };
  isOffline: boolean; // True if saved to queue (not yet synced)
  message: string;
}

/**
 * Offline-aware clock in/out action
 *
 * @param employeeId - Employee UUID
 * @param employeeName - Employee display name (for queue entry)
 * @returns Clock action result
 */
export async function offlineClockAction(
  employeeId: string,
  employeeName: string
): Promise<ClockActionResult> {

  // STEP 1: Try normal API call
  try {
    console.log('[OfflineClockAction] Attempting online clock action...');
    const event = await clockInOut(employeeId);

    console.log('[OfflineClockAction] ✅ Online clock action successful', event);

    // Success! Trigger sync in case there are queued entries
    // (This ensures queue gets cleared when connection is good)
    syncOfflineQueue().catch(error => {
      console.warn('[OfflineClockAction] Background sync failed:', error);
    });

    return {
      success: true,
      event,
      isOffline: false,
      message: `Successfully ${event.event_type === 'in' ? 'clocked in' : 'clocked out'}`
    };

  } catch (error: any) {
    console.warn('[OfflineClockAction] Online clock action failed:', error);

    // STEP 2: Online call failed - check if we're offline or if there's a real error
    const isNetworkError =
      !navigator.onLine ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('NetworkError');

    if (!isNetworkError) {
      // Real error (not network) - throw it
      console.error('[OfflineClockAction] ❌ Non-network error, re-throwing:', error);
      throw error;
    }

    // STEP 3: Network error - fall back to offline queue
    console.log('[OfflineClockAction] 📵 Network error detected, using offline fallback...');

    // Determine expected action (in or out)
    // Default to 'in' if we can't determine
    let expectedAction: 'in' | 'out' = 'in';

    try {
      // Try to get last event to determine what action should be next
      const lastEvent = await getLastClockEvent(employeeId);
      if (lastEvent) {
        expectedAction = lastEvent.event_type === 'in' ? 'out' : 'in';
      }
    } catch {
      // If we can't get last event (offline), check localStorage
      const cachedAction = localStorage.getItem(`lastAction_${employeeId}`);
      if (cachedAction === 'in') {
        expectedAction = 'out';
      }
    }

    // STEP 4: Add to offline queue
    const timestamp = new Date().toISOString();

    try {
      const queueId = await addToQueue({
        employeeId,
        employeeName,
        expectedAction,
        timestamp,
        error: error?.message || String(error)
      });

      console.log('[OfflineClockAction] ✅ Added to offline queue:', queueId);

      // Cache the action in localStorage for next time
      localStorage.setItem(`lastAction_${employeeId}`, expectedAction);

      // Create optimistic event response (looks like real event)
      const optimisticEvent = {
        id: queueId, // Use queue ID as temporary event ID
        employee_id: employeeId,
        event_type: expectedAction,
        event_timestamp: timestamp
      };

      return {
        success: true,
        event: optimisticEvent,
        isOffline: true,
        message: `Saved offline - will sync when connection returns`
      };

    } catch (queueError) {
      // Queue failed too - this is bad
      console.error('[OfflineClockAction] ❌ Failed to add to offline queue:', queueError);
      throw new Error('Failed to save clock action offline. Please try again.');
    }
  }
}

/**
 * Check if there are pending offline entries for an employee
 */
export async function hasPendingClockActions(employeeId: string): Promise<boolean> {
  const { getQueuedEntries } = await import('./offlineQueue');
  const entries = await getQueuedEntries();
  return entries.some(entry => entry.employeeId === employeeId);
}
