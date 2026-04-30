import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { getQuestion, getQuestions } from '../api/curriculum'
import { submitCode, runCode, getHistory } from '../api/submissions'
import { chat, getHint } from '../api/ai'

/* ─── helpers ─────────────────────────────────────────────── */

function statusColor(s) {
  return { accepted:'#00ff88', wrong_answer:'#ff4466', error:'#ff4466', timeout:'#ffaa00' }[s] || '#9999b0'
}
function statusIcon(s) {
  return { accepted:'✓', wrong_answer:'✗', error:'⚠', timeout:'⏱' }[s] || '·'
}

/* ─── Monaco wrapper ──────────────────────────────────────── */
function CodeEditor({ value, onChange, onRun, onSubmit }) {
  const editorRef = useRef(null)

  function handleMount(editor, monaco) {
    editorRef.current = editor
    // Define a custom dark Python theme
    monaco.editor.defineTheme('pylearn-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword',         foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'string',          foreground: 'f1fa8c' },
        { token: 'comment',         foreground: '6272a4', fontStyle: 'italic' },
        { token: 'number',          foreground: 'bd93f9' },
        { token: 'identifier',      foreground: 'f8f8f2' },
        { token: 'delimiter',       foreground: 'ff79c6' },
        { token: 'type.identifier', foreground: '8be9fd' },
      ],
      colors: {
        'editor.background':           '#0a0a0f',
        'editor.foreground':           '#f8f8f2',
        'editorLineNumber.foreground': '#44475a',
        'editorLineNumber.activeForeground': '#f8f8f2',
        'editor.lineHighlightBackground': '#14141c',
        'editor.selectionBackground':  '#44475a',
        'editorCursor.foreground':     '#00ff88',
        'editorGutter.background':     '#0a0a0f',
        'editorIndentGuide.background':'#282a36',
        'editor.inactiveSelectionBackground': '#282a36',
        'scrollbarSlider.background':  '#282a3680',
        'scrollbarSlider.hoverBackground': '#44475a80',
      },
    })
    monaco.editor.setTheme('pylearn-dark')

    // Keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => onRun()
    )
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => onSubmit()
    )
    editor.focus()
  }

  return (
    <div style={{ height:'100%', position:'relative' }}>
      {/* Titlebar */}
      <div style={{
        height: 34, background:'#0d0d14', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', padding:'0 14px', gap:8,
        flexShrink: 0,
      }}>
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#ff5f57', display:'block' }} />
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#ffbd2e', display:'block' }} />
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#28ca41', display:'block' }} />
        <span style={{
          marginLeft: 10, fontSize: 12, fontFamily:'var(--font-mono)',
          color:'var(--text3)', letterSpacing:'0.5px'
        }}>solution.py</span>
        <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
          {'Ctrl+Enter run · Ctrl+Shift+Enter submit'}
        </span>
      </div>
      <Editor
        height="calc(100% - 34px)"
        language="python"
        value={value}
        onChange={v => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          fontSize: 14,
          fontFamily: '"Space Mono", "Fira Code", monospace',
          fontLigatures: true,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          renderLineHighlight: 'gutter',
          cursorBlinking: 'smooth',
          cursorStyle: 'line',
          smoothScrolling: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          automaticLayout: true,
          suggest: { showWords: true },
          quickSuggestions: { other: true, comments: false, strings: false },
          acceptSuggestionOnCommitCharacter: true,
          folding: true,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  )
}

/* ─── Output Panel ────────────────────────────────────────── */
function OutputPanel({ result, submitting, running }) {
  if (submitting || running) return (
    <div style={{ padding:24, display:'flex', alignItems:'center', gap:12 }}>
      <div style={{
        width:16, height:16, border:'2px solid var(--green)',
        borderTopColor:'transparent', borderRadius:'50%',
        animation:'spin 0.7s linear infinite',
      }} />
      <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text2)' }}>
        {submitting ? 'Grading against test cases…' : 'Running your code…'}
      </span>
    </div>
  )

  if (!result) return (
    <div style={{ padding:24, color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:13 }}>
      {'Press '}<strong style={{ color:'var(--text2)' }}>Run</strong>{' to test · '}
      <strong style={{ color:'var(--green)' }}>Submit</strong>{' to grade'}
    </div>
  )

  const col = statusColor(result.status)

  return (
    <div style={{ padding:'14px 16px', fontFamily:'var(--font-mono)', fontSize:13, overflowY:'auto', height:'100%' }}>
      {/* Status badge */}
      {result.status && (
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:`${col}12`, border:`1px solid ${col}30`,
          borderRadius:8, padding:'6px 14px', marginBottom:14,
        }}>
          <span style={{ color: col, fontSize:16, fontWeight:700 }}>{statusIcon(result.status)}</span>
          <span style={{ color: col, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', fontSize:11 }}>
            {result.status.replace(/_/g,' ')}
          </span>
          {result.score !== undefined && (
            <span style={{ color: col, opacity:0.6, fontSize:12 }}>· {result.score}/100</span>
          )}
        </div>
      )}

      {/* stdout */}
      {result.stdout && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>stdout</div>
          <pre style={{
            margin:0, color:'#a8ff78', background:'#0d1a10',
            border:'1px solid rgba(0,255,136,0.12)',
            padding:'10px 12px', borderRadius:8, fontSize:13,
            overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word',
          }}>{result.stdout}</pre>
        </div>
      )}

      {/* stderr */}
      {result.stderr && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:'var(--red)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>error</div>
          <pre style={{
            margin:0, color:'#ff8099', background:'#1a0d10',
            border:'1px solid rgba(255,68,102,0.15)',
            padding:'10px 12px', borderRadius:8, fontSize:13,
            overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word',
          }}>{result.stderr}</pre>
        </div>
      )}

      {/* Test cases */}
      {result.test_results?.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:8 }}>
            test cases — {result.test_results.filter(t => t.status==='passed').length}/{result.test_results.length} passed
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {result.test_results.map((t, i) => {
              const pass = t.status === 'passed'
              return (
                <div key={i} style={{
                  borderRadius:7, overflow:'hidden',
                  border:`1px solid ${pass ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)'}`,
                }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:10, padding:'7px 12px',
                    background: pass ? 'rgba(0,255,136,0.05)' : 'rgba(255,68,102,0.06)',
                  }}>
                    <span style={{ color: pass ? 'var(--green)' : 'var(--red)', fontWeight:700 }}>
                      {pass ? '✓' : '✗'}
                    </span>
                    <span style={{ color:'var(--text2)', fontSize:12 }}>Case {i + 1}</span>
                    <span style={{ marginLeft:'auto', color:'var(--text3)', fontSize:11 }}>{t.runtime_ms}ms</span>
                  </div>
                  {!pass && t.actual_output !== '[hidden]' && (
                    <div style={{ padding:'8px 12px', background:'rgba(0,0,0,0.3)', fontSize:12 }}>
                      <div style={{ color:'var(--text3)', marginBottom:3 }}>
                        expected: <span style={{ color:'var(--green)' }}>{t.expected_output}</span>
                      </div>
                      <div style={{ color:'var(--text3)' }}>
                        got: <span style={{ color:'var(--red)' }}>{t.actual_output || '(empty)'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Submission History ─────────────────────────────────── */
function HistoryPanel({ questionId, onLoadSubmission }) {
  const [history, setHistory] = useState(null)

  useEffect(() => {
    getHistory(questionId).then(r => setHistory(r.data)).catch(() => setHistory([]))
  }, [questionId])

  if (!history) return (
    <div style={{ padding:24, color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:13 }}>Loading…</div>
  )
  if (!history.length) return (
    <div style={{ padding:24, color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:13 }}>No submissions yet</div>
  )

  return (
    <div style={{ padding:'12px', overflowY:'auto', height:'100%' }}>
      <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:10, fontFamily:'var(--font-mono)' }}>
        recent submissions
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {history.map(sub => {
          const col = statusColor(sub.status)
          const dt = new Date(sub.submitted_at)
          return (
            <div key={sub.id}
              onClick={() => onLoadSubmission(sub)}
              style={{
                background:'var(--bg3)', border:`1px solid var(--border)`,
                borderRadius:8, padding:'10px 12px', cursor:'pointer',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = col+'40'; e.currentTarget.style.background = 'var(--bg4)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{
                  fontSize:11, fontFamily:'var(--font-mono)', color: col, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'1px',
                }}>
                  {statusIcon(sub.status)} {sub.status.replace(/_/g,' ')}
                </span>
                <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                  {sub.score}/100
                </span>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                {' · '}click to restore
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── AI Chat ─────────────────────────────────────────────── */
function AIPanel({ questionId, code, questionHints }) {
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState([{
    role:'assistant',
    content:"Hi! I'm PyBot 🤖 I can help you think through this problem. What's confusing you?",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hintIdx, setHintIdx] = useState(0)
  const [shownHints, setShownHints] = useState([])
  const [hintLoading, setHintLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg = { role:'user', content: text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { data } = await chat({
        question_id: questionId,
        message: text,
        history: messages.slice(-6),
      })
      setMessages(m => [...m, { role:'assistant', content: data.reply }])
    } catch {
      setMessages(m => [...m, { role:'assistant', content:'Sorry, connection issue. Please try again!' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, loading, messages, questionId])

  const fetchNextHint = async () => {
    if (hintLoading) return
    // First serve DB hints
    if (questionHints?.length && hintIdx < questionHints.length) {
      setShownHints(h => [...h, questionHints[hintIdx].content])
      setHintIdx(i => i + 1)
      return
    }
    // Fall back to AI hint
    setHintLoading(true)
    try {
      const { data } = await getHint(questionId, { code })
      setShownHints(h => [...h, data.hint])
    } catch {
      setShownHints(h => [...h, 'Could not load hint right now. Try again.'])
    } finally {
      setHintLoading(false)
    }
  }

  const tabs = [
    { id:'chat',  label:'🤖 Chat' },
    { id:'hints', label:'💡 Hints' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'9px 4px',
            fontSize:12, fontFamily:'var(--font-mono)',
            color: tab===t.id ? 'var(--green)' : 'var(--text3)',
            background: tab===t.id ? 'rgba(0,255,136,0.07)' : 'transparent',
            borderBottom: tab===t.id ? '2px solid var(--green)' : '2px solid transparent',
            transition:'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Chat */}
      {tab === 'chat' && (
        <>
          <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', marginBottom:3 }}>PyBot</div>
                )}
                <div style={{
                  maxWidth:'90%', padding:'9px 12px', borderRadius: m.role==='user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  fontSize:13, lineHeight:1.65,
                  background: m.role==='user' ? 'rgba(0,255,136,0.1)' : 'var(--bg3)',
                  border: `1px solid ${m.role==='user' ? 'rgba(0,255,136,0.2)' : 'var(--border)'}`,
                  color: m.role==='user' ? 'var(--green)' : 'var(--text)',
                  fontFamily: m.role==='user' ? 'var(--font-mono)' : 'var(--font-body)',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text3)', fontSize:13 }}>
                <span style={{ animation:'pulse 1s infinite 0s' }}>●</span>
                <span style={{ animation:'pulse 1s infinite 0.2s' }}>●</span>
                <span style={{ animation:'pulse 1s infinite 0.4s' }}>●</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding:'10px', borderTop:'1px solid var(--border)', display:'flex', gap:8, flexShrink:0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask PyBot anything…"
              style={{
                flex:1, background:'var(--bg3)', border:'1px solid var(--border)',
                borderRadius:8, padding:'8px 12px', color:'var(--text)', fontSize:13,
                outline:'none', fontFamily:'var(--font-body)', transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor='var(--green)'}
              onBlur={e => e.target.style.borderColor='var(--border)'}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width:36, height:36, borderRadius:8,
                background: input.trim() && !loading ? 'var(--green)' : 'var(--bg4)',
                color: input.trim() && !loading ? 'var(--bg)' : 'var(--text3)',
                fontSize:16, fontWeight:700, flexShrink:0, transition:'all 0.15s',
              }}
            >↑</button>
          </div>
        </>
      )}

      {/* Hints */}
      {tab === 'hints' && (
        <div style={{ flex:1, overflowY:'auto', padding:14 }}>
          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:16, lineHeight:1.7 }}>
            Stuck? Get a nudge without spoiling the solution.
            Hints reveal progressively — start with #1.
          </p>
          {shownHints.map((h, i) => (
            <div key={i} style={{
              background:'rgba(255,170,0,0.07)',
              border:'1px solid rgba(255,170,0,0.2)',
              borderRadius:10, padding:'12px 14px', marginBottom:10,
              fontSize:13, lineHeight:1.7, color:'var(--text)',
            }}>
              <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--amber)', marginRight:8 }}>
                HINT {i + 1}
              </span>
              {h}
            </div>
          ))}
          <button
            onClick={fetchNextHint}
            disabled={hintLoading}
            style={{
              width:'100%', padding:'10px 0',
              background:'rgba(255,170,0,0.08)',
              border:'1px solid rgba(255,170,0,0.25)',
              borderRadius:8, color:'var(--amber)',
              fontSize:13, fontFamily:'var(--font-mono)',
              transition:'all 0.2s', cursor: hintLoading ? 'wait' : 'pointer',
            }}
            onMouseEnter={e => { if (!hintLoading) e.currentTarget.style.background='rgba(255,170,0,0.14)' }}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,170,0,0.08)'}
          >
            {hintLoading ? 'Loading…' : shownHints.length === 0 ? '💡 Show first hint' : '💡 Next hint →'}
          </button>
          <p style={{ fontSize:11, color:'var(--text3)', marginTop:10, textAlign:'center' }}>
            {questionHints?.length || 0} pre-written hints available
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Question Nav (prev/next) ────────────────────────────── */
function QuestionNav({ currentId, levelSlug, refreshKey }) {
  const [questions, setQuestions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (levelSlug) getQuestions(levelSlug).then(r => setQuestions(r.data)).catch(() => {})
  }, [levelSlug, refreshKey])

  const idx = questions.findIndex(q => q.id === currentId)
  const prev = idx > 0 ? questions[idx - 1] : null
  const next = idx < questions.length - 1 ? questions[idx + 1] : null
  const nextLocked = next && next.is_unlocked === false

  return (
    <div style={{ display:'flex', gap:6 }}>
      <button
        onClick={() => prev && navigate(`/question/${prev.id}`)}
        disabled={!prev}
        title={prev?.title}
        style={{
          padding:'4px 12px', borderRadius:6, fontSize:12,
          fontFamily:'var(--font-mono)',
          color: prev ? 'var(--text2)' : 'var(--text3)',
          background:'var(--bg3)', border:'1px solid var(--border)',
          cursor: prev ? 'pointer' : 'not-allowed', opacity: prev ? 1 : 0.4,
          transition:'all 0.15s',
        }}
        onMouseEnter={e => { if (prev) e.currentTarget.style.borderColor='var(--border-hover)' }}
        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
      >← prev</button>
      <button
        onClick={() => next && !nextLocked && navigate(`/question/${next.id}`)}
        disabled={!next || nextLocked}
        title={nextLocked ? next.locked_reason : next?.title}
        style={{
          padding:'4px 12px', borderRadius:6, fontSize:12,
          fontFamily:'var(--font-mono)',
          color: next && !nextLocked ? 'var(--text2)' : 'var(--text3)',
          background:'var(--bg3)', border:'1px solid var(--border)',
          cursor: next && !nextLocked ? 'pointer' : 'not-allowed', opacity: next && !nextLocked ? 1 : 0.4,
          transition:'all 0.15s',
        }}
        onMouseEnter={e => { if (next && !nextLocked) e.currentTarget.style.borderColor='var(--border-hover)' }}
        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
      >{nextLocked ? 'locked' : 'next →'}</button>
    </div>
  )
}

/* ─── Celebration overlay ─────────────────────────────────── */
function SuccessOverlay({ onClose }) {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:50,
      background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div style={{
        background:'var(--bg2)', border:'1px solid rgba(0,255,136,0.3)',
        borderRadius:20, padding:'40px 48px', textAlign:'center',
        boxShadow:'0 0 80px rgba(0,255,136,0.15)',
        animation:'fadeIn 0.4s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <div style={{
          fontSize:28, fontWeight:700, color:'var(--green)',
          fontFamily:'var(--font-mono)', letterSpacing:'-1px', marginBottom:8,
        }}>Accepted!</div>
        <div style={{ fontSize:15, color:'var(--text2)', marginBottom:28 }}>
          All test cases passed. Score: 100/100
        </div>
        <button
          onClick={onClose}
          style={{
            background:'var(--green)', color:'var(--bg)',
            padding:'10px 32px', borderRadius:8, fontSize:14,
            fontWeight:700, cursor:'pointer', transition:'all 0.2s',
          }}
        >Continue →</button>
      </div>
    </div>
  )
}

/* ─── Main Workspace ──────────────────────────────────────── */
export default function WorkspacePage() {
  const { id } = useParams()
  const [question, setQuestion]   = useState(null)
  const [code, setCode]           = useState('')
  const [result, setResult]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [running, setRunning]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [lockError, setLockError] = useState('')
  const [rightTab, setRightTab]   = useState('output')   // 'output'|'history'|'ai'
  const [showSuccess, setShowSuccess] = useState(false)
  const [fontSize, setFontSize]   = useState(14)
  const [navRefresh, setNavRefresh] = useState(0)

  // Derive level slug from question (passed via location.state or stored)
  const [levelSlug, setLevelSlug] = useState('')

  useEffect(() => {
    setLoading(true)
    setResult(null)
    setShowSuccess(false)
    setLockError('')
    getQuestion(id)
      .then(r => {
        setQuestion(r.data)
        setLevelSlug(r.data.level_slug || '')
        // Infer level slug from level id — stored in state
        const saved = localStorage.getItem(`code_${id}`)
        setCode(saved || r.data.starter_code || '# Write your solution here\n')
      })
      .catch(err => {
        setQuestion(null)
        setLockError(err.response?.data?.detail || '')
      })
      .finally(() => setLoading(false))
  }, [id])

  // Persist code on change
  useEffect(() => {
    if (code && id) localStorage.setItem(`code_${id}`, code)
  }, [code, id])

  // Detect level slug from question data
  useEffect(() => {
    if (!question) return
    setLevelSlug(question.level_slug || 'beginner')
  }, [question])

  const handleRun = useCallback(async () => {
    if (running || submitting) return
    setRunning(true); setResult(null)
    try {
      const { data } = await runCode({ code })
      setResult({
        stdout: data.stdout,
        stderr: data.stderr,
        status: data.exit_code === 0 ? null : 'error',
        test_results: [],
      })
      setRightTab('output')
    } catch {
      setResult({ stderr:'Failed to connect to execution service.', status:'error', test_results:[] })
    } finally { setRunning(false) }
  }, [code, running, submitting])

  const handleSubmit = useCallback(async () => {
    if (running || submitting) return
    setSubmitting(true); setResult(null); setRightTab('output')
    try {
      const { data } = await submitCode({ question_id: id, code })
      setResult(data)
      if (data.status === 'accepted') {
        setShowSuccess(true)
        setNavRefresh(v => v + 1)
      }
    } catch (err) {
      setResult({ stderr: err.response?.data?.detail || 'Submission failed. Please try again.', status:'error', test_results:[] })
    } finally { setSubmitting(false) }
  }, [code, id, running, submitting])

  const resetCode = () => {
    if (question && window.confirm('Reset to starter code? Your current code will be lost.')) {
      setCode(question.starter_code || '# Write your solution here\n')
      localStorage.removeItem(`code_${id}`)
    }
  }

  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'calc(100vh - 56px)',
      color:'var(--text2)', fontFamily:'var(--font-mono)', fontSize:14,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:14, height:14, border:'2px solid var(--green)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
        loading question…
      </div>
    </div>
  )

  if (!question) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>
      <div style={{ maxWidth:460, margin:'0 auto', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 24px' }}>
        <div style={{ fontSize:12, color: lockError ? 'var(--amber)' : 'var(--red)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>
          {lockError ? 'Question locked' : 'Question not found'}
        </div>
        <div style={{ fontSize:15, color:'var(--text2)', lineHeight:1.7, marginBottom:20 }}>
          {lockError || 'This question does not exist or is no longer available.'}
        </div>
        <Link to="/dashboard" style={{
          display:'inline-flex',
          color:'var(--green)',
          border:'1px solid rgba(0,255,136,0.25)',
          background:'var(--green-dim)',
          borderRadius:9,
          padding:'9px 14px',
          fontSize:12,
          fontFamily:'var(--font-mono)',
        }}>Back to dashboard</Link>
      </div>
    </div>
  )

  const rightTabs = [
    { id:'output',  label:'⚡ Output' },
    { id:'history', label:'📋 History' },
    { id:'ai',      label:'🤖 AI' },
  ]

  return (
    <div style={{ height:'calc(100vh - 56px)', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
      {showSuccess && <SuccessOverlay onClose={() => setShowSuccess(false)} />}

      {/* ── Top bar ── */}
      <div style={{
        height:44, background:'var(--bg2)', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', padding:'0 14px', gap:12, flexShrink:0,
      }}>
        <Link to={`/level/${levelSlug}`} style={{
          fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)',
          display:'flex', alignItems:'center', gap:4, transition:'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}
        >← {levelSlug}</Link>

        <div style={{ width:1, height:16, background:'var(--border)' }} />

        {/* Question number + title */}
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text)', fontWeight:600,
          flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{question.title}</span>

        <span style={{
          fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text3)',
          background:'var(--bg4)', padding:'3px 10px', borderRadius:20,
          border:'1px solid var(--border)',
        }}>{question.points} pts</span>

        {/* Font size controls */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {[12,14,16].map(s => (
            <button key={s} onClick={() => setFontSize(s)} style={{
              width:26, height:22, borderRadius:5, fontSize:10,
              fontFamily:'var(--font-mono)',
              background: fontSize===s ? 'var(--green-dim)' : 'transparent',
              color: fontSize===s ? 'var(--green)' : 'var(--text3)',
              border: `1px solid ${fontSize===s ? 'rgba(0,255,136,0.2)' : 'transparent'}`,
            }}>{s}</button>
          ))}
        </div>

        <QuestionNav currentId={id} levelSlug={levelSlug} refreshKey={navRefresh} />
      </div>

      {/* ── Main 3-column layout ── */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'300px 1fr 320px', overflow:'hidden', minHeight:0 }}>

        {/* ── Left: Problem description ── */}
        <div style={{
          borderRight:'1px solid var(--border)',
          overflowY:'auto', display:'flex', flexDirection:'column',
        }}>
          <div style={{ padding:'18px 16px', borderBottom:'1px solid var(--border)' }}>
            <h2 style={{ fontSize:16, fontWeight:700, marginBottom:10, lineHeight:1.4 }}>{question.title}</h2>
            <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.9, whiteSpace:'pre-wrap' }}>
              {question.description}
            </div>
          </div>

          {/* Examples */}
          {question.test_cases?.filter(t => !t.is_hidden).length > 0 && (
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'var(--font-mono)', marginBottom:10 }}>
                examples
              </div>
              {question.test_cases.filter(t => !t.is_hidden).slice(0, 3).map((tc, i) => (
                <div key={i} style={{
                  background:'var(--bg3)', border:'1px solid var(--border)',
                  borderRadius:8, padding:'10px 12px', marginBottom:8,
                  fontFamily:'var(--font-mono)', fontSize:12,
                }}>
                  {tc.input_data && (
                    <div style={{ marginBottom:5 }}>
                      <span style={{ color:'var(--text3)' }}>Input:  </span>
                      <span style={{ color:'#8be9fd' }}>{tc.input_data}</span>
                    </div>
                  )}
                  <div>
                    <span style={{ color:'var(--text3)' }}>Output: </span>
                    <span style={{ color:'var(--green)' }}>{tc.expected_output}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Constraints */}
          <div style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'var(--font-mono)', marginBottom:10 }}>
              constraints
            </div>
            {[
              '⏱  5 second time limit',
              '💾  64 MB memory limit',
              '📝  50 KB max code size',
              `💡  ${question.hints?.length || 0} hints available`,
            ].map(c => (
              <div key={c} style={{ fontSize:12, color:'var(--text2)', marginBottom:5, fontFamily:'var(--font-mono)' }}>{c}</div>
            ))}
          </div>
        </div>

        {/* ── Center: Editor ── */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
          <div style={{ flex:1, minHeight:0 }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              onRun={handleRun}
              onSubmit={handleSubmit}
              fontSize={fontSize}
            />
          </div>

          {/* Action bar */}
          <div style={{
            height:52, background:'var(--bg2)', borderTop:'1px solid var(--border)',
            display:'flex', alignItems:'center', padding:'0 14px', gap:8, flexShrink:0,
          }}>
            <button onClick={resetCode} style={{
              padding:'5px 12px', fontSize:11, fontFamily:'var(--font-mono)',
              color:'var(--text3)', background:'transparent',
              border:'1px solid var(--border)', borderRadius:6,
              transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='var(--border-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.borderColor='var(--border)' }}
            >⟲ reset</button>

            <div style={{ flex:1 }} />

            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={running || submitting}
              style={{
                padding:'7px 22px', fontSize:13, fontFamily:'var(--font-mono)',
                color: running ? 'var(--text3)' : 'var(--text)',
                background:'var(--bg4)', border:'1px solid var(--border)',
                borderRadius:8, fontWeight:600, transition:'all 0.15s',
                cursor: running || submitting ? 'wait' : 'pointer',
              }}
              onMouseEnter={e => { if (!running && !submitting) { e.currentTarget.style.borderColor='var(--border-hover)'; e.currentTarget.style.background='var(--bg3)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg4)' }}
            >
              {running ? (
                <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:10, height:10, border:'2px solid var(--text3)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                  Running…
                </span>
              ) : '▶ Run'}
            </button>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={running || submitting}
              style={{
                padding:'7px 26px', fontSize:13, fontFamily:'var(--font-mono)',
                color: submitting ? 'var(--text3)' : 'var(--bg)',
                background: submitting ? 'var(--bg4)' : 'var(--green)',
                border:'none', borderRadius:8, fontWeight:700,
                transition:'all 0.15s',
                cursor: running || submitting ? 'wait' : 'pointer',
                boxShadow: submitting ? 'none' : '0 0 18px rgba(0,255,136,0.28)',
              }}
              onMouseEnter={e => { if (!submitting && !running) e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              {submitting ? (
                <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:10, height:10, border:'2px solid var(--text3)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                  Grading…
                </span>
              ) : '✓ Submit'}
            </button>
          </div>
        </div>

        {/* ── Right: Output / History / AI ── */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderLeft:'1px solid var(--border)', minHeight:0 }}>
          {/* Right tab bar */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            {rightTabs.map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)} style={{
                flex:1, padding:'9px 2px',
                fontSize:11, fontFamily:'var(--font-mono)',
                color: rightTab===t.id ? 'var(--green)' : 'var(--text3)',
                background: rightTab===t.id ? 'rgba(0,255,136,0.06)' : 'transparent',
                borderBottom: rightTab===t.id ? '2px solid var(--green)' : '2px solid transparent',
                transition:'all 0.15s', whiteSpace:'nowrap',
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ flex:1, overflow:'hidden', minHeight:0 }}>
            {rightTab === 'output'  && <OutputPanel result={result} submitting={submitting} running={running} />}
            {rightTab === 'history' && <HistoryPanel questionId={id} onLoadSubmission={sub => { setCode(sub.code || code); setResult(sub); setRightTab('output') }} />}
            {rightTab === 'ai'      && <AIPanel questionId={id} code={code} questionHints={question.hints} />}
          </div>
        </div>

      </div>
    </div>
  )
}
