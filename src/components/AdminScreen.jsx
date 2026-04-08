import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL } from '../lib/constants'

const GOLD = '#c9a84c'
const G = '#1a3a2a'

export default function AdminScreen({ onNav, isAdmin, onResultsUpdate }) {
  const [results, setResults] = useState(
    PLAYER_POOL.map(p => ({ player_id: p.id, position: p.rank, missed_cut: false }))
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('live_results').select('player_id, position, missed_cut')
      if (data && data.length > 0) {
        // Merge DB data with defaults
        const merged = PLAYER_POOL.map(p => {
          const db = data.find(d => d.player_id === p.id)
          return db || { player_id: p.id, position: p.rank, missed_cut: false }
        })
        setResults(merged)
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('live_results').upsert(results, { onConflict: 'player_id' })
    setSaving(false)
    if (error) {
      setMsg('Error saving: ' + error.message)
    } else {
      setMsg('✓ Standings updated!')
      onResultsUpdate(results)
      setTimeout(() => setMsg(''), 2500)
    }
  }

  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#a0b8a8', fontSize: 13, cursor: 'pointer' }

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
      <div style={{ color: '#f87171', fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8 }}>Access denied</div>
      <div style={{ color: '#5a8a62', fontSize: 14, marginBottom: 24 }}>You need admin privileges to access this page.</div>
      <button onClick={() => onNav('dashboard')} style={ghostBtn}>← Back home</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <div style={{ padding: '14px 18px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,15,10,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => onNav('dashboard')} style={ghostBtn}>← Home</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>Admin Panel</div>
          <div style={{ fontSize: 11, color: '#4ade80' }}>Admin ✓</div>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 10, color: '#3a5a42', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Update Live Standings</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: GOLD }}>Loading…</div>
        ) : (
          PLAYER_POOL.map((player, idx) => {
            const r = results.find(x => x.player_id === player.id) || { player_id: player.id, position: player.rank, missed_cut: false }
            return (
              <div key={player.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 13px', marginBottom: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
              }}>
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
                  <input
                    type="checkbox" checked={r.missed_cut}
                    onChange={e => setResults(prev => prev.map(x => x.player_id === player.id ? { ...x, missed_cut: e.target.checked } : x))}
                    style={{ accentColor: GOLD, width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 11, color: '#7a9a80' }}>MC</span>
                </label>
              </div>
            )
          })
        )}

        <button onClick={save} disabled={saving} style={{
          width: '100%', marginTop: 16,
          background: saving ? `${GOLD}44` : `linear-gradient(135deg, ${GOLD}, #b8943e)`,
          color: G, border: 'none', borderRadius: 13, padding: '15px',
          fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          fontFamily: "'Playfair Display', serif",
        }}>
          {msg || (saving ? 'Saving…' : 'Save Standings')}
        </button>
      </div>
    </div>
  )
}
