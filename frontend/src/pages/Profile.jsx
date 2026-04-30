import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getProgress } from '../api/curriculum'
import { getAllSubmissions, getStats } from '../api/submissions'
import ActivityHeatmap from '../components/ActivityHeatmap'
import { Skeleton } from '../components/Skeleton'

const LEVEL_COLORS = { beginner: '#00ff88', intermediate: '#4488ff', advanced: '#aa66ff' }
const STATUS_COLORS = {
  accepted:     '#00ff88',
  wrong_answer: '#ff4466',
  error:        '#ff8888',
  timeout:      '#ffaa00',
  pending:      '#9999b0',
}

function StatBadge({ label, value, color = 'var(--green)' }) {
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{label}</div>
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontFamily: 'var(--font-mono)' }}>
        <span style={{ textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function getCurrentStreak(submissions) {
  const activeDays = new Set(
    submissions
      .map(sub => sub.submitted_at ? dayKey(new Date(sub.submitted_at)) : null)
      .filter(Boolean)
  )

  if (activeDays.size === 0) return 0

  const cursor = new Date()
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (activeDays.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function buildAchievements(progress, stats, submissions) {
  const totalSolved = progress.reduce((s, p) => s + p.questions_completed, 0)
  const completed = new Set(progress.filter(p => p.completion_pct === 100).map(p => p.level_slug))
  const streak = getCurrentStreak(submissions)
  const allComplete = progress.length > 0 && progress.every(p => p.completion_pct === 100)

  return [
    { title: 'First solve', detail: 'Submit one accepted answer', unlocked: totalSolved >= 1, color: '#00ff88' },
    { title: 'Momentum', detail: `${streak} day current streak`, unlocked: streak >= 3, color: '#4488ff' },
    { title: 'Consistency', detail: `${streak} day current streak`, unlocked: streak >= 7, color: '#aa66ff' },
    { title: 'Beginner complete', detail: 'Finish the beginner path', unlocked: completed.has('beginner'), color: '#00ff88' },
    { title: 'Intermediate complete', detail: 'Finish the intermediate path', unlocked: completed.has('intermediate'), color: '#4488ff' },
    { title: 'Advanced complete', detail: 'Finish the advanced path', unlocked: completed.has('advanced'), color: '#aa66ff' },
    { title: 'Sharp accuracy', detail: '70% acceptance over 5+ submissions', unlocked: (stats?.total_submissions || 0) >= 5 && (stats?.acceptance_rate || 0) >= 70, color: '#ffaa00' },
    { title: 'Curriculum champion', detail: 'Complete every level', unlocked: allComplete, color: '#ff4466' },
  ]
}

function AchievementBadge({ badge, index }) {
  return (
    <div className="fade-in" style={{
      animationDelay: `${index * 45}ms`,
      background: badge.unlocked ? `linear-gradient(135deg, ${badge.color}12, var(--bg2) 42%)` : 'var(--bg2)',
      border: `1px solid ${badge.unlocked ? badge.color + '35' : 'var(--border)'}`,
      borderRadius: 14,
      padding: '16px 16px',
      opacity: badge.unlocked ? 1 : 0.55,
      minHeight: 118,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${badge.unlocked ? badge.color + '45' : 'var(--border)'}`,
          color: badge.unlocked ? badge.color : 'var(--text3)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: badge.unlocked ? 15 : 10,
          marginBottom: 12,
        }}>
          {badge.unlocked ? '✓' : 'LOCK'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{badge.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{badge.detail}</div>
      </div>
      <div style={{
        fontSize: 10,
        color: badge.unlocked ? badge.color : 'var(--text3)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        marginTop: 12,
      }}>
        {badge.unlocked ? 'Unlocked' : 'Locked'}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [progress,     setProgress]     = useState([])
  const [submissions,  setSubmissions]  = useState([])
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([getProgress(), getAllSubmissions(), getStats()])
      .then(([pRes, sRes, stRes]) => {
        setProgress(pRes.data)
        setSubmissions(sRes.data)
        setStats(stRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const levelColor  = LEVEL_COLORS[user?.skill_level] || '#00ff88'
  const totalSolved = progress.reduce((s, p) => s + p.questions_completed, 0)
  const totalPts    = progress.reduce((s, p) => s + p.total_score, 0)
  const achievements = buildAchievements(progress, stats, submissions)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '44px 24px' }}>
      {/* ── Header card ── */}
      <div className="fade-in" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '32px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: `radial-gradient(circle, ${levelColor}10, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${levelColor}30, ${levelColor}10)`,
          border: `2px solid ${levelColor}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontFamily: 'var(--font-mono)', color: levelColor, fontWeight: 700,
        }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>{user?.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, padding: '3px 12px', borderRadius: 20,
              background: `${levelColor}12`, color: levelColor,
              border: `1px solid ${levelColor}30`,
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px',
            }}>{user?.skill_level}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              joined {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>

        <Link to="/settings" style={{
          padding: '8px 18px', fontSize: 12, fontFamily: 'var(--font-mono)',
          color: 'var(--text2)', border: '1px solid var(--border)',
          borderRadius: 8, transition: 'all 0.2s', flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
        >⚙ Edit profile</Link>
      </div>

      {/* ── Stats row ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={80} radius={12} />)}
        </div>
      ) : (
        <div className="fade-in" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20,
          animationDelay: '60ms',
        }}>
          <StatBadge label="Problems solved"  value={totalSolved}                             color="var(--green)"  />
          <StatBadge label="Total score"       value={totalPts.toLocaleString()}               color="var(--blue)"   />
          <StatBadge label="Submissions"       value={stats?.total_submissions ?? 0}           color="var(--purple)" />
          <StatBadge label="Acceptance rate"   value={`${stats?.acceptance_rate ?? 0}%`}       color="var(--amber)"  />
        </div>
      )}

      {/* ── Achievements ── */}
      {!loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Achievement badges
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 12,
          }}>
            {achievements.map((badge, i) => (
              <AchievementBadge key={badge.title} badge={badge} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Two-column middle row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Level progress */}
        <div className="fade-in" style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, animationDelay: '100ms',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
            Level progress
          </div>
          {loading
            ? [...Array(3)].map((_, i) => <Skeleton key={i} height={40} radius={6} style={{ marginBottom: 10 }} />)
            : progress.map(p => (
              <div key={p.level_slug} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: LEVEL_COLORS[p.level_slug] || '#00ff88', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase' }}>
                      {p.level_name}
                    </span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {p.questions_completed}/{p.total_questions}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${p.completion_pct}%`,
                    background: LEVEL_COLORS[p.level_slug] || '#00ff88',
                    borderRadius: 3,
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Submissions by status */}
        <div className="fade-in" style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, animationDelay: '140ms',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
            Submissions breakdown
          </div>
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} height={32} radius={4} style={{ marginBottom: 8 }} />)
            : stats?.by_status && Object.entries(stats.by_status)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <MiniBar
                    key={status}
                    label={status}
                    value={count}
                    max={stats.total_submissions}
                    color={STATUS_COLORS[status] || 'var(--text3)'}
                  />
                ))
          }
        </div>
      </div>

      {/* ── Activity heatmap ── */}
      <div className="fade-in" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24, marginBottom: 20,
        animationDelay: '180ms',
      }}>
        {loading
          ? <Skeleton height={100} radius={6} />
          : <ActivityHeatmap submissions={submissions} />
        }
      </div>

      {/* ── Recent submissions ── */}
      <div className="fade-in" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24,
        animationDelay: '220ms',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
          Recent submissions
        </div>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <Skeleton width={70} height={22} radius={20} />
              <Skeleton height={22} />
              <Skeleton width={80} height={22} />
            </div>
          ))
        ) : submissions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            No submissions yet — <Link to="/dashboard" style={{ color: 'var(--green)' }}>start solving!</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {submissions.slice(0, 15).map(sub => {
              const col = STATUS_COLORS[sub.status] || 'var(--text2)'
              return (
                <div key={sub.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 60px 120px',
                  gap: 12, alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                    color: col, fontWeight: 700,
                    background: `${col}12`,
                    padding: '3px 10px', borderRadius: 20,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    textAlign: 'center',
                  }}>
                    {sub.status.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Question #{sub.question?.slice(0, 8) || '—'}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--green)', textAlign: 'right' }}>
                    {sub.score}/100
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                    {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
