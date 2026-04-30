import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getQuestions } from '../api/curriculum'
import { QuestionRowSkeleton } from '../components/Skeleton'

const LEVEL_META = {
  beginner:     { color: '#00ff88', label: 'Beginner',     desc: 'Master Python fundamentals' },
  intermediate: { color: '#4488ff', label: 'Intermediate', desc: 'Algorithms & data structures' },
  advanced:     { color: '#aa66ff', label: 'Advanced',     desc: 'Patterns, async, decorators' },
}

const BOOKMARK_KEY = 'pypractice:question-bookmarks'

function cleanText(text, max = 150) {
  const compact = (text || '').replace(/\s+/g, ' ').trim()
  if (compact.length <= max) return compact
  return `${compact.slice(0, max).trim()}...`
}

function getStoredBookmarks() {
  if (typeof window === 'undefined') return []
  try {
    const saved = JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function getDifficulty(slug) {
  if (slug === 'advanced') return { label: 'Hard', color: '#ff4466' }
  if (slug === 'intermediate') return { label: 'Medium', color: '#ffaa00' }
  return { label: 'Easy', color: '#00ff88' }
}

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function dailyIndexFor(slug, count) {
  if (!count) return 0
  const key = `${slug}:${getDateKey(new Date())}`
  const seed = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return seed % count
}

function StatTile({ label, value, color }) {
  return (
    <div style={{
      flex: '1 1 130px',
      minWidth: 0,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '12px 14px',
    }}>
      <div style={{
        fontSize: 10,
        color: 'var(--text3)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '1.6px',
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        color,
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}

function FilterButton({ active, children, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        color: active ? 'var(--bg)' : 'var(--text2)',
        background: active ? color : 'transparent',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function FocusCard({ label, question, helper, color, actionLabel, locked }) {
  if (!question) return null

  return (
    <div className="fade-in" style={{
      background: 'var(--bg2)',
      border: `1px solid ${color}24`,
      borderRadius: 14,
      padding: '18px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: '0 0 auto auto',
        width: 140,
        height: 100,
        background: `radial-gradient(circle at top right, ${color}12, transparent 72%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 10,
          color,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '1.8px',
          marginBottom: 8,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.35,
          marginBottom: 6,
        }}>
          {question.title}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 14 }}>
          {helper}
        </p>
        {locked ? (
          <div style={{
            display: 'inline-flex',
            color: 'var(--text3)',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.025)',
            borderRadius: 9,
            padding: '7px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Locked
          </div>
        ) : (
          <Link to={`/question/${question.id}`} style={{
          display: 'inline-flex',
          color,
          border: `1px solid ${color}35`,
          background: `${color}10`,
          borderRadius: 9,
          padding: '7px 12px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {actionLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

function QuestionCard({ q, index, isSolved, isUnlocked, lockedReason, color, difficulty, isSaved, onToggleSaved }) {
  const baseBg = isSolved
    ? `linear-gradient(135deg, ${color}10, var(--bg2) 38%)`
    : !isUnlocked
      ? 'linear-gradient(135deg, rgba(255,255,255,0.015), var(--bg2) 44%)'
    : 'var(--bg2)'
  const preview = cleanText(q.description)
  const orderLabel = String(q.order || index + 1).padStart(2, '0')

  return (
    <div
      className="fade-in question-card"
      style={{
        animationDelay: `${index * 25}ms`,
        background: baseBg,
        border: `1px solid ${isSolved ? color + '35' : 'var(--border)'}`,
        opacity: isUnlocked ? 1 : 0.72,
        borderRadius: 14,
        padding: '16px 18px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.18s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = isSolved
          ? `linear-gradient(135deg, ${color}18, var(--bg3) 42%)`
          : 'var(--bg3)'
        e.currentTarget.style.borderColor = isSolved ? `${color}55` : 'var(--border-hover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 14px 34px ${color}0d`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = baseBg
        e.currentTarget.style.borderColor = isSolved ? `${color}35` : 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        position: 'absolute',
        left: 0,
        top: 14,
        bottom: 14,
        width: 3,
        borderRadius: '0 3px 3px 0',
        background: isSolved ? color : 'var(--bg4)',
      }} />

      {isUnlocked ? (
        <Link to={`/question/${q.id}`} className="question-card-main" style={{
          textDecoration: 'none',
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr)',
          alignItems: 'center',
          gap: 16,
          minWidth: 0,
        }}>
          <QuestionCardBody
            q={q}
            isSolved={isSolved}
            isUnlocked={isUnlocked}
            lockedReason={lockedReason}
            color={color}
            difficulty={difficulty}
            orderLabel={orderLabel}
            preview={preview}
          />
        </Link>
      ) : (
        <div className="question-card-main" style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr)',
          alignItems: 'center',
          gap: 16,
          minWidth: 0,
        }}>
          <QuestionCardBody
            q={q}
            isSolved={isSolved}
            isUnlocked={isUnlocked}
            lockedReason={lockedReason}
            color={color}
            difficulty={difficulty}
            orderLabel={orderLabel}
            preview={preview}
          />
        </div>
      )}

      <div className="question-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
        <button
          type="button"
          onClick={() => onToggleSaved(q.id)}
          style={{
            color: isSaved ? 'var(--amber)' : 'var(--text3)',
            border: `1px solid ${isSaved ? 'rgba(255,170,0,0.35)' : 'var(--border)'}`,
            background: isSaved ? 'var(--amber-dim)' : 'transparent',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          {isSaved ? 'Saved' : 'Save'}
        </button>
        {isUnlocked ? (
          <Link to={`/question/${q.id}`} style={{
            color: isSolved ? color : 'var(--text2)',
            border: `1px solid ${isSolved ? color + '35' : 'var(--border)'}`,
            background: isSolved ? `${color}10` : 'transparent',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            {isSolved ? 'Review' : 'Solve'}
          </Link>
        ) : (
          <div title={lockedReason} style={{
            color: 'var(--text3)',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.025)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            Locked
          </div>
        )}
      </div>
    </div>
  )
}

function QuestionCardBody({ q, isSolved, isUnlocked, lockedReason, color, difficulty, orderLabel, preview }) {
  return (
    <>
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          flexShrink: 0,
          background: isSolved ? `${color}16` : 'var(--bg4)',
          border: `1.5px solid ${isSolved ? color + '45' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isSolved ? 18 : 13,
          fontFamily: 'var(--font-mono)',
          color: isSolved ? color : 'var(--text3)',
          fontWeight: 700,
        }}>
          {isSolved ? '✓' : isUnlocked ? orderLabel : 'LOCK'}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 5,
          }}>
            <div style={{
              fontWeight: 650,
              fontSize: 15,
              color: isSolved ? color : 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              maxWidth: '100%',
            }}>
              {q.title}
            </div>
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: isSolved ? color : isUnlocked ? 'var(--text3)' : 'var(--amber)',
              background: isSolved ? `${color}12` : isUnlocked ? 'rgba(255,255,255,0.025)' : 'var(--amber-dim)',
              border: `1px solid ${isSolved ? color + '25' : isUnlocked ? 'var(--border)' : 'rgba(255,170,0,0.25)'}`,
              borderRadius: 999,
              padding: '2px 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              flexShrink: 0,
            }}>
              {isSolved ? 'solved' : isUnlocked ? 'open' : 'locked'}
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: difficulty.color,
              background: `${difficulty.color}12`,
              border: `1px solid ${difficulty.color}28`,
              borderRadius: 999,
              padding: '2px 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              flexShrink: 0,
            }}>
              {difficulty.label}
            </span>
          </div>

          {preview && (
            <p style={{
              fontSize: 12,
              color: 'var(--text2)',
              lineHeight: 1.55,
              marginBottom: 10,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {preview}
            </p>
          )}
          {!isUnlocked && lockedReason && (
            <p style={{
              fontSize: 12,
              color: 'var(--amber)',
              lineHeight: 1.5,
              marginBottom: 10,
            }}>
              {lockedReason}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11,
              color: 'var(--text3)',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '3px 8px',
            }}>
              {q.points} pts
            </span>
            <span style={{
              fontSize: 11,
              color: 'var(--text3)',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '3px 8px',
            }}>
              {q.hint_count || 0} hints
            </span>
          </div>
        </div>
    </>
  )
}

function EmptyState({ color }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '26px 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No questions found</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
        Try changing the search, filter, or sort options.
      </div>
      <div style={{ margin: '14px auto 0', width: 44, height: 3, borderRadius: 3, background: color }} />
    </div>
  )
}

function Toolbar({ query, setQuery, filter, setFilter, sortBy, setSortBy, color, savedCount }) {
  const filters = [
    ['all', 'All'],
    ['unsolved', 'Unsolved'],
    ['solved', 'Solved'],
    ['saved', `Saved ${savedCount ? `(${savedCount})` : ''}`],
  ]

  return (
    <div className="question-toolbar" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(220px, 1fr) auto auto',
      gap: 10,
      alignItems: 'center',
      marginBottom: 16,
    }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search questions..."
        aria-label="Search questions"
        style={{
          width: '100%',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 13px',
          color: 'var(--text)',
          fontSize: 13,
          outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = color}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      <div style={{
        display: 'flex',
        gap: 5,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 4,
        overflowX: 'auto',
      }}>
        {filters.map(([value, label]) => (
          <FilterButton key={value} active={filter === value} color={color} onClick={() => setFilter(value)}>
            {label}
          </FilterButton>
        ))}
      </div>

      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        aria-label="Sort questions"
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 12px',
          color: 'var(--text2)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          outline: 'none',
        }}
      >
        <option value="order">Default order</option>
        <option value="points">Most points</option>
        <option value="hints">Most hints</option>
        <option value="title">Title A-Z</option>
      </select>
    </div>
  )
}

export default function LevelPage() {
  const { slug } = useParams()
  const meta = LEVEL_META[slug] || LEVEL_META.beginner
  const [questions, setQuestions] = useState([])
  const [solved,    setSolved]    = useState(new Set())
  const [loading,   setLoading]   = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('order')
  const [savedIds, setSavedIds] = useState(getStoredBookmarks)

  useEffect(() => {
    setLoading(true)
    getQuestions(slug).then(r => {
      setQuestions(r.data)
      setSolved(new Set(r.data.filter(q => q.is_solved).map(q => q.id)))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(savedIds))
    }
  }, [savedIds])

  const pct = questions.length ? Math.round((solved.size / questions.length) * 100) : 0
  const remaining = Math.max(questions.length - solved.size, 0)
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const savedSet = useMemo(() => new Set(savedIds), [savedIds])
  const difficulty = getDifficulty(slug)
  const nextQuestion = questions.find(q => q.is_unlocked && !solved.has(q.id)) || questions.find(q => q.is_unlocked) || questions[0]
  const dailyQuestion = questions[dailyIndexFor(slug, questions.length)]

  const visibleQuestions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = questions.filter(q => {
      const matchesSearch = !needle ||
        q.title.toLowerCase().includes(needle) ||
        (q.description || '').toLowerCase().includes(needle)
      const isSolved = solved.has(q.id)
      const isSaved = savedSet.has(q.id)

      if (!matchesSearch) return false
      if (filter === 'solved') return isSolved
      if (filter === 'unsolved') return !isSolved
      if (filter === 'saved') return isSaved
      return true
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'points') return (b.points || 0) - (a.points || 0)
      if (sortBy === 'hints') return (b.hint_count || 0) - (a.hint_count || 0)
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return (a.order || 0) - (b.order || 0)
    })
  }, [questions, query, filter, sortBy, solved, savedSet])

  const toggleSaved = id => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(savedId => savedId !== id) : [...prev, id])
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

      {/* Breadcrumb */}
      <Link to="/dashboard" style={{
        fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
        display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 24,
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
      >← dashboard</Link>

      {/* Header */}
      <div className="fade-in" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px 22px', marginBottom: 22,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 140, height: 140,
          background: `radial-gradient(circle at top right, ${meta.color}10, transparent)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: meta.color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>
              {meta.label}
            </div>
            <h1 style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 0,
              marginBottom: 6,
              lineHeight: 1.15,
            }}>
              Question list
            </h1>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>{meta.desc}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: meta.color, lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
              {solved.size}/{questions.length} solved
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
            borderRadius: 2, transition: 'width 1s ease',
          }} />
        </div>

        {pct === 100 && (
          <div style={{
            marginTop: 12, fontSize: 13, color: meta.color, fontFamily: 'var(--font-mono)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Level complete
          </div>
        )}
      </div>

      <div className="fade-in" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22, animationDelay: '80ms' }}>
        <StatTile label="Solved" value={solved.size} color={meta.color} />
        <StatTile label="Remaining" value={remaining} color="var(--text)" />
        <StatTile label="Points" value={totalPoints} color="var(--blue)" />
      </div>

      {!loading && questions.length > 0 && (
        <div className="level-feature-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 22,
        }}>
          <FocusCard
            label="Next recommended"
            question={nextQuestion}
            helper={!nextQuestion?.is_unlocked ? nextQuestion?.locked_reason : solved.has(nextQuestion?.id) ? 'Everything is solved. Revisit this one to keep the pattern fresh.' : 'This is the next open question in your current path.'}
            color={meta.color}
            actionLabel={solved.has(nextQuestion?.id) ? 'Review' : 'Continue'}
            locked={!nextQuestion?.is_unlocked}
          />
          <FocusCard
            label="Daily challenge"
            question={dailyQuestion}
            helper={dailyQuestion?.is_unlocked ? 'A fresh pick for today, chosen from this level to keep practice focused.' : dailyQuestion?.locked_reason}
            color="#ffaa00"
            actionLabel="Start daily"
            locked={!dailyQuestion?.is_unlocked}
          />
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}>
        <h2 style={{
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text3)',
          letterSpacing: '2.4px',
          textTransform: 'uppercase',
        }}>
          Practice queue
        </h2>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {visibleQuestions.length}/{questions.length} questions
        </div>
      </div>

      <Toolbar
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        color={meta.color}
        savedCount={questions.filter(q => savedSet.has(q.id)).length}
      />

      {/* Question list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading
          ? [...Array(10)].map((_, i) => <QuestionRowSkeleton key={i} />)
          : visibleQuestions.length === 0
            ? <EmptyState color={meta.color} />
            : visibleQuestions.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={i}
                isSolved={solved.has(q.id)}
                isUnlocked={q.is_unlocked}
                lockedReason={q.locked_reason}
                color={meta.color}
                difficulty={difficulty}
                isSaved={savedSet.has(q.id)}
                onToggleSaved={toggleSaved}
              />
            ))
        }
      </div>
    </div>
  )
}
