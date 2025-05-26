import { Metadata } from 'next'
import Image from "next/image"
import Link from "next/link"
import { Calendar, Ruler, Weight, Trophy, TrendingUp, Activity, BarChart3, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import PlayerTabs from "@/components/ui/player-tabs"  // We'll create this client component
import axios from "axios"

// Define the params type explicitly
type PlayerParams = {
    id: string;
}

type PlayerPageProps = {
    params: PlayerParams
    searchParams: Record<string, string | string[]>
}


// Add generateMetadata if needed (optional)
export async function generateMetadata({ params, searchParams }: PlayerPageProps): Promise<Metadata> {
    console.log(searchParams)
    return {
        title: `Player ${params.id} | HoopMetrics`,
    }
}

// Types for our player data
interface PlayerStat {
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

interface Player {
    id: number
    name: string
    birth_date: string
    height: number
    weight: number
    position: string
    number: number
    team: {
        full_name: string
    }
    url_pic: string
    stats: PlayerStat[]
    average_stats: PlayerStat
}

export default async function PlayerDetailPage({
    params,
    searchParams
}: PlayerPageProps) {
    // Server-side data fetching
    console.log(searchParams)
    const playerId = params.id;
    const player = await fetchPlayer(playerId)

    if (!player) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex flex-col items-center justify-center py-20">
                    <h1 className="text-2xl font-bold mb-4">Player not found</h1>
                    <p className="text-muted-foreground mb-6">{`The player you're looking for doesn't exist or has been removed.`}</p>
                    <Link href="/players" className="flex items-center gap-2 text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Players
                    </Link>
                </div>
            </div>
        )
    }

    // Calculate career highs directly (no useMemo needed)
    const careerHighs = {
        points: Math.max(...player.stats.map((game) => game.points)),
        rebounds: Math.max(...player.stats.map((game) => game.rebounds)),
        assists: Math.max(...player.stats.map((game) => game.assists)),
        steals: Math.max(...player.stats.map((game) => game.steals)),
        blocks: Math.max(...player.stats.map((game) => game.blocks)),
    }

    // Calculate shooting percentages directly
    const {
        field_goals_made,
        field_goals_attempted,
        three_points_made,
        three_points_attempted,
        free_throws_made,
        free_throws_attempted,
    } = player.average_stats

    const shootingPercentages = {
        fg: ((field_goals_made / field_goals_attempted) * 100).toFixed(1),
        threePoint: three_points_attempted > 0
            ? ((three_points_made / three_points_attempted) * 100).toFixed(1)
            : "0.0",
        ft: ((free_throws_made / free_throws_attempted) * 100).toFixed(1),
    }

    // Get position full name
    const getPositionName = (pos: string) => {
        const positions: Record<string, string> = {
            G: "Guard",
            F: "Forward",
            C: "Center",
            PG: "Point Guard",
            SG: "Shooting Guard",
            SF: "Small Forward",
            PF: "Power Forward",
        }
        return positions[pos] || pos
    }

    // Format date
    const formatBirthDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMMM d, yyyy")
        } catch (e) {
            console.error("Error formatting date:", e)
            return dateString
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Link href="/players" className="mb-6 flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Players
            </Link>

            {/* Hero Section */}
            <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-background border border-border">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />

                <div className="flex flex-col md:flex-row items-center p-6 md:p-8">
                    {/* Player Image */}
                    <div className="relative h-64 w-48 md:h-80 md:w-60 mb-6 md:mb-0 md:mr-8">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-lg" />
                        <Image
                            src={player.url_pic || "/placeholder.svg"}
                            alt={player.name}
                            fill
                            className="object-contain z-10"
                            priority
                        />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{player.name}</h1>
                            <div className="flex items-center justify-center md:justify-start">
                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                    {player.number}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="font-medium text-foreground">{getPositionName(player.position)}</span>
                                <span className="text-muted-foreground">•</span>
                                <span>{player.team.full_name}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Height</span>
                                <div className="flex items-center gap-1">
                                    <Ruler className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{player.height} m</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Weight</span>
                                <div className="flex items-center gap-1">
                                    <Weight className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{player.weight} kg</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Born</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{formatBirthDate(player.birth_date)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Experience</span>
                                <div className="flex items-center gap-1">
                                    <Trophy className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Veteran</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Season Averages</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard
                        title="Points"
                        value={player.average_stats.points.toFixed(1)}
                        icon={<TrendingUp className="h-5 w-5 text-primary" />}
                        isHighlight={true}
                    />
                    <StatCard
                        title="Rebounds"
                        value={player.average_stats.rebounds.toFixed(1)}
                        icon={<Activity className="h-5 w-5 text-primary" />}
                    />
                    <StatCard
                        title="Assists"
                        value={player.average_stats.assists.toFixed(1)}
                        icon={<BarChart3 className="h-5 w-5 text-primary" />}
                    />
                    <StatCard
                        title="Steals"
                        value={player.average_stats.steals.toFixed(1)}
                        icon={<Activity className="h-5 w-5 text-primary" />}
                    />
                    <StatCard
                        title="Blocks"
                        value={player.average_stats.blocks.toFixed(1)}
                        icon={<Activity className="h-5 w-5 text-primary" />}
                    />
                </div>
            </div>

            {/* Tabs for different views - This is interactive, so we use a client component */}
            <PlayerTabs
                player={player}
                careerHighs={careerHighs}
                shootingPercentages={shootingPercentages}
            />
        </div>
    )
}

// Stat Card Component - Keep this as a server component since it doesn't need interactivity
function StatCard({
    title,
    value,
    icon,
    isHighlight = false
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    isHighlight?: boolean
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border border-border",
                isHighlight && "bg-primary/5 border-primary/20",
            )}
        >
            <div className="flex items-center justify-center mb-2">{icon}</div>
            <span className={cn("text-3xl font-bold", isHighlight && "text-primary")}>{value}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{title}</span>
        </div>
    )
}

// Server-side data fetching function
async function fetchPlayer(id: string): Promise<Player | null> {
    try {
        const response = await axios.get<Player>(`${process.env.API_URL}/players/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching player data:", error);
        return null;
    }
}
