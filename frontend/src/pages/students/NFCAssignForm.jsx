import { useState } from 'react'
import { CreditCard, ShieldOff, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { assignNFC, setNFCStatus } from '../../api/students'

export default function NFCAssignForm({ student, onSuccess }) {
  const nfc = student.nfc_card
  const [uid, setUid] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const doAssign = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await assignNFC(student.id, uid)
      toast.success('NFC card assigned.')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign NFC.')
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

      {nfc ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl">
            <CreditCard size={20} className="text-brand-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Current NFC Card</p>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">{nfc.uid}</p>
              <span className={nfc.is_active ? 'badge-green mt-1' : 'badge-red mt-1'}>
                {nfc.status}
              </span>
            </div>
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
        <form onSubmit={doAssign} className="space-y-4">
          <div>
            <label className="label">NFC Card UID *</label>
            <input
              className="input font-mono"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="e.g. A1B2C3D4"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Enter the unique ID from the NFC card.</p>
          </div>
          <button type="submit" disabled={loading || !uid} className="btn-primary w-full justify-center">
            <CreditCard size={15} /> {loading ? 'Assigning...' : 'Assign NFC Card'}
          </button>
        </form>
      )}
    </div>
  )
}
