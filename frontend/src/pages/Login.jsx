import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 24px 56px' }}>
      <div className="fade-in" style={{
        width:'100%', maxWidth:'400px',
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'20px', padding:'40px'
      }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{
            width:68, height:68, margin:'0 auto 12px',
            borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(68,136,255,0.20)',
            boxShadow:'0 0 34px rgba(68,136,255,0.14)'
          }}>
            <img src="/pypractice-mark.png" alt="" style={{ width:58, height:58, objectFit:'contain' }} />
          </div>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:8, lineHeight:1 }}>
            <span style={{ color:'var(--blue)' }}>Py</span>
            <span style={{ color:'var(--text)' }}>Practice</span>
          </div>
          <h1 style={{ fontSize:'22px', fontWeight:700 }}>Welcome back</h1>
          <p style={{ fontSize:'14px', color:'var(--text2)', marginTop:'6px' }}>Sign in to continue coding</p>
        </div>

        {error && (
          <div style={{ background:'var(--red-dim)', border:'1px solid rgba(255,68,102,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'var(--red)', marginBottom:'20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {[
            { name:'email', type:'email', label:'Email', placeholder:'you@example.com' },
            { name:'password', type:'password', label:'Password', placeholder:'••••••••' },
          ].map(f => (
            <div key={f.name}>
              <label style={{ display:'block', fontSize:'12px', color:'var(--text2)', marginBottom:'6px', fontFamily:'var(--font-mono)' }}>{f.label}</label>
              {f.name === 'password' ? (
                <PasswordField
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  autoComplete="current-password"
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                />
              ) : (
                <input
                  type={f.type} placeholder={f.placeholder} value={form[f.name]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  required
                  autoComplete="email"
                  style={{
                    width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
                    borderRadius:'8px', padding:'10px 14px', color:'var(--text)',
                    fontSize:'14px', outline:'none', transition:'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor='var(--green)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'}
                />
              )}
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            width:'100%', background: loading ? 'var(--bg4)' : 'var(--green)',
            color: loading ? 'var(--text2)' : 'var(--bg)',
            padding:'12px', borderRadius:'8px', fontWeight:700, fontSize:'15px',
            marginTop:'8px', transition:'all 0.2s',
            boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,136,0.25)'
          }}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'24px', fontSize:'13px', color:'var(--text3)' }}>
          No account? <Link to="/register" style={{ color:'var(--green)' }}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}
