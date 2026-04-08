import { useState, useEffect } from 'react'
import { LOCK_TIME_UTC } from '../lib/constants'

const GOLD = '#c9a84c'
const G = '#1a3a2a'

export default function CountdownBanner() {
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false })

  useEffect(() => {
    const tick = () => {
      const diff = LOCK_TIME_UTC - new Date()
      if (diff <= 0) { setCd({ d:0, h:0, m:0, s:0, expired:true }); return }
      setCd({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: cd.expired
        ? 'rgba(248,113,113,0.12)'
        : 'linear-gradient(90deg, rgba(10,22,15,0.97), rgba(20,46,30,0.97))',
      borderBottom: `1px solid ${cd.expired ? 'rgba(248,113,113,0.35)' : GOLD + '2a'}`,
      backdropFilter: 'blur(16px)',
      padding: '9px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Left label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: cd.expired ? '#f87171' : '#4ade80',
          boxShadow: cd.expired ? '0 0 6px #f87171' : '0 0 7px #4ade80',
          animation: cd.expired ? 'none' : 'pulse 1.5s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 10, color: cd.expired ? '#f87171' : '#5a8a62', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {cd.expired ? 'Picks locked' : 'Picks close'}
        </span>
      </div>

      {/* Right countdown or locked */}
      {cd.expired ? (
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>🔒 Closed — Thu 10 Apr 16:00 SAST</span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {[{ v: cd.d, l: 'd' }, { v: cd.h, l: 'h' }, { v: cd.m, l: 'm' }, { v: cd.s, l: 's' }].map(({ v, l }, i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div style={{
                background: `${GOLD}16`, border: `1px solid ${GOLD}28`,
                borderRadius: 6, padding: '3px 6px', minWidth: 28, textAlign: 'center',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 14, fontWeight: 800, color: GOLD,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {String(v).padStart(2, '0')}
              </div>
              <span style={{ fontSize: 9, color: `${GOLD}55`, marginRight: i < 3 ? 3 : 0 }}>{l}</span>
              {i < 3 && <span style={{ fontSize: 11, color: `${GOLD}30`, marginRight: 3 }}>·</span>}
            </div>
          ))}
          <span style={{ fontSize: 10, color: '#3a5a42', marginLeft: 4 }}>SAST</span>
        </div>
      )}
    </div>
  )
}
