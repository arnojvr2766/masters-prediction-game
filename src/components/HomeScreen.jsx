import { useState } from 'react'
import { supabase } from '../lib/supabase'

const G = '#1a3a2a'
const GOLD = '#c9a84c'

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(201,168,76,0.22)`,
  borderRadius: 12, padding: '13px 16px', color: '#f5f0e8',
  fontSize: 15, outline: 'none', fontFamily: 'inherit',
}

const ghostBtn = {
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 20, padding: '10px 20px', color: '#a0b8a8', fontSize: 14, cursor: 'pointer',
}

export default function HomeScreen({ onLogin, onNav }) {
  const [mode, setMode] = useState('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name'); return }
    if (!email.includes('@')) { setError('Enter a valid email address'); return }
    if (pass.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(mode === 'signup' ? 'Creating account…' : 'Signing in…')
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { display_name: name.trim() } },
        })
        if (err) throw err
        // Insert profile row
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: name.trim(),
            email,
            is_admin: false,
          })
        }
        onLogin(data.user, name.trim())
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (err) throw err
        const { data: profile } = await supabase
          .from('profiles').select('display_name, is_admin').eq('id', data.user.id).single()
        onLogin(data.user, profile?.display_name || email.split('@')[0], profile?.is_admin)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading('')
    }
  }

  const examples = [
    { name: 'Scheffler', picked: 1, actual: 1, exact: true },
    { name: 'McIlroy',   picked: 2, actual: 4, exact: false },
    { name: 'Rahm',      picked: 5, actual: null, mc: true },
  ]

  return (
    <div style={{ minHeight: '100vh', overflowY: 'auto' }}>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', padding: '56px 24px 40px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, #c9a84c 28px, #c9a84c 29px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${GOLD}44`, animation: 'spin 18s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: `1px solid ${GOLD}22`, animation: 'spin 12s linear infinite reverse' }} />
          <span style={{ fontSize: 40, position: 'relative', zIndex: 1 }}>⛳</span>
        </div>

        <div style={{ fontSize: 10, letterSpacing: 7, color: `${GOLD}88`, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Georgia, serif' }}>
          Augusta National · April 2026
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(38px,9vw,62px)', fontWeight: 800, color: '#f5f0e8', margin: '0 0 4px', lineHeight: 1.05 }}>
          Masters
        </h1>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(38px,9vw,62px)', fontWeight: 800, color: GOLD, margin: '0 0 18px', lineHeight: 1.05 }}>
          Predictor
        </h1>
        <p style={{ color: '#7a9a80', fontSize: 16, maxWidth: 290, margin: '0 auto', lineHeight: 1.65 }}>
          The fantasy game where <em style={{ color: '#a8c8b0', fontStyle: 'normal' }}>precision beats luck</em>.<br />
          Pick 20 golfers. Rank them perfectly. Win.
        </p>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ padding: '0 24px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <span style={{ fontSize: 10, letterSpacing: 5, color: `${GOLD}66`, textTransform: 'uppercase', fontFamily: 'Georgia, serif', borderBottom: `1px solid ${GOLD}28`, paddingBottom: 7 }}>
            How it works
          </span>
        </div>
        {[
          { n: '01', title: 'Pick your field', body: 'Choose 20 players from the Masters field — world #1s to dark horses.' },
          { n: '02', title: 'Rank them 1–20',  body: 'Predict the finishing order. Your #1 pick should win the green jacket.' },
          { n: '03', title: 'Lowest score wins', body: 'Score = |your rank − actual finish|. Nail it exactly and earn a bonus. Fewest points wins.' },
        ].map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: `${GOLD}38`, fontFamily: "'Playfair Display', serif", lineHeight: 1, flexShrink: 0, width: 34, textAlign: 'right' }}>{s.n}</div>
            <div style={{ paddingTop: 2 }}>
              <div style={{ color: '#f5f0e8', fontWeight: 700, fontSize: 15, marginBottom: 3, fontFamily: "'Playfair Display', serif" }}>{s.title}</div>
              <div style={{ color: '#5a7a62', fontSize: 13, lineHeight: 1.6 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── EXAMPLE SCORECARD ── */}
      <div style={{ margin: '0 20px 36px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${GOLD}22`, borderRadius: 18, padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)` }} />
        <div style={{ fontSize: 10, letterSpacing: 5, color: `${GOLD}66`, textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 14 }}>Example scorecard</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 46px', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {['Player', 'Picked', 'Actual', 'Pts'].map(h => (
            <div key={h} style={{ fontSize: 10, color: '#3a5a42', textTransform: 'uppercase', letterSpacing: 1, textAlign: h !== 'Player' ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {examples.map(row => {
          const actual = row.mc ? 33 + 50 : row.actual
          const diff = Math.abs(actual - row.picked)
          const pts = row.exact ? -(21 - row.picked) : diff
          return (
            <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 50px 46px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <div>
                <div style={{ color: '#e8e0d0', fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                {row.mc && <div style={{ fontSize: 9, color: '#f87171', fontWeight: 700 }}>MISSED CUT</div>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: `${GOLD}1a`, border: `1px solid ${GOLD}28`, borderRadius: 7, padding: '4px 0', fontSize: 13, fontWeight: 700, color: GOLD }}>{row.picked}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: row.mc ? 'rgba(248,113,113,0.1)' : row.exact ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', border: row.mc ? '1px solid rgba(248,113,113,0.25)' : row.exact ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '4px 0', fontSize: 13, fontWeight: 700, color: row.mc ? '#f87171' : row.exact ? '#4ade80' : '#c0b898' }}>
                  {row.mc ? 'MC' : row.actual}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: row.exact ? '#4ade80' : row.mc ? '#f87171' : GOLD }}>
                  {row.exact ? `−${Math.abs(pts)}` : `+${pts}`}
                </div>
                {row.exact && <div style={{ fontSize: 9, color: '#4ade80', fontWeight: 700, letterSpacing: 0.5 }}>EXACT!</div>}
              </div>
            </div>
          )
        })}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', marginTop: 4, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: '#4a6a52', lineHeight: 1.5 }}>
              <span style={{ color: '#7ab87a', fontWeight: 700 }}>Exact match bonus:</span> Pick #1 right = −20 pts. Pick #20 = −1 pt.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', marginTop: 4, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: '#4a6a52', lineHeight: 1.5 }}>
              <span style={{ color: '#f8a0a0', fontWeight: 700 }}>Missed cut:</span> +50 added to their finish position before scoring.
            </div>
          </div>
        </div>
      </div>

      {/* ── AUTH FORM ── */}
      <div style={{ margin: '0 20px 64px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${GOLD}28`, borderRadius: 22, padding: '26px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}07, transparent 70%)`, pointerEvents: 'none' }} />

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.28)', borderRadius: 13, padding: 4, marginBottom: 26 }}>
            {[['signup', 'Join the game'], ['login', 'Sign in']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '11px 0', border: 'none', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                background: mode === m ? `linear-gradient(135deg, ${GOLD}e0, #b8943e)` : 'transparent',
                color: mode === m ? G : '#4a6a52',
                fontFamily: "'Playfair Display', serif",
              }}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: `${GOLD}77`, marginBottom: 5, letterSpacing: 1.5 }}>YOUR NAME</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tiger" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: `${GOLD}77`, marginBottom: 5, letterSpacing: 1.5 }}>EMAIL</div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <div style={{ marginBottom: error ? 12 : 22 }}>
            <div style={{ fontSize: 10, color: `${GOLD}77`, marginBottom: 5, letterSpacing: 1.5 }}>PASSWORD</div>
            <input value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" type="password" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 10, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={!!loading} style={{
            width: '100%', background: loading ? 'rgba(201,168,76,0.4)' : `linear-gradient(135deg, ${GOLD}, #b8943e)`,
            color: G, border: 'none', borderRadius: 13, padding: '16px',
            fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer',
            fontFamily: "'Playfair Display', Georgia, serif",
            boxShadow: loading ? 'none' : `0 8px 28px ${GOLD}2a`,
          }}>
            {loading || (mode === 'signup' ? 'Create my account →' : 'Sign in & play →')}
          </button>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: '#2e4a36' }}>
            Picks close Thu 10 Apr at 16:00 SAST · Free to play
          </div>
        </div>
      </div>

    </div>
  )
}
