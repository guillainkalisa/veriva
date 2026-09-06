import { useState, useEffect, useRef, useCallback } from 'react'
import { Wifi, CheckCircle, XCircle, AlertTriangle, User, DoorOpen, LogOut as ExitIcon } from 'lucide-react'
import { nfcCampusTap } from '../../api/attendance'

const GATES = ['Main Gate', 'Gate A', 'Gate B', 'Gate C', 'Library Gate']
const AUTO_RESET_MS = 5000  // clear result card after 5 s

export default function NFCStation() {
  const [gate, setGate]         = useState('Main Gate')
  const [uid, setUid]           = useState('')
  const [result, setResult]     = useState(null)   // { ok, action, student, entry, error }
  const [scanning, setScanning] = useState(false)
  const inputRef  = useRef(null)
  const timerRef  = useRef(null)

  // keep input focused so the NFC reader (HID) can type into it
  const refocus = useCallback(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  useEffect(() => {
    refocus()
    window.addEventListener('click', refocus)
    return () => window.removeEventListener('click', refocus)
  }, [refocus])

  const handleTap = useCallback(async (cardUid) => {
    if (!cardUid.trim() || scanning) return
    setScanning(true)
    setResult(null)
    clearTimeout(timerRef.current)

    try {
      const { data } = await nfcCampusTap({ nfc_uid: cardUid.trim(), gate })
      setResult({ ok: true, ...data })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Card not recognised.'
      const status = err.response?.data?.status
      setResult({ ok: false, error: msg, status })
    } finally {
      setScanning(false)
      setUid('')
      // auto-clear after delay, then refocus
      timerRef.current = setTimeout(() => {
        setResult(null)
        refocus()
      }, AUTO_RESET_MS)
    }
  }, [scanning, gate, refocus])

  // NFC reader sends UID then Enter — capture on keydown
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTap(uid)
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const student = result?.student
  const isEntry = result?.action === 'entry'
  const isExit  = result?.action === 'exit'

  return (
    <div className="min-h-screen bg-brand-900 flex flex-col select-none">

      {/* top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-brand-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">VERIVA</p>
            <p className="text-brand-300 text-xs">NFC Scanning Station</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-brand-300 text-sm">Gate:</label>
          <select
            value={gate}
            onChange={(e) => setGate(e.target.value)}
            onFocus={() => clearTimeout(timerRef.current)}
            onBlur={refocus}
            className="bg-brand-800 text-white text-sm rounded-lg px-3 py-1.5 border border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {GATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            scanning ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            {scanning ? 'Reading...' : 'Ready'}
          </div>
        </div>
      </header>

      {/* invisible input — always focused to capture NFC reader keystrokes */}
      <input
        ref={inputRef}
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        onKeyDown={handleKeyDown}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        aria-hidden="true"
        autoComplete="off"
        readOnly={scanning}
      />

      {/* main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {!result && !scanning && (
          <div className="text-center animate-pulse">
            <div className="w-40 h-40 bg-brand-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-brand-600">
              <Wifi size={64} className="text-brand-400" />
            </div>
            <p className="text-white text-2xl font-semibold">Waiting for NFC Card</p>
            <p className="text-brand-400 text-sm mt-2">Ask the student to tap their card on the reader</p>
            <p className="text-brand-600 text-xs mt-1">Gate: {gate}</p>
          </div>
        )}

        {scanning && (
          <div className="text-center">
            <div className="w-40 h-40 bg-brand-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-500">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-white text-2xl font-semibold">Verifying card...</p>
          </div>
        )}

        {result && result.ok && student && (
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-4 ${
            isEntry ? 'border-green-500' : 'border-blue-500'
          }`}>
            {/* status banner */}
            <div className={`px-8 py-4 flex items-center gap-3 ${isEntry ? 'bg-green-500' : 'bg-blue-500'}`}>
              {isEntry
                ? <DoorOpen size={28} className="text-white" />
                : <ExitIcon size={28} className="text-white" />
              }
              <div>
                <p className="text-white font-bold text-xl">
                  {isEntry ? 'Campus Entry Recorded' : 'Campus Exit Recorded'}
                </p>
                <p className="text-white/80 text-sm">{gate} &middot; {new Date().toLocaleTimeString()}</p>
              </div>
              <CheckCircle size={32} className="text-white ml-auto" />
            </div>

            {/* student info */}
            <div className="bg-white px-8 py-8 flex items-center gap-8">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.full_name}
                  className="w-36 h-36 rounded-2xl object-cover border-4 border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-36 h-36 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0 border-4 border-gray-100">
                  <User size={56} className="text-brand-300" />
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">{student.full_name}</h2>
                <p className="text-brand-600 font-mono font-semibold text-lg mt-1">{student.registration_number}</p>
                <div className="mt-3 space-y-1 text-gray-500 text-sm">
                  <p>{student.college_name}</p>
                  <p>{student.department_name}</p>
                  <p>Year {student.year_of_study}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                  student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {student.is_active ? 'Active Student' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* auto-reset countdown hint */}
            <div className="bg-gray-50 px-8 py-3 text-center text-xs text-gray-400">
              Clearing in {AUTO_RESET_MS / 1000} seconds&hellip;
            </div>
          </div>
        )}

        {result && !result.ok && (
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-4 border-red-500">
            <div className="bg-red-500 px-8 py-4 flex items-center gap-3">
              <XCircle size={28} className="text-white" />
              <p className="text-white font-bold text-xl">Access Denied</p>
            </div>
            <div className="bg-white px-8 py-8 text-center">
              <AlertTriangle size={56} className="text-red-400 mx-auto mb-4" />
              <p className="text-gray-800 text-xl font-semibold">{result.error}</p>
              {result.status && (
                <p className="text-gray-400 text-sm mt-2">Card status: <span className="font-medium capitalize">{result.status}</span></p>
              )}
            </div>
            <div className="bg-gray-50 px-8 py-3 text-center text-xs text-gray-400">
              Clearing in {AUTO_RESET_MS / 1000} seconds&hellip;
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
