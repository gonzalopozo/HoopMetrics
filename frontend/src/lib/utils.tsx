import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as NBALogos from "react-nba-logos"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Team name mapping to handle different formats
const teamNameMapping: Record<string, string> = {
  // Full names to abbreviations
  "Atlanta Hawks": "ATL",
  "Boston Celtics": "BOS",
  "Brooklyn Nets": "BKN",
  "Charlotte Hornets": "CHA",
  "Chicago Bulls": "CHI",
  "Cleveland Cavaliers": "CLE",
  "Dallas Mavericks": "DAL",
  "Denver Nuggets": "DEN",
  "Detroit Pistons": "DET",
  "Golden State Warriors": "GSW",
  "Houston Rockets": "HOU",
  "Indiana Pacers": "IND",
  "Los Angeles Clippers": "LAC",
  "Los Angeles Lakers": "LAL",
  "Memphis Grizzlies": "MEM",
  "Miami Heat": "MIA",
  "Milwaukee Bucks": "MIL",
  "Minnesota Timberwolves": "MIN",
  "New Orleans Pelicans": "NOP",
  "New York Knicks": "NYK",
  "Oklahoma City Thunder": "OKC",
  "Orlando Magic": "ORL",
  "Philadelphia 76ers": "PHI",
  "Phoenix Suns": "PHX",
  "Portland Trail Blazers": "POR",
  "Sacramento Kings": "SAC",
  "San Antonio Spurs": "SAS",
  "Toronto Raptors": "TOR",
  "Utah Jazz": "UTA",
  "Washington Wizards": "WAS",

  // Common abbreviations are already handled
}

/**
 * Returns the NBA team logo component based on team name or abbreviation
 * @param teamName - The team name or abbreviation (e.g., "Boston Celtics", "BOS", "GSW")
 * @param props - Additional props to pass to the logo component
 * @returns The corresponding NBA logo component or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNBALogo(teamName: string, props: Record<string, any> = {}) {
  if (!teamName) return null

  // Normalize the team name to get the abbreviation
  let teamAbbr = teamName.trim()

  // Check if we need to convert from full name to abbreviation
  if (teamNameMapping[teamAbbr]) {
    teamAbbr = teamNameMapping[teamAbbr]
  }

  // Get the component name
  const componentName = teamAbbr

  // Access the component from the NBALogos object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LogoComponent = (NBALogos as any)[componentName]

  if (LogoComponent) {
    return <LogoComponent { ...props } />
  }

  // Return null if no matching logo is found
  return null
}
