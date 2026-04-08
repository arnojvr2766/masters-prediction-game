import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateScore, isPicksLocked } from '../lib/constants'
import PlayerAvatar from './PlayerAvatar'

const GOLD = '#c9a84c'
const G = '#1a3a2a'

export default function DashboardScreen({ user, userName, isAdmin, onNav, onLogout, liveResults }) {
  const [picks, setPicks] = useState([])
  const [leaderPos, setLeaderPos] = useState(null)
  const locked = isPicksLocked()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('picks').select('player_id, position').eq('user_id', user.id).order('position')
      if (data) setPicks(data)
    }
    load()
  }, [user.id])

  const score = calculateScore(picks, liveResults)

  return (
    <div style={{ minHeight: '100vh', padding: '48px 22px 80px' }}>

      {/* Greeting */}
      <div style={{ marginBottom: 32, animation: 'slideUp 0.4s ease both' }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: `${GOLD}66`, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Georgia, serif' }}>
          Augusta National · 2026
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.2 }}>
          Welcome back,<br /><span style={{ color: GOLD }}>{userName}</span>
        </h1>
        <div style={{ marginTop: 8, fontSize: 13, color: locked ? '#f87171' : '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: locked ? '#f87171' : '#4ade80', animation: locked ? 'none' : 'pulse 1.5s infinite' }} />
          {locked ? 'Picks are locked · 16:00 SAST passed' : 'Picks open until Thu 10 Apr 16:00 SAST'}
        </div>
      </div>

      {/* Score card */}
      {score ? (
        <div style={{
          background: `linear-gradient(135deg, ${GOLD}14, rgba(201,168,76,0.05))`,
          border: `1px solid ${GOLD}30`, borderRadius: 18, padding: '20px',
          marginBottom: 20, animation: 'slideUp 0.4s ease 0.1s both',
        }}>
          <div style={{ fontSize: 10, color: `${GOLD}77`, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Your score</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 52, fontWeight: 800, color: GOLD, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{score.total}</div>
              <div style={{ fontSize: 12, color: '#5a8a62', marginTop: 4 }}>points · lower is better</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#4a6a52', marginBottom: 2 }}>exact matches</div>
              <div style={{ fontSize: 32, color: '#4ade80', fontWeight: 800 }}>{score.breakdown.filter(b => b.exact).length}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: '#4a6a52' }}>{picks.length}/20 picks submitted</div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: `1px dashed ${GOLD}28`,
          borderRadius: 18, padding: '28px 20px', marginBottom: 20, textAlign: 'center',
          animation: 'slideUp 0.4s ease 0.1s both',
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⛳</div>
          <div style={{ color: '#7a9a80', fontSize: 15, marginBottom: 4 }}>No picks yet</div>
          <div style={{ color: '#4a6a52', fontSize: 12 }}>Select 20 players and rank them to play</div>
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'slideUp 0.4s ease 0.2s both' }}>
        {!locked && (
          <button onClick={() => onNav('picks')} style={{
            background: `linear-gradient(135deg, ${GOLD}, #b8943e)`, color: G,
            border: 'none', borderRadius: 14, padding: '16px 20px',
            fontSize: 16, fontWeight: 800, cursor: 'pointer', textAlign: 'left',
            fontFamily: "'Playfair Display', serif",
            boxShadow: `0 6px 24px ${GOLD}28`,
          }}>
            {picks.length === 0 ? '⛳ Make your picks →' : `✏️ Edit picks (${picks.length}/20) →`}
          </button>
        )}

        <button onClick={() => onNav('myPicks')} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '14px 20px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', color: '#c8d8c8', textAlign: 'left',
        }}>
          📋 My picks & score →
        </button>

        <button onClick={() => onNav('leaderboard')} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '14px 20px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', color: '#c8d8c8', textAlign: 'left',
        }}>
          🏆 Leaderboard →
        </button>

        {isAdmin && (
          <button onClick={() => onNav('admin')} style={{
            background: 'rgba(201,168,76,0.08)', border: `1px solid ${GOLD}28`,
            borderRadius: 14, padding: '14px 20px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', color: GOLD, textAlign: 'left',
          }}>
            ⚙️ Admin — update standings →
          </button>
        )}
      </div>

      {/* Sign out */}
      <button onClick={onLogout} style={{
        marginTop: 36, background: 'none', border: 'none',
        color: '#2e4a36', fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
      }}>
        Sign out
      </button>
    </div>
  )
}
