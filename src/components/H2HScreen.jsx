import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL, isPicksLocked, calculateH2HScore } from '../lib/constants'

const GOLD = '#c9a84c'
const G = '#0d1f3c'

export default function H2HScreen({ userId, onNav, liveResults, matchups }) {
  const [picks, setPicks] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const locked = isPicksLocked()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('h2h_picks').select('matchup_id, picked_player').eq('user_id', userId)
      if (data) setPicks(data)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const makePick = async (matchupId, playerId) => {
    if (locked) return
    const existing = picks.find(p => p.matchup_id === matchupId)
    // Toggle off if same player picked again
    if (existing?.picked_player === playerId) {
      const newPicks = picks.filter(p => p.matchup_id !== matchupId)
      setPicks(newPicks)
      setSaving(true)
      await supabase.from('h2h_picks').delete().eq('user_id', userId).eq('matchup_id', matchupId)
      setSaving(false)
      return
    }
    const newPick = { matchup_id: matchupId, picked_player: playerId }
    const newPicks = [...picks.filter(p => p.matchup_id !== matchupId), newPick]
    setPicks(newPicks)
    setSaving(true)
    await supabase.from('h2h_picks').upsert({ user_id: userId, ...newPick }, { onConflict: 'user_id,matchup_id' })
    setSaving(false)
    setSaveMsg('Saved ✓')
    setTimeout(() => setSaveMsg(''), 1400)
  }

  const score = calculateH2HScore(picks, matchups, liveResults)
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
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>Head to Head</div>
          <div style={{ fontSize: 12, color: saving ? GOLD : '#3a5a7a' }}>{saving ? 'Saving…' : saveMsg || `${picks.length}/${matchups.length}`}</div>
        </div>

        {score && (
          <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}22`, borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#3a5a7a', letterSpacing: 1 }}>H2H SCORE</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, color: GOLD, fontSize: 20 }}>{score.correct}/{score.total}</div>
            <div style={{ fontSize: 11, color: '#6a8aaa' }}>correct</div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {matchups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <div style={{ color: '#f5f0e8', fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 8 }}>Matchups coming soon</div>
            <div style={{ color: '#3a5a7a', fontSize: 13 }}>The admin will set up head-to-head matchups before the tournament starts.</div>
          </div>
        ) : (
          matchups.map((matchup, idx) => {
            const playerA = PLAYER_POOL.find(p => p.id === matchup.player_a)
            const playerB = PLAYER_POOL.find(p => p.id === matchup.player_b)
            if (!playerA || !playerB) return null
            const pick = picks.find(p => p.matchup_id === matchup.id)
            const sd = score?.breakdown.find(b => b.matchup_id === matchup.id)
            const liveA = liveResults.find(r => r.player_id === matchup.player_a)
            const liveB = liveResults.find(r => r.player_id === matchup.player_b)

            return (
              <div key={matchup.id} style={{ marginBottom: 14, animation: 'fadeIn 0.3s ease both', animationDelay: `${idx * 40}ms` }}>
                <div style={{ fontSize: 10, color: '#2a4a6a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  Match {idx + 1}
                  {sd?.resolved && (
                    <span style={{ marginLeft: 8, color: sd.correct ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      {sd.correct ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: 8, alignItems: 'center' }}>
                  {[{ player: playerA, id: matchup.player_a, live: liveA }, { player: playerB, id: matchup.player_b, live: liveB }].map(({ player, id, live }, side) => {
                    const isPicked = pick?.picked_player === id
                    const isWinner = sd?.resolved && sd.winner === id
                    const isLoser = sd?.resolved && sd.winner !== id
                    return (
                      <button
                        key={id}
                        onClick={() => makePick(matchup.id, id)}
                        disabled={locked}
                        style={{
                          background: isPicked
                            ? isWinner ? 'rgba(74,222,128,0.15)' : isLoser ? 'rgba(248,113,113,0.1)' : `linear-gradient(135deg, ${GOLD}18, ${GOLD}08)`
                            : 'rgba(255,255,255,0.04)',
                          border: isPicked
                            ? isWinner ? '2px solid rgba(74,222,128,0.5)' : isLoser ? '2px solid rgba(248,113,113,0.35)' : `2px solid ${GOLD}55`
                            : '1px solid rgba(255,255,255,0.09)',
                          borderRadius: 14, padding: '14px 10px',
                          cursor: locked ? 'default' : 'pointer',
                          textAlign: 'center', transition: 'all 0.18s',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f0e8', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{player.name}</div>
                        <div style={{ fontSize: 10, color: '#6a8aaa', marginBottom: 6 }}>#{player.rank} · {player.odds}</div>
                        {live ? (
                          <div style={{ fontSize: 11, fontWeight: 700, color: live.missed_cut ? '#f87171' : '#4ade80' }}>{live.missed_cut ? 'MC' : `T${live.position}`}</div>
                        ) : (
                          <div style={{ fontSize: 11, color: isPicked ? GOLD : '#2a4a6a', fontWeight: isPicked ? 700 : 400 }}>
                            {isPicked ? '✓ Your pick' : 'Tap to pick'}
                          </div>
                        )}
                      </button>
                    )
                  })}

                  {/* VS divider */}
                  <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#1a3060', letterSpacing: 1 }}>VS</div>
                </div>
              </div>
            )
          })
        )}

        {locked && matchups.length > 0 && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 10, fontSize: 12, color: '#f87171', textAlign: 'center' }}>
            🔒 Picks locked · Thu 14 May 14:00 SAST
          </div>
        )}
      </div>
    </div>
  )
}
