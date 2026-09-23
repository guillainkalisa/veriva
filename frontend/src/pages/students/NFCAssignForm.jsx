import { useState, useRef, useEffect } from 'react'
import { CreditCard, ShieldOff, AlertTriangle, RefreshCw, Copy, Check, Wifi, Keyboard } from 'lucide-react'
import toast from 'react-hot-toast'
import { assignNFC, setNFCStatus } from '../../api/students'
import Spinner from '../../components/Spinner'

function CopyableToken({ value }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy — select and copy manually.')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <p className="flex-1 text-xs text-gray-500 font-mono break-all bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
        {value}
      </p>
      <button type="button" onClick={copy} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 shrink-0">
        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
    </div>
  )
}

const SERIAL_MODES = [
  { key: 'reader', label: 'Tap on reader', icon: Wifi },
  { key: 'manual', label: 'Type manually', icon: Keyboard },
]

// The USB reader types the chip serial and presses Enter, so in reader mode a
// tap with this field focused submits the form.
function IssueCardForm({ studentId, label, onIssued }) {
  const [mode, setMode] = useState('reader')
  const [cardSerial, setCardSerial] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [mode])

  const switchMode = (next) => {
    setMode(next)
    setCardSerial('')
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const serial = cardSerial.trim()
    if (!serial) return
    setLoading(true)
    setError('')
    try {
      const { data } = await assignNFC(studentId, serial)
      toast.success('NFC card issued.')
      onIssued(data)
    } catch (err) {
      const data = err.response?.data
      setError(data?.card_serial?.[0] || data?.detail || 'Failed to issue NFC card.')
      setCardSerial('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Card serial</label>
        <div className="grid grid-cols-2 gap-1 p-1 mb-2 bg-gray-100 rounded-lg">
          {SERIAL_MODES.map(({ key, label: modeLabel, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === key ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={13} /> {modeLabel}
            </button>
          ))}
        </div>
        <input
          ref={inputRef}
          className="input font-mono"
          value={cardSerial}
          onChange={(e) => { setCardSerial(e.target.value); setError('') }}
          placeholder={mode === 'reader' ? 'Waiting for card tap...' : 'e.g. 0116658347'}
          inputMode={mode === 'manual' ? 'numeric' : undefined}
          autoComplete="off"
        />
        <p className="text-xs text-gray-400 mt-1">
          {mode === 'reader'
            ? 'Tap the card on the USB reader; the card is issued as soon as it is read.'
            : 'Type the 10-digit number exactly as the USB reader shows it, then press Issue.'}
        </p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button type="submit" disabled={loading || !cardSerial.trim()} className="btn-primary w-full justify-center">
        {loading ? <Spinner size={15} /> : <CreditCard size={15} />} {loading ? 'Issuing...' : label}
      </button>
    </form>
  )
}

export default function NFCAssignForm({ student, onSuccess }) {
  const nfc = student.nfc_card
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [issuedCard, setIssuedCard] = useState(null)

  const doStatus = async (action) => {
    setLoading(true)
    try {
      await setNFCStatus(student.id, action, reason)
      toast.success(`Card ${action === 'reactivate' ? 'reactivated' : 'status updated'}.`)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700">Student: {student.full_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{student.registration_number}</p>
      </div>

      {issuedCard ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 border border-green-200 bg-green-50 rounded-xl">
            <CreditCard size={20} className="text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Card issued &middot; serial {issuedCard.card_serial}</p>
              <p className="text-xs text-gray-500 mt-1">
                Now write this token onto the same card as a Text record using a phone (e.g. NFC Tools).
              </p>
            </div>
          </div>
          <CopyableToken value={issuedCard.uid} />
          <button className="btn-primary w-full justify-center" onClick={onSuccess}>
            Done
          </button>
        </div>
      ) : nfc ? (
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <CreditCard size={20} className="text-brand-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Current NFC Card</p>
                <span className={nfc.is_active ? 'badge-green mt-1' : 'badge-red mt-1'}>
                  {nfc.status}
                </span>
                {nfc.decrypted_registration_number && (
                  <p className="text-xs text-green-600 mt-1">
                    Verified &middot; encodes {nfc.decrypted_registration_number}
                  </p>
                )}
                {nfc.card_serial ? (
                  <p className="text-xs text-gray-500 mt-1">Card serial <span className="font-mono">{nfc.card_serial}</span></p>
                ) : (
                  <p className="text-xs text-amber-600 mt-1">
                    No card serial recorded, so USB readers won't recognise this card.
                    Deactivate it and issue a replacement to record one.
                  </p>
                )}
              </div>
            </div>
            <CopyableToken value={nfc.uid} />
          </div>

          {!nfc.is_active && (
            <div className="p-4 border border-gray-200 rounded-xl space-y-2">
              <p className="text-sm font-medium text-gray-900">Issue replacement card</p>
              <p className="text-xs text-gray-500">The old card stops working as soon as the new one is issued.</p>
              <IssueCardForm studentId={student.id} label="Issue Replacement" onIssued={setIssuedCard} />
            </div>
          )}

          <div>
            <label className="label">Reason (optional)</label>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Card lost, replacing..." />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {!nfc.is_active && (
              <button className="btn-success" onClick={() => doStatus('reactivate')} disabled={loading}>
                <RefreshCw size={14} /> Reactivate
              </button>
            )}
            {nfc.is_active && (
              <button className="btn-secondary" onClick={() => doStatus('deactivate')} disabled={loading}>
                <ShieldOff size={14} /> Deactivate
              </button>
            )}
            <button className="btn-danger" onClick={() => doStatus('report_lost')} disabled={loading}>
              <AlertTriangle size={14} /> Report Lost
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Tap a blank card on the USB reader to record its serial. VERIVA then generates an
            encrypted token from this student's registration number to write onto the card.
          </p>
          <IssueCardForm studentId={student.id} label="Issue NFC Card" onIssued={setIssuedCard} />
        </div>
      )}
    </div>
  )
}
