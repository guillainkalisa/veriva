import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getStudents, getStudent } from '../../api/students'
import LoadingState from '../../components/LoadingState'
import Spinner from '../../components/Spinner'
import NFCAssignForm from './NFCAssignForm'

// Opened from a table row with `studentId`, or from the header with nothing,
// in which case the admin finds the student by registration number first.
export default function NFCCardManager({ studentId, onSuccess }) {
  const [student, setStudent] = useState(null)
  const [regNumber, setRegNumber] = useState('')
  const [loading, setLoading] = useState(Boolean(studentId))
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!studentId) return
    getStudent(studentId)
      .then(({ data }) => setStudent(data))
      .catch(() => toast.error('Failed to load student.'))
      .finally(() => setLoading(false))
  }, [studentId])

  const findStudent = async (e) => {
    e.preventDefault()
    const reg = regNumber.replace(/\s/g, '').toUpperCase()
    if (!reg) return
    setLoading(true)
    setNotFound(false)
    try {
      const { data } = await getStudents({ registration_number: reg })
      if (data.results.length === 0) {
        setNotFound(true)
        return
      }
      const { data: full } = await getStudent(data.results[0].id)
      setStudent(full)
    } catch {
      toast.error('Search failed.')
    } finally {
      setLoading(false)
    }
  }

  if (studentId) {
    return loading || !student ? <LoadingState /> : <NFCAssignForm student={student} onSuccess={onSuccess} />
  }

  if (student) {
    return (
      <div className="space-y-4">
        <NFCAssignForm student={student} onSuccess={onSuccess} />
        <button type="button" className="text-xs text-gray-400 hover:text-brand-600" onClick={() => setStudent(null)}>
          &larr; Different registration number
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={findStudent} className="space-y-4">
      <div>
        <label className="label">Registration number</label>
        <input
          className="input font-mono"
          value={regNumber}
          onChange={(e) => { setRegNumber(e.target.value); setNotFound(false) }}
          placeholder="e.g. 222000001"
          autoFocus
        />
        {notFound && (
          <p className="text-xs text-red-500 mt-1">
            No student with this registration number. Register the student first.
          </p>
        )}
      </div>
      <button type="submit" disabled={loading || !regNumber.trim()} className="btn-primary w-full justify-center">
        {loading ? <Spinner size={15} /> : <Search size={15} />} Find Student
      </button>
    </form>
  )
}
