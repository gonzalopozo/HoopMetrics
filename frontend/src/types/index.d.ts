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

export interface TopPerformer {
    id: number
    name: string
    team: { full_name: string }
    url_pic: string
    isWinner: boolean
    points: number
    rebounds: number
    assists: number
}

export type UserRole = "free" | "premium" | "enterprise" | "admin";

export interface TokenResponse {
    access_token: string;
    token_type: "bearer";
    username: string;
    role: UserRole;
}

export interface Team {
    id: string
    name: string
    logo?: JSX.Element
    // conference: string
    // division: string
    record: {
        wins: number
        losses: number
    }
    win_percentage: number
    standing: number
    stats: {
        ppg: number
        rpg: number
        apg: number
        spg: number
        bpg: number
    }
}