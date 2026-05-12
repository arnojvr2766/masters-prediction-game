import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL, isPicksLocked, calculateBetterballScore } from '../lib/constants'
import PlayerAvatar from './PlayerAvatar'

const GOLD = '#c9a84c'
const G = '#0d1f3c'

// pairs: [{pair_num, player_a, player_b}] - up to 5
export default function BetterballScreen({ userId, onNav, liveResults }) {
  const [pairs, setPairs] = useState([]) // [{pair_num, player_a, player_b}]
  const [activePair, setActivePair] = useState(1) // which pair we're filling (1-5)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const locked = isPicksLocked()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('betterball_pairs').select('pair_num, player_a, player_b').eq('user_id', userId).order('pair_num')
      if (data && data.length > 0) {
        setPairs(data)
        // Activate next incomplete pair, or last if all done
        const incomplete = data.find(p => !p.player_b)
        if (incomplete) setActivePair(incomplete.pair_num)
        else if (data.length < 5) setActivePair(data.length + 1)
        else setActivePair(5)
      }
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const usedPlayerIds = new Set(pairs.flatMap(p => [p.player_a, p.player_b].filter(Boolean)))

  const currentPair = pairs.find(p => p.pair_num === activePair) || { pair_num: activePair, player_a: null, player_b: null }
  const pairFull = currentPair.player_a && currentPair.player_b

  const tapPlayer = async (player) => {
    if (locked || usedPlayerIds.has(player.id)) return
    let updated = { ...currentPair }
    if (!updated.player_a) {
      updated.player_a = player.id
    } else if (!updated.player_b) {
      updated.player_b = player.id
    } else return

    const newPairs = [...pairs.filter(p => p.pair_num !== activePair), updated].sort((a, b) => a.pair_num - b.pair_num)
    setPairs(newPairs)
    setSaving(true)
    await supabase.from('betterball_pairs').upsert({ user_id: userId, pair_num: activePair, player_a: updated.player_a, player_b: updated.player_b || updated.player_a }, { onConflict: 'user_id,pair_num' })
    setSaving(false)

    // Auto-advance when pair is filled
    if (updated.player_b && activePair < 5) {
      setActivePair(activePair + 1)
    }
  }

  const removePair = async (pairNum) => {
    if (locked) return
    const newPairs = pairs.filter(p => p.pair_num !== pairNum)
    setPairs(newPairs)
    setActivePair(pairNum)
    setSaving(true)
    await supabase.from('betterball_pairs').delete().eq('user_id', userId).eq('pair_num', pairNum)
    setSaving(false)
  }

  const score = calculateBetterballScore(pairs, liveResults)
  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#8098b8', fontSize: 13, cursor: 'pointer' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,11,18,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={() => onNav('miniGames')} style={ghostBtn}>← Games</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>Betterball</div>
          <div style={{ fontSize: 12, color: saving ? GOLD : '#3a5a7a' }}>{saving ? 'Saving…' : `${pairs.filter(p => p.player_b).length}/5 pairs`}</div>
        </div>

        {score && score.resolved > 0 && (
          <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}22`, borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#3a5a7a', letterSpacing: 1 }}>BETTERBALL SCORE</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, color: GOLD, fontSize: 22 }}>{score.total}</div>
            <div style={{ fontSize: 11, color: '#6a8aaa' }}>{score.resolved}/{score.pairs} pairs live</div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Pair slots */}
        <div style={{ fontSize: 10, color: '#2a4a6a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Your 5 Pairs</div>

        {Array.from({ length: 5 }, (_, i) => i + 1).map(pairNum => {
          const pair = pairs.find(p => p.pair_num === pairNum)
          const pA = pair?.player_a ? PLAYER_POOL.find(p => p.id === pair.player_a) : null
          const pB = pair?.player_b ? PLAYER_POOL.find(p => p.id === pair.player_b) : null
          const lA = pA ? liveResults.find(r => r.player_id === pA.id) : null
          const lB = pB ? liveResults.find(r => r.player_id === pB.id) : null
          const bd = score?.breakdown[pairNum - 1]
          const isActive = pairNum === activePair
          const complete = pA && pB

          return (
            <div
              key={pairNum}
              onClick={() => !locked && setActivePair(pairNum)}
              style={{
                marginBottom: 10, borderRadius: 14, padding: '12px 14px',
                background: isActive ? `linear-gradient(135deg, ${GOLD}10, rgba(13,31,60,0.8))` : 'rgba(255,255,255,0.04)',
                border: isActive ? `2px solid ${GOLD}44` : complete ? '1px solid rgba(74,222,128,0.2)' : '1px dashed rgba(255,255,255,0.1)',
                cursor: locked ? 'default' : 'pointer', transition: 'all 0.18s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: complete ? 8 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? GOLD : complete ? '#6a8aaa' : '#2a4a6a', letterSpacing: 1 }}>
                  PAIR {pairNum} {isActive && !locked ? '← editing' : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {bd?.best != null && <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>T{bd.best}</span>}
                  {complete && !locked && (
                    <button onClick={e => { e.stopPropagation(); removePair(pairNum) }} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '2px 8px', fontSize: 10, color: '#f87171', cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              </div>

              {complete ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', gap: 6, alignItems: 'center' }}>
                  {[{ p: pA, l: lA, pos: bd?.posA }, { p: pB, l: lB, pos: bd?.posB }].map(({ p, l, pos }, side) => (
                    <div key={p.id} style={{
                      background: bd?.best != null && pos === bd.best ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                      border: bd?.best != null && pos === bd.best ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f5f0e8', marginBottom: 2 }}>{p.name.split(' ').pop()}</div>
                      {l ? (
                        <div style={{ fontSize: 11, fontWeight: 700, color: l.missed_cut ? '#f87171' : '#4ade80' }}>{l.missed_cut ? 'MC' : `T${l.position}`}</div>
                      ) : (
                        <div style={{ fontSize: 10, color: '#3a5a7a' }}>—</div>
                      )}
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', fontSize: 10, color: '#2a4a6a', fontWeight: 700 }}>+</div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, padding: '8px', background: pA ? `${GOLD}14` : 'rgba(255,255,255,0.03)', border: pA ? `1px solid ${GOLD}33` : '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, textAlign: 'center', fontSize: 11, color: pA ? '#f5f0e8' : '#2a4a6a' }}>
                    {pA ? pA.name.split(' ').pop() : 'Player A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: '#1e3460', fontWeight: 700 }}>+</div>
                  <div style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, textAlign: 'center', fontSize: 11, color: '#2a4a6a' }}>
                    {isActive && pA ? <span style={{ color: GOLD }}>← tap below</span> : 'Player B'}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Available player pool */}
        {!locked && pairs.filter(p => p.player_b).length < 5 && (
          <>
            <div style={{ fontSize: 10, color: '#2a4a6a', letterSpacing: 2, textTransform: 'uppercase', margin: '18px 0 10px' }}>
              {pairFull ? 'All spots filled for this pair' : `Tap to add to Pair ${activePair}`}
            </div>
            {PLAYER_POOL.map(player => {
              const used = usedPlayerIds.has(player.id)
              return (
                <div
                  key={player.id}
                  onClick={() => !used && tapPlayer(player)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', marginBottom: 5,
                    background: used ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 11, cursor: used ? 'not-allowed' : 'pointer',
                    opacity: used || pairFull ? 0.35 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <PlayerAvatar initials={player.img} size={34} seed={player.id} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f5f0e8', fontWeight: 600, fontSize: 13 }}>{player.name} <span style={{ fontSize: 12 }}>{player.country}</span></div>
                    <div style={{ fontSize: 10, color: '#6a8aaa' }}>#{player.rank} · {player.odds}</div>
                  </div>
                  {used && <div style={{ fontSize: 10, color: '#3a5a7a', fontWeight: 600 }}>In pair</div>}
                </div>
              )
            })}
          </>
        )}

        {locked && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 10, fontSize: 12, color: '#f87171', textAlign: 'center' }}>
            🔒 Picks locked · Thu 14 May 14:00 SAST
          </div>
        )}
      </div>
    </div>
  )
}
