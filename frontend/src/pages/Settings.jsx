import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import api from '../api/client'

const LEVELS = [
  { value: 'beginner',     label: 'Beginner',     desc: 'Just starting out with Python' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Know the basics, ready for more' },
  { value: 'advanced',     label: 'Advanced',     desc: 'Comfortable with Python, want challenges' },
]
const LEVEL_COLORS = { beginner: 'var(--green)', intermediate: 'var(--blue)', advanced: 'var(--purple)' }

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const toast            = useToast()
  const [form,    setForm]    = useState({ name: user?.name || '', skill_level: user?.skill_level || 'beginner' })
  const [saving,  setSaving]  = useState(false)

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/auth/me/', { name: form.name, skill_level: form.skill_level })
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to save changes.')
    } finally { setSaving(false) }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <div className="fade-in">
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Settings</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 36 }}>Manage your profile and preferences</p>

        {/* Profile */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20 }}>Profile</div>

          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: 'name', type: 'text',  label: 'Full name', placeholder: 'Your name' },
            ].map(f => (
              <div key={f.name}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder} value={form[f.name]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  required
                  style={{
                    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '10px 14px', color: 'var(--text)',
                    fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--green)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>Email (read-only)</label>
              <input value={user?.email || ''} disabled style={{
                width: '100%', background: 'var(--bg4)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--text3)', fontSize: 14, cursor: 'not-allowed',
              }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>Skill level</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {LEVELS.map(l => {
                  const sel = form.skill_level === l.value
                  const c   = LEVEL_COLORS[l.value]
                  return (
                    <label key={l.value} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: sel ? `${c}10`.replace('var(--green)', 'rgba(0,255,136,0.08)').replace('var(--blue)', 'rgba(68,136,255,0.08)').replace('var(--purple)', 'rgba(170,102,255,0.08)') : 'var(--bg3)',
                      border: `1px solid ${sel ? c.replace('var(--green)', 'rgba(0,255,136,0.3)').replace('var(--blue)', 'rgba(68,136,255,0.3)').replace('var(--purple)', 'rgba(170,102,255,0.3)') : 'var(--border)'}`,
                      borderRadius: 8, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="skill_level" value={l.value} checked={sel}
                        onChange={e => setForm(p => ({ ...p, skill_level: e.target.value }))}
                        style={{ display: 'none' }} />
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: `2px solid ${sel ? c : 'var(--border)'}`,
                        background: sel ? c : 'transparent', flexShrink: 0, transition: 'all 0.15s',
                      }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{l.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.desc}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <button type="submit" disabled={saving} style={{
              padding: 11, background: saving ? 'var(--bg4)' : 'var(--green)',
              color: saving ? 'var(--text2)' : 'var(--bg)',
              borderRadius: 8, fontWeight: 700, fontSize: 14,
              marginTop: 4, transition: 'all 0.2s',
              boxShadow: saving ? 'none' : '0 0 16px rgba(0,255,136,0.2)',
              cursor: saving ? 'wait' : 'pointer',
            }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Account */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>Account</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
            Member since <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
              {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
          <button onClick={handleLogout} style={{
            padding: '9px 20px', background: 'rgba(255,68,102,0.07)',
            border: '1px solid rgba(255,68,102,0.2)',
            borderRadius: 8, color: 'var(--red)', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,102,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,68,102,0.07)'}
          >Sign out of PyPractice</button>
        </div>
      </div>
    </div>
  )
}
