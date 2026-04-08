import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL, calculateScore, isPicksLocked } from '../lib/constants'
import PlayerAvatar from './PlayerAvatar'

const GOLD = '#c9a84c'
const G = '#1a3a2a'

export default function MyPicksScreen({ userId, onNav, liveResults }) {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const locked = isPicksLocked()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('picks').select('player_id, position').eq('user_id', userId).order('position')
      if (data) setPicks(data)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const moveUp = async (idx) => {
    if (locked || idx === 0) return
    const arr = [...picks]
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    const reranked = arr.map((p, i) => ({ ...p, position: i + 1 }))
    setPicks(reranked)
    setSaving(true)
    await supabase.from('picks').upsert(reranked.map(p => ({ user_id: userId, player_id: p.player_id, position: p.position })), { onConflict: 'user_id,player_id' })
    setSaving(false)
  }

  const moveDown = async (idx) => {
    if (locked || idx === picks.length - 1) return
    const arr = [...picks]
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    const reranked = arr.map((p, i) => ({ ...p, position: i + 1 }))
    setPicks(reranked)
    setSaving(true)
    await supabase.from('picks').upsert(reranked.map(p => ({ user_id: userId, player_id: p.player_id, position: p.position })), { onConflict: 'user_id,player_id' })
    setSaving(false)
  }

  const score = calculateScore(picks, liveResults)
  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#a0b8a8', fontSize: 13, cursor: 'pointer' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>Loading…</div>
    </div>
  )

  if (picks.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>📋</div>
      <h2 style={{ color: '#f5f0e8', fontFamily: "'Playfair Display', serif", marginBottom: 20 }}>No picks yet</h2>
      <button onClick={() => onNav('picks')} style={{ ...ghostBtn, padding: '12px 24px' }}>Start picking →</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,15,10,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => onNav('picks')} style={ghostBtn}>← Edit</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>My Picks</div>
          <button onClick={() => onNav('dashboard')} style={ghostBtn}>Home</button>
        </div>

        {/* Score summary */}
        {score && (
          <div style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}2a`, borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: '#5a8a62', marginBottom: 3, letterSpacing: 1 }}>CURRENT SCORE</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: GOLD, fontFamily: "'Playfair Display', serif" }}>{score.total}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#5a8a62', marginBottom: 3, letterSpacing: 1 }}>EXACT MATCHES</div>
              <div style={{ fontSize: 28, color: '#4ade80', fontWeight: 700 }}>{score.breakdown.filter(b => b.exact).length}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#5a8a62', marginBottom: 3, letterSpacing: 1 }}>PICKS</div>
              <div style={{ fontSize: 28, color: '#c8d8c8', fontWeight: 700 }}>{picks.length}/20</div>
            </div>
          </div>
        )}
      </div>

      {locked && (
        <div style={{ margin: '0 18px 12px', padding: '11px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 11, fontSize: 12, color: '#f87171', textAlign: 'center' }}>
          🔒 Picks are locked. Closed Thu 10 Apr at 16:00 SAST.
        </div>
      )}

      {saving && (
        <div style={{ margin: '0 18px 10px', padding: '8px 14px', background: `${GOLD}10`, borderRadius: 10, fontSize: 12, color: GOLD, textAlign: 'center' }}>Saving…</div>
      )}

      {/* Picks list */}
      <div style={{ padding: '0 14px' }}>
        {picks.map((pick, idx) => {
          const player = PLAYER_POOL.find(p => p.id === pick.player_id)
          const sd = score?.breakdown[idx]
          if (!player) return null
          return (
            <div key={pick.player_id} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '11px 13px', marginBottom: 6,
              background: sd?.exact ? 'rgba(74,222,128,0.08)' : sd?.missedCut ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.04)',
              border: sd?.exact ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 13, animation: 'fadeIn 0.25s ease both',
              animationDelay: `${idx * 30}ms`,
            }}>
              {/* Rank */}
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${GOLD}20`, border: `1px solid ${GOLD}38`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: GOLD, flexShrink: 0 }}>
                {pick.position}
              </div>
              <PlayerAvatar initials={player.img} size={36} seed={player.id} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#f5f0e8', fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{player.name}</div>
                <div style={{ fontSize: 10, color: '#5a8a62' }}>
                  {sd?.actualPos != null ? `Actual: T${sd.actualPos}${sd.missedCut ? ' (MC)' : ''}` : 'Live: —'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                {sd?.exact && <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700, letterSpacing: 0.5 }}>EXACT!</span>}
                {sd && (
                  <div style={{ fontSize: 15, fontWeight: 800, color: sd.exact ? '#4ade80' : sd.points > 10 ? '#f87171' : GOLD }}>
                    {sd.points > 0 ? `+${sd.points}` : sd.points}
                  </div>
                )}
                {!locked && (
                  <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                    <button onClick={() => moveUp(idx)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 5, width: 22, height: 22, cursor: 'pointer', color: '#7a9a80', fontSize: 12 }}>↑</button>
                    <button onClick={() => moveDown(idx)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 5, width: 22, height: 22, cursor: 'pointer', color: '#7a9a80', fontSize: 12 }}>↓</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      {!locked && picks.length < 20 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 18px', background: 'rgba(8,15,10,0.94)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${GOLD}2a` }}>
          <button onClick={() => onNav('picks')} style={{
            width: '100%', background: `${GOLD}30`, color: GOLD,
            border: `1px solid ${GOLD}40`, borderRadius: 13, padding: '14px',
            fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'Playfair Display', serif",
          }}>
            Add more players ({picks.length}/20)
          </button>
        </div>
      )}
    </div>
  )
}
