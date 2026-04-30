import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/* ── Animated typing demo ──────────────────────────────── */
const DEMOS = [
  {
    label: 'Hello World',
    code: `# Your first Python program\nprint("Hello, World!")`,
    output: 'Hello, World!',
    color: '#00ff88',
  },
  {
    label: 'Fibonacci',
    code: `def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint(fib(10))`,
    output: '55',
    color: '#4488ff',
  },
  {
    label: 'List comprehension',
    code: `squares = [x**2 for x in range(1, 6)]\nprint(squares)`,
    output: '[1, 4, 9, 16, 25]',
    color: '#aa66ff',
  },
]

function CodeDemo() {
  const [demoIdx,   setDemoIdx]   = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [done,      setDone]      = useState(false)
  const timerRef = useRef(null)

  const demo = DEMOS[demoIdx]

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const type = () => {
      if (i <= demo.code.length) {
        setDisplayed(demo.code.slice(0, i))
        i++
        timerRef.current = setTimeout(type, i < 10 ? 80 : 28)
      } else {
        setTimeout(() => setDone(true), 400)
      }
    }
    timerRef.current = setTimeout(type, 600)
    return () => clearTimeout(timerRef.current)
  }, [demoIdx, demo.code])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => {
      setDemoIdx(i => (i + 1) % DEMOS.length)
    }, 2800)
    return () => clearTimeout(t)
  }, [done])

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: `0 0 60px ${demo.color}12`,
      transition: 'box-shadow 0.6s ease',
      maxWidth: 480, width: '100%',
    }}>
      {/* Titlebar */}
      <div style={{
        background: 'var(--bg3)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {['#ff5f57','#ffbd2e','#28ca41'].map(c => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'block' }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
          solution.py
        </span>
        {/* Demo tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {DEMOS.map((d, i) => (
            <button key={i} onClick={() => setDemoIdx(i)} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              background: demoIdx === i ? `${d.color}20` : 'transparent',
              color: demoIdx === i ? d.color : 'var(--text3)',
              border: `1px solid ${demoIdx === i ? d.color + '40' : 'transparent'}`,
              transition: 'all 0.15s', cursor: 'pointer',
            }}>{d.label}</button>
          ))}
        </div>
      </div>

      {/* Code */}
      <div style={{ padding: '16px 18px', minHeight: 120 }}>
        <pre style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8,
          color: '#a8ff78', whiteSpace: 'pre-wrap', margin: 0,
        }}>
          {displayed}
          <span style={{
            display: 'inline-block', width: 2, height: '1em',
            background: demo.color, marginLeft: 1,
            animation: done ? 'none' : 'pulse .8s infinite',
            verticalAlign: 'text-bottom', opacity: done ? 0 : 1,
          }} />
        </pre>
      </div>

      {/* Output */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        minHeight: 44,
        background: 'rgba(0,0,0,0.2)',
        transition: 'opacity 0.4s ease',
        opacity: done ? 1 : 0.3,
      }}>
        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>output</span>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: demo.color }}>{demo.output}</span>
        {done && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, color: demo.color,
            background: `${demo.color}12`, border: `1px solid ${demo.color}30`,
            padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)',
          }}>✓ accepted</span>
        )}
      </div>
    </div>
  )
}



/* ── Feature cards ─────────────────────────────────────── */
const FEATURES = [
  { icon: '⚡', title: 'Monaco Editor',      desc: 'VS Code quality editing in the browser — syntax highlighting, autocomplete, keyboard shortcuts', color: '#ffaa00' },
  { icon: '🤖', title: 'PyBot AI Tutor',     desc: 'Socratic guidance that nudges you toward the answer without spoiling it', color: '#aa66ff' },
  { icon: '🎯', title: '30 Curated Problems', desc: 'Beginner to Advanced with real test cases, hidden edge cases, and partial credit', color: '#00ff88' },
  { icon: '📊', title: 'Progress Tracking',   desc: 'Heatmap calendar, level rings, leaderboard — see your growth at a glance', color: '#4488ff' },
  { icon: '🔒', title: 'Sandboxed Execution', desc: 'Every code run is isolated — no network, no filesystem, memory-capped', color: '#ff4466' },
  { icon: '🏆', title: 'Leaderboard',         desc: 'See where you rank among all learners. Climb by solving harder problems', color: '#ffaa00' },
]

/* ── Comparison table ──────────────────────────────────── */
const COMPARISON = [
  { feature: 'Structured curriculum',   pylearn: true,  leetcode: false, codecademy: true,  replit: false },
  { feature: 'Real code execution',     pylearn: true,  leetcode: true,  codecademy: false, replit: true  },
  { feature: 'AI tutor',                pylearn: true,  leetcode: false, codecademy: false, replit: false },
  { feature: 'Monaco editor',           pylearn: true,  leetcode: true,  codecademy: false, replit: true  },
  { feature: 'Activity heatmap',        pylearn: true,  leetcode: true,  codecademy: false, replit: false },
  { feature: 'Free & open-source',      pylearn: true,  leetcode: false, codecademy: false, replit: false },
  { feature: 'Hint system',             pylearn: true,  leetcode: false, codecademy: true,  replit: false },
  { feature: 'Leaderboard',             pylearn: true,  leetcode: true,  codecademy: false, replit: false },
]

function Check({ v }) {
  return (
    <span style={{ color: v ? '#00ff88' : '#5a5a75', fontSize: 15, fontWeight: 700 }}>
      {v ? '✓' : '✗'}
    </span>
  )
}

export default function Home() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Grid BG */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,255,136,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.025) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', zIndex: 1,
        minHeight: '90vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '80px 24px 60px',
        gap: 60, flexWrap: 'wrap',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(0,255,136,0.05) 0%, transparent 65%)',
        }} />

        {/* Left text column */}
        <div style={{ maxWidth: 500, flex: '1 1 300px', position: 'relative' }}>
          <div className="fade-in" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.18)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 28,
            fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-mono)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            Open-source · Free forever
          </div>

          <h1 className="fade-in" style={{
            animationDelay: '60ms',
            fontSize: 'clamp(38px, 6vw, 72px)', fontWeight: 700,
            letterSpacing: '-2.5px', lineHeight: 1.05, marginBottom: 22,
          }}>
            Learn Python<br />
            <span style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>the right way.</span>
          </h1>

          <p className="fade-in" style={{
            animationDelay: '120ms',
            fontSize: 17, color: 'var(--text2)', lineHeight: 1.75,
            marginBottom: 36, maxWidth: 440,
          }}>
            30 structured challenges across 3 levels. Run real Python in the browser,
            get AI hints, track your streak, and climb the leaderboard.
          </p>

          <div className="fade-in" style={{
            animationDelay: '180ms',
            display: 'flex', gap: 12, flexWrap: 'wrap',
          }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--green)', color: 'var(--bg)',
              padding: '13px 30px', borderRadius: 10,
              fontWeight: 700, fontSize: 15,
              boxShadow: '0 0 32px rgba(0,255,136,0.30)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,255,136,0.40)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 0 32px rgba(0,255,136,0.30)' }}
            >Start coding free →</Link>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--text2)', padding: '13px 24px', borderRadius: 10,
              fontWeight: 500, fontSize: 15,
              border: '1px solid var(--border)', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';        e.currentTarget.style.color = 'var(--text2)' }}
            >Sign in</Link>
          </div>

          {/* Micro-stats */}
          <div className="fade-in" style={{
            animationDelay: '260ms',
            display: 'flex', gap: 28, marginTop: 40, flexWrap: 'wrap',
          }}>
            {[['30', 'Problems'], ['3', 'Levels'], ['100%', 'Free']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right demo column */}
        <div className="fade-in" style={{ animationDelay: '100ms', flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
          <CodeDemo />
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 24px', maxWidth: 1060, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>
            Everything you need
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-1px' }}>
            Built for real learning
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="fade-in" style={{
              animationDelay: `${i * 50}ms`,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '22px 20px',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '35'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 7, color: f.color }}>{f.title}</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 24px 60px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>
            Comparison
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 700, letterSpacing: '-0.5px' }}>
            How PyPractice stacks up
          </h2>
        </div>

        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 100px 110px 80px',
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg3)',
          }}>
            {['Feature', 'PyPractice', 'LeetCode', 'Codecademy', 'Replit'].map((h, i) => (
              <div key={h} style={{
                fontSize: 12, fontFamily: 'var(--font-mono)',
                color: i === 1 ? 'var(--green)' : 'var(--text3)',
                textAlign: i > 0 ? 'center' : 'left',
                fontWeight: i === 1 ? 700 : 400,
              }}>{h}</div>
            ))}
          </div>

          {COMPARISON.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 100px 110px 80px',
              padding: '12px 20px',
              borderBottom: i < COMPARISON.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
            >
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{row.feature}</div>
              {[row.pylearn, row.leetcode, row.codecademy, row.replit].map((v, j) => (
                <div key={j} style={{ textAlign: 'center' }}><Check v={v} /></div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '40px 24px 100px', maxWidth: 680, margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(68,136,255,0.06))',
          border: '1px solid rgba(0,255,136,0.15)',
          borderRadius: 20, padding: '48px 32px',
        }}>
          <img
            src="/pypractice-mark.png"
            alt=""
            style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 16 }}
          />
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 12 }}>
            Ready to write your first line?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.7 }}>
            Join PyPractice for free. No credit card, no setup, no excuses.
          </p>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--green)', color: 'var(--bg)',
            padding: '14px 36px', borderRadius: 10,
            fontWeight: 700, fontSize: 16,
            boxShadow: '0 0 40px rgba(0,255,136,0.30)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 48px rgba(0,255,136,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 0 40px rgba(0,255,136,0.30)' }}
          >Get started — it's free →</Link>
        </div>
      </section>
    </div>
  )
}
