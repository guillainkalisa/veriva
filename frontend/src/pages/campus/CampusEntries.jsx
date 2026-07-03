import { useState, useEffect, useCallback } from 'react'
import { DoorOpen, Wifi } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import { getCampusEntries } from '../../api/attendance'

export default function CampusEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    getCampusEntries({ search })
      .then(({ data }) => { setEntries(data.results); setCount(data.count) })
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <PageHeader title="Campus Entries" subtitle={`${count} total entry/exit events`} />

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by student name..." />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <DoorOpen size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No campus entries recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Student', 'Gate', 'Entry Time', 'Exit Time', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{e.student_detail?.full_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{e.student_detail?.registration_number}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.gate}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(e.entry_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {e.exit_time ? new Date(e.exit_time).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={e.status === 'entered' ? 'badge-green' : 'badge-gray'}>
                        {e.status === 'entered' ? 'On Campus' : 'Exited'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
