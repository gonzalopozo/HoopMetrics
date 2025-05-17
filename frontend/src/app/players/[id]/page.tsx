"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Ruler, Weight, Trophy, TrendingUp, Activity, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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

export default function PlayerDetailPage({ params }: { params: { id: string } }) {
    const [player, setPlayer] = useState<Player | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null)

    // Fetch player data
    useEffect(() => {
        const fetchPlayer = async () => {
            try {
                // In a real app, this would be an API call
                // For demo purposes, we'll simulate a delay
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Fetch from your API endpoint
                const response = await fetch(`http://localhost:8000/players/${params.id}`)
                const data = await response.json()
                setPlayer(data)
            } catch (error) {
                console.error("Error fetching player data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPlayer()
    }, [params.id])

    // Calculate career highs
    const careerHighs = useMemo(() => {
        if (!player?.stats) return null

        return {
            points: Math.max(...player.stats.map((game) => game.points)),
            rebounds: Math.max(...player.stats.map((game) => game.rebounds)),
            assists: Math.max(...player.stats.map((game) => game.assists)),
            steals: Math.max(...player.stats.map((game) => game.steals)),
            blocks: Math.max(...player.stats.map((game) => game.blocks)),
        }
    }, [player?.stats])

    // Calculate shooting percentages
    const shootingPercentages = useMemo(() => {
        if (!player?.average_stats) return null

        const {
            field_goals_made,
            field_goals_attempted,
            three_points_made,
            three_points_attempted,
            free_throws_made,
            free_throws_attempted,
        } = player.average_stats

        return {
            fg: ((field_goals_made / field_goals_attempted) * 100).toFixed(1),
            threePoint: three_points_attempted > 0 ? ((three_points_made / three_points_attempted) * 100).toFixed(1) : "0.0",
            ft: ((free_throws_made / free_throws_attempted) * 100).toFixed(1),
        }
    }, [player?.average_stats])

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
            return dateString
        }
    }

    if (loading) {
        return <PlayerDetailSkeleton />
    }

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

            {/* Tabs for different views */}
            <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="shooting">Shooting</TabsTrigger>
                    <TabsTrigger value="gamelog">Game Log</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Career Highs */}
                    {careerHighs && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-primary" />
                                    Career Highs
                                </CardTitle>
                                <CardDescription>Best performances in each statistical category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="flex flex-col items-center p-4 rounded-lg bg-accent">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Points</span>
                                        <span className="text-3xl font-bold text-primary">{careerHighs.points}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 rounded-lg bg-accent">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Rebounds</span>
                                        <span className="text-3xl font-bold text-primary">{careerHighs.rebounds}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 rounded-lg bg-accent">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Assists</span>
                                        <span className="text-3xl font-bold text-primary">{careerHighs.assists}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 rounded-lg bg-accent">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Steals</span>
                                        <span className="text-3xl font-bold text-primary">{careerHighs.steals}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 rounded-lg bg-accent">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Blocks</span>
                                        <span className="text-3xl font-bold text-primary">{careerHighs.blocks}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Efficiency Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Efficiency Metrics
                            </CardTitle>
                            <CardDescription>Advanced statistics and efficiency ratings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Minutes Per Game */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Minutes Per Game</span>
                                        <span className="font-medium">{player.average_stats.minutes_played.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${(player.average_stats.minutes_played / 48) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Field Goal % */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Field Goal %</span>
                                        <span className="font-medium">{shootingPercentages?.fg}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${Number(shootingPercentages?.fg)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Free Throw % */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Free Throw %</span>
                                        <span className="font-medium">{shootingPercentages?.ft}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${Number(shootingPercentages?.ft)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shooting" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shooting Breakdown</CardTitle>
                            <CardDescription>Detailed shooting statistics and percentages</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {/* Field Goals */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Field Goals</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Made-Attempted</span>
                                                <span className="font-medium">
                                                    {player.average_stats.field_goals_made.toFixed(1)}-
                                                    {player.average_stats.field_goals_attempted.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-accent rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{
                                                        width: `${(player.average_stats.field_goals_made / player.average_stats.field_goals_attempted) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
                                            <span className="text-lg font-bold">{shootingPercentages?.fg}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Three Pointers */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Three Pointers</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Made-Attempted</span>
                                                <span className="font-medium">
                                                    {player.average_stats.three_points_made.toFixed(1)}-
                                                    {player.average_stats.three_points_attempted.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-accent rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{
                                                        width:
                                                            player.average_stats.three_points_attempted > 0
                                                                ? `${(player.average_stats.three_points_made / player.average_stats.three_points_attempted) * 100}%`
                                                                : "0%",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
                                            <span className="text-lg font-bold">{shootingPercentages?.threePoint}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Free Throws */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Free Throws</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Made-Attempted</span>
                                                <span className="font-medium">
                                                    {player.average_stats.free_throws_made.toFixed(1)}-
                                                    {player.average_stats.free_throws_attempted.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-accent rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{
                                                        width: `${(player.average_stats.free_throws_made / player.average_stats.free_throws_attempted) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
                                            <span className="text-lg font-bold">{shootingPercentages?.ft}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gamelog" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Game Log</CardTitle>
                            <CardDescription>Recent game performances and statistics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Game</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">PTS</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">REB</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">AST</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">STL</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">BLK</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">MIN</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">FG</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">3PT</th>
                                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">FT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {player.stats.slice(0, 10).map((game, index) => (
                                            <tr
                                                key={index}
                                                className={cn(
                                                    "border-b border-border hover:bg-accent/50 cursor-pointer transition-colors",
                                                    selectedGameIndex === index && "bg-accent",
                                                )}
                                                onClick={() => setSelectedGameIndex(index === selectedGameIndex ? null : index)}
                                            >
                                                <td className="px-4 py-3 font-medium">Game {player.stats.length - index}</td>
                                                <td
                                                    className={cn(
                                                        "px-4 py-3 text-center",
                                                        game.points > player.average_stats.points && "text-primary font-medium",
                                                    )}
                                                >
                                                    {game.points}
                                                </td>
                                                <td
                                                    className={cn(
                                                        "px-4 py-3 text-center",
                                                        game.rebounds > player.average_stats.rebounds && "text-primary font-medium",
                                                    )}
                                                >
                                                    {game.rebounds}
                                                </td>
                                                <td
                                                    className={cn(
                                                        "px-4 py-3 text-center",
                                                        game.assists > player.average_stats.assists && "text-primary font-medium",
                                                    )}
                                                >
                                                    {game.assists}
                                                </td>
                                                <td
                                                    className={cn(
                                                        "px-4 py-3 text-center",
                                                        game.steals > player.average_stats.steals && "text-primary font-medium",
                                                    )}
                                                >
                                                    {game.steals}
                                                </td>
                                                <td
                                                    className={cn(
                                                        "px-4 py-3 text-center",
                                                        game.blocks > player.average_stats.blocks && "text-primary font-medium",
                                                    )}
                                                >
                                                    {game.blocks}
                                                </td>
                                                <td className="px-4 py-3 text-center">{game.minutes_played}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {game.field_goals_made}-{game.field_goals_attempted}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {game.three_points_made}-{game.three_points_attempted}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {game.free_throws_made}-{game.free_throws_attempted}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {selectedGameIndex !== null && (
                                <div className="mt-6 p-4 rounded-lg bg-accent">
                                    <h4 className="text-lg font-medium mb-3">
                                        Game {player.stats.length - selectedGameIndex} Highlights
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Points</span>
                                            <span className="text-2xl font-bold text-primary">{player.stats[selectedGameIndex].points}</span>
                                        </div>
                                        <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Rebounds</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {player.stats[selectedGameIndex].rebounds}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Assists</span>
                                            <span className="text-2xl font-bold text-primary">{player.stats[selectedGameIndex].assists}</span>
                                        </div>
                                        <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Minutes</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {player.stats[selectedGameIndex].minutes_played}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// Stat Card Component
function StatCard({ title, value, icon, isHighlight = false }) {
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

// Loading Skeleton
function PlayerDetailSkeleton() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Skeleton className="h-6 w-32" />
            </div>

            {/* Hero Section Skeleton */}
            <div className="relative mb-8 overflow-hidden rounded-xl border border-border p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center">
                    {/* Player Image Skeleton */}
                    <Skeleton className="h-64 w-48 md:h-80 md:w-60 mb-6 md:mb-0 md:mr-8" />

                    {/* Player Info Skeleton */}
                    <div className="flex-1 w-full">
                        <Skeleton className="h-10 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2 mb-6" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mb-8">
                <Skeleton className="h-10 w-full max-w-md mb-4" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
}
