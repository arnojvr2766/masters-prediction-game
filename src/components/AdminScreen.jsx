import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL } from '../lib/constants'

const GOLD = '#c9a84c'
const G = '#0d1f3c'

export default function AdminScreen({ onNav, isAdmin, onResultsUpdate, onMatchupsUpdate }) {
  const [tab, setTab] = useState('standings')

  // ── Standings state ──
  const [results, setResults] = useState(
    PLAYER_POOL.map(p => ({ player_id: p.id, position: p.rank, missed_cut: false }))
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loadingResults, setLoadingResults] = useState(true)

  // ── H2H state ──
  const [matchups, setMatchups] = useState([])
  const [loadingMatchups, setLoadingMatchups] = useState(true)
  const [newA, setNewA] = useState('')
  const [newB, setNewB] = useState('')
  const [h2hSaving, setH2hSaving] = useState(false)
  const [h2hMsg, setH2hMsg] = useState('')

  useEffect(() => {
    const loadResults = async () => {
      const { data } = await supabase.from('live_results').select('player_id, position, missed_cut')
      if (data && data.length > 0) {
        const merged = PLAYER_POOL.map(p => {
          const db = data.find(d => d.player_id === p.id)
          return db || { player_id: p.id, position: p.rank, missed_cut: false }
        })
        setResults(merged)
      }
      setLoadingResults(false)
    }
    const loadMatchups = async () => {
      const { data } = await supabase.from('h2h_matchups').select('*').order('id')
      if (data) setMatchups(data)
      setLoadingMatchups(false)
    }
    loadResults()
    loadMatchups()
  }, [])

  const saveStandings = async () => {
    setSaving(true)
    const { error } = await supabase.from('live_results').upsert(results, { onConflict: 'player_id' })
    setSaving(false)
    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('✓ Standings updated!')
      onResultsUpdate(results)
      setTimeout(() => setMsg(''), 2500)
    }
  }

  const addMatchup = async () => {
    if (!newA || !newB || newA === newB) { setH2hMsg('Pick two different players'); return }
    const a = parseInt(newA), b = parseInt(newB)
    if (matchups.find(m => (m.player_a === a && m.player_b === b) || (m.player_a === b && m.player_b === a))) {
      setH2hMsg('Matchup already exists'); return
    }
    setH2hSaving(true)
    const { data, error } = await supabase.from('h2h_matchups').insert({ player_a: a, player_b: b }).select().single()
    setH2hSaving(false)
    if (error) { setH2hMsg('Error: ' + error.message); return }
    const updated = [...matchups, data]
    setMatchups(updated)
    onMatchupsUpdate?.(updated)
    setNewA(''); setNewB('')
    setH2hMsg('✓ Matchup added')
    setTimeout(() => setH2hMsg(''), 2000)
  }

  const deleteMatchup = async (id) => {
    await supabase.from('h2h_matchups').delete().eq('id', id)
    const updated = matchups.filter(m => m.id !== id)
    setMatchups(updated)
    onMatchupsUpdate?.(updated)
  }

  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#8098b8', fontSize: 13, cursor: 'pointer' }
  const selectStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', color: '#f5f0e8', fontSize: 13, outline: 'none', flex: 1 }

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
      <div style={{ color: '#f87171', fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8 }}>Access denied</div>
      <div style={{ color: '#3a5a7a', fontSize: 14, marginBottom: 24 }}>You need admin privileges to access this page.</div>
      <button onClick={() => onNav('dashboard')} style={ghostBtn}>← Back home</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,11,18,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => onNav('dashboard')} style={ghostBtn}>← Home</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>Admin Panel</div>
          <div style={{ fontSize: 11, color: '#4ade80' }}>Admin ✓</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 3 }}>
          {[['standings', '📊 Standings'], ['h2h', '⚔️ H2H Setup']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '9px 0', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              background: tab === key ? `linear-gradient(135deg, ${GOLD}cc, #b8943e)` : 'transparent',
              color: tab === key ? G : '#3a5a7a',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── STANDINGS TAB ── */}
      {tab === 'standings' && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: '#2a4a6a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Update Live Standings</div>

          {loadingResults ? (
            <div style={{ textAlign: 'center', padding: 40, color: GOLD }}>Loading…</div>
          ) : (
            PLAYER_POOL.map(player => {
              const r = results.find(x => x.player_id === player.id) || { player_id: player.id, position: player.rank, missed_cut: false }
              return (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                  <div style={{ color: '#f5f0e8', fontSize: 13, width: 130, flexShrink: 0 }}>{player.name}</div>
                  <input
                    type="number" min={1} max={100}
                    value={r.position}
                    onChange={e => {
                      const pos = parseInt(e.target.value) || 1
                      setResults(prev => prev.map(x => x.player_id === player.id ? { ...x, position: pos } : x))
                    }}
                    style={{ width: 56, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 9px', color: '#f5f0e8', fontSize: 13, outline: 'none' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginLeft: 4 }}>
                    <input type="checkbox" checked={r.missed_cut} onChange={e => setResults(prev => prev.map(x => x.player_id === player.id ? { ...x, missed_cut: e.target.checked } : x))} style={{ accentColor: GOLD, width: 15, height: 15 }} />
                    <span style={{ fontSize: 11, color: '#6a8aaa' }}>MC</span>
                  </label>
                </div>
              )
            })
          )}

          <button onClick={saveStandings} disabled={saving} style={{
            width: '100%', marginTop: 16,
            background: saving ? `${GOLD}44` : `linear-gradient(135deg, ${GOLD}, #b8943e)`,
            color: G, border: 'none', borderRadius: 13, padding: '15px',
            fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
            fontFamily: "'Playfair Display', serif",
          }}>
            {msg || (saving ? 'Saving…' : 'Save Standings')}
          </button>
        </div>
      )}

      {/* ── H2H SETUP TAB ── */}
      {tab === 'h2h' && (
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: '#2a4a6a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>H2H Matchup Setup</div>
          <div style={{ fontSize: 12, color: '#3a5a7a', marginBottom: 16, lineHeight: 1.6 }}>
            Create head-to-head matchups. Players pick who they think finishes higher (lower position number).
          </div>

          {/* Add matchup form */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${GOLD}22`, borderRadius: 14, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: `${GOLD}88`, letterSpacing: 1, marginBottom: 12 }}>ADD MATCHUP</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <select value={newA} onChange={e => setNewA(e.target.value)} style={selectStyle}>
                <option value="">Player A…</option>
                {PLAYER_POOL.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <span style={{ color: '#2a4a6a', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>vs</span>
              <select value={newB} onChange={e => setNewB(e.target.value)} style={selectStyle}>
                <option value="">Player B…</option>
                {PLAYER_POOL.filter(p => p.id !== parseInt(newA)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {h2hMsg && <div style={{ fontSize: 12, color: h2hMsg.startsWith('✓') ? '#4ade80' : '#f87171', marginBottom: 8 }}>{h2hMsg}</div>}
            <button onClick={addMatchup} disabled={h2hSaving} style={{
              width: '100%', background: `linear-gradient(135deg, ${GOLD}, #b8943e)`,
              color: G, border: 'none', borderRadius: 10, padding: '12px',
              fontSize: 14, fontWeight: 700, cursor: h2hSaving ? 'default' : 'pointer',
            }}>
              {h2hSaving ? 'Adding…' : '+ Add matchup'}
            </button>
          </div>

          {/* Existing matchups */}
          <div style={{ fontSize: 10, color: '#2a4a6a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            {matchups.length} matchup{matchups.length !== 1 ? 's' : ''} set up
          </div>

          {loadingMatchups ? (
            <div style={{ textAlign: 'center', padding: 20, color: GOLD }}>Loading…</div>
          ) : matchups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#2a4a6a', fontSize: 13 }}>No matchups yet.</div>
          ) : (
            matchups.map((m, idx) => {
              const pA = PLAYER_POOL.find(p => p.id === m.player_a)
              const pB = PLAYER_POOL.find(p => p.id === m.player_b)
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11 }}>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, width: 22, flexShrink: 0 }}>{idx + 1}.</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#f5f0e8' }}>{pA?.name} <span style={{ color: '#2a4a6a' }}>vs</span> {pB?.name}</span>
                  <button onClick={() => deleteMatchup(m.id)} style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#f87171', cursor: 'pointer' }}>Remove</button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
