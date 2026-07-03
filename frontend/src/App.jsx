import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Students from './pages/students/Students'
import Devices from './pages/devices/Devices'
import Attendance from './pages/attendance/Attendance'
import CampusEntries from './pages/campus/CampusEntries'
import Courses from './pages/courses/Courses'
import Incidents from './pages/verification/Incidents'
import VerifyDevice from './pages/verification/VerifyDevice'
import NFCStation from './pages/nfc/NFCStation'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading VERIVA...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Full-screen NFC station — no sidebar */}
      <Route path="/nfc-station" element={
        <PrivateRoute roles={['admin', 'security']}>
          <NFCStation />
        </PrivateRoute>
      } />

      {/* Main app with sidebar layout */}
      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/campus" element={<CampusEntries />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/verify" element={<VerifyDevice />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
