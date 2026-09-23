import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import AccessDenied from './components/AccessDenied'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Students from './pages/students/Students'
import Devices from './pages/devices/Devices'
import Attendance from './pages/attendance/Attendance'
import CampusEntries from './pages/campus/CampusEntries'
import Courses from './pages/courses/Courses'
import Gates from './pages/gates/Gates'
import Incidents from './pages/verification/Incidents'
import GateCheck from './pages/verification/GateCheck'
import NFCStation from './pages/nfc/NFCStation'
import SessionScan from './pages/attendance/SessionScan'
import { NAV } from './nav'

const PAGES = {
  '/': <Dashboard />,
  '/students': <Students />,
  '/devices': <Devices />,
  '/gate-check': <GateCheck />,
  '/campus': <CampusEntries />,
  '/gates': <Gates />,
  '/attendance': <Attendance />,
  '/courses': <Courses />,
  '/incidents': <Incidents />,
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading VERIVA...</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ roles, children }) {
  const { user } = useAuth()
  if (roles && !roles.includes(user?.role)) return <AccessDenied roles={roles} />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Full-screen NFC station — no sidebar */}
      <Route path="/nfc-station" element={
        <RequireAuth>
          <RequireRole roles={['admin', 'security']}>
            <NFCStation />
          </RequireRole>
        </RequireAuth>
      } />

      {/* Full-screen class session check-in — no sidebar */}
      <Route path="/attendance/scan" element={
        <RequireAuth>
          <RequireRole roles={['admin', 'lecturer']}>
            <SessionScan />
          </RequireRole>
        </RequireAuth>
      } />

      {/* Main app with sidebar */}
      <Route path="/*" element={
        <RequireAuth>
          <Layout>
            <Routes>
              {NAV.filter((n) => !n.fullscreen).map((n) => (
                <Route key={n.path} path={n.path === '/' ? '/' : n.path} element={
                  <RequireRole roles={n.roles}>{PAGES[n.path]}</RequireRole>
                } />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </RequireAuth>
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
