import { useState, useEffect, useCallback } from 'react'
import { Plus, BookOpen, Edit, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import LoadingState from '../../components/LoadingState'
import Spinner from '../../components/Spinner'
import CourseRoster from './CourseRoster'
import { getCourses, createCourse, updateCourse } from '../../api/attendance'
import { useRole } from '../../hooks/useRole'

export default function Courses() {
  const { canManageCourses } = useRole()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [rosterCourse, setRosterCourse] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', department: '', min_attendance_percent: 80 })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCourses().then(({ data }) => setCourses(data.results)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = (c = null) => {
    setSelected(c)
    setForm(c
      ? { name: c.name, code: c.code, department: c.department, min_attendance_percent: c.min_attendance_percent }
      : { name: '', code: '', department: '', min_attendance_percent: 80 })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (selected) { await updateCourse(selected.id, form); toast.success('Course updated.') }
      else { await createCourse(form); toast.success('Course created.') }
      setShowForm(false)
      load()
    } catch { toast.error('Failed to save course.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="Courses" subtitle="Manage academic courses for attendance tracking"
        action={canManageCourses && <button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add Course</button>}
      />

      <div className="card">
        {loading ? (
          <LoadingState />
        ) : courses.length === 0 ? (
          <EmptyState icon={BookOpen} message="No courses yet." action={
            <button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add Course</button>
          } />
        ) : (
          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Course Name', 'Department', 'Lecturer', 'Min. Attendance', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-semibold text-brand-700">{c.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.department}</td>
                    <td className="px-4 py-3 text-gray-600">{c.lecturer_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.min_attendance_percent}%</td>
                    <td className="px-4 py-3">
                      <span className={c.is_active ? 'badge-green' : 'badge-gray'}>{c.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canManageCourses ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setRosterCourse(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600" title="Roster">
                            <Users size={14} />
                          </button>
                          <button onClick={() => openForm(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600" title="Edit">
                            <Edit size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={selected ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Course Code *</label>
            <input className="input font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="e.g. CST101" />
          </div>
          <div>
            <label className="label">Course Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Department *</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          </div>
          <div>
            <label className="label">Minimum Attendance to Sit Exam (%) *</label>
            <input className="input" type="number" min="0" max="100" value={form.min_attendance_percent}
              onChange={(e) => setForm({ ...form, min_attendance_percent: Number(e.target.value) })} required />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving && <Spinner size={14} />} {saving ? 'Saving...' : selected ? 'Update Course' : 'Create Course'}
          </button>
        </form>
      </Modal>

      <Modal open={!!rosterCourse} onClose={() => setRosterCourse(null)} title={rosterCourse ? `${rosterCourse.code} Roster` : ''} size="lg">
        {rosterCourse && <CourseRoster course={rosterCourse} />}
      </Modal>
    </div>
  )
}
