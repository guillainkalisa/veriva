import { useState, useEffect, useRef, useCallback } from 'react'
import { XCircle, AlertTriangle, User, LogIn, LogOut as ExitIcon } from 'lucide-react'
import LogoLoader from '../../components/LogoLoader'
import SuccessTick from '../../components/SuccessTick'
import StationHeader from '../../components/StationHeader'
import { nfcAttendanceTap, getSessions } from '../../api/attendance'

const AUTO_RESET_MS = 5000

export default function SessionScan() {
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [uid, setUid] = useState('')
  const [result, setResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    getSessions({ is_open: true, ordering: '-date' }).then(({ data }) => setSessions(data.results))
  }, [])

  useEffect(() => {
    if (!sessionId && sessions.length) setSessionId(sessions[0].id)
  }, [sessions, sessionId])

  const currentSession = sessions.find((s) => s.id === sessionId)

  const refocus = useCallback(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  useEffect(() => {
    refocus()
    window.addEventListener('click', refocus)
    return () => window.removeEventListener('click', refocus)
  }, [refocus])

  const handleTap = useCallback(async (cardUid) => {
    if (!cardUid.trim() || scanning || !sessionId) return
    setScanning(true)
    setResult(null)
    clearTimeout(timerRef.current)

    try {
      const { data } = await nfcAttendanceTap({ nfc_uid: cardUid.trim(), session_id: sessionId })
      setResult({ ok: true, ...data })
    } catch (err) {
      setResult({ ok: false, error: err.response?.data?.detail || 'Card not recognised.' })
    } finally {
      setScanning(false)
      setUid('')
      timerRef.current = setTimeout(() => { setResult(null); refocus() }, AUTO_RESET_MS)
    }
  }, [scanning, sessionId, refocus])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleTap(uid) }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const student = result?.student
  const isIn = result?.action === 'in'
  const noSession = sessions.length === 0

  return (
    <div className="min-h-dvh bg-brand-900 flex flex-col select-none">
      <StationHeader title="Session Check-in" exitTo="/attendance">
        <label className="text-brand-300 text-sm">Session:</label>
        {sessions.length > 1 ? (
          <select
            value={sessionId ?? ''}
            onChange={(e) => setSessionId(Number(e.target.value))}
            onFocus={() => clearTimeout(timerRef.current)}
            onBlur={refocus}
            className="bg-brand-800 text-white text-sm rounded-lg px-3 py-1.5 border border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.course_code} &middot; {s.room}</option>)}
          </select>
        ) : (
          <span className="bg-brand-800 text-white text-sm rounded-lg px-3 py-1.5 border border-brand-700">
            {currentSession ? `${currentSession.course_code} · ${currentSession.room}` : '—'}
          </span>
        )}

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          scanning ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          {scanning ? 'Reading...' : 'Ready'}
        </div>
      </StationHeader>

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

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {noSession && (
          <div className="text-center">
            <AlertTriangle size={56} className="text-amber-400 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold">No open sessions</p>
            <p className="text-brand-400 text-sm mt-2">Open an attendance session first, then come back here.</p>
          </div>
        )}

        {!noSession && !result && !scanning && (
          <div className="text-center animate-pulse">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-brand-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-brand-600">
              <img src="/veriva-logo-white.svg" alt="" className="w-16 h-16 sm:w-20 sm:h-20 opacity-80" />
            </div>
            <p className="text-white text-xl sm:text-2xl font-semibold">Waiting for Card</p>
            <p className="text-brand-400 text-sm mt-2">Ask the student to tap their card on the reader</p>
            <p className="text-brand-600 text-xs mt-1">
              {currentSession ? `${currentSession.course_code} · ${currentSession.course_name}` : ''}
            </p>
          </div>
        )}

        {scanning && <LogoLoader tone="light" className="w-32 sm:w-40" />}

        {result && result.ok && student && (
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-4 ${isIn ? 'border-green-500' : 'border-blue-500'}`}>
            <div className={`px-5 sm:px-8 py-4 flex items-center gap-3 ${isIn ? 'bg-green-500' : 'bg-blue-500'}`}>
              {isIn ? <LogIn size={28} className="text-white" /> : <ExitIcon size={28} className="text-white" />}
              <div>
                <p className="text-white font-bold text-lg sm:text-xl">
                  {isIn ? 'Checked In' : 'Checked Out'}
                </p>
                <p className="text-white/80 text-sm">
                  {currentSession?.course_code} &middot; {new Date().toLocaleTimeString()}
                </p>
              </div>
              <SuccessTick tone="light" size={44} className="ml-auto" />
            </div>

            <div className="bg-white px-5 py-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8 text-center sm:text-left">
              {student.photo_url ? (
                <img src={student.photo_url} alt={student.full_name} className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-gray-100 shrink-0" />
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0 border-4 border-gray-100">
                  <User size={56} className="text-brand-300" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{student.full_name}</h2>
                <p className="text-brand-600 font-mono font-semibold text-lg mt-1">{student.registration_number}</p>
                {result.already_recorded && (
                  <p className="text-amber-600 text-sm mt-2">Already checked in for this session.</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-5 sm:px-8 py-3 text-center text-xs text-gray-400">
              Clearing in {AUTO_RESET_MS / 1000} seconds&hellip;
            </div>
          </div>
        )}

        {result && !result.ok && (
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-4 border-red-500">
            <div className="bg-red-500 px-5 sm:px-8 py-4 flex items-center gap-3">
              <XCircle size={28} className="text-white" />
              <p className="text-white font-bold text-lg sm:text-xl">Not Recorded</p>
            </div>
            <div className="bg-white px-5 py-6 sm:p-8 text-center">
              <AlertTriangle size={56} className="text-red-400 mx-auto mb-4" />
              <p className="text-gray-800 text-lg sm:text-xl font-semibold">{result.error}</p>
            </div>
            <div className="bg-gray-50 px-5 sm:px-8 py-3 text-center text-xs text-gray-400">
              Clearing in {AUTO_RESET_MS / 1000} seconds&hellip;
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
