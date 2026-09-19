import { useState, useEffect, useCallback } from 'react'
import { Plus, Laptop, Edit, Trash2, QrCode, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import LoadingState from '../../components/LoadingState'
import DeviceForm from './DeviceForm'
import { getDevices, deleteDevice, regenerateQR } from '../../api/devices'
import { useRole } from '../../hooks/useRole'

export default function Devices() {
  const { canManageDevices } = useRole()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [selected, setSelected] = useState(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)

  const load = useCallback(() => {
    setLoading(true)
    getDevices({ search, page })
      .then(({ data }) => { setDevices(data.results); setCount(data.count) })
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (d) => {
    if (!confirm(`Delete device ${d.brand} ${d.model}?`)) return
    try {
      await deleteDevice(d.id)
      toast.success('Device deleted.')
      load()
    } catch {
      toast.error('Failed to delete device.')
    }
  }

  const handleRegenQR = async (d) => {
    try {
      const { data } = await regenerateQR(d.id)
      setSelected(data)
      toast.success('QR code regenerated.')
      load()
    } catch {
      toast.error('Failed to regenerate QR code.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle={`${count} registered devices`}
        action={canManageDevices && (
          <button className="btn-primary" onClick={() => { setSelected(null); setShowForm(true) }}>
            <Plus size={16} /> Register Device
          </button>
        )}
      />

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search devices or owner..." />
        </div>

        {loading ? (
          <LoadingState />
        ) : devices.length === 0 ? (
          <EmptyState icon={Laptop} message="No devices registered." action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Register First Device
            </button>
          } />
        ) : (
          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Device', 'Serial Number', 'Owner', 'Registered', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Laptop size={14} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{d.brand} {d.model}</p>
                          {d.color && <p className="text-xs text-gray-400">{d.color}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.serial_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{d.owner_detail?.full_name}</p>
                      <p className="text-xs text-gray-400">{d.owner_detail?.registration_number}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(d.registered_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={d.is_active ? 'badge-green' : 'badge-red'}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelected(d); setShowQR(true) }}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600"
                          title="View QR Code"
                        >
                          <QrCode size={14} />
                        </button>
                        {canManageDevices && (<>
                        <button
                          onClick={() => handleRegenQR(d)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-yellow-600"
                          title="Regenerate QR"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={() => { setSelected(d); setShowForm(true) }}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        </>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={selected ? 'Edit Device' : 'Register Device'}>
        <DeviceForm device={selected} onSuccess={() => { setShowForm(false); load() }} />
      </Modal>

      <Modal open={showQR} onClose={() => setShowQR(false)} title="Device QR Code" size="sm">
        {selected?.qr_code_url && (
          <div className="text-center space-y-4">
            <img src={selected.qr_code_url} alt="QR Code" className="mx-auto w-56 h-56 border border-gray-200 rounded-xl" />
            <div className="text-sm text-gray-600">
              <p className="font-semibold">{selected.brand} {selected.model}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{selected.serial_number}</p>
              <p className="text-xs text-gray-400 mt-1">Owner: {selected.owner_detail?.full_name}</p>
            </div>
            <a
              href={selected.qr_code_url}
              download={`veriva-qr-${selected.serial_number}.png`}
              className="btn-secondary text-xs"
            >
              Download QR Code
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}
