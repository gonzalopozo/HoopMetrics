export interface SearchTeamResult {
    id: number
    full_name: string
    abbreviation: string
    conference?: string
    division?: string
    city?: string
}

export interface SearchPlayerResult {
    id: number
    name: string
    position: string
    number?: number
    team_name?: string
    url_pic?: string
}

export interface SearchSuggestions {
    teams: SearchTeamResult[]
    players: SearchPlayerResult[]
    total_teams: number
    total_players: number
}

export interface SearchResults {
    teams: SearchTeamResult[]
    players: SearchPlayerResult[]
    query: string
    total_teams: number
    total_players: number
    page: number
    limit: number
    has_next_page: boolean
}