export interface Player {
    name: string
    team: string
    stat: string
    image: string
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
