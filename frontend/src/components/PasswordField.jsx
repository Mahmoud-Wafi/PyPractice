import { useState } from 'react'

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.4 5.4A10.7 10.7 0 0 1 12 4.8c5 0 8.3 4.3 9.2 5.7.2.3.2.7 0 1.1a15.1 15.1 0 0 1-2.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.2 18.2a10.5 10.5 0 0 1-3.2.5c-5 0-8.3-4.3-9.2-5.7a1 1 0 0 1 0-1.1 15.4 15.4 0 0 1 3-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.8 12.6a1 1 0 0 1 0-1.1C3.7 10 7 5.8 12 5.8s8.3 4.2 9.2 5.7c.2.3.2.7 0 1.1-.9 1.5-4.2 5.7-9.2 5.7s-8.3-4.2-9.2-5.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function PasswordField({ value, onChange, placeholder, minLength, autoComplete }) {
  const [visible, setVisible] = useState(false)
  const [focused, setFocused] = useState(false)

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg3)',
      border: `1px solid ${focused ? 'var(--green)' : 'var(--border)'}`,
      borderRadius: 8,
      transition: 'border-color 0.2s',
    }}>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderRadius: 8,
          padding: '10px 44px 10px 14px',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        onMouseDown={e => e.preventDefault()}
        onClick={() => setVisible(v => !v)}
        style={{
          position: 'absolute',
          right: 5,
          width: 34,
          height: 34,
          borderRadius: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: visible ? 'var(--green)' : 'var(--text3)',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--text)'
          e.currentTarget.style.background = 'var(--bg4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = visible ? 'var(--green)' : 'var(--text3)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <EyeIcon hidden={visible} />
      </button>
    </div>
  )
}
