import { useMemo } from 'react'

// Generate last 26 weeks of day cells
function buildCalendar(submissions) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const start = new Date(today)
  start.setDate(start.getDate() - 181) // ~26 weeks back

  // Count submissions per date string
  const counts = {}
  submissions.forEach(s => {
    const d = new Date(s.submitted_at)
    const key = d.toISOString().slice(0, 10)
    counts[key] = (counts[key] || 0) + 1
  })

  // Build day array from start to today
  const days = []
  const cur = new Date(start)
  // Align to Sunday
  cur.setDate(cur.getDate() - cur.getDay())

  while (cur <= today) {
    const key = cur.toISOString().slice(0, 10)
    days.push({
      date: key,
      count: counts[key] || 0,
      future: cur > today,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function intensity(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

const LEVEL_BG = [
  'var(--bg4)',
  'rgba(0,255,136,0.15)',
  'rgba(0,255,136,0.30)',
  'rgba(0,255,136,0.55)',
  'rgba(0,255,136,0.85)',
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['S','M','T','W','T','F','S']

export default function ActivityHeatmap({ submissions = [] }) {
  const days = useMemo(() => buildCalendar(submissions), [submissions])

  // Group into weeks (columns of 7)
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Month labels: pick label when month changes across week starts
  const monthLabels = weeks.map((week, wi) => {
    const first = week.find(d => !d.future)
    if (!first) return null
    const d = new Date(first.date)
    const prev = wi > 0 ? new Date(weeks[wi - 1][0]?.date) : null
    if (!prev || prev.getMonth() !== d.getMonth()) {
      return { label: MONTHS[d.getMonth()], col: wi }
    }
    return null
  }).filter(Boolean)

  const totalSubmissions = days.reduce((s, d) => s + d.count, 0)
  const activeDays       = days.filter(d => d.count > 0).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Activity — last 26 weeks
        </span>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
          {totalSubmissions} submissions · {activeDays} active days
        </span>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {/* Month labels row */}
        <div style={{ display: 'flex', marginLeft: 22, marginBottom: 3, position: 'relative', height: 14 }}>
          {monthLabels.map(({ label, col }) => (
            <span key={`${label}-${col}`} style={{
              position: 'absolute',
              left: col * 13,
              fontSize: 10,
              color: 'var(--text3)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}>{label}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {/* Day-of-week labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4, paddingTop: 1 }}>
            {DAYS.map((d, i) => (
              <span key={i} style={{
                fontSize: 9, color: i % 2 === 1 ? 'var(--text3)' : 'transparent',
                fontFamily: 'var(--font-mono)', lineHeight: '11px', width: 10,
              }}>{d}</span>
            ))}
          </div>

          {/* Week columns */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.future ? '' : `${day.date}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                    style={{
                      width: 11, height: 11,
                      borderRadius: 2,
                      background: day.future ? 'transparent' : LEVEL_BG[intensity(day.count)],
                      border: day.future ? 'none' : '1px solid rgba(255,255,255,0.04)',
                      cursor: day.count > 0 ? 'pointer' : 'default',
                      transition: 'transform 0.1s',
                    }}
                    onMouseEnter={e => { if (day.count > 0) e.currentTarget.style.transform = 'scale(1.4)' }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Less</span>
          {LEVEL_BG.map((bg, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: '1px solid rgba(255,255,255,0.04)' }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>More</span>
        </div>
      </div>
    </div>
  )
}
