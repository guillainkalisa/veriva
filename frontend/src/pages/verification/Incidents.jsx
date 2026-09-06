import { useState, useEffect, useCallback } from 'react'
import { Plus, ShieldAlert, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import { getIncidents, createIncident, resolveIncident } from '../../api/verification'
import { getStudents } from '../../api/students'
import { getDirectorates } from '../../api/campus'
import { useRole } from '../../hooks/useRole'

const TYPES = [
  { value: 'device_mismatch', label: 'Device Ownership Mismatch' },
  { value: 'card_sharing', label: 'NFC Card Sharing Attempt' },
  { value: 'unauthorized_entry', label: 'Unauthorized Campus Entry' },
  { value: 'stolen_device', label: 'Stolen Device Report' },
  { value: 'stranger', label: 'Unregistered Person on Campus' },
  { value: 'other', label: 'Other' },
]

export default function Incidents() {
  const { canResolveIncidents } = useRole()
  const [incidents, setIncidents] = useState([])
  const [students, setStudents] = useState([])
  const [directorates, setDirectorates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showResolve, setShowResolve] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const emptyForm = { type: '', severity: 'medium', description: '', involved_student: '', location: '', handling_directorate: '' }
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(() => {
    setLoading(true)
    const params = filter ? { is_resolved: filter === 'resolved' } : {}
    Promise.all([getIncidents(params), getStudents({ page_size: 200 }), getDirectorates()])
      .then(([{ data: i }, { data: s }, { data: d }]) => {
        setIncidents(i.results)
        setStudents(s.results)
        setDirectorates(d)
      })
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.involved_student) delete payload.involved_student
      if (!payload.handling_directorate) delete payload.handling_directorate
      await createIncident(payload)
      toast.success('Incident reported.')
      setShowForm(false)
      load()
    } catch { toast.error('Failed to report incident.') }
    finally { setSaving(false) }
  }

  const handleResolve = async () => {
    setSaving(true)
    try {
      await resolveIncident(selected.id, resolveNotes)
      toast.success('Incident resolved.')
      setShowResolve(false)
      setResolveNotes('')
      load()
    } catch { toast.error('Failed to resolve.') }
    finally { setSaving(false) }
  }

  const severityClass = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue' }

  return (
    <div>
      <PageHeader
        title="Incident Reports"
        action={
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setShowForm(true) }}>
            <Plus size={16} /> Report Incident
          </button>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex gap-2">
          {[['', 'All'], ['unresolved', 'Unresolved'], ['resolved', 'Resolved']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === val ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : incidents.length === 0 ? (
          <EmptyState icon={ShieldAlert} message="No incidents found." />
        ) : (
          <div className="divide-y divide-gray-50">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-4 hover:bg-gray-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{inc.type_display}</span>
                      <span className={severityClass[inc.severity] || 'badge-gray'}>{inc.severity_display}</span>
                      <span className={inc.is_resolved ? 'badge-green' : 'badge-red'}>
                        {inc.is_resolved ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{inc.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {inc.involved_student_detail && `Student: ${inc.involved_student_detail.full_name} · `}
                      {inc.location && `Location: ${inc.location} · `}
                      {inc.handling_directorate_name && `${inc.handling_directorate_name} · `}
                      Reported by {inc.reported_by_name} · {new Date(inc.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!inc.is_resolved && canResolveIncidents && (
                    <button
                      className="btn-success text-xs py-1"
                      onClick={() => { setSelected(inc); setResolveNotes(''); setShowResolve(true) }}
                    >
                      <CheckCircle size={13} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Report Incident" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                <option value="">Select type...</option>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Severity *</label>
              <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Involved Student</label>
              <select className="input" value={form.involved_student} onChange={(e) => setForm({ ...form, involved_student: e.target.value })}>
                <option value="">None / Unknown</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Gate, Block A" />
            </div>
          </div>
          <div>
            <label className="label">Handling Directorate</label>
            <select className="input" value={form.handling_directorate} onChange={(e) => setForm({ ...form, handling_directorate: e.target.value })}>
              <option value="">Unassigned</option>
              {directorates.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-danger w-full justify-center">
            <ShieldAlert size={15} /> {saving ? 'Reporting...' : 'Submit Incident Report'}
          </button>
        </form>
      </Modal>

      <Modal open={showResolve} onClose={() => setShowResolve(false)} title="Resolve Incident" size="sm">
        <div className="space-y-4">
          {selected && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.description}</p>}
          <div>
            <label className="label">Resolution Notes</label>
            <textarea className="input resize-none" rows={3} value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Describe how this was resolved..." />
          </div>
          <button className="btn-success w-full justify-center" onClick={handleResolve} disabled={saving}>
            <CheckCircle size={15} /> {saving ? 'Resolving...' : 'Mark as Resolved'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
