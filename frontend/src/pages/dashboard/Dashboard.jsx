import { useEffect, useState } from 'react'
import { Users, Laptop, CalendarCheck, ShieldAlert, DoorOpen, BookOpen } from 'lucide-react'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import { getDashboardStats } from '../../api/verification'
import { getIncidents } from '../../api/verification'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getIncidents({ is_resolved: false, page_size: 5 })])
      .then(([{ data: s }, { data: i }]) => {
        setStats(s)
        setIncidents(i.results || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const severityClass = {
    high:   'badge-red',
    medium: 'badge-yellow',
    low:    'badge-blue',
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of campus activity"
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28 bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Students"
              value={stats?.students?.total}
              icon={Users}
              color="blue"
              sub={`${stats?.students?.active} active`}
            />
            <StatCard
              label="Registered Devices"
              value={stats?.devices?.total}
              icon={Laptop}
              color="purple"
              sub={`${stats?.devices?.active} active`}
            />
            <StatCard
              label="On Campus Today"
              value={stats?.attendance?.students_on_campus}
              icon={DoorOpen}
              color="green"
              sub={`${stats?.attendance?.today_campus_entries} total entries`}
            />
            <StatCard
              label="Open Sessions"
              value={stats?.attendance?.open_sessions}
              icon={BookOpen}
              color="yellow"
              sub={`${stats?.attendance?.records_today} records today`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Unresolved Incidents"
              value={stats?.incidents?.unresolved}
              icon={ShieldAlert}
              color="red"
              sub={`${stats?.incidents?.high_severity} high severity`}
            />
            <StatCard
              label="Total Incidents"
              value={stats?.incidents?.total}
              icon={ShieldAlert}
              color="yellow"
            />
            <StatCard
              label="Attendance Records Today"
              value={stats?.attendance?.records_today}
              icon={CalendarCheck}
              color="green"
            />
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Unresolved Incidents</h3>
            {incidents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No unresolved incidents</p>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inc.type_display}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{inc.description}</p>
                    </div>
                    <span className={severityClass[inc.severity] || 'badge-gray'}>
                      {inc.severity_display}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
