import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useRole } from '../hooks/useRole'
import { ROLE_LABEL } from '../nav'

export default function AccessDenied({ roles = [] }) {
  const { roleLabel } = useRole()
  const allowed = roles.map((r) => ROLE_LABEL[r] || r).join(', ')

  return (
    <div className="max-w-md mx-auto mt-16 card p-8 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Lock size={26} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">Access restricted</h2>
      <p className="text-sm text-gray-500 mt-2">
        This page is available to: <span className="font-medium text-gray-700">{allowed || 'administrators'}</span>.
      </p>
      <p className="text-sm text-gray-400 mt-1">You are signed in as <span className="font-medium">{roleLabel}</span>.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
    </div>
  )
}
