import { useEffect, useState } from 'react';
import { Clock, Users, Activity, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { timeclockApi, scheduleApi } from '../lib/supabase';

export default function Dashboard() {
  const [currentlyWorking, setCurrentlyWorking] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [working, recent, schedule] = await Promise.all([
        timeclockApi.getCurrentlyWorking(),
        timeclockApi.getRecentEvents(20),
        scheduleApi.getTodaySchedule()
      ]);

      setCurrentlyWorking(working);
      setRecentEvents(recent);
      setTodaySchedule(schedule);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return timestamp.split(' ')[1]?.substring(0, 5) || '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Bagel Crust Dashboard</h1>
            <div className="text-sm text-gray-500">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Currently Working */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Currently Working</h2>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{currentlyWorking.length}</div>
            <p className="text-sm text-gray-500 mt-1">employees on duty</p>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Scheduled Today</h2>
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">{todaySchedule.length}</div>
            <p className="text-sm text-gray-500 mt-1">shifts scheduled</p>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600">{recentEvents.length}</div>
            <p className="text-sm text-gray-500 mt-1">clock events today</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Currently Working List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Who's Working Now
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {currentlyWorking.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No employees currently clocked in
                </div>
              ) : (
                currentlyWorking.map((emp) => (
                  <div key={emp.employee_id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {emp.display_name || emp.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Clocked in at {formatTime(emp.clock_in_time)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Working
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Clock Events */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No recent clock events
                </div>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {event.core_employees?.display_name || event.core_employees?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(event.event_time_est)}
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        event.event_type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Clocked {event.event_type}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors flex items-center justify-between"
          >
            <span className="font-medium">Clock In/Out</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => window.location.href = '/schedule'}
            className="bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition-colors flex items-center justify-between"
          >
            <span className="font-medium">View Schedule</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => window.location.href = '/employees'}
            className="bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 transition-colors flex items-center justify-between"
          >
            <span className="font-medium">Manage Employees</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}