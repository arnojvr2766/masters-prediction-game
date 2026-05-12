// ─── LOCK TIME ────────────────────────────────────────────────────────────────
// Thu 14 May 2026 at 14:00 SAST (UTC+2) = 12:00 UTC
export const LOCK_TIME_UTC = new Date('2026-05-14T12:00:00Z')

export const isPicksLocked = () => new Date() >= LOCK_TIME_UTC

// ─── SCORING ─────────────────────────────────────────────────────────────────
export const MISSED_CUT_PENALTY = 50

export function calculateScore(picks, liveResults) {
  if (!picks || picks.length === 0) return null
  let total = 0
  const breakdown = picks.map((pick) => {
    const result = liveResults.find((r) => r.player_id === pick.player_id)
    if (!result) return { ...pick, actualPos: null, points: 0, exact: false }
    const actualPos = result.missed_cut ? result.position + MISSED_CUT_PENALTY : result.position
    const diff = Math.max(0, Math.abs(actualPos - pick.position))
    const exact = !result.missed_cut && actualPos === pick.position
    const exactBonus = exact ? -(21 - pick.position) : 0
    const points = diff + exactBonus
    total += points
    return { ...pick, actualPos, points, exact, missedCut: result.missed_cut }
  })
  return { total, breakdown }
}

// Pick 5: same formula, exact bonus = -(6 - position)
export function calculatePick5Score(picks, liveResults) {
  if (!picks || picks.length === 0) return null
  let total = 0
  const breakdown = picks.map((pick) => {
    const result = liveResults.find((r) => r.player_id === pick.player_id)
    if (!result) return { ...pick, actualPos: null, points: 0, exact: false }
    const actualPos = result.missed_cut ? result.position + MISSED_CUT_PENALTY : result.position
    const diff = Math.max(0, Math.abs(actualPos - pick.position))
    const exact = !result.missed_cut && actualPos === pick.position
    const exactBonus = exact ? -(6 - pick.position) : 0
    const points = diff + exactBonus
    total += points
    return { ...pick, actualPos, points, exact, missedCut: result.missed_cut }
  })
  return { total, breakdown }
}

// H2H: count correct picks (higher = better, shown as correct/total)
export function calculateH2HScore(picks, matchups, liveResults) {
  if (!picks || !matchups || picks.length === 0) return null
  let correct = 0
  const breakdown = picks.map((pick) => {
    const matchup = matchups.find(m => m.id === pick.matchup_id)
    if (!matchup) return { ...pick, correct: false, resolved: false }
    const resA = liveResults.find(r => r.player_id === matchup.player_a)
    const resB = liveResults.find(r => r.player_id === matchup.player_b)
    if (!resA || !resB) return { ...pick, correct: false, resolved: false }
    const posA = resA.missed_cut ? resA.position + MISSED_CUT_PENALTY : resA.position
    const posB = resB.missed_cut ? resB.position + MISSED_CUT_PENALTY : resB.position
    const winner = posA <= posB ? matchup.player_a : matchup.player_b
    const isCorrect = pick.picked_player === winner
    if (isCorrect) correct++
    return { ...pick, correct: isCorrect, resolved: true, winner }
  })
  return { correct, total: picks.length, breakdown }
}

// Betterball: sum of best position from each pair (lower = better)
export function calculateBetterballScore(pairs, liveResults) {
  if (!pairs || pairs.length === 0) return null
  let total = 0
  let resolved = 0
  const breakdown = pairs.map((pair) => {
    const resA = liveResults.find(r => r.player_id === pair.player_a)
    const resB = liveResults.find(r => r.player_id === pair.player_b)
    const posA = resA ? (resA.missed_cut ? resA.position + MISSED_CUT_PENALTY : resA.position) : null
    const posB = resB ? (resB.missed_cut ? resB.position + MISSED_CUT_PENALTY : resB.position) : null
    if (posA !== null && posB !== null) {
      const best = Math.min(posA, posB)
      total += best
      resolved++
      return { ...pair, posA, posB, best }
    }
    return { ...pair, posA, posB, best: null }
  })
  return { total, resolved, pairs: pairs.length, breakdown }
}

// ─── PLAYER POOL ──────────────────────────────────────────────────────────────
export const PLAYER_POOL = [
  { id: 1,  name: 'Scottie Scheffler',  country: '🇺🇸', rank: 1,  odds: '6/1',  wins: 0, avgFinish: 8.2,  img: 'SS' },
  { id: 2,  name: 'Rory McIlroy',       country: '🇬🇧', rank: 2,  odds: '8/1',  wins: 1, avgFinish: 11.4, img: 'RM' },
  { id: 3,  name: 'Jon Rahm',           country: '🇪🇸', rank: 3,  odds: '12/1', wins: 0, avgFinish: 9.8,  img: 'JR' },
  { id: 4,  name: 'Xander Schauffele',  country: '🇺🇸', rank: 4,  odds: '14/1', wins: 1, avgFinish: 13.1, img: 'XS' },
  { id: 5,  name: 'Collin Morikawa',    country: '🇺🇸', rank: 5,  odds: '16/1', wins: 1, avgFinish: 18.6, img: 'CM' },
  { id: 6,  name: 'Viktor Hovland',     country: '🇳🇴', rank: 6,  odds: '20/1', wins: 0, avgFinish: 16.2, img: 'VH' },
  { id: 7,  name: 'Ludvig Åberg',       country: '🇸🇪', rank: 7,  odds: '22/1', wins: 0, avgFinish: 12.4, img: 'LA' },
  { id: 8,  name: 'Brooks Koepka',      country: '🇺🇸', rank: 8,  odds: '22/1', wins: 3, avgFinish: 14.1, img: 'BK' },
  { id: 9,  name: 'Tommy Fleetwood',    country: '🇬🇧', rank: 9,  odds: '28/1', wins: 0, avgFinish: 21.7, img: 'TF' },
  { id: 10, name: 'Matt Fitzpatrick',   country: '🇬🇧', rank: 10, odds: '30/1', wins: 0, avgFinish: 17.9, img: 'MF' },
  { id: 11, name: 'Justin Thomas',      country: '🇺🇸', rank: 11, odds: '28/1', wins: 2, avgFinish: 18.4, img: 'JT' },
  { id: 12, name: 'Hideki Matsuyama',   country: '🇯🇵', rank: 12, odds: '33/1', wins: 0, avgFinish: 14.8, img: 'HM' },
  { id: 13, name: 'Shane Lowry',        country: '🇮🇪', rank: 13, odds: '35/1', wins: 0, avgFinish: 22.1, img: 'SL' },
  { id: 14, name: 'Patrick Cantlay',    country: '🇺🇸', rank: 14, odds: '35/1', wins: 0, avgFinish: 19.3, img: 'PC' },
  { id: 15, name: 'Tony Finau',         country: '🇺🇸', rank: 15, odds: '40/1', wins: 0, avgFinish: 24.3, img: 'TFin'},
  { id: 16, name: 'Joaquín Niemann',    country: '🇨🇱', rank: 16, odds: '45/1', wins: 0, avgFinish: 28.6, img: 'JN' },
  { id: 17, name: 'Tyrrell Hatton',     country: '🇬🇧', rank: 17, odds: '40/1', wins: 0, avgFinish: 26.4, img: 'TH' },
  { id: 18, name: 'Max Homa',           country: '🇺🇸', rank: 18, odds: '50/1', wins: 0, avgFinish: 29.1, img: 'MH' },
  { id: 19, name: 'Sungjae Im',         country: '🇰🇷', rank: 19, odds: '55/1', wins: 0, avgFinish: 31.2, img: 'SI' },
  { id: 20, name: 'Jordan Spieth',      country: '🇺🇸', rank: 20, odds: '50/1', wins: 0, avgFinish: 16.9, img: 'JS' },
  { id: 21, name: 'Adam Scott',         country: '🇦🇺', rank: 21, odds: '66/1', wins: 0, avgFinish: 20.3, img: 'AS' },
  { id: 22, name: 'Cameron Smith',      country: '🇦🇺', rank: 22, odds: '66/1', wins: 0, avgFinish: 19.8, img: 'CS' },
  { id: 23, name: 'Will Zalatoris',     country: '🇺🇸', rank: 23, odds: '70/1', wins: 0, avgFinish: 23.4, img: 'WZ' },
  { id: 24, name: 'Sepp Straka',        country: '🇦🇹', rank: 24, odds: '80/1', wins: 0, avgFinish: 34.1, img: 'SSt'},
  { id: 25, name: 'Keegan Bradley',     country: '🇺🇸', rank: 25, odds: '80/1', wins: 0, avgFinish: 32.8, img: 'KB' },
]
