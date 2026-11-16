import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useStore } from './store/AppStore'
import Nav from './components/Nav'
import MetaMaskPopup from './components/MetaMaskPopup'
import Receipts from './components/Receipts'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EvidenceList from './pages/EvidenceList'
import EvidenceDetail from './pages/EvidenceDetail'
import Register from './pages/Register'
import Verify from './pages/Verify'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import Users from './pages/admin/Users'
import ActivityLog from './pages/admin/ActivityLog'

function Shell() {
  const { me } = useStore()
  if (!me) return <Navigate to="/masuk" replace />
  return (
    <div className="desk">
      <Nav />
      <main className="page">
        <Outlet />
      </main>
    </div>
  )
}

function AdminOnly({ children }) {
  const { me } = useStore()
  return me.role === 'Admin' ? children : <Navigate to="/" replace />
}

function Home() {
  const { me } = useStore()
  return me.role === 'Admin' ? <Navigate to="/admin" replace /> : <Dashboard />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/masuk" element={<Login />} />
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="bukti" element={<EvidenceList />} />
          <Route path="bukti/:id" element={<EvidenceDetail />} />
          <Route path="registrasi" element={<Register />} />
          <Route path="verifikasi" element={<Verify />} />
          <Route path="kasus" element={<Cases />} />
          <Route path="kasus/:no" element={<CaseDetail />} />
          <Route path="profil" element={<Profile />} />
          <Route path="admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
          <Route path="pengguna" element={<AdminOnly><Users /></AdminOnly>} />
          <Route path="log" element={<AdminOnly><ActivityLog /></AdminOnly>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MetaMaskPopup />
      <Receipts />
    </>
  )
}
