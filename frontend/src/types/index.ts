export interface Player {
    id: string
    name: string
    position: string
    team: {
        name: string
        logo?: string
    }
    image: string
    stats: {
        points: number
        rebounds: number
        assists: number
    }
}

export interface Game {
    time: string
    teams: [string, string]
    channel: string
}

export interface TeamStanding {
    team: string
    wins: number
    losses: number
}

export interface Milestone {
    player: string
    achievement: string
}

export interface Stat {
    label: string
    value: string
    trend: number[]
}
