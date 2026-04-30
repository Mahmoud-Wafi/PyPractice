import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getLevels, getProgress } from '../api/curriculum'

const LEVEL_COLORS = { beginner:'#00ff88', intermediate:'#4488ff', advanced:'#aa66ff' }

/* ─── Circular progress ring ─────────────────────── */
function Ring({ pct, color, size=64 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg4)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1s ease' }}
      />
    </svg>
  )
}

/* ─── Level card ──────────────────────────────────── */
function LevelCard({ level, progress, index }) {
  const color   = LEVEL_COLORS[level.slug] || '#00ff88'
  const pct     = progress?.completion_pct ?? 0
  const done    = progress?.questions_completed ?? 0
  const total   = level.question_count ?? 0
  const locked  = level.is_unlocked === false

  return (
    <Link to={`/level/${level.slug}`} style={{ textDecoration:'none' }}>
      <div className="fade-in" style={{
        animationDelay:`${index * 80}ms`,
        background: locked ? 'linear-gradient(135deg, rgba(255,255,255,0.015), var(--bg2) 42%)' : 'var(--bg2)',
        border:`1px solid ${locked ? 'rgba(255,170,0,0.16)' : 'var(--border)'}`,
        borderRadius:16, padding:'24px 22px',
        display:'flex', flexDirection:'column', gap:16,
        position:'relative', overflow:'hidden',
        transition:'all 0.25s', cursor:'pointer',
        minHeight:200,
        opacity: locked ? 0.72 : 1,
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = locked ? 'rgba(255,170,0,0.32)' : color + '45'
          e.currentTarget.style.transform   = 'translateY(-4px)'
          e.currentTarget.style.boxShadow   = `0 16px 48px ${locked ? 'rgba(255,170,0,0.05)' : color + '0d'}`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = locked ? 'rgba(255,170,0,0.16)' : 'var(--border)'
          e.currentTarget.style.transform   = 'translateY(0)'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      >
        {/* Corner glow */}
        <div style={{ position:'absolute', top:0, right:0, width:100, height:100,
          background:`radial-gradient(circle at top right, ${color}10, transparent)`, pointerEvents:'none' }} />

        {/* Progress ring */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          {locked ? (
            <span style={{
              fontSize:10,
              color:'var(--amber)',
              fontFamily:'var(--font-mono)',
              textTransform:'uppercase',
              letterSpacing:'1.2px',
              border:'1px solid rgba(255,170,0,0.25)',
              background:'var(--amber-dim)',
              borderRadius:999,
              padding:'3px 8px',
            }}>
              Locked
            </span>
          ) : (
            <span style={{
              fontSize:10,
              color,
              fontFamily:'var(--font-mono)',
              textTransform:'uppercase',
              letterSpacing:'1.2px',
              border:`1px solid ${color}25`,
              background:`${color}10`,
              borderRadius:999,
              padding:'3px 8px',
            }}>
              {level.is_completed ? 'Complete' : 'Open'}
            </span>
          )}
          <Ring pct={pct} color={color} size={52} />
        </div>

        {/* Title + desc */}
        <div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color, letterSpacing:'2px', textTransform:'uppercase', marginBottom:4 }}>
            {level.name}
          </div>
          <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{level.description}</p>
          {locked && (
            <p style={{ fontSize:12, color:'var(--amber)', lineHeight:1.55, marginTop:8 }}>
              {level.locked_reason}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)', marginBottom:5 }}>
            <span>{done}/{total} solved</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height:3, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'width 1.2s ease' }} />
          </div>
        </div>

        {/* CTA */}
        <div style={{ fontSize:12, color: locked ? 'var(--amber)' : color, fontFamily:'var(--font-mono)', marginTop:'auto' }}>
          {locked ? 'Preview locked path →' : pct === 0 ? 'Start →' : pct === 100 ? '✓ Complete' : 'Continue →'}
        </div>
      </div>
    </Link>
  )
}

/* ─── Stat card ───────────────────────────────────── */
function StatCard({ label, value, sub, color='var(--green)', delay=0 }) {
  return (
    <div className="fade-in" style={{
      animationDelay:`${delay}ms`,
      background:'var(--bg2)', border:'1px solid var(--border)',
      borderRadius:14, padding:'18px 20px',
    }}>
      <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color, fontFamily:'var(--font-mono)', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:6 }}>{sub}</div>}
    </div>
  )
}

/* ─── Dashboard ───────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()
  const [levels,   setLevels]   = useState([])
  const [progress, setProgress] = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getLevels(), getProgress()])
      .then(([lRes, pRes]) => {
        setLevels(lRes.data)
        const map = {}
        pRes.data.forEach(p => { map[p.level_slug] = p })
        setProgress(map)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalSolved = Object.values(progress).reduce((s, p) => s + p.questions_completed, 0)
  const totalScore  = Object.values(progress).reduce((s, p) => s + p.total_score, 0)
  const totalQs     = levels.reduce((s, l) => s + (l.question_count || 0), 0)
  const overallPct  = totalQs ? Math.round((totalSolved / totalQs) * 100) : 0

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh',
      color:'var(--text2)', fontFamily:'var(--font-mono)', fontSize:13, gap:10 }}>
      <div style={{ width:14, height:14, border:'2px solid var(--green)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      loading…
    </div>
  )

  return (
    <div style={{ maxWidth:1060, margin:'0 auto', padding:'44px 24px' }}>
      {/* ── Header ── */}
      <div className="fade-in" style={{ marginBottom:36 }}>
        <h1 style={{ fontSize:30, fontWeight:700, marginBottom:4 }}>
          Hey, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color:'var(--text2)', fontSize:15 }}>
          {overallPct === 0 ? "Let's start your Python journey" :
           overallPct === 100 ? '🏆 You completed all levels!' :
           `${overallPct}% of the curriculum done — keep going!`}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:36 }}>
        <StatCard label="Problems solved" value={totalSolved} sub={`of ${totalQs} total`} color="var(--green)" delay={0} />
        <StatCard label="Total score"     value={totalScore.toLocaleString()} sub="points earned" color="var(--blue)"   delay={60} />
        <StatCard label="Completion"      value={`${overallPct}%`} sub="all levels" color="var(--purple)" delay={120} />
        <StatCard label="Current level"   value={user?.skill_level?.slice(0,3).toUpperCase() || '—'} sub={user?.skill_level} color={LEVEL_COLORS[user?.skill_level] || 'var(--green)'} delay={180} />
      </div>

      {/* ── Level cards ── */}
      <div style={{ marginBottom:36 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text3)', letterSpacing:'3px', textTransform:'uppercase' }}>
            Learning paths
          </h2>
          <Link to="/leaderboard" style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)', display:'flex', alignItems:'center', gap:5, transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}>
            🏆 Leaderboard →
          </Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:14 }}>
          {levels.map((level, i) => (
            <LevelCard key={level.id} level={level} progress={progress[level.slug]} index={i} />
          ))}
        </div>
      </div>

      {/* ── Quick start (if nothing solved yet) ── */}
      {totalSolved === 0 && (
        <div className="fade-in" style={{ animationDelay:'300ms',
          background:'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(68,136,255,0.06))',
          border:'1px solid rgba(0,255,136,0.15)',
          borderRadius:16, padding:'28px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap',
        }}>
          <div>
            <div style={{ fontSize:11, color:'var(--green)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>
              Quick start
            </div>
            <div style={{ fontSize:17, fontWeight:600, marginBottom:4 }}>Ready to write your first line?</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Start with the Beginner level — no setup needed.</div>
          </div>
          <Link to="/level/beginner" style={{
            padding:'10px 28px', background:'var(--green)', color:'var(--bg)',
            borderRadius:10, fontWeight:700, fontSize:14, whiteSpace:'nowrap',
            boxShadow:'0 0 24px rgba(0,255,136,0.25)', transition:'all 0.15s',
          }}>Start coding →</Link>
        </div>
      )}
    </div>
  )
}
