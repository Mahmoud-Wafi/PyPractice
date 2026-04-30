import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../hooks/useAuth'

const levels = [
  { value:'beginner', label:'Beginner', desc:'Just starting out with Python' },
  { value:'intermediate', label:'Intermediate', desc:'Know the basics, ready for more' },
  { value:'advanced', label:'Advanced', desc:'Comfortable with Python, want challenges' },
]

function getPasswordChecks(password, form) {
  const value = password || ''
  const lower = value.toLowerCase()
  const namePart = (form.name || '').toLowerCase().trim()
  const emailPart = (form.email || '').split('@')[0].toLowerCase().trim()
  return [
    { label: '8+ characters', ok: value.length >= 8 },
    { label: 'Upper and lower case', ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: 'Number', ok: /\d/.test(value) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(value) },
    { label: 'Not your name/email', ok: value.length > 0 && (!namePart || !lower.includes(namePart)) && (!emailPart || !lower.includes(emailPart)) },
  ]
}

function PasswordStrength({ password, form }) {
  if (!password) return null

  const checks = getPasswordChecks(password, form)
  const score = checks.filter(c => c.ok).length
  const pct = Math.round((score / checks.length) * 100)
  const levels = [
    { label: 'Weak', color: 'var(--red)' },
    { label: 'Fair', color: 'var(--amber)' },
    { label: 'Good', color: 'var(--blue)' },
    { label: 'Strong', color: 'var(--green)' },
  ]
  const strength = levels[Math.min(Math.max(score - 1, 0), levels.length - 1)]

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>Password strength</span>
        <span style={{ fontSize:11, color:strength.color, fontFamily:'var(--font-mono)' }}>{strength.label}</span>
      </div>
      <div style={{ height:4, background:'var(--bg4)', borderRadius:4, overflow:'hidden', marginBottom:8 }}>
        <div style={{
          height:'100%',
          width:`${pct}%`,
          background:strength.color,
          borderRadius:4,
          transition:'width 0.2s, background 0.2s',
        }} />
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {checks.map(check => (
          <span key={check.label} style={{
            fontSize:10,
            color:check.ok ? 'var(--green)' : 'var(--text3)',
            border:`1px solid ${check.ok ? 'rgba(0,255,136,0.22)' : 'var(--border)'}`,
            background:check.ok ? 'rgba(0,255,136,0.07)' : 'transparent',
            borderRadius:999,
            padding:'2px 7px',
            fontFamily:'var(--font-mono)',
          }}>
            {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'', skill_level:'beginner' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await register(form); navigate('/dashboard')
    } catch (err) {
      const d = err.response?.data
      if (d) setError(Object.values(d).flat().join(' '))
      else setError('Registration failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 24px 56px' }}>
      <div className="fade-in" style={{
        width:'100%', maxWidth:'460px',
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
          <h1 style={{ fontSize:'22px', fontWeight:700 }}>Create your account</h1>
          <p style={{ fontSize:'14px', color:'var(--text2)', marginTop:'6px' }}>Free forever · No credit card</p>
        </div>

        {error && (
          <div style={{ background:'var(--red-dim)', border:'1px solid rgba(255,68,102,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'var(--red)', marginBottom:'20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {[
            { name:'name', type:'text', label:'Full name', placeholder:'Layla Hassan' },
            { name:'email', type:'email', label:'Email', placeholder:'you@example.com' },
            { name:'password', type:'password', label:'Password', placeholder:'Min. 8 characters' },
          ].map(f => (
            <div key={f.name}>
              <label style={{ display:'block', fontSize:'12px', color:'var(--text2)', marginBottom:'6px', fontFamily:'var(--font-mono)' }}>{f.label}</label>
              {f.name === 'password' ? (
                <>
                  <PasswordField
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    minLength={8}
                    autoComplete="new-password"
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  />
                  <PasswordStrength password={form.password} form={form} />
                </>
              ) : (
                <input
                  type={f.type} placeholder={f.placeholder} value={form[f.name]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  required minLength={1}
                  autoComplete={f.name === 'email' ? 'email' : 'name'}
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

          <div>
            <label style={{ display:'block', fontSize:'12px', color:'var(--text2)', marginBottom:'8px', fontFamily:'var(--font-mono)' }}>Your Python level</label>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {levels.map(l => {
                const selected = form.skill_level === l.value
                const colors = { beginner:'var(--green)', intermediate:'var(--blue)', advanced:'var(--purple)' }
                const c = colors[l.value]
                return (
                  <label key={l.value} style={{
                    display:'flex', alignItems:'center', gap:'12px',
                    background: selected ? `${c}10` : 'var(--bg3)',
                    border: `1px solid ${selected ? c+'40' : 'var(--border)'}`,
                    borderRadius:'8px', padding:'10px 14px', cursor:'pointer',
                    transition:'all 0.2s'
                  }}>
                    <input type="radio" name="skill_level" value={l.value}
                      checked={selected} onChange={e => setForm(p => ({ ...p, skill_level: e.target.value }))}
                      style={{ display:'none' }} />
                    <div style={{
                      width:16, height:16, borderRadius:'50%',
                      border: `2px solid ${selected ? c : 'var(--border)'}`,
                      background: selected ? c : 'transparent', flexShrink:0,
                      transition:'all 0.2s'
                    }} />
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:500 }}>{l.label}</div>
                      <div style={{ fontSize:'11px', color:'var(--text3)' }}>{l.desc}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width:'100%', background: loading ? 'var(--bg4)' : 'var(--green)',
            color: loading ? 'var(--text2)' : 'var(--bg)',
            padding:'12px', borderRadius:'8px', fontWeight:700, fontSize:'15px',
            marginTop:'8px', transition:'all 0.2s',
            boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,136,0.25)'
          }}>
            {loading ? 'Creating account...' : 'Start coding →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'24px', fontSize:'13px', color:'var(--text3)' }}>
          Have an account? <Link to="/login" style={{ color:'var(--green)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
