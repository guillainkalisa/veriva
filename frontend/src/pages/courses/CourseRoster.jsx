import { useState, useEffect, useCallback } from 'react'
import { UserPlus, UserMinus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import SearchBar from '../../components/SearchBar'
import Spinner from '../../components/Spinner'
import { getCourseRoster, enrollStudents, unenrollStudents } from '../../api/attendance'
import { getStudents } from '../../api/students'

export default function CourseRoster({ course }) {
  const [roster, setRoster] = useState(null)
  const [search, setSearch] = useState('')
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)

  const loadRoster = useCallback(() => {
    getCourseRoster(course.id).then(({ data }) => setRoster(data))
  }, [course.id])

  useEffect(() => { loadRoster() }, [loadRoster])

  useEffect(() => {
    if (!search.trim()) { setCandidates([]); return }
    const enrolledIds = new Set((roster || []).map((r) => r.student.id))
    getStudents({ search, is_active: true }).then(({ data }) => {
      setCandidates(data.results.filter((s) => !enrolledIds.has(s.id)))
    })
  }, [search, roster])

  const toggleSelect = (id) => {
    setSelected((sel) => sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id])
  }

  const handleEnroll = async () => {
    if (!selected.length) return
    setBusy(true)
    try {
      await enrollStudents(course.id, selected)
      toast.success(`Enrolled ${selected.length} student(s).`)
      setSelected([])
      setSearch('')
      loadRoster()
    } catch { toast.error('Failed to enroll students.') }
    finally { setBusy(false) }
  }

  const handleUnenroll = async (studentId) => {
    setBusy(true)
    try {
      await unenrollStudents(course.id, [studentId])
      toast.success('Removed from roster.')
      loadRoster()
    } catch { toast.error('Failed to remove student.') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="label">Enroll students</label>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or reg. number..." />
        {candidates.length > 0 && (
          <div className="mt-2 border border-gray-100 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
            {candidates.map((s) => (
              <label key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                <span className="font-medium text-gray-800">{s.full_name}</span>
                <span className="font-mono text-xs text-gray-400">{s.registration_number}</span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <button disabled={busy} onClick={handleEnroll} className="btn-primary mt-2 text-xs py-1.5 px-3">
            {busy && <Spinner size={12} />} <UserPlus size={14} /> Enroll {selected.length} selected
          </button>
        )}
      </div>

      <div>
        <label className="label">Current roster ({roster?.length ?? 0})</label>
        {!roster ? (
          <p className="flex items-center gap-2 text-sm text-gray-400 py-4"><Spinner size={14} /> Loading roster...</p>
        ) : roster.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center text-gray-400">
            <Users size={32} className="mb-2" />
            <p className="text-sm">No students enrolled yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase">
                <th className="text-left pb-2">Student</th>
                <th className="text-left pb-2">Attendance</th>
                <th className="text-left pb-2">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roster.map((r) => (
                <tr key={r.student.id}>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">{r.student.full_name}</p>
                    <p className="font-mono text-xs text-gray-400">{r.student.registration_number}</p>
                  </td>
                  <td className="py-2 text-gray-600">{r.percent}%</td>
                  <td className="py-2">
                    <span className={r.eligible ? 'badge-green' : 'badge-red'}>
                      {r.eligible ? 'Eligible' : 'At risk'}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button disabled={busy} onClick={() => handleUnenroll(r.student.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500">
                      <UserMinus size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
