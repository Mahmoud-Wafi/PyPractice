import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'

const ToastContext = createContext(null)

const ICONS = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' }
const COLORS = {
  success: { bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)', icon: '#00ff88', text: '#00ff88' },
  error:   { bg: 'rgba(255,68,102,0.08)', border: 'rgba(255,68,102,0.25)', icon: '#ff4466', text: '#ff8099' },
  info:    { bg: 'rgba(68,136,255,0.08)', border: 'rgba(68,136,255,0.25)', icon: '#4488ff', text: '#88aaff' },
  warning: { bg: 'rgba(255,170,0,0.08)',  border: 'rgba(255,170,0,0.25)',  icon: '#ffaa00', text: '#ffcc44' },
}

function ToastItem({ id, type = 'info', message, onRemove }) {
  const [visible, setVisible] = useState(false)
  const c = COLORS[type] || COLORS.info

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(id), 300)
    }, 3500)
    return () => clearTimeout(t)
  }, [id, onRemove])

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300) }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: c.bg, border: `1px solid ${c.border}`,
        borderRadius: 10, padding: '11px 14px',
        cursor: 'pointer', minWidth: 260, maxWidth: 360,
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(.22,.68,0,1.2), opacity 0.3s ease',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ fontSize: 14, color: c.icon, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
        {ICONS[type]}
      </span>
      <span style={{ fontSize: 13, color: c.text, lineHeight: 1.5, flex: 1 }}>{message}</span>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const add = useCallback((message, type = 'info') => {
    const id = ++counter.current
    setToasts(t => [...t, { id, message, type }])
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const toast = {
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'error'),
    info:    (m) => add(m, 'info'),
    warning: (m) => add(m, 'warning'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem {...t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
