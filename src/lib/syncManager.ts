/**
 * SYNC MANAGER - Background sync for offline clock entries
 *
 * Automatically retries queued clock in/out entries when connection is restored.
 * Uses smart retry logic with exponential backoff.
 *
 * Features:
 * - Automatic sync on connection restore
 * - Manual sync trigger
 * - Event emitter for UI updates
 * - Exponential backoff for retries
 * - Prevents duplicate syncs
 */

import { supabase } from '../supabase/supabase';
import {
  getQueuedEntries,
  removeFromQueue,
  updateQueueEntry,
  getQueueCount
} from './offlineQueue';

// Sync event types
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncEvent {
  status: SyncStatus;
  queueCount: number;
  message?: string;
  error?: string;
}

// Event listeners
type SyncListener = (event: SyncEvent) => void;
const listeners: SyncListener[] = [];

/**
 * Subscribe to sync events
 */
export function onSyncEvent(listener: SyncListener): () => void {
  listeners.push(listener);
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Emit sync event to all listeners
 */
function emitSyncEvent(event: SyncEvent) {
  listeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in sync event listener:', error);
    }
  });
}

// Sync state
let isSyncing = false;
let syncTimeout: number | null = null;

/**
 * Process the offline queue - sync all entries
 */
export async function syncOfflineQueue(): Promise<void> {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log('[SyncManager] Already syncing, skipping...');
    return;
  }

  // Check if online
  if (!navigator.onLine) {
    console.log('[SyncManager] Offline, cannot sync');
    const queueCount = await getQueueCount();
    emitSyncEvent({
      status: 'idle',
      queueCount,
      message: 'Offline - waiting for connection'
    });
    return;
  }

  isSyncing = true;
  console.log('[SyncManager] Starting sync...');

  try {
    const entries = await getQueuedEntries();

    if (entries.length === 0) {
      console.log('[SyncManager] Queue is empty');
      emitSyncEvent({
        status: 'idle',
        queueCount: 0,
        message: 'All synced'
      });
      isSyncing = false;
      return;
    }

    console.log(`[SyncManager] Syncing ${entries.length} entries...`);
    emitSyncEvent({
      status: 'syncing',
      queueCount: entries.length,
      message: `Syncing ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}...`
    });

    let successCount = 0;
    let failureCount = 0;

    // Process each entry (FIFO - oldest first)
    for (const entry of entries) {
      try {
        console.log(`[SyncManager] Syncing entry ${entry.id} (${entry.employeeName})`);

        // Use table operations to bypass PostgREST cache issues
        // Get last event
        const { data: lastEvent } = await supabase
          .schema('employees')
          .from('time_entries')
          .select('event_type')
          .eq('employee_id', entry.employeeId)
          .order('event_timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Determine new event type
        const newEventType: 'in' | 'out' = (!lastEvent || lastEvent.event_type === 'out') ? 'in' : 'out';

        // Insert new event
        const { data, error } = await supabase
          .schema('employees')
          .from('time_entries')
          .insert({
            employee_id: entry.employeeId,
            event_type: newEventType,
            event_timestamp: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw new Error(`Failed: ${error.message}`);
        const result = data;

        console.log(`[SyncManager] ✅ Successfully synced ${entry.id}`, result);

        // Remove from queue on success
        await removeFromQueue(entry.id);
        successCount++;

      } catch (error: any) {
        console.error(`[SyncManager] ❌ Failed to sync ${entry.id}:`, error);

        // Update attempt count and error
        await updateQueueEntry(entry.id, {
          attempts: entry.attempts + 1,
          lastAttempt: new Date().toISOString(),
          error: error?.message || String(error)
        });

        failureCount++;

        // If max attempts reached (10), give up and notify user
        if (entry.attempts >= 10) {
          console.error(`[SyncManager] Max attempts reached for ${entry.id}, giving up`);
          // Could notify user here or mark for manual review
        }
      }

      // Small delay between syncs to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const remainingCount = await getQueueCount();

    if (remainingCount === 0) {
      console.log('[SyncManager] ✅ All entries synced successfully');
      emitSyncEvent({
        status: 'success',
        queueCount: 0,
        message: 'All entries synced!'
      });
    } else {
      console.log(`[SyncManager] ⚠️ ${remainingCount} entries remaining in queue`);
      emitSyncEvent({
        status: 'error',
        queueCount: remainingCount,
        message: `${successCount} synced, ${failureCount} failed`
      });

      // Schedule retry with exponential backoff
      scheduleRetry(remainingCount);
    }

  } catch (error: any) {
    console.error('[SyncManager] Sync failed:', error);
    const queueCount = await getQueueCount();
    emitSyncEvent({
      status: 'error',
      queueCount,
      error: error?.message || String(error)
    });

    // Schedule retry
    scheduleRetry(queueCount);
  } finally {
    isSyncing = false;
  }
}

/**
 * Schedule a retry with exponential backoff
 */
function scheduleRetry(queueCount: number) {
  // Clear existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Exponential backoff: 5s, 10s, 30s, 60s
  const delays = [5000, 10000, 30000, 60000];
  const delay = delays[Math.min(queueCount - 1, delays.length - 1)];

  console.log(`[SyncManager] Scheduling retry in ${delay / 1000}s...`);

  syncTimeout = setTimeout(() => {
    console.log('[SyncManager] Retry scheduled, attempting sync...');
    syncOfflineQueue();
  }, delay);
}

/**
 * Start the sync manager - set up listeners
 */
export function startSyncManager() {
  console.log('[SyncManager] Starting sync manager...');

  // Sync when online event fires
  window.addEventListener('online', () => {
    console.log('[SyncManager] Network back online, syncing...');
    syncOfflineQueue();
  });

  // Check queue on startup (if online)
  if (navigator.onLine) {
    console.log('[SyncManager] Online at startup, checking queue...');
    syncOfflineQueue();
  }

  // Periodic check every 60 seconds (only if online and has queue items)
  setInterval(async () => {
    if (navigator.onLine && !isSyncing) {
      const count = await getQueueCount();
      if (count > 0) {
        console.log(`[SyncManager] Periodic check: ${count} items in queue, syncing...`);
        syncOfflineQueue();
      }
    }
  }, 60000);
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncEvent> {
  const queueCount = await getQueueCount();
  return {
    status: isSyncing ? 'syncing' : queueCount > 0 ? 'idle' : 'success',
    queueCount,
    message: queueCount > 0 ? `${queueCount} pending` : 'All synced'
  };
}
