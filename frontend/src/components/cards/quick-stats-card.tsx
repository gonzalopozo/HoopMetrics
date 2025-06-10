import { BarChart2, User } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"
import Link from "next/link"
import axios from "axios"

interface PlayerStats {
    id: number
    name: string
    birth_date: string
    height?: number
    weight?: number
    position?: string
    number?: number
    team: {
        full_name: string
    }
    url_pic?: string
    stats: Array<{
        points?: number
        rebounds?: number
        assists?: number
        steals?: number
        blocks?: number
        minutes_played?: number
        field_goals_attempted?: number
        field_goals_made?: number
        three_points_made?: number
        three_points_attempted?: number
        free_throws_made?: number
        free_throws_attempted?: number
        fouls?: number
        turnovers?: number
    }>
    average_stats: {
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
}

async function getRandomPlayer(): Promise<PlayerStats> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
        try {
            const randomId = Math.floor(Math.random() * 738) + 1
            const response = await axios.get<PlayerStats>(
                `${process.env.NEXT_PUBLIC_API_URL}/players/${randomId}`
            )
            return response.data
        } catch (error) {
            attempts++
            if (attempts === maxAttempts) {
                // Fallback to a known working player ID if all attempts fail
                const response = await axios.get<PlayerStats>(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/334`
                )
                return response.data
            }
        }
    }

    throw new Error("Failed to fetch random player")
}

export async function QuickStatsCard() {
    const player = await getRandomPlayer()
    
    const PLAYER_STATS = [
        { 
            label: "Points", 
            value: player.average_stats.points.toFixed(1), 
            maxValue: 36 
        },
        { 
            label: "Rebounds", 
            value: player.average_stats.rebounds.toFixed(1), 
            maxValue: 16 
        },
        { 
            label: "Assists", 
            value: player.average_stats.assists.toFixed(1), 
            maxValue: 16 
        },
    ]

    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
            <CardHeader title="Random player stats" icon={BarChart2} />
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="mb-4 text-center text-sm font-medium">
                        {player.name} - Season Averages
                    </div>
                    <div className="space-y-6">
                        {PLAYER_STATS.map((stat, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                                    <span className="font-semibold text-lg">{stat.value}</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-accent">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{ 
                                            width: `${Math.min((parseFloat(stat.value) / stat.maxValue) * 100, 100)}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* View Player Details Button */}
                    <div className="mt-6">
                        <Link href={`/players/${player.id}`}>
                            <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                                <User className="h-4 w-4" />
                                View Player Details
                            </button>
                        </Link>
                    </div>
                </div>
                
                {/* Season Summary Section */}
                <div className="mt-6 pt-4 border-t border-border">
                    <div className="text-center">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Season Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-muted-foreground">Games Played</p>
                                <p className="font-bold text-lg">{player.stats.length}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Min/Game</p>
                                <p className="font-bold text-lg">{player.average_stats.minutes_played.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
