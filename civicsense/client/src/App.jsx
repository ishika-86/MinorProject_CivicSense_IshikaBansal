import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import { useSocket } from './hooks/useSocket.jsx'

import DashboardLayout   from './components/layout/DashboardLayout.jsx'
import Login             from './pages/auth/Login.jsx'
import Register          from './pages/auth/Register.jsx'
import PublicDashboard   from './pages/public/PublicDashboard.jsx'
import CitizenDashboard  from './pages/citizen/CitizenDashboard.jsx'
import RaiseComplaint    from './pages/citizen/RaiseComplaint.jsx'
import MyComplaints      from './pages/citizen/MyComplaints.jsx'
import ComplaintDetail   from './pages/citizen/ComplaintDetail.jsx'
import AdminDashboard    from './pages/admin/AdminDashboard.jsx'
import AdminComplaints   from './pages/admin/AdminComplaints.jsx'
import AdminAnalytics    from './pages/admin/AdminAnalytics.jsx'
import AdminUsers        from './pages/admin/AdminUsers.jsx'
import AdminEmergency    from './pages/admin/AdminEmergency.jsx'
import OfficerDashboard  from './pages/officer/OfficerDashboard.jsx'
import OfficerComplaints from './pages/officer/OfficerComplaints.jsx'
import Community         from './pages/shared/Community.jsx'
import Profile           from './pages/shared/Profile.jsx'
import EmergencyOverlay  from './components/emergency/EmergencyOverlay.jsx'
import FloatingChatbot   from './components/chatbot/FloatingChatbot.jsx'

const ROLE_HOME = { citizen:'/citizen', admin:'/admin', officer:'/officer' }

// Google OAuth callback handler
function GoogleCallback() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const { setUser }  = useAuthStore()
  useEffect(() => {
    const token = params.get('token')
    const raw   = params.get('user')
    if (token && raw) {
      try {
        const u = JSON.parse(decodeURIComponent(raw))
        setUser(u, token)
        navigate(ROLE_HOME[u.role] || '/citizen', { replace:true })
      } catch { navigate('/login', { replace:true }) }
    } else {
      navigate('/login', { replace:true })
    }
  }, [])
  return <div className="min-h-screen flex items-center justify-center"><div className="text-dash-2">Signing in with Google…</div></div>
}

function Guard({ children, roles }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]||'/'} replace />
  return children
}

function AppContent() {
  useSocket()
  const { user, fetchMe } = useAuthStore()
  useEffect(() => { if (user) fetchMe() }, [])

  return (
    <>
      <EmergencyOverlay />
      {/* Floating chatbot available on all authenticated pages */}
      {user && <FloatingChatbot />}
      <Routes>
        <Route path="/"                      element={<PublicDashboard />} />
        <Route path="/login"                 element={<Login />} />
        <Route path="/register"              element={<Register />} />
        <Route path="/auth/google-callback"  element={<GoogleCallback />} />

        <Route path="/citizen" element={<Guard roles={['citizen']}><DashboardLayout role="citizen" /></Guard>}>
          <Route index element={<CitizenDashboard />} />
          <Route path="raise"              element={<RaiseComplaint />} />
          <Route path="complaints"         element={<MyComplaints />} />
          <Route path="complaints/:id"     element={<ComplaintDetail />} />
          <Route path="community"          element={<Community />} />
          <Route path="profile"            element={<Profile />} />
        </Route>

        <Route path="/admin" element={<Guard roles={['admin']}><DashboardLayout role="admin" /></Guard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="complaints"         element={<AdminComplaints />} />
          <Route path="complaints/:id"     element={<ComplaintDetail />} />
          <Route path="analytics"          element={<AdminAnalytics />} />
          <Route path="users"              element={<AdminUsers />} />
          <Route path="emergency"          element={<AdminEmergency />} />
          <Route path="community"          element={<Community />} />
          <Route path="profile"            element={<Profile />} />
        </Route>

        <Route path="/officer" element={<Guard roles={['officer']}><DashboardLayout role="officer" /></Guard>}>
          <Route index element={<OfficerDashboard />} />
          <Route path="complaints"         element={<OfficerComplaints />} />
          <Route path="complaints/:id"     element={<ComplaintDetail />} />
          <Route path="community"          element={<Community />} />
          <Route path="profile"            element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style:   { borderRadius:'12px', fontFamily:'Outfit,sans-serif', fontSize:'14px' },
        success: { style:{ background:'#064e3b', color:'#fff' } },
        error:   { style:{ background:'#7f1d1d', color:'#fff' } },
      }} />
      <AppContent />
    </BrowserRouter>
  )
}
