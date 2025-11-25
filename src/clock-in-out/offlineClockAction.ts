/**
 * OFFLINE-AWARE CLOCK ACTION
 *
 * Wraps the normal clock in/out function with offline fallback.
 * - Uses atomic clock_toggle RPC (prevents race conditions)
 * - 60-second debounce prevents rapid-fire double punches
 * - If fails, stores to local queue
 * - Shows optimistic success to user
 * - Background sync handles retry
 *
 * This makes the clock terminal work ALWAYS, even offline.
 */

import { supabase } from '../shared/supabase-client';
import { addToQueue } from './offlineQueue';
import { syncOfflineQueue } from './syncManager';
import { logData, assertShape, logError, logCondition } from '../shared/debug-utils';

// Debounce window in seconds (must match database function default)
const DEBOUNCE_SECONDS = 60;

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

  // STEP 1: Try atomic clock_toggle RPC (prevents race conditions)
  try {
    console.log('[OfflineClockAction] Attempting online clock action via RPC...', {
      employeeId,
      employeeName,
      timestamp: new Date().toISOString()
    });
    logData('OfflineClockAction', 'Attempting clock_toggle RPC', { employeeId, employeeName });

    // Call atomic clock_toggle function (handles debounce + toggle logic)
    const { data: result, error } = await supabase
      .schema('employees')
      .rpc('clock_toggle', {
        p_employee_id: employeeId,
        p_debounce_seconds: DEBOUNCE_SECONDS
      });

    console.log('[OfflineClockAction] RPC response:', { result, error });

    if (error) {
      console.error('[OfflineClockAction] RPC error:', error);
      logError('OfflineClockAction', 'RPC failed', error, { employeeId });
      throw new Error(`Failed: ${error.message}`);
    }

    // Check if debounce rejected the action
    if (!result.success) {
      console.warn('[OfflineClockAction] Debounce rejection:', result.message);
      logData('OfflineClockAction', 'Debounce rejected', result);
      return {
        success: false,
        event: {
          id: '',
          employee_id: employeeId,
          event_type: 'in' as const,
          event_timestamp: new Date().toISOString()
        },
        isOffline: false,
        message: result.message // "Please wait X seconds before clocking again"
      };
    }

    // Build event object from RPC result
    const event = {
      id: String(result.event_id),
      employee_id: employeeId,
      event_type: result.event_type as 'in' | 'out',
      event_timestamp: result.event_timestamp
    };

    console.log('[OfflineClockAction] ✅ Online clock action successful', event);
    assertShape('OfflineClockAction', event, ['id', 'employee_id', 'event_type', 'event_timestamp'], 'event');
    logData('OfflineClockAction', 'Online success', event);

    // Success! Trigger sync in case there are queued entries
    syncOfflineQueue().catch(err => {
      console.warn('[OfflineClockAction] Background sync failed:', err);
    });

    return {
      success: true,
      event,
      isOffline: false,
      message: result.message
    };

  } catch (error: any) {
    console.warn('[OfflineClockAction] Online clock action failed:', error);
    logError('OfflineClockAction', 'Online clock action failed', error, { employeeId, employeeName });

    // STEP 2: Online call failed - check if we're offline or if there's a real error
    const isNetworkError =
      !navigator.onLine ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('NetworkError');

    logCondition('OfflineClockAction', 'Navigator says online', navigator.onLine);
    logCondition('OfflineClockAction', 'Is network error', isNetworkError, { errorMessage: error?.message });

    if (!isNetworkError) {
      // Real error (not network) - throw it
      console.error('[OfflineClockAction] ❌ Non-network error, re-throwing:', error);
      logError('OfflineClockAction', 'Non-network error - re-throwing', error);
      throw error;
    }

    // STEP 3: Network error - fall back to offline queue
    console.log('[OfflineClockAction] 📵 Network error detected, using offline fallback...');
    logData('OfflineClockAction', 'Entering offline fallback mode', { isNetworkError, navigatorOnline: navigator.onLine });

    // Determine expected action (in or out)
    // Default to 'in' if we can't determine
    let expectedAction: 'in' | 'out' = 'in';

    try {
      // Try to get last event to determine what action should be next
      const { data: lastEvent } = await supabase
        .schema('employees')
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('event_timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastEvent) {
        expectedAction = lastEvent.event_type === 'in' ? 'out' : 'in';
        logData('OfflineClockAction', 'Got last event from DB', { lastEvent, expectedAction });
      } else {
        logData('OfflineClockAction', 'No last event - defaulting to IN', { expectedAction });
      }
    } catch (lastEventError) {
      // If we can't get last event (offline), check localStorage
      logError('OfflineClockAction', 'Could not get last event', lastEventError);
      const cachedAction = localStorage.getItem(`lastAction_${employeeId}`);
      if (cachedAction === 'in') {
        expectedAction = 'out';
      }
      logData('OfflineClockAction', 'Using localStorage fallback', { cachedAction, expectedAction });
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
      logData('OfflineClockAction', 'Added to offline queue', { queueId, expectedAction, employeeName });

      // Cache the action in localStorage for next time
      localStorage.setItem(`lastAction_${employeeId}`, expectedAction);

      // Create optimistic event response (looks like real event)
      const optimisticEvent = {
        id: queueId, // Use queue ID as temporary event ID
        employee_id: employeeId,
        event_type: expectedAction,
        event_timestamp: timestamp
      };

      assertShape('OfflineClockAction', optimisticEvent, ['id', 'employee_id', 'event_type', 'event_timestamp'], 'optimistic_event');
      logData('OfflineClockAction', 'Offline success - returning optimistic event', optimisticEvent);

      return {
        success: true,
        event: optimisticEvent,
        isOffline: true,
        message: `Saved offline - will sync when connection returns`
      };

    } catch (queueError) {
      // Queue failed too - this is bad
      console.error('[OfflineClockAction] ❌ Failed to add to offline queue:', queueError);
      logError('OfflineClockAction', 'Failed to add to offline queue', queueError);
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
