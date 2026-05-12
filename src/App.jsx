import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import CountdownBanner from './components/CountdownBanner'
import HomeScreen from './components/HomeScreen'
import DashboardScreen from './components/DashboardScreen'
import PickScreen from './components/PickScreen'
import MyPicksScreen from './components/MyPicksScreen'
import LeaderboardScreen from './components/LeaderboardScreen'
import AdminScreen from './components/AdminScreen'
import MiniGamesHubScreen from './components/MiniGamesHubScreen'
import Pick5Screen from './components/Pick5Screen'
import H2HScreen from './components/H2HScreen'
import BetterballScreen from './components/BetterballScreen'

const G = '#0d1f3c'
const GOLD = '#c9a84c'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [liveResults, setLiveResults] = useState([])
  const [h2hMatchups, setH2hMatchups] = useState([])
  const [booting, setBooting] = useState(true)

  // ── Restore session on load ──
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) await loadProfile(session.user)
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

  // ── Load live results + h2h matchups from DB ──
  useEffect(() => {
    const load = async () => {
      const [{ data: results }, { data: matchups }] = await Promise.all([
        supabase.from('live_results').select('player_id, position, missed_cut'),
        supabase.from('h2h_matchups').select('*').order('id'),
      ])
      if (results && results.length > 0) setLiveResults(results)
      if (matchups) setH2hMatchups(matchups)
    }
    load()
    const id = setInterval(load, 120000)
    return () => clearInterval(id)
  }, [])

  const loadProfile = async (authUser) => {
    const { data } = await supabase.from('profiles').select('display_name, is_admin').eq('id', authUser.id).single()
    setUser(authUser)
    setUserName(data?.display_name || authUser.email.split('@')[0])
    setIsAdmin(data?.is_admin || false)
    setScreen('dashboard')
  }

  const handleLogin = (authUser, name, admin = false) => {
    setUser(authUser); setUserName(name); setIsAdmin(admin); setScreen('dashboard')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setUserName(''); setIsAdmin(false); setScreen('home')
  }

  if (booting) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at top, #0e1e3a 0%, #080e1c 40%, #080b12 100%)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛳</div>
        <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Loading…</div>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', maxWidth: 430, margin: '0 auto',
      background: 'radial-gradient(ellipse at top, #0e1e3a 0%, #080e1c 40%, #080b12 100%)',
      color: '#f5f0e8', fontFamily: "-apple-system, 'SF Pro Display', Georgia, serif",
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, pointerEvents: 'none', zIndex: 0, background: `radial-gradient(ellipse, ${GOLD}07 0%, transparent 70%)` }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <CountdownBanner />

        {screen === 'home'        && <HomeScreen onLogin={handleLogin} onNav={setScreen} />}
        {screen === 'dashboard'   && <DashboardScreen user={user} userName={userName} isAdmin={isAdmin} onNav={setScreen} onLogout={handleLogout} liveResults={liveResults} />}
        {screen === 'picks'       && <PickScreen userId={user?.id} onNav={setScreen} liveResults={liveResults} />}
        {screen === 'myPicks'     && <MyPicksScreen userId={user?.id} onNav={setScreen} liveResults={liveResults} />}
        {screen === 'leaderboard' && <LeaderboardScreen onNav={setScreen} liveResults={liveResults} currentUserId={user?.id} />}
        {screen === 'admin'       && <AdminScreen onNav={setScreen} isAdmin={isAdmin} onResultsUpdate={setLiveResults} onMatchupsUpdate={setH2hMatchups} />}
        {screen === 'miniGames'   && <MiniGamesHubScreen onNav={setScreen} liveResults={liveResults} userId={user?.id} />}
        {screen === 'pick5'       && <Pick5Screen userId={user?.id} onNav={setScreen} liveResults={liveResults} />}
        {screen === 'h2h'         && <H2HScreen userId={user?.id} onNav={setScreen} liveResults={liveResults} matchups={h2hMatchups} />}
        {screen === 'betterball'  && <BetterballScreen userId={user?.id} onNav={setScreen} liveResults={liveResults} />}
      </div>
    </div>
  )
}
