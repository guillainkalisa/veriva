import { useState } from 'react'
import { ScanLine, CheckCircle, XCircle, AlertTriangle, User, Laptop, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { verifyDevice } from '../../api/devices'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'

export default function VerifyDevice() {
  const [qrInput, setQrInput] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setResult(null)
    setError(null)
    setLoading(true)
    try {
      const { data } = await verifyDevice(qrInput.trim())
      setResult(data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Device not found or QR code is invalid.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setQrInput('')
    setResult(null)
    setError(null)
  }

  const owner = result?.owner
  const device = result?.device
  const loan = result?.active_loan

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Verify Device Ownership"
        subtitle="Paste scanned QR code data to identify the registered owner"
      />

      {!result ? (
        <div className="card p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl mx-auto mb-6">
            <ScanLine size={32} className="text-brand-600" />
          </div>
          <h3 className="text-center font-semibold text-gray-900 mb-1">Scan or Paste QR Data</h3>
          <p className="text-center text-sm text-gray-400 mb-6">
            Copy the text from the laptop QR code and paste it below
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <textarea
              className="input resize-none font-mono text-xs leading-relaxed"
              rows={5}
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder={'{"veriva_device":true,"device_id":1,"serial":"SN-...","brand":"HP",...}'}
              required
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <XCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !qrInput.trim()} className="btn-primary w-full justify-center py-3">
              {loading ? <Spinner size={16} /> : <ScanLine size={16} />}
              {loading ? 'Verifying...' : 'Verify Device'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Verification badge */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${loan ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            {loan
              ? <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
              : <CheckCircle size={20} className="text-green-600 shrink-0" />
            }
            <div>
              <p className={`font-semibold text-sm ${loan ? 'text-yellow-800' : 'text-green-800'}`}>
                {loan ? 'Device Currently on Authorized Loan' : 'Device Verified — Registered Owner'}
              </p>
              <p className={`text-xs mt-0.5 ${loan ? 'text-yellow-600' : 'text-green-600'}`}>
                {loan
                  ? `Authorized borrower: ${loan.borrower_name} · Until ${new Date(loan.end_date).toLocaleDateString()}`
                  : 'This device is registered in the VERIVA system'
                }
              </p>
            </div>
          </div>

          {/* Owner card */}
          <div className="card p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Registered Owner</p>
            <div className="flex items-start gap-5">
              {owner?.photo_url ? (
                <img
                  src={owner.photo_url}
                  alt={owner.full_name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-100 shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
                  <User size={36} className="text-brand-400" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-bold text-gray-900">{owner?.full_name}</h2>
                <div className="flex items-center gap-2">
                  <span className="badge-blue font-mono text-xs">{owner?.registration_number}</span>
                  <span className={owner?.is_active ? 'badge-green' : 'badge-red'}>
                    {owner?.is_active ? 'Active Student' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p>{owner?.college_name}</p>
                  <p>{owner?.department_name}</p>
                  <p>Year {owner?.year_of_study}</p>
                  {owner?.email && <p className="text-xs text-gray-400">{owner.email}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Device card */}
          <div className="card p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Device Details</p>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <Laptop size={22} className="text-purple-600" />
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm flex-1">
                <div>
                  <p className="text-xs text-gray-400">Brand</p>
                  <p className="font-medium text-gray-800">{device?.brand}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Model</p>
                  <p className="font-medium text-gray-800">{device?.model}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Serial Number</p>
                  <p className="font-medium text-gray-800 font-mono text-xs">{device?.serial_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Color</p>
                  <p className="font-medium text-gray-800">{device?.color || '—'}</p>
                </div>
                {device?.specifications && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Specifications</p>
                    <p className="font-medium text-gray-800">{device.specifications}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active loan info */}
          {loan && (
            <div className="card p-6 border-yellow-200 bg-yellow-50/50">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-3">Active Loan Authorization</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-700 font-medium">{loan.lender_name}</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-gray-700 font-medium">{loan.borrower_name}</span>
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                Authorized until: {new Date(loan.end_date).toLocaleString()}
              </p>
              {loan.reason && <p className="text-xs text-gray-500 mt-1">Reason: {loan.reason}</p>}
            </div>
          )}

          <button onClick={reset} className="btn-secondary w-full justify-center">
            <ScanLine size={15} /> Verify Another Device
          </button>
        </div>
      )}
    </div>
  )
}
