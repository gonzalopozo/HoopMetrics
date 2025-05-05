export interface PlayerStats {
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  minutes_played: number
  field_goals_attempted: number
  field_goals_made: number
  three_points_made: number
  three_points_attempted: number
  free_throws_made: number
  free_throws_attempted: number
  fouls: number
  turnovers: number
}

export interface Player {
  name: string
  birth_date: string
  height: number
  weight: number
  position: string
  number: number
  team: { full_name: string }
  stats: PlayerStats[]
  average_stats: PlayerStats
}