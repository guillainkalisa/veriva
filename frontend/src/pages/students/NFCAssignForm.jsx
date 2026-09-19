import { useState } from 'react'
import { CreditCard, ShieldOff, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react'
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

export default function NFCAssignForm({ student, onSuccess }) {
  const nfc = student.nfc_card
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [issuedCard, setIssuedCard] = useState(null)

  const doAssign = async () => {
    setLoading(true)
    try {
      const { data } = await assignNFC(student.id)
      setIssuedCard(data)
      toast.success('NFC card issued.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to issue NFC card.')
    } finally {
      setLoading(false)
    }
  }

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
              <p className="text-sm font-medium text-gray-900">Card issued</p>
              <p className="text-xs text-gray-500 mt-1">
                Write this value onto the physical NFC tag using your external writer tool.
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
              </div>
            </div>
            <CopyableToken value={nfc.uid} />
          </div>

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
            Issuing a card generates an encrypted token from this student's registration number —
            no manual entry needed.
          </p>
          <button onClick={doAssign} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <Spinner size={15} /> : <CreditCard size={15} />} {loading ? 'Issuing...' : 'Issue NFC Card'}
          </button>
        </div>
      )}
    </div>
  )
}
