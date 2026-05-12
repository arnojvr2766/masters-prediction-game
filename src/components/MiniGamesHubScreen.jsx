import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { isPicksLocked, calculatePick5Score, calculateH2HScore, calculateBetterballScore } from '../lib/constants'

const GOLD = '#c9a84c'
const G = '#0d1f3c'

export default function MiniGamesHubScreen({ onNav, liveResults, userId }) {
  const [pick5Count, setPick5Count] = useState(0)
  const [h2hCount, setH2hCount] = useState(0)
  const [bbCount, setBbCount] = useState(0)
  const [pick5Score, setPick5Score] = useState(null)
  const [h2hScore, setH2hScore] = useState(null)
  const [bbScore, setBbScore] = useState(null)
  const locked = isPicksLocked()

  useEffect(() => {
    const load = async () => {
      const [{ data: p5 }, { data: matchups }, { data: h2hPicks }, { data: bb }] = await Promise.all([
        supabase.from('pick5_picks').select('player_id, position').eq('user_id', userId).order('position'),
        supabase.from('h2h_matchups').select('*'),
        supabase.from('h2h_picks').select('matchup_id, picked_player').eq('user_id', userId),
        supabase.from('betterball_pairs').select('pair_num, player_a, player_b').eq('user_id', userId).order('pair_num'),
      ])
      if (p5) { setPick5Count(p5.length); setPick5Score(calculatePick5Score(p5, liveResults)) }
      if (matchups && h2hPicks) { setH2hCount(h2hPicks.length); setH2hScore(calculateH2HScore(h2hPicks, matchups, liveResults)) }
      if (bb) { setBbCount(bb.length); setBbScore(calculateBetterballScore(bb, liveResults)) }
    }
    if (userId) load()
  }, [userId, liveResults])

  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#8098b8', fontSize: 13, cursor: 'pointer' }

  const games = [
    {
      key: 'pick5',
      icon: '5️⃣',
      name: 'Pick 5',
      desc: 'Pick the top 5 finishers in order. Smallest deviation wins.',
      status: pick5Count === 5 ? `${pick5Count}/5 picks` : `${pick5Count}/5 picks`,
      score: pick5Score ? `Score: ${pick5Score.total}` : null,
      done: pick5Count === 5,
    },
    {
      key: 'h2h',
      icon: '⚔️',
      name: 'Head to Head',
      desc: 'Pick who finishes higher in each head-to-head matchup.',
      status: h2hCount > 0 ? `${h2hCount} picked` : 'No picks yet',
      score: h2hScore ? `${h2hScore.correct}/${h2hScore.total} correct` : null,
      done: h2hCount > 0,
    },
    {
      key: 'betterball',
      icon: '🤝',
      name: 'Betterball',
      desc: 'Build 5 player pairs. Best finisher from each pair counts.',
      status: `${bbCount}/5 pairs`,
      score: bbScore && bbScore.resolved > 0 ? `Score: ${bbScore.total}` : null,
      done: bbCount === 5,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ padding: '14px 18px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,11,18,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => onNav('dashboard')} style={ghostBtn}>← Home</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>Mini-Games</div>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{ padding: '20px 18px' }}>
        <p style={{ color: '#3a5a7a', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Side bets on the PGA Championship. Each game is scored independently — same lock time as your main picks.
        </p>

        {games.map((g) => (
          <div
            key={g.key}
            onClick={() => onNav(g.key)}
            style={{
              background: g.done ? `linear-gradient(135deg, ${GOLD}10, ${GOLD}04)` : 'rgba(255,255,255,0.04)',
              border: g.done ? `1px solid ${GOLD}38` : '1px solid rgba(255,255,255,0.09)',
              borderRadius: 18, padding: '20px', marginBottom: 14,
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}
          >
            {g.done && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)` }} />
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                <div style={{ fontSize: 32 }}>{g.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#f5f0e8', fontSize: 16, marginBottom: 4 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: '#3a5a7a', lineHeight: 1.5, marginBottom: 10 }}>{g.desc}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: g.done ? '#4ade80' : '#6a8aaa', fontWeight: 600, background: g.done ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '3px 10px', border: g.done ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>
                      {g.done ? '✓ ' : ''}{g.status}
                    </span>
                    {g.score && (
                      <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, background: `${GOLD}14`, borderRadius: 20, padding: '3px 10px', border: `1px solid ${GOLD}28` }}>
                        {g.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ color: '#2a4a6a', fontSize: 20, paddingLeft: 8, paddingTop: 4 }}>›</div>
            </div>
          </div>
        ))}

        {locked && (
          <div style={{ marginTop: 8, padding: '12px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 12, fontSize: 12, color: '#f87171', textAlign: 'center' }}>
            🔒 All games are locked. Thu 14 May at 14:00 SAST has passed.
          </div>
        )}
      </div>
    </div>
  )
}
