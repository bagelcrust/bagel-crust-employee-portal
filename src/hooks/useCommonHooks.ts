/**
 * ESSENTIAL CUSTOM HOOKS
 *
 * Common patterns that every app needs but React doesn't provide.
 * These make your code more reusable and easier to test.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../lib/logger';

/**
 * useLocalStorage - Persist state to localStorage
 *
 * Like useState but synced with localStorage.
 * Perfect for: user preferences, cached data, "remember me" checkboxes
 *
 * Example:
 *   const [theme, setTheme] = useLocalStorage('theme', 'light');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get stored value on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.warn(`Error reading localStorage key "${key}"`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error(`Error setting localStorage key "${key}"`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * useDebounce - Delay updating a value until user stops typing
 *
 * Essential for search inputs and expensive operations.
 * Prevents firing API calls on every keystroke.
 *
 * Example:
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearch = useDebounce(searchTerm, 500);
 *   // API call only fires 500ms after user stops typing
 */
export function useDebounce<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * useOnlineStatus - Detect when user goes offline/online
 *
 * Essential for PWAs. Show warning when offline, retry when back online.
 *
 * Example:
 *   const isOnline = useOnlineStatus();
 *   {!isOnline && <Banner>You are offline</Banner>}
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Connection restored', undefined, 'Network');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Connection lost', undefined, 'Network');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * usePrevious - Access previous value of a state/prop
 *
 * Useful for comparing current vs previous values in useEffect.
 *
 * Example:
 *   const prevCount = usePrevious(count);
 *   if (count !== prevCount) { ... }
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * useInterval - Run callback on an interval (with cleanup)
 *
 * Like setInterval but handles cleanup automatically.
 * Perfect for: polling, auto-refresh, countdown timers
 *
 * Example:
 *   useInterval(() => {
 *     checkForUpdates();
 *   }, 30000); // Check every 30 seconds
 */
export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  // Remember latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up interval
  useEffect(() => {
    if (delayMs === null) return;

    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}

/**
 * useTimeout - Run callback after a delay (with cleanup)
 *
 * Like setTimeout but handles cleanup automatically.
 *
 * Example:
 *   useTimeout(() => {
 *     setShowNotification(false);
 *   }, 3000); // Hide notification after 3 seconds
 */
export function useTimeout(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;

    const id = setTimeout(() => savedCallback.current(), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
}

/**
 * useMediaQuery - Detect if media query matches
 *
 * Responsive hooks for showing/hiding content based on screen size.
 *
 * Example:
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   {isMobile ? <MobileNav /> : <DesktopNav />}
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * useClickOutside - Detect clicks outside an element
 *
 * Perfect for: closing modals, dropdowns, popovers
 *
 * Example:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useClickOutside(ref, () => setIsOpen(false));
 */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

/**
 * useAsync - Handle async operations with loading/error states
 *
 * Simpler than React Query for one-off async operations.
 *
 * Example:
 *   const { execute, loading, error, data } = useAsync(
 *     () => employeeApi.getByPin(pin)
 *   );
 */
interface UseAsyncResult<T> {
  execute: () => Promise<void>;
  loading: boolean;
  error: Error | null;
  data: T | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>
): UseAsyncResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err as Error);
      logger.error('Async operation failed', err);
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { execute, loading, error, data };
}

/**
 * useKeyPress - Detect when specific key is pressed
 *
 * Perfect for: keyboard shortcuts, form navigation
 *
 * Example:
 *   const enterPressed = useKeyPress('Enter');
 *   useEffect(() => {
 *     if (enterPressed) submitForm();
 *   }, [enterPressed]);
 */
export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}
