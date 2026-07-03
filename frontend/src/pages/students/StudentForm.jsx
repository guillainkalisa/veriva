import { useState } from 'react'
import toast from 'react-hot-toast'
import { createStudent, updateStudent } from '../../api/students'

const COLLEGES = [
  'College of Science and Technology',
  'College of Business and Economics',
  'College of Education',
  'College of Medicine and Health Sciences',
  'College of Arts and Social Sciences',
  'College of Agriculture, Animal Sciences and Veterinary Medicine',
]

export default function StudentForm({ student, onSuccess }) {
  const [form, setForm] = useState({
    registration_number: student?.registration_number || '',
    full_name: student?.full_name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    college: student?.college || '',
    department: student?.department || '',
    program: student?.program || '',
    year_of_study: student?.year_of_study || 1,
  })
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('photo', photo)

      if (student) {
        await updateStudent(student.id, fd)
        toast.success('Student updated.')
      } else {
        await createStudent(fd)
        toast.success('Student created.')
      }
      onSuccess()
    } catch (err) {
      const errors = err.response?.data
      const msg = errors
        ? Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        : 'Failed to save student.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Registration Number *</label>
          <input className="input font-mono" value={form.registration_number} onChange={(e) => set('registration_number', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email *</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="07XXXXXXXX" />
        </div>
      </div>

      <div>
        <label className="label">College *</label>
        <select className="input" value={form.college} onChange={(e) => set('college', e.target.value)} required>
          <option value="">Select college...</option>
          {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Department *</label>
          <input className="input" value={form.department} onChange={(e) => set('department', e.target.value)} required placeholder="e.g. Information Technology" />
        </div>
        <div>
          <label className="label">Program *</label>
          <input className="input" value={form.program} onChange={(e) => set('program', e.target.value)} required placeholder="e.g. Bachelor of IT" />
        </div>
      </div>

      <div>
        <label className="label">Year of Study *</label>
        <select className="input" value={form.year_of_study} onChange={(e) => set('year_of_study', Number(e.target.value))} required>
          {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Student Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Saving...' : student ? 'Update Student' : 'Create Student'}
        </button>
      </div>
    </form>
  )
}
