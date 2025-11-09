/**
 * OFFLINE QUEUE SYSTEM - IndexedDB-based persistent storage
 *
 * Stores clock in/out attempts that fail due to network issues.
 * Automatically retries when connection is restored.
 *
 * Key features:
 * - Persistent across page reloads (IndexedDB)
 * - Small memory footprint (~1-5 KB per entry)
 * - Automatic retry on connection restore
 * - FIFO queue processing
 * - Prevents duplicate entries
 */

export interface QueuedClockEntry {
  id: string; // Unique ID for this queue entry
  employeeId: string;
  employeeName: string;
  expectedAction: 'in' | 'out'; // What action was expected
  timestamp: string; // When the action was attempted (ISO string)
  attempts: number; // How many times we've tried to sync
  lastAttempt: string; // Last sync attempt timestamp
  error?: string; // Last error message
}

const DB_NAME = 'BagelCrustOffline';
const DB_VERSION = 1;
const STORE_NAME = 'clockQueue';

/**
 * Initialize IndexedDB
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('employeeId', 'employeeId', { unique: false });
      }
    };
  });
}

/**
 * Add a clock entry to the offline queue
 */
export async function addToQueue(entry: Omit<QueuedClockEntry, 'id' | 'attempts' | 'lastAttempt'>): Promise<string> {
  const db = await openDB();

  const queueEntry: QueuedClockEntry = {
    ...entry,
    id: `${entry.employeeId}-${Date.now()}`, // Unique ID
    attempts: 0,
    lastAttempt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(queueEntry);

    request.onsuccess = () => resolve(queueEntry.id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all queued entries (sorted by timestamp, oldest first)
 */
export async function getQueuedEntries(): Promise<QueuedClockEntry[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const entries = request.result as QueuedClockEntry[];
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get count of queued entries
 */
export async function getQueueCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove an entry from the queue (after successful sync)
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an entry's attempt count and error
 */
export async function updateQueueEntry(id: string, updates: Partial<QueuedClockEntry>): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const entry = getRequest.result;
      if (!entry) {
        reject(new Error('Entry not found'));
        return;
      }

      const updatedEntry = { ...entry, ...updates };
      const putRequest = store.put(updatedEntry);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Clear all entries from the queue (use with caution!)
 */
export async function clearQueue(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
