import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createStudent, updateStudent } from '../../api/students'
import { getColleges, getSchools, getDepartments, getPrograms } from '../../api/organization'

const YEARS = [1, 2, 3, 4, 5]

export default function StudentForm({ student, onSuccess }) {
  const [form, setForm] = useState({
    registration_number: student?.registration_number || '',
    full_name: student?.full_name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    college: student?.college || '',
    school: student?.school || '',
    department: student?.department || '',
    program: student?.program || '',
    year_of_study: student?.year_of_study || 1,
  })
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  const [colleges, setColleges] = useState([])
  const [schools, setSchools] = useState([])
  const [departments, setDepartments] = useState([])
  const [programs, setPrograms] = useState([])

  // Load lookup lists. When editing, walk down the student's existing chain.
  useEffect(() => {
    getColleges().then(({ data }) => setColleges(data))
    if (student?.college) getSchools(student.college).then(({ data }) => setSchools(data))
    if (student?.school) getDepartments(student.school).then(({ data }) => setDepartments(data))
    if (student?.department) getPrograms(student.department).then(({ data }) => setPrograms(data))
  }, [student])

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const onCollegeChange = (id) => {
    setForm((f) => ({ ...f, college: id, school: '', department: '', program: '' }))
    setSchools([]); setDepartments([]); setPrograms([])
    if (id) getSchools(id).then(({ data }) => setSchools(data))
  }

  const onSchoolChange = (id) => {
    setForm((f) => ({ ...f, school: id, department: '', program: '' }))
    setDepartments([]); setPrograms([])
    if (id) getDepartments(id).then(({ data }) => setDepartments(data))
  }

  const onDepartmentChange = (id) => {
    setForm((f) => ({ ...f, department: id, program: '' }))
    setPrograms([])
    if (id) getPrograms(id).then(({ data }) => setPrograms(data))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = new FormData()
      Object.entries(form).forEach(([k, v]) => body.append(k, v))
      if (photo) body.append('photo', photo)

      if (student) {
        await updateStudent(student.id, body)
        toast.success('Student updated.')
      } else {
        await createStudent(body)
        toast.success('Student created.')
      }
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ')
        : 'Failed to save student.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const Select = ({ label, value, onChange, options, disabled, placeholder }) => (
    <div>
      <label className="label">{label} *</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required disabled={disabled}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Registration Number *</label>
          <input className="input font-mono" value={form.registration_number}
            onChange={(e) => setField('registration_number', e.target.value.toUpperCase())} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email *</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="07XXXXXXXX" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="College" value={form.college} onChange={onCollegeChange}
          options={colleges} placeholder="Select college..." />
        <Select label="School" value={form.school} onChange={onSchoolChange}
          options={schools} disabled={!form.college} placeholder="Select school..." />
        <Select label="Department" value={form.department} onChange={onDepartmentChange}
          options={departments} disabled={!form.school} placeholder="Select department..." />
        <Select label="Programme" value={form.program} onChange={(v) => setField('program', v)}
          options={programs} disabled={!form.department} placeholder="Select programme..." />
      </div>

      <div>
        <label className="label">Year of Study *</label>
        <select className="input" value={form.year_of_study}
          onChange={(e) => setField('year_of_study', Number(e.target.value))} required>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Student Photo</label>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Saving...' : student ? 'Update Student' : 'Create Student'}
        </button>
      </div>
    </form>
  )
}
