import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, textAlign:'center', padding:'32px 24px 56px' }}>
      <div style={{ fontSize:72 }}>🐍</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:64, fontWeight:700, color:'var(--green)', lineHeight:1 }}>404</div>
      <h1 style={{ fontSize:22, fontWeight:600 }}>Page not found</h1>
      <p style={{ color:'var(--text2)', fontSize:15, maxWidth:320 }}>
        Looks like this page slithered away. Let's get you back on track.
      </p>
      <Link to="/" style={{
        marginTop:8, padding:'10px 28px', background:'var(--green)',
        color:'var(--bg)', borderRadius:8, fontWeight:700, fontSize:14,
      }}>Go home →</Link>
    </div>
  )
}
