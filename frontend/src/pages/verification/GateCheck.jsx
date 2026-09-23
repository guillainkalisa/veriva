import { useState, useEffect, useRef, useCallback } from 'react'
import {
  CreditCard, Laptop, ScanLine, CheckCircle, XCircle, AlertTriangle, User,
  RotateCcw, ShieldAlert, X, Camera, ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { gateCheck } from '../../api/devices'
import { createIncident } from '../../api/verification'
import { useGate } from '../../hooks/useGate'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import QrCameraScanner from '../../components/QrCameraScanner'

const OUTCOMES = {
  owner:        { tone: 'green', icon: CheckCircle,   title: 'Owner verified' },
  borrower:     { tone: 'blue',  icon: CheckCircle,   title: 'Authorised borrower' },
  mismatch:     { tone: 'red',   icon: XCircle,       title: 'Mismatch — do not let the device leave' },
  student_only: { tone: 'gray',  icon: CreditCard,    title: 'Devices registered to this student' },
  device_only:  { tone: 'gray',  icon: Laptop,        title: 'Registered owner of this device' },
}

const TONES = {
  green: 'bg-green-50 border-green-200 text-green-800',
  blue:  'bg-blue-50 border-blue-200 text-blue-800',
  red:   'bg-red-50 border-red-200 text-red-800',
  gray:  'bg-gray-50 border-gray-200 text-gray-800',
}

function StepCard({ number, icon: Icon, title, children }) {
  return (
    <div className="card p-5 space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center">{number}</span>
        <Icon size={16} className="text-gray-400" /> {title}
      </p>
      {children}
    </div>
  )
}

function Captured({ label, onClear }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
      <CheckCircle size={16} className="text-green-600 shrink-0" />
      <p className="flex-1 text-sm text-green-800">{label}</p>
      <button type="button" onClick={onClear} className="p-1 rounded text-green-700 hover:bg-green-100" title="Clear">
        <X size={14} />
      </button>
    </div>
  )
}

function PersonCard({ title, student }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</p>
      <div className="flex items-start gap-4">
        {student.photo_url ? (
          <img src={student.photo_url} alt={student.full_name} className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100 shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
            <User size={36} className="text-brand-400" />
          </div>
        )}
        <div className="space-y-1.5 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{student.full_name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-blue font-mono text-xs">{student.registration_number}</span>
            <span className={student.is_active ? 'badge-green' : 'badge-red'}>
              {student.is_active ? 'Active Student' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-500">{student.department_name} &middot; Year {student.year_of_study}</p>
        </div>
      </div>
    </div>
  )
}

function DeviceCard({ device }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
          <Laptop size={20} className="text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {device.brand} {device.model}
            {device.color && <span className="font-normal text-gray-500"> &middot; {device.color}</span>}
          </p>
          <p className="text-xs text-gray-400 mt-2">Serial number &mdash; compare with the label on the device</p>
          <p className="font-mono font-semibold text-gray-800 break-all">{device.serial_number}</p>
          {!device.is_active && <span className="badge-red mt-2">Device deactivated</span>}
        </div>
      </div>
    </div>
  )
}

export default function GateCheck() {
  const { gateChoices, gateId, setGateId, currentGate, noGate } = useGate()
  const [studentInput, setStudentInput] = useState('')
  const [studentValue, setStudentValue] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reported, setReported] = useState(false)
  const studentRef = useRef(null)

  const runCheck = useCallback(async (student, qr) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await gateCheck({ student, qr_data: qr, gate: gateId })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Check failed.')
    } finally {
      setLoading(false)
    }
  }, [gateId])

  // A full check runs as soon as both halves are in; a one-sided check only on request.
  useEffect(() => {
    if (studentValue && qrValue) runCheck(studentValue, qrValue)
  }, [studentValue, qrValue, runCheck])

  const reset = () => {
    setStudentInput('')
    setStudentValue('')
    setQrValue('')
    setCameraOpen(false)
    setResult(null)
    setError(null)
    setReported(false)
    setTimeout(() => studentRef.current?.focus())
  }

  const submitStudent = (e) => {
    e.preventDefault()
    const value = studentInput.trim()
    if (value) setStudentValue(value)
  }

  const onQrScan = (data) => {
    setCameraOpen(false)
    setQrValue(data)
    if (!studentValue) studentRef.current?.focus()
  }

  const reportMismatch = async () => {
    const { student, device, owner } = result
    try {
      await createIncident({
        type: 'device_mismatch',
        severity: 'high',
        description: `${student.full_name} (${student.registration_number}) presented ${device.brand} ${device.model} `
          + `(SN ${device.serial_number}), which is registered to ${owner.full_name} (${owner.registration_number}).`,
        involved_student: student.id,
        involved_device: device.id,
        location: result.gate.name,
      })
      setReported(true)
      toast.success('Incident reported.')
    } catch {
      toast.error('Failed to report incident.')
    }
  }

  const outcome = result && OUTCOMES[result.outcome]
  const weakId = result?.identified_by === 'serial' || result?.identified_by === 'registration_number'

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Gate Check"
        subtitle="Tap the student's card and scan the device QR to confirm they may take it"
        action={!noGate && (
          gateChoices.length > 1 ? (
            <select className="input w-auto" value={gateId ?? ''} onChange={(e) => setGateId(Number(e.target.value))}>
              {gateChoices.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <span className="badge-blue">{currentGate?.name}</span>
          )
        )}
      />

      {noGate ? (
        <div className="card p-8 text-center">
          <AlertTriangle size={40} className="text-amber-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">No gate assigned</p>
          <p className="text-sm text-gray-500 mt-1">Ask an administrator to assign you to a gate.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <StepCard number={1} icon={CreditCard} title="Student">
              {studentValue ? (
                <Captured
                  label={result?.student ? result.student.full_name : 'Student captured'}
                  onClear={() => { setStudentValue(''); setStudentInput(''); setResult(null); setError(null) }}
                />
              ) : (
                <form onSubmit={submitStudent} className="space-y-2">
                  <input
                    ref={studentRef}
                    className="input font-mono"
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="Tap card on reader, or type reg number"
                    autoComplete="off"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400">A card tap is read instantly; press Enter after typing a reg number.</p>
                </form>
              )}
            </StepCard>

            <StepCard number={2} icon={Laptop} title="Device">
              {qrValue ? (
                <Captured
                  label={result?.device ? `${result.device.brand} ${result.device.model}` : 'QR code scanned'}
                  onClear={() => { setQrValue(''); setResult(null); setError(null) }}
                />
              ) : cameraOpen ? (
                <div className="space-y-2">
                  <QrCameraScanner onScan={onQrScan} />
                  <button type="button" className="btn-secondary w-full justify-center" onClick={() => setCameraOpen(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className="btn-primary w-full justify-center" onClick={() => setCameraOpen(true)}>
                  <Camera size={16} /> Scan QR with camera
                </button>
              )}
            </StepCard>
          </div>

          {!result && !loading && (studentValue || qrValue) && !(studentValue && qrValue) && (
            <button
              type="button"
              className="btn-secondary w-full justify-center"
              onClick={() => runCheck(studentValue, qrValue)}
            >
              <ScanLine size={15} />
              {studentValue ? 'No QR on the device — show their registered devices' : 'No card — show the registered owner'}
            </button>
          )}

          {loading && (
            <div className="card p-6 flex items-center justify-center gap-3 text-gray-500">
              <Spinner size={18} /> Checking...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <XCircle size={18} className="text-red-500 shrink-0" />
              <p className="flex-1 text-sm text-red-700">{error}</p>
              <button type="button" className="text-sm font-medium text-red-700 hover:underline" onClick={reset}>
                Start over
              </button>
            </div>
          )}

          {result && outcome && (
            <div className="space-y-4 animate-fade-in">
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${TONES[outcome.tone]}`}>
                <outcome.icon size={22} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{outcome.title}</p>
                  {result.outcome === 'owner' && (
                    <p className="text-sm mt-0.5">{result.student.full_name} is the registered owner of this device.</p>
                  )}
                  {result.outcome === 'borrower' && (
                    <p className="text-sm mt-0.5 flex flex-wrap items-center gap-1">
                      On loan from {result.active_loan.lender_name} <ArrowRight size={12} /> {result.active_loan.borrower_name}
                      {' '}until {new Date(result.active_loan.end_date).toLocaleString()}
                    </p>
                  )}
                  {result.outcome === 'mismatch' && (
                    <p className="text-sm mt-0.5">This device is registered to {result.owner.full_name}, not the person presenting it.</p>
                  )}
                </div>
              </div>

              {weakId && result.student && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  <AlertTriangle size={16} className="shrink-0" /> Confirm the photo of the student.
                </div>
              )}

              {result.student && (
                <PersonCard title={result.device ? 'Person presenting the device' : 'Student'} student={result.student} />
              )}

              {result.device && <DeviceCard device={result.device} />}

              {result.device && result.outcome !== 'owner' && (
                <PersonCard title="Registered owner" student={result.owner} />
              )}

              {result.outcome === 'student_only' && (
                result.devices.length === 0 ? (
                  <p className="card p-5 text-sm text-gray-500">No devices are registered to or on loan to this student.</p>
                ) : (
                  result.devices.map((d) => <DeviceCard key={d.id} device={d} />)
                )
              )}

              <div className="flex gap-3">
                {result.outcome === 'mismatch' && (
                  <button type="button" className="btn-danger flex-1 justify-center" onClick={reportMismatch} disabled={reported}>
                    <ShieldAlert size={15} /> {reported ? 'Incident reported' : 'Report incident'}
                  </button>
                )}
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={reset}>
                  <RotateCcw size={15} /> Next check
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
