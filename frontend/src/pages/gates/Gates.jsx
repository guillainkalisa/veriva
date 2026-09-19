import { useState, useEffect, useCallback } from 'react'
import { Plus, Fingerprint, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import LoadingState from '../../components/LoadingState'
import Spinner from '../../components/Spinner'
import { getGates, createGate, updateGate, deleteGate } from '../../api/campus'

const empty = { name: '', code: '', location: '', is_active: true }

export default function Gates() {
  const [gates, setGates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getGates().then(({ data }) => setGates(data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openForm = (g = null) => {
    setSelected(g)
    setForm(g ? { name: g.name, code: g.code, location: g.location, is_active: g.is_active } : empty)
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (selected) { await updateGate(selected.id, form); toast.success('Gate updated.') }
      else { await createGate(form); toast.success('Gate created.') }
      setShowForm(false)
      load()
    } catch (err) {
      const d = err.response?.data
      toast.error(d ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' | ') : 'Failed to save gate.')
    } finally { setSaving(false) }
  }

  const remove = async (g) => {
    if (!confirm(`Delete "${g.name}"? If it has recorded entries, deactivate it instead.`)) return
    try {
      await deleteGate(g.id)
      toast.success('Gate deleted.')
      load()
    } catch {
      toast.error('Cannot delete — this gate has recorded entries. Deactivate it instead.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Gates"
        subtitle="Campus entry points. Guards are assigned to gates in user management."
        action={<button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add Gate</button>}
      />

      <div className="card">
        {loading ? (
          <LoadingState />
        ) : gates.length === 0 ? (
          <EmptyState icon={Fingerprint} message="No gates yet." action={
            <button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add First Gate</button>
          } />
        ) : (
          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Name', 'Location', 'Guards', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gates.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-semibold text-brand-700">{g.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                    <td className="px-4 py-3 text-gray-600">{g.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{g.guard_count}</td>
                    <td className="px-4 py-3">
                      <span className={g.is_active ? 'badge-green' : 'badge-gray'}>{g.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openForm(g)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600" title="Edit">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => remove(g)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={selected ? 'Edit Gate' : 'Add Gate'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Main Gate" />
            </div>
            <div>
              <label className="label">Code *</label>
              <input className="input font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="e.g. MAIN" />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Front entrance, near reception" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (available for tapping)
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saving && <Spinner size={14} />} {saving ? 'Saving...' : selected ? 'Update Gate' : 'Create Gate'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
