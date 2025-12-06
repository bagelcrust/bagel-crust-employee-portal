import type { SyncEvent } from './syncManager'

/**
 * RecentActivityPanel Component
 *
 * Widget showing recent clock in/out events with sync status.
 *
 * WIDGET VERSION: Non-fixed, flows in sidebar layout
 * Uses shared glassmorphism styling
 */

interface RecentActivityPanelProps {
  recentEvents: any[]
  syncStatus: SyncEvent
  realtimeStatus: 'connected' | 'disconnected' | 'error'
  devMode: boolean
  activityListRef: any
}

export function RecentActivityPanel({
  recentEvents,
  syncStatus,
  realtimeStatus,
  devMode,
  activityListRef
}: RecentActivityPanelProps) {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-3 flex-1 min-h-[180px] overflow-y-auto">
      <div className="relative flex items-center justify-center mb-3">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Recent Activity
        </h3>
        <div className="absolute right-0 flex items-center gap-2">
          {/* Sync status indicator */}
          {syncStatus.queueCount > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
              syncStatus.status === 'syncing'
                ? 'bg-blue-400/20 text-blue-600 animate-pulse'
                : 'bg-yellow-400/20 text-yellow-600'
            }`} title={syncStatus.message}>
              {syncStatus.status === 'syncing' ? '⟳' : '●'}
              <span>{syncStatus.queueCount}</span>
            </div>
          )}
          {/* Realtime connection indicator (DEV mode only) */}
          {devMode && (
            <div className={`w-2 h-2 rounded-full ${
              realtimeStatus === 'connected' ? 'bg-green-500' :
              realtimeStatus === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} title={`Realtime: ${realtimeStatus}`} />
          )}
        </div>
      </div>

      {recentEvents.length > 0 ? (
        <div ref={activityListRef} className="flex flex-col gap-2">
          {recentEvents
            .filter(event => {
              // FILTER TEST USER: Hide test user (employeeId: bbb42de4-61b0-45cc-ae92-2e6dec6b53ee) in production mode
              // Test user entries only show when devMode is enabled
              if (!devMode && event.employeeId === 'bbb42de4-61b0-45cc-ae92-2e6dec6b53ee') {
                return false;
              }
              return true;
            })
            .slice(0, 8)
            .map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 py-2 px-2 border-b border-slate-200 last:border-b-0"
            >
              {/* Name */}
              <div className="flex-1 min-w-0 text-[13px] font-medium text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap">
                {event.name}
              </div>
              {/* Time */}
              <div className="text-xs text-slate-500 whitespace-nowrap">
                {event.time}
              </div>
              {/* Badge */}
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                event.action === 'Clock In'
                  ? 'bg-green-400/15 text-green-500'
                  : 'bg-orange-400/15 text-orange-500'
              }`}>
                {event.action === 'Clock In' ? 'IN' : 'OUT'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400 text-center p-4 italic">
          No recent activity
        </div>
      )}
    </div>
  )
}
