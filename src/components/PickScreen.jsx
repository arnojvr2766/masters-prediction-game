import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL, isPicksLocked } from '../lib/constants'
import PlayerAvatar from './PlayerAvatar'

const GOLD = '#c9a84c'
const G = '#1a3a2a'

export default function PickScreen({ userId, onNav, liveResults }) {
  const [picks, setPicks] = useState([])      // [{player_id, position}]
  const [searchQ, setSearchQ] = useState('')
  const [sortBy, setSortBy] = useState('rank')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const locked = isPicksLocked()

  // Load existing picks from Supabase
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('picks')
        .select('player_id, position')
        .eq('user_id', userId)
        .order('position')
      if (data) setPicks(data)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const savePicks = async (newPicks) => {
    if (locked) return
    setSaving(true)
    // Upsert all picks for this user
    const rows = newPicks.map(p => ({ user_id: userId, player_id: p.player_id, position: p.position }))
    await supabase.from('picks').upsert(rows, { onConflict: 'user_id,player_id' })
    // Remove picks that were deleted
    const keptIds = newPicks.map(p => p.player_id)
    await supabase.from('picks').delete().eq('user_id', userId).not('player_id', 'in', `(${keptIds.join(',')})`)
    setSaving(false)
    setSaveMsg('Saved ✓')
    setTimeout(() => setSaveMsg(''), 1800)
  }

  const addPick = (player) => {
    if (locked || picks.length >= 20 || picks.find(p => p.player_id === player.id)) return
    const newPicks = [...picks, { player_id: player.id, position: picks.length + 1 }]
    setPicks(newPicks)
    savePicks(newPicks)
  }

  const removePick = (playerId) => {
    if (locked) return
    const newPicks = picks.filter(p => p.player_id !== playerId).map((p, i) => ({ ...p, position: i + 1 }))
    setPicks(newPicks)
    savePicks(newPicks)
  }

  const filtered = PLAYER_POOL
    .filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rank') return a.rank - b.rank
      if (sortBy === 'odds') return parseFloat(a.odds) - parseFloat(b.odds)
      if (sortBy === 'avg')  return a.avgFinish - b.avgFinish
      return 0
    })

  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '8px 14px', color: '#a0b8a8', fontSize: 13, cursor: 'pointer' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Loading your picks…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: '14px 18px 0', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,15,10,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => onNav('dashboard')} style={ghostBtn}>← Back</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>
            {locked ? '🔒 Picks Locked' : 'Select Players'}
          </div>
          <button onClick={() => onNav('myPicks')} style={{
            background: picks.length === 20 ? `linear-gradient(135deg, ${GOLD}, #b8943e)` : `${GOLD}22`,
            border: `1px solid ${GOLD}44`, borderRadius: 18, padding: '7px 14px',
            color: picks.length === 20 ? G : GOLD, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            {picks.length}/20 →
          </button>
        </div>

        {!locked && (
          <>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search players…" style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '11px 16px', color: '#f5f0e8', fontSize: 14, outline: 'none', marginBottom: 10,
            }} />
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12 }}>
              {[['rank', 'World Rank'], ['odds', 'Odds'], ['avg', 'Avg Finish']].map(([v, label]) => (
                <button key={v} onClick={() => setSortBy(v)} style={{
                  borderRadius: 18, padding: '6px 13px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
                  background: sortBy === v ? `${GOLD}30` : 'rgba(255,255,255,0.06)',
                  color: sortBy === v ? GOLD : '#7a9a80',
                  border: sortBy === v ? `1px solid ${GOLD}44` : '1px solid rgba(255,255,255,0.08)',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {locked && (
        <div style={{ margin: '12px 18px', padding: '12px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, fontSize: 13, color: '#f87171', textAlign: 'center' }}>
          Picks closed at 16:00 SAST on Thu 10 Apr. View your selections below.
        </div>
      )}

      {/* Player list */}
      <div style={{ padding: '0 14px' }}>
        {filtered.map(player => {
          const sel = picks.find(p => p.player_id === player.id)
          const live = liveResults.find(r => r.player_id === player.id)
          return (
            <div key={player.id}
              onClick={() => locked ? null : sel ? removePick(player.id) : addPick(player)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 14px', marginBottom: 7,
                background: sel ? `linear-gradient(135deg, ${GOLD}14, ${GOLD}07)` : 'rgba(255,255,255,0.04)',
                border: sel ? `1px solid ${GOLD}3a` : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 15, cursor: locked ? 'default' : 'pointer',
                transition: 'all 0.18s',
              }}>
              <PlayerAvatar initials={player.img} size={46} seed={player.id} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ color: '#f5f0e8', fontWeight: 700, fontSize: 14, fontFamily: "'Playfair Display', serif" }}>{player.name}</span>
                  <span style={{ fontSize: 14 }}>{player.country}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: '#7a9a80' }}>#{player.rank} world</span>
                  <span style={{ fontSize: 10, color: `${GOLD}88` }}>{player.odds}</span>
                  <span style={{ fontSize: 10, color: '#7a9a80' }}>avg T{Math.round(player.avgFinish)}</span>
                  {player.wins > 0 && <span style={{ fontSize: 10, color: '#4ade80' }}>🏆 {player.wins}×</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                {live && <div style={{ fontSize: 10, color: live.missed_cut ? '#f87171' : '#4ade80', fontWeight: 700 }}>{live.missed_cut ? 'MC' : `T${live.position}`}</div>}
                {sel ? (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #b8943e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: G }}>
                    {sel.position}
                  </div>
                ) : (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'rgba(255,255,255,0.25)' }}>+</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom bar */}
      {!locked && picks.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 18px', background: 'rgba(8,15,10,0.94)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${GOLD}2a` }}>
          {saveMsg ? (
            <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 700, padding: '14px 0' }}>{saveMsg}</div>
          ) : (
            <button onClick={() => onNav('myPicks')} style={{
              width: '100%',
              background: picks.length === 20 ? `linear-gradient(135deg, ${GOLD}, #b8943e)` : `${GOLD}33`,
              color: picks.length === 20 ? G : GOLD,
              border: 'none', borderRadius: 13, padding: '15px',
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Playfair Display', serif",
            }}>
              {picks.length === 20 ? 'Review my picks →' : `${picks.length}/20 selected`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
