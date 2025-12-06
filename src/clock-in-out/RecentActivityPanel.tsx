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
    <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-3">
      {/* Header row */}
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

      {/* Horizontal scrolling cards */}
      {recentEvents.length > 0 ? (
        <div ref={activityListRef} className="flex gap-2 overflow-x-auto pb-1">
          {recentEvents
            .filter(event => {
              if (!devMode && event.employeeId === 'bbb42de4-61b0-45cc-ae92-2e6dec6b53ee') {
                return false;
              }
              return true;
            })
            .slice(0, 10)
            .map((event) => (
            <div
              key={event.id}
              className={`flex-shrink-0 px-3 py-2 rounded-lg ${
                event.action === 'Clock In'
                  ? 'bg-green-100 border border-green-200'
                  : 'bg-orange-100 border border-orange-200'
              }`}
            >
              {/* Name */}
              <div className="text-[12px] font-semibold text-slate-700 whitespace-nowrap">
                {event.name.split(' ')[0]}
              </div>
              {/* Time + Badge */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-500">{event.time}</span>
                <span className={`text-[10px] font-bold ${
                  event.action === 'Clock In' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {event.action === 'Clock In' ? 'IN' : 'OUT'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400 text-center py-2 italic">
          No recent activity
        </div>
      )}
    </div>
  )
}
