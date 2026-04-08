// ─── LOCK TIME ────────────────────────────────────────────────────────────────
// Thu 10 April 2026 at 16:00 SAST (UTC+2) = 14:00 UTC
export const LOCK_TIME_UTC = new Date('2026-04-10T14:00:00Z')

export const isPicksLocked = () => new Date() >= LOCK_TIME_UTC

// ─── SCORING ─────────────────────────────────────────────────────────────────
export const MISSED_CUT_PENALTY = 50

export function calculateScore(picks, liveResults) {
  if (!picks || picks.length === 0) return null
  let total = 0
  const breakdown = picks.map((pick) => {
    const result = liveResults.find((r) => r.player_id === pick.player_id)
    if (!result) return { ...pick, actualPos: null, points: 0, exact: false }

    const actualPos = result.missed_cut
      ? result.position + MISSED_CUT_PENALTY
      : result.position

    const diff = Math.max(0, Math.abs(actualPos - pick.position))
    const exact = !result.missed_cut && actualPos === pick.position
    const exactBonus = exact ? -(21 - pick.position) : 0
    const points = diff + exactBonus
    total += points
    return { ...pick, actualPos, points, exact, missedCut: result.missed_cut }
  })
  return { total, breakdown }
}

// ─── PLAYER POOL ──────────────────────────────────────────────────────────────
export const PLAYER_POOL = [
  { id: 1,  name: 'Scottie Scheffler',  country: '🇺🇸', rank: 1,  odds: '9/2',  wins: 4, avgFinish: 8.2,  img: 'SS' },
  { id: 2,  name: 'Rory McIlroy',       country: '🇬🇧', rank: 2,  odds: '10/1', wins: 1, avgFinish: 11.4, img: 'RM' },
  { id: 3,  name: 'Jon Rahm',           country: '🇪🇸', rank: 3,  odds: '12/1', wins: 1, avgFinish: 9.8,  img: 'JR' },
  { id: 4,  name: 'Xander Schauffele',  country: '🇺🇸', rank: 4,  odds: '14/1', wins: 2, avgFinish: 13.1, img: 'XS' },
  { id: 5,  name: 'Collin Morikawa',    country: '🇺🇸', rank: 5,  odds: '16/1', wins: 0, avgFinish: 18.6, img: 'CM' },
  { id: 6,  name: 'Viktor Hovland',     country: '🇳🇴', rank: 6,  odds: '18/1', wins: 0, avgFinish: 16.2, img: 'VH' },
  { id: 7,  name: 'Ludvig Åberg',       country: '🇸🇪', rank: 7,  odds: '20/1', wins: 0, avgFinish: 12.4, img: 'LA' },
  { id: 8,  name: 'Patrick Cantlay',    country: '🇺🇸', rank: 8,  odds: '22/1', wins: 0, avgFinish: 19.3, img: 'PC' },
  { id: 9,  name: 'Tommy Fleetwood',    country: '🇬🇧', rank: 9,  odds: '25/1', wins: 0, avgFinish: 21.7, img: 'TF' },
  { id: 10, name: 'Matt Fitzpatrick',   country: '🇬🇧', rank: 10, odds: '28/1', wins: 0, avgFinish: 17.9, img: 'MF' },
  { id: 11, name: 'Hideki Matsuyama',   country: '🇯🇵', rank: 11, odds: '30/1', wins: 1, avgFinish: 14.8, img: 'HM' },
  { id: 12, name: 'Shane Lowry',        country: '🇮🇪', rank: 12, odds: '33/1', wins: 0, avgFinish: 22.1, img: 'SL' },
  { id: 13, name: 'Tony Finau',         country: '🇺🇸', rank: 13, odds: '35/1', wins: 0, avgFinish: 24.3, img: 'TFin'},
  { id: 14, name: 'Joaquín Niemann',    country: '🇨🇱', rank: 14, odds: '40/1', wins: 0, avgFinish: 28.6, img: 'JN' },
  { id: 15, name: 'Tyrrell Hatton',     country: '🇬🇧', rank: 15, odds: '40/1', wins: 0, avgFinish: 26.4, img: 'TH' },
  { id: 16, name: 'Max Homa',           country: '🇺🇸', rank: 16, odds: '45/1', wins: 0, avgFinish: 29.1, img: 'MH' },
  { id: 17, name: 'Sungjae Im',         country: '🇰🇷', rank: 17, odds: '50/1', wins: 0, avgFinish: 31.2, img: 'SI' },
  { id: 18, name: 'Brooks Koepka',      country: '🇺🇸', rank: 18, odds: '50/1', wins: 0, avgFinish: 18.4, img: 'BK' },
  { id: 19, name: 'Justin Thomas',      country: '🇺🇸', rank: 19, odds: '55/1', wins: 0, avgFinish: 22.7, img: 'JT' },
  { id: 20, name: 'Jordan Spieth',      country: '🇺🇸', rank: 20, odds: '55/1', wins: 1, avgFinish: 16.9, img: 'JS' },
  { id: 21, name: 'Adam Scott',         country: '🇦🇺', rank: 21, odds: '60/1', wins: 1, avgFinish: 20.3, img: 'AS' },
  { id: 22, name: 'Cameron Smith',      country: '🇦🇺', rank: 22, odds: '60/1', wins: 0, avgFinish: 19.8, img: 'CS' },
  { id: 23, name: 'Will Zalatoris',     country: '🇺🇸', rank: 23, odds: '66/1', wins: 0, avgFinish: 23.4, img: 'WZ' },
  { id: 24, name: 'Sepp Straka',        country: '🇦🇹', rank: 24, odds: '80/1', wins: 0, avgFinish: 34.1, img: 'SSt'},
  { id: 25, name: 'Keegan Bradley',     country: '🇺🇸', rank: 25, odds: '80/1', wins: 0, avgFinish: 32.8, img: 'KB' },
]
