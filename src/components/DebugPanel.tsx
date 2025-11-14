/**
 * DEVELOPMENT DEBUG PANEL
 *
 * Floating debug panel for development only.
 * Shows: environment info, API status, error log, performance metrics.
 *
 * ONLY appears in development mode (import.meta.env.DEV).
 * Will not be included in production build.
 *
 * Usage: Add to App.tsx:
 *   {import.meta.env.DEV && <DebugPanel />}
 */

import { useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import { checkSupabaseHealth } from '../lib/supabaseClient';
import { useOnlineStatus } from '../hooks/useCommonHooks';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'env' | 'api' | 'errors' | 'perf'>('env');
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [errorLog, setErrorLog] = useState<any[]>([]);
  const isOnline = useOnlineStatus();

  // Check Supabase health on mount
  useEffect(() => {
    checkSupabaseHealth().then(healthy => {
      setSupabaseStatus(healthy ? 'healthy' : 'error');
    });
  }, []);

  // Update error log periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setErrorLog(logger.getErrorQueue());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-mono hover:bg-gray-700 z-50"
        title="Open Debug Panel (Development Only)"
      >
        🛠️ Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] bg-gray-900 text-gray-100 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛠️</span>
          <span className="font-bold text-sm">Debug Panel</span>
          <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">DEV</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700">
        {[
          { id: 'env', label: 'Env', icon: '⚙️' },
          { id: 'api', label: 'API', icon: '🔌' },
          { id: 'errors', label: 'Errors', icon: '🐛' },
          { id: 'perf', label: 'Perf', icon: '⚡' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {/* Environment Tab */}
        {activeTab === 'env' && (
          <div className="space-y-3">
            <DebugRow label="Mode" value={import.meta.env.MODE} />
            <DebugRow label="Dev" value={import.meta.env.DEV ? 'Yes' : 'No'} />
            <DebugRow label="Prod" value={import.meta.env.PROD ? 'Yes' : 'No'} />
            <DebugRow label="Base URL" value={import.meta.env.BASE_URL} />
            <DebugRow
              label="Supabase URL"
              value={import.meta.env.VITE_SUPABASE_URL || 'Not set'}
            />
            <DebugRow
              label="Network"
              value={isOnline ? '🟢 Online' : '🔴 Offline'}
              valueColor={isOnline ? 'text-green-400' : 'text-red-400'}
            />
            <DebugRow
              label="Service Worker"
              value={navigator.serviceWorker ? 'Enabled' : 'Disabled'}
            />
            <DebugRow label="User Agent" value={navigator.userAgent} wrap />
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="space-y-3">
            <DebugRow
              label="Supabase Status"
              value={
                supabaseStatus === 'checking' ? '⏳ Checking...' :
                supabaseStatus === 'healthy' ? '🟢 Healthy' :
                '🔴 Error'
              }
              valueColor={
                supabaseStatus === 'healthy' ? 'text-green-400' :
                supabaseStatus === 'error' ? 'text-red-400' :
                'text-yellow-400'
              }
            />
            <button
              onClick={() => {
                setSupabaseStatus('checking');
                checkSupabaseHealth().then(healthy => {
                  setSupabaseStatus(healthy ? 'healthy' : 'error');
                });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs"
            >
              Recheck Connection
            </button>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-gray-400 mb-2">React Query DevTools:</div>
              <div className="text-xs text-gray-500">
                Open React Query DevTools panel at bottom-left of screen to inspect queries/mutations
              </div>
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="space-y-2">
            {errorLog.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                🎉 No errors logged
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">
                    {errorLog.length} error{errorLog.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => {
                      logger.clearErrorQueue();
                      setErrorLog([]);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Clear
                  </button>
                </div>
                {errorLog.map((error, i) => (
                  <div
                    key={i}
                    className="bg-red-900/20 border border-red-700 rounded p-2 text-xs"
                  >
                    <div className="text-red-400 font-bold mb-1">
                      {error.message}
                    </div>
                    {error.context && (
                      <div className="text-gray-400 mb-1">
                        Context: {error.context}
                      </div>
                    )}
                    <div className="text-gray-500 text-[10px]">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'perf' && (
          <div className="space-y-3">
            <DebugRow
              label="Memory (Used)"
              value={
                (performance as any).memory
                  ? `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)} MB`
                  : 'N/A'
              }
            />
            <DebugRow
              label="Memory (Total)"
              value={
                (performance as any).memory
                  ? `${Math.round((performance as any).memory.totalJSHeapSize / 1048576)} MB`
                  : 'N/A'
              }
            />
            <DebugRow
              label="Connection"
              value={
                (navigator as any).connection
                  ? (navigator as any).connection.effectiveType
                  : 'Unknown'
              }
            />
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs mt-4"
            >
              🔄 Reload App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for debug rows
function DebugRow({
  label,
  value,
  valueColor = 'text-blue-400',
  wrap = false
}: {
  label: string;
  value: string;
  valueColor?: string;
  wrap?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-gray-400 text-[10px] uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`${valueColor} ${wrap ? 'break-all' : 'truncate'}`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
