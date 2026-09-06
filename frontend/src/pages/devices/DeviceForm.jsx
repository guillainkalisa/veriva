import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createDevice, updateDevice } from '../../api/devices'
import { getStudents } from '../../api/students'
import { getDirectorates } from '../../api/campus'

export default function DeviceForm({ device, onSuccess }) {
  const [form, setForm] = useState({
    owner: device?.owner || '',
    brand: device?.brand || '',
    model: device?.model || '',
    serial_number: device?.serial_number || '',
    color: device?.color || '',
    specifications: device?.specifications || '',
    managing_directorate: device?.managing_directorate || '',
  })
  const [students, setStudents] = useState([])
  const [directorates, setDirectorates] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getStudents({ page_size: 200 }).then(({ data }) => setStudents(data.results))
    getDirectorates().then(({ data }) => setDirectorates(data))
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, managing_directorate: form.managing_directorate || null }
      if (device) {
        await updateDevice(device.id, payload)
        toast.success('Device updated.')
      } else {
        await createDevice(payload)
        toast.success('Device registered. QR code generated.')
      }
      onSuccess()
    } catch (err) {
      const errors = err.response?.data
      const msg = errors
        ? Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        : 'Failed to save device.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Owner (Student) *</label>
        <select className="input" value={form.owner} onChange={(e) => set('owner', e.target.value)} required>
          <option value="">Select student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name} ({s.registration_number})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Brand *</label>
          <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} required placeholder="e.g. HP, Dell, Lenovo" />
        </div>
        <div>
          <label className="label">Model *</label>
          <input className="input" value={form.model} onChange={(e) => set('model', e.target.value)} required placeholder="e.g. EliteBook 840" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Serial Number *</label>
          <input className="input font-mono" value={form.serial_number} onChange={(e) => set('serial_number', e.target.value)} required placeholder="Device serial number" />
        </div>
        <div>
          <label className="label">Color</label>
          <input className="input" value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. Silver, Black" />
        </div>
      </div>

      <div>
        <label className="label">Specifications</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.specifications}
          onChange={(e) => set('specifications', e.target.value)}
          placeholder="e.g. Intel Core i5, 8GB RAM, 256GB SSD"
        />
      </div>

      <div>
        <label className="label">Managing Directorate</label>
        <select className="input" value={form.managing_directorate}
          onChange={(e) => set('managing_directorate', e.target.value)}>
          <option value="">Unassigned</option>
          {directorates.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {!device && (
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          A unique QR code will be automatically generated and attached to this device upon registration.
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Saving...' : device ? 'Update Device' : 'Register Device'}
      </button>
    </form>
  )
}
