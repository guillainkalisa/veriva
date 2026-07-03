import { useState, useEffect, useCallback } from 'react'
import { Plus, Users, Edit, Trash2, CreditCard, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import StudentForm from './StudentForm'
import NFCAssignForm from './NFCAssignForm'
import { getStudents, deleteStudent } from '../../api/students'
import { useRole } from '../../hooks/useRole'

export default function Students() {
  const { canManageStudents } = useRole()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showNFC, setShowNFC] = useState(false)
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    getStudents({ search, page })
      .then(({ data }) => {
        setStudents(data.results)
        setCount(data.count)
      })
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (s) => {
    if (!confirm(`Delete ${s.full_name}? This cannot be undone.`)) return
    try {
      await deleteStudent(s.id)
      toast.success('Student deleted.')
      load()
    } catch {
      toast.error('Failed to delete student.')
    }
  }

  const nfcBadge = (s) => {
    if (s.has_nfc) return <span className="badge-green">NFC Active</span>
    return <span className="badge-gray">No NFC</span>
  }

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${count} registered students`}
        action={canManageStudents && (
          <button className="btn-primary" onClick={() => { setSelected(null); setShowForm(true) }}>
            <Plus size={16} /> Add Student
          </button>
        )}
      />

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search students..." />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            message="No students found."
            action={canManageStudents && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Add First Student
              </button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Student', 'Reg. Number', 'College / Dept.', 'Year', 'NFC', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-semibold">
                            {s.full_name[0]}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.registration_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{s.college}</p>
                      <p className="text-gray-400 text-xs">{s.department}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Year {s.year_of_study}</td>
                    <td className="px-4 py-3">{nfcBadge(s)}</td>
                    <td className="px-4 py-3">
                      {canManageStudents ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelected(s); setShowForm(true) }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => { setSelected(s); setShowNFC(true) }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors"
                            title="Manage NFC Card"
                          >
                            <CreditCard size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
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

        {count > 20 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Page {page} of {Math.ceil(count / 20)}</span>
            <div className="flex gap-2">
              <button className="btn-secondary px-3 py-1 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn-secondary px-3 py-1 text-xs" disabled={page >= Math.ceil(count / 20)} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={selected ? 'Edit Student' : 'Add Student'} size="lg">
        <StudentForm
          student={selected}
          onSuccess={() => { setShowForm(false); load() }}
        />
      </Modal>

      <Modal open={showNFC} onClose={() => setShowNFC(false)} title="Manage NFC Card">
        {selected && (
          <NFCAssignForm
            student={selected}
            onSuccess={() => { setShowNFC(false); load() }}
          />
        )}
      </Modal>
    </div>
  )
}
