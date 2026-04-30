import { useState, useEffect } from 'react'
import { getLeaderboard } from '../api/auth'

const medals = ['🥇','🥈','🥉']
const levelColors = { beginner:'#00ff88', intermediate:'#4488ff', advanced:'#aa66ff' }

export default function Leaderboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getLeaderboard().then(r => setData(r.data)).catch(() => setData([]))
  }, [])

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'48px 24px' }}>
      <div className="fade-in">
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:48, marginBottom:10 }}>🏆</div>
          <h1 style={{ fontSize:26, fontWeight:700, marginBottom:6 }}>Leaderboard</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Top solvers across all levels</p>
        </div>

        {data === null ? (
          <div style={{ textAlign:'center', color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:13 }}>Loading…</div>
        ) : data.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:13 }}>No data yet — start solving!</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'48px 1fr 80px 80px', gap:12, padding:'0 16px', fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:4 }}>
              <span>Rank</span><span>Player</span><span style={{ textAlign:'right' }}>Solved</span><span style={{ textAlign:'right' }}>Score</span>
            </div>

            {data.map((entry, i) => {
              const c = levelColors[entry.skill_level] || '#00ff88'
              return (
                <div key={i} className="fade-in" style={{
                  animationDelay:`${i * 30}ms`,
                  display:'grid', gridTemplateColumns:'48px 1fr 80px 80px', gap:12,
                  alignItems:'center',
                  background: entry.is_me ? 'rgba(0,255,136,0.06)' : 'var(--bg2)',
                  border:`1px solid ${entry.is_me ? 'rgba(0,255,136,0.25)' : 'var(--border)'}`,
                  borderRadius:12, padding:'14px 16px',
                  transition:'all 0.2s',
                }}>
                  <div style={{ fontSize: i < 3 ? 22 : 14, fontFamily:'var(--font-mono)', color:'var(--text3)', fontWeight:700, textAlign:'center' }}>
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                    <div style={{
                      width:34, height:34, borderRadius:'50%', flexShrink:0,
                      background:`${c}18`, border:`1.5px solid ${c}40`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, fontFamily:'var(--font-mono)', color:c, fontWeight:700,
                    }}>
                      {entry.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {entry.name} {entry.is_me && <span style={{ fontSize:11, color:'var(--green)', fontFamily:'var(--font-mono)' }}>(you)</span>}
                      </div>
                      <div style={{ fontSize:11, color:c, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{entry.skill_level}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:14, fontFamily:'var(--font-mono)', color:'var(--text)', textAlign:'right', fontWeight:600 }}>
                    {entry.total_solved}
                  </div>
                  <div style={{ fontSize:14, fontFamily:'var(--font-mono)', color:'var(--green)', textAlign:'right', fontWeight:700 }}>
                    {entry.total_score.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
