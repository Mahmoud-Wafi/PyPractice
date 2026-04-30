import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }  from './hooks/useAuth'
import { ToastProvider }          from './components/Toast'
import Home          from './pages/Home'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Dashboard     from './pages/Dashboard'
import LevelPage     from './pages/LevelPage'
import WorkspacePage from './pages/WorkspacePage'
import Settings      from './pages/Settings'
import Leaderboard   from './pages/Leaderboard'
import Profile       from './pages/Profile'
import NotFound      from './pages/NotFound'
import Navbar        from './components/Navbar'
import Footer        from './components/Footer'

function Spinner() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      gap: 12,
      color: 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: 13,
    }}>
      <div style={{
        width: 14, height: 14,
        border: '2px solid var(--green)', borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      }} />
      loading…
    </div>
  )
}

function Private({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}
function Guest({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return !user ? children : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<Guest><Login /></Guest>} />
          <Route path="/register"      element={<Guest><Register /></Guest>} />
          <Route path="/dashboard"     element={<Private><Dashboard /></Private>} />
          <Route path="/level/:slug"   element={<Private><LevelPage /></Private>} />
          <Route path="/question/:id"  element={<Private><WorkspacePage /></Private>} />
          <Route path="/settings"      element={<Private><Settings /></Private>} />
          <Route path="/leaderboard"   element={<Private><Leaderboard /></Private>} />
          <Route path="/profile"       element={<Private><Profile /></Private>} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
