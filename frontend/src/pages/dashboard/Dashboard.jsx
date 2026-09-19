import { useEffect, useState } from 'react'
import { Users, Laptop, CalendarCheck, ShieldAlert, DoorOpen, BookOpen, GraduationCap } from 'lucide-react'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import { getDashboardStats, getIncidents } from '../../api/verification'
import { useRole } from '../../hooks/useRole'

export default function Dashboard() {
  const { roleLabel, canManageIncidents, isLecturer } = useRole()
  const [stats, setStats] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calls = [getDashboardStats()]
    if (canManageIncidents) calls.push(getIncidents({ is_resolved: false, page_size: 5 }))

    Promise.all(calls)
      .then(([statsRes, incRes]) => {
        setStats(statsRes.data)
        if (incRes) setIncidents(incRes.data.results || [])
      })
      .catch(() => setStats({}))
      .finally(() => setLoading(false))
  }, [canManageIncidents])

  const severityClass = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue' }
  const s = stats || {}

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Signed in as ${roleLabel}`} />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {s.students && (
              <StatCard label="Total Students" value={s.students.total} icon={Users} color="blue"
                sub={`${s.students.active} active`} />
            )}
            {s.campus && (
              <StatCard label="On Campus Now" value={s.campus.on_campus} icon={DoorOpen} color="green"
                sub={`${s.campus.today_entries} entries today${s.campus.all_gates ? '' : ' · your gates'}`} />
            )}
            {s.devices && (
              <StatCard label="Registered Devices" value={s.devices.total} icon={Laptop} color="purple"
                sub={`${s.devices.active} active`} />
            )}
            {s.attendance && (
              <StatCard label="Open Sessions" value={s.attendance.open_sessions} icon={BookOpen} color="yellow"
                sub={`${s.attendance.records_today} records today`} />
            )}
            {s.incidents && (
              <StatCard label="Unresolved Incidents" value={s.incidents.unresolved} icon={ShieldAlert} color="red"
                sub={`${s.incidents.high_severity} high severity`} />
            )}
            {s.attendance && (
              <StatCard label="Attendance Records Today" value={s.attendance.records_today} icon={CalendarCheck} color="green" />
            )}
            {s.eligibility && (
              <StatCard label="Students At Risk" value={s.eligibility.at_risk_count} icon={GraduationCap} color="red"
                sub={`across ${s.eligibility.courses} course(s)`} />
            )}
          </div>

          {isLecturer && s.eligibility && (
            <div className="card p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Exam Eligibility — Students At Risk</h3>
              {s.eligibility.at_risk.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Everyone's meeting their attendance threshold.</p>
              ) : (
                <div className="space-y-3">
                  {s.eligibility.at_risk.map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{row.student_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.course_code} &middot; needs {row.required_percent}%</p>
                      </div>
                      <span className="badge-red">{row.percent}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {canManageIncidents && (
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
                      <span className={severityClass[inc.severity] || 'badge-gray'}>{inc.severity_display}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
