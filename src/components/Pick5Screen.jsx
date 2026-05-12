import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL, isPicksLocked, calculatePick5Score } from '../lib/constants'
import PlayerAvatar from './PlayerAvatar'

const GOLD = '#c9a84c'
const G = '#0d1f3c'

export default function Pick5Screen({ userId, onNav, liveResults }) {
  const [picks, setPicks] = useState([])
  const [searchQ, setSearchQ] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const locked = isPicksLocked()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('pick5_picks').select('player_id, position').eq('user_id', userId).order('position')
      if (data) setPicks(data)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const savePicks = async (newPicks) => {
    if (locked) return
    setSaving(true)
    const rows = newPicks.map(p => ({ user_id: userId, player_id: p.player_id, position: p.position }))
    await supabase.from('pick5_picks').upsert(rows, { onConflict: 'user_id,player_id' })
    if (newPicks.length < picks.length) {
      const keptIds = newPicks.map(p => p.player_id)
      if (keptIds.length > 0) {
        await supabase.from('pick5_picks').delete().eq('user_id', userId).not('player_id', 'in', `(${keptIds.join(',')})`)
      } else {
        await supabase.from('pick5_picks').delete().eq('user_id', userId)
      }
    }
    setSaving(false)
    setSaveMsg('Saved ✓')
    setTimeout(() => setSaveMsg(''), 1800)
  }

  const addPick = (player) => {
    if (locked || picks.length >= 5 || picks.find(p => p.player_id === player.id)) return
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

  const score = calculatePick5Score(picks, liveResults)
  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#8098b8', fontSize: 13, cursor: 'pointer' }

  const filtered = PLAYER_POOL.filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()))

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 0', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,11,18,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={() => onNav('miniGames')} style={ghostBtn}>← Games</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>
            {locked ? '🔒 Pick 5' : 'Pick 5'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: picks.length === 5 ? '#4ade80' : GOLD }}>
            {picks.length}/5
          </div>
        </div>

        {/* Score strip */}
        {score && (
          <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}22`, borderRadius: 12, padding: '10px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#3a5a7a', letterSpacing: 1 }}>PICK 5 SCORE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: GOLD, fontFamily: "'Playfair Display', serif" }}>{score.total}</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>{score.breakdown.filter(b => b.exact).length} exact</div>
          </div>
        )}

        {/* Your picks row */}
        {picks.length > 0 && (
          <div style={{ display: 'flex', gap: 6, paddingBottom: 12, overflowX: 'auto' }}>
            {picks.map((pick, i) => {
              const player = PLAYER_POOL.find(p => p.id === pick.player_id)
              const sd = score?.breakdown[i]
              return (
                <div key={pick.player_id} onClick={() => !locked && removePick(pick.player_id)}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: locked ? 'default' : 'pointer' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #b8943e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: G }}>{i + 1}</div>
                  <div style={{ fontSize: 9, color: sd?.exact ? '#4ade80' : sd?.points != null ? GOLD : '#6a8aaa', fontWeight: 600, maxWidth: 44, textAlign: 'center', lineHeight: 1.2 }}>{player?.name.split(' ').pop()}</div>
                  {sd && <div style={{ fontSize: 9, color: sd.exact ? '#4ade80' : '#f5f0e8', fontWeight: 700 }}>{sd.points > 0 ? `+${sd.points}` : sd.points}</div>}
                </div>
              )
            })}
            {Array.from({ length: 5 - picks.length }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.15)' }}>+</div>
            ))}
          </div>
        )}

        {!locked && (
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search players…" style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '10px 16px', color: '#f5f0e8', fontSize: 14, outline: 'none', marginBottom: 10,
          }} />
        )}
      </div>

      {locked && (
        <div style={{ margin: '10px 18px', padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, fontSize: 12, color: '#f87171', textAlign: 'center' }}>
          Picks locked · Thu 14 May 14:00 SAST
        </div>
      )}

      <div style={{ padding: '0 14px' }}>
        <div style={{ fontSize: 10, color: '#2a4a6a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
          {picks.length === 5 ? 'Your picks — tap to remove' : `Select ${5 - picks.length} more player${5 - picks.length !== 1 ? 's' : ''}`}
        </div>
        {filtered.map(player => {
          const sel = picks.find(p => p.player_id === player.id)
          const live = liveResults.find(r => r.player_id === player.id)
          const sd = score?.breakdown.find((_, i) => picks[i]?.player_id === player.id)
          return (
            <div key={player.id}
              onClick={() => locked ? null : sel ? removePick(player.id) : addPick(player)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 13px', marginBottom: 6,
                background: sel ? `linear-gradient(135deg, ${GOLD}14, ${GOLD}07)` : 'rgba(255,255,255,0.04)',
                border: sel ? `1px solid ${GOLD}44` : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 13, cursor: locked ? 'default' : (!sel && picks.length >= 5) ? 'not-allowed' : 'pointer',
                opacity: !sel && picks.length >= 5 && !locked ? 0.4 : 1,
                transition: 'all 0.15s',
              }}>
              <PlayerAvatar initials={player.img} size={40} seed={player.id} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f5f0e8', fontWeight: 600, fontSize: 14 }}>{player.name} <span style={{ fontSize: 13 }}>{player.country}</span></div>
                <div style={{ fontSize: 10, color: '#6a8aaa' }}>#{player.rank} · {player.odds}  {player.wins > 0 ? `· 🏆 ${player.wins}×` : ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                {live && <div style={{ fontSize: 10, fontWeight: 700, color: live.missed_cut ? '#f87171' : '#4ade80' }}>{live.missed_cut ? 'MC' : `T${live.position}`}</div>}
                {sel ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #b8943e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: G }}>
                    {sel.position}
                  </div>
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'rgba(255,255,255,0.2)' }}>+</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!locked && picks.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 18px', background: 'rgba(8,11,18,0.94)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${GOLD}2a` }}>
          {saveMsg ? (
            <div style={{ textAlign: 'center', color: '#4ade80', fontWeight: 700, padding: '12px 0' }}>{saveMsg}</div>
          ) : (
            <button onClick={() => onNav('miniGames')} style={{
              width: '100%', background: picks.length === 5 ? `linear-gradient(135deg, ${GOLD}, #b8943e)` : `${GOLD}33`,
              color: picks.length === 5 ? G : GOLD, border: 'none', borderRadius: 13, padding: '14px',
              fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'Playfair Display', serif",
            }}>
              {picks.length === 5 ? 'Picks saved ✓' : `${picks.length}/5 selected`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
