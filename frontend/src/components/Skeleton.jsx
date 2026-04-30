export function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  )
}

export function CardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 24,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <Skeleton width={40} height={40} radius={8} />
      <Skeleton width="40%" height={12} />
      <Skeleton width="90%" height={14} />
      <Skeleton width="70%" height={14} />
      <Skeleton width="60%" height={10} style={{ marginTop: 8 }} />
    </div>
  )
}

export function QuestionRowSkeleton() {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <Skeleton width={32} height={32} radius={16} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="30%" height={10} />
      </div>
      <Skeleton width={48} height={10} />
    </div>
  )
}

// Add shimmer keyframe once globally
const style = document.createElement('style')
style.textContent = `@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`
document.head.appendChild(style)
