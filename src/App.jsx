import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import CountdownBanner from './components/CountdownBanner'
import HomeScreen from './components/HomeScreen'
import DashboardScreen from './components/DashboardScreen'
import PickScreen from './components/PickScreen'
import MyPicksScreen from './components/MyPicksScreen'
import LeaderboardScreen from './components/LeaderboardScreen'
import AdminScreen from './components/AdminScreen'

const G = '#1a3a2a'
const GOLD = '#c9a84c'

// Default live results — replaced by DB data
const DEFAULT_RESULTS = []

export default function App() {
  const [screen, setScreen] = useState('home')
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [liveResults, setLiveResults] = useState(DEFAULT_RESULTS)
  const [booting, setBooting] = useState(true)

  // ── Restore session on load ──
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadProfile(session.user)
      }
      setBooting(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user)
      } else {
        setUser(null); setUserName(''); setIsAdmin(false); setScreen('home')
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Load live results from DB ──
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('live_results').select('player_id, position, missed_cut')
      if (data && data.length > 0) setLiveResults(data)
    }
    load()
    const id = setInterval(load, 120000) // refresh every 2 min
    return () => clearInterval(id)
  }, [])

  const loadProfile = async (authUser) => {
    const { data } = await supabase
      .from('profiles').select('display_name, is_admin').eq('id', authUser.id).single()
    setUser(authUser)
    setUserName(data?.display_name || authUser.email.split('@')[0])
    setIsAdmin(data?.is_admin || false)
    setScreen('dashboard')
  }

  const handleLogin = (authUser, name, admin = false) => {
    setUser(authUser)
    setUserName(name)
    setIsAdmin(admin)
    setScreen('dashboard')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setUserName(''); setIsAdmin(false); setScreen('home')
  }

  if (booting) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1e4530 0%, #0f2218 40%, #080f0a 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛳</div>
        <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Loading…</div>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', maxWidth: 430, margin: '0 auto',
      background: 'radial-gradient(ellipse at top, #1e4530 0%, #0f2218 40%, #080f0a 100%)',
      color: '#f5f0e8', fontFamily: "-apple-system, 'SF Pro Display', Georgia, serif",
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse, ${GOLD}07 0%, transparent 70%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <CountdownBanner />

        {screen === 'home'        && <HomeScreen onLogin={handleLogin} onNav={setScreen} />}
        {screen === 'dashboard'   && <DashboardScreen user={user} userName={userName} isAdmin={isAdmin} onNav={setScreen} onLogout={handleLogout} liveResults={liveResults} />}
        {screen === 'picks'       && <PickScreen userId={user?.id} onNav={setScreen} liveResults={liveResults} />}
        {screen === 'myPicks'     && <MyPicksScreen userId={user?.id} onNav={setScreen} liveResults={liveResults} />}
        {screen === 'leaderboard' && <LeaderboardScreen onNav={setScreen} liveResults={liveResults} currentUserId={user?.id} />}
        {screen === 'admin'       && <AdminScreen onNav={setScreen} isAdmin={isAdmin} onResultsUpdate={setLiveResults} />}
      </div>
    </div>
  )
}
