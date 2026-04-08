import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateScore, PLAYER_POOL } from '../lib/constants'
import PlayerAvatar from './PlayerAvatar'

const GOLD = '#c9a84c'
const G = '#1a3a2a'

export default function LeaderboardScreen({ onNav, liveResults, currentUserId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // Fetch all profiles + their picks
      const { data: profiles } = await supabase.from('profiles').select('id, display_name')
      const { data: allPicks } = await supabase.from('picks').select('user_id, player_id, position')

      if (!profiles || !allPicks) { setLoading(false); return }

      const ranked = profiles.map(profile => {
        const myPicks = allPicks.filter(p => p.user_id === profile.id).sort((a, b) => a.position - b.position)
        const score = calculateScore(myPicks, liveResults)
        return { ...profile, picks: myPicks, score }
      })
      .filter(e => e.picks.length > 0)
      .sort((a, b) => (a.score?.total ?? 9999) - (b.score?.total ?? 9999))

      setEntries(ranked)
      setLoading(false)
    }
    load()
  }, [liveResults])

  // Live polling every 60s
  useEffect(() => {
    const id = setInterval(async () => {
      const { data: allPicks } = await supabase.from('picks').select('user_id, player_id, position')
      const { data: profiles } = await supabase.from('profiles').select('id, display_name')
      if (!profiles || !allPicks) return
      const ranked = profiles.map(profile => {
        const myPicks = allPicks.filter(p => p.user_id === profile.id).sort((a, b) => a.position - b.position)
        return { ...profile, picks: myPicks, score: calculateScore(myPicks, liveResults) }
      }).filter(e => e.picks.length > 0).sort((a, b) => (a.score?.total ?? 9999) - (b.score?.total ?? 9999))
      setEntries(ranked)
    }, 60000)
    return () => clearInterval(id)
  }, [liveResults])

  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#a0b8a8', fontSize: 13, cursor: 'pointer' }

  const topFive = [...liveResults].sort((a, b) => a.position - b.position).slice(0, 5)

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,15,10,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => onNav('dashboard')} style={ghostBtn}>← Home</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>Leaderboard</div>
          <div style={{ fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1.5s infinite' }} />
            LIVE
          </div>
        </div>

        {/* Masters mini leaderboard */}
        {liveResults.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 13, padding: '12px 14px', marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: '#3a5a42', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Masters Leaderboard</div>
            {topFive.map(r => {
              const player = PLAYER_POOL.find(p => p.id === r.player_id)
              return player ? (
                <div key={r.player_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <span style={{ color: GOLD, fontWeight: 700, fontSize: 12, width: 22 }}>T{r.position}</span>
                    <span style={{ color: '#d8d0c0', fontSize: 13 }}>{player.name}</span>
                  </div>
                  <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
                    {r.missed_cut ? 'MC' : `−${Math.max(0, 20 - r.position * 2)}`}
                  </span>
                </div>
              ) : null
            })}
          </div>
        )}
      </div>

      {/* Predictor standings */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ fontSize: 10, color: '#3a5a42', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Predictor Standings
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: GOLD, fontFamily: "'Playfair Display', serif" }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#5a8a62' }}>No picks submitted yet.</div>
        ) : (
          entries.map((entry, idx) => {
            const isMe = entry.id === currentUserId
            return (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 13,
                padding: '14px', marginBottom: 9,
                background: isMe
                  ? `linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.05))`
                  : idx === 0
                  ? `linear-gradient(135deg, ${GOLD}18, ${GOLD}07)`
                  : 'rgba(255,255,255,0.04)',
                border: isMe
                  ? `1px solid ${GOLD}55`
                  : idx === 0 ? `1px solid ${GOLD}38` : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 15,
                animation: 'fadeIn 0.3s ease both',
                animationDelay: `${idx * 40}ms`,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: idx === 0 ? `linear-gradient(135deg, ${GOLD}, #b8943e)` : 'rgba(255,255,255,0.09)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, color: idx === 0 ? G : '#f5f0e8',
                }}>
                  {idx + 1}
                </div>
                <PlayerAvatar initials={entry.display_name?.slice(0, 2) || '?'} size={42} seed={idx + 5} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f5f0e8', fontWeight: 700, fontSize: 15, fontFamily: "'Playfair Display', serif" }}>
                    {entry.display_name}
                    {isMe && <span style={{ marginLeft: 8, fontSize: 11, color: GOLD, fontWeight: 600 }}>you</span>}
                    {idx === 0 && !isMe && <span style={{ marginLeft: 6 }}>🏆</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#4a6a52' }}>
                    {entry.score?.breakdown.filter(b => b.exact).length ?? 0} exact · {entry.picks.length} picks
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: idx === 0 ? GOLD : '#d8d0c0', fontFamily: "'Playfair Display', serif" }}>
                    {entry.score?.total ?? '—'}
                  </div>
                  <div style={{ fontSize: 10, color: '#3a5a42' }}>pts</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
