import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()
  const isWorkspace      = location.pathname.startsWith('/question/')

  const handleLogout = async () => { await logout(); navigate('/') }

  const LEVEL_COLORS = { beginner: '#00ff88', intermediate: '#4488ff', advanced: '#aa66ff' }
  const badgeColor   = LEVEL_COLORS[user?.skill_level] || '#00ff88'

  const NavLink = ({ to, children }) => {
    const active = location.pathname === to
    return (
      <Link to={to} style={{
        fontSize: 13, fontWeight: 500,
        color: active ? 'var(--text)' : 'var(--text2)',
        borderBottom: `1px solid ${active ? 'var(--green)' : 'transparent'}`,
        paddingBottom: 2, transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = active ? 'var(--text)' : 'var(--text2)'}
      >{children}</Link>
    )
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 22px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link to="/" aria-label="PyPractice home" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <img
          src="/pypractice-mark.png"
          alt=""
          style={{
            width: 34,
            height: 34,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(68,136,255,0.22))',
          }}
        />
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 16, letterSpacing: 0, lineHeight: 1 }}>
          <span style={{ color: 'var(--blue)' }}>Py</span>
          <span style={{ color: 'var(--text)' }}>Practice</span>
        </span>
      </Link>

      {/* Centre links */}
      {user && !isWorkspace && (
        <div style={{ display: 'flex', gap: 22 }}>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </div>
      )}

      {/* Right side */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${badgeColor}30, ${badgeColor}10)`,
              border: `1.5px solid ${badgeColor}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontFamily: 'var(--font-mono)', color: badgeColor, fontWeight: 700,
            }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            {!isWorkspace && (
              <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--font-mono)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name?.split(' ')[0]}
              </span>
            )}
          </Link>

          {!isWorkspace && (
            <>
              <span style={{ width: 1, height: 16, background: 'var(--border)', display: 'inline-block' }} />
              <Link to="/settings" title="Settings" style={{
                fontSize: 16, color: 'var(--text3)', transition: 'color 0.15s', lineHeight: 1,
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
              >⚙</Link>
              <button onClick={handleLogout} style={{
                fontSize: 12, color: 'var(--text3)',
                fontFamily: 'var(--font-mono)', padding: '4px 12px',
                borderRadius: 6, border: '1px solid var(--border)', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(255,68,102,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >logout</button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{
            fontSize: 13, color: 'var(--text2)', padding: '6px 16px',
            border: '1px solid var(--border)', borderRadius: 8, fontWeight: 500, transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >Sign in</Link>
          <Link to="/register" style={{
            fontSize: 13, color: 'var(--bg)', padding: '6px 18px',
            background: 'var(--green)', borderRadius: 8, fontWeight: 700,
            boxShadow: '0 0 14px rgba(0,255,136,0.25)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >Get started</Link>
        </div>
      )}
    </nav>
  )
}
