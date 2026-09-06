import { useState, useEffect, useCallback } from 'react'
import { Plus, CalendarCheck, Lock, ChevronDown, ChevronUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import { getSessions, createSession, closeSession, getSessionRecords, getCourses } from '../../api/attendance'
import { useRole } from '../../hooks/useRole'

export default function Attendance() {
  const { canManageAttendance } = useRole()
  const [sessions, setSessions] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [records, setRecords] = useState({})
  const [form, setForm] = useState({ course: '', date: new Date().toISOString().slice(0, 10), start_time: '', room: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getSessions({ ordering: '-date' }), getCourses()])
      .then(([{ data: s }, { data: c }]) => {
        setSessions(s.results)
        setCourses(c.results)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!records[id]) {
      const { data } = await getSessionRecords(id)
      setRecords((r) => ({ ...r, [id]: data }))
    }
  }

  const handleClose = async (id) => {
    if (!confirm('Close this attendance session?')) return
    await closeSession(id)
    toast.success('Session closed.')
    load()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createSession(form)
      toast.success('Session created.')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error('Failed to create session.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Attendance Sessions"
        subtitle="Manage classroom attendance sessions"
        action={canManageAttendance && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Session
          </button>
        )}
      />

      {loading ? (
        <div className="card p-8 text-center text-gray-400 text-sm">Loading...</div>
      ) : sessions.length === 0 ? (
        <EmptyState icon={CalendarCheck} message="No attendance sessions yet." action={
          canManageAttendance && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Create Session</button>
        } />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="card overflow-hidden">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleExpand(s.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{s.course_code}</span>
                    <span className="text-gray-500 text-sm">{s.course_name}</span>
                    <span className={s.is_open ? 'badge-green' : 'badge-gray'}>
                      {s.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {s.date} &middot; {s.start_time}{s.end_time ? ` - ${s.end_time}` : ''} &middot; Room {s.room} &middot; {s.attendance_count} students
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.is_open && canManageAttendance && (
                    <button
                      className="btn-secondary text-xs py-1 px-3"
                      onClick={(e) => { e.stopPropagation(); handleClose(s.id) }}
                    >
                      <Lock size={12} /> Close
                    </button>
                  )}
                  {expanded === s.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {expanded === s.id && (
                <div className="border-t border-gray-100 p-4">
                  {!records[s.id] ? (
                    <p className="text-sm text-gray-400">Loading records...</p>
                  ) : records[s.id].length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No attendance records yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase">
                          <th className="text-left pb-2">Student</th>
                          <th className="text-left pb-2">Reg. Number</th>
                          <th className="text-left pb-2">Check-in</th>
                          <th className="text-left pb-2">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {records[s.id].map((r) => (
                          <tr key={r.id}>
                            <td className="py-2 font-medium text-gray-800">{r.student_detail?.full_name}</td>
                            <td className="py-2 font-mono text-xs text-gray-500">{r.student_detail?.registration_number}</td>
                            <td className="py-2 text-xs text-gray-500">{new Date(r.check_in_time).toLocaleTimeString()}</td>
                            <td className="py-2">
                              <span className={r.method === 'nfc' ? 'badge-blue' : 'badge-gray'}>{r.method}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Attendance Session">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Course *</label>
            <select className="input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required>
              <option value="">Select course...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Start Time *</label>
              <input className="input" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Room *</label>
            <input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} required placeholder="e.g. Room 101" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
