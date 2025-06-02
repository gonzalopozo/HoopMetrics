"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
    Users,
    Calendar,
    Trophy,
    Activity,
    Clock,
    Lock,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Target,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, getNBALogo } from "@/lib/utils"
import { TeamDetails } from "@/types"
import { ResponsiveContainer, AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, LineChart, Line, PieChart, Pie, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"
import axios from "axios"
import { useTheme } from "next-themes"
import { CardFooter } from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
} from "@/components/ui/chart";

function getUserRoleFromToken(): string {
    if (typeof document === "undefined") return "free"
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]
    if (!token) return "free"
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.role || "free"
    } catch {
        return "free"
    }
}

export default function TeamTabs({ team }: { team: TeamDetails }) {
    const [, setActiveTab] = useState("overview")
    const [userRole, setUserRole] = useState<string>("free")
    const [pointsVsOpponent, setPointsVsOpponent] = useState<{ date: string; points_for: number; points_against: number }[]>([])

    const isPremium = userRole === "premium" || userRole === "ultimate"
    const isUltimate = userRole === "ultimate"

    const [pointsProgression, setPointsProgression] = useState<{ date: string; points: number }[]>([])
    const [teamPointsType, setTeamPointsType] = useState<{ two_points: number; three_points: number; free_throws: number } | null>(null)
    const { resolvedTheme } = useTheme()
    const [teamRadarProfile, setTeamRadarProfile] = useState<{ points: number; rebounds: number; assists: number; steals: number; blocks: number } | null>(null)


    useEffect(() => {
        setUserRole(getUserRoleFromToken())
    }, [])

    useEffect(() => {
        if (!isPremium) return
        axios
            .get<{ date: string; points: number }[]>(
                `${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/basicstats/pointsprogression`
            )
            .then(res => setPointsProgression(res.data))
            .catch(() => setPointsProgression([]))
    }, [team.id, isPremium])

    useEffect(() => {
        if (!isPremium) return
        axios
            .get<{ date: string; points_for: number; points_against: number }[]>(
                `${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/basicstats/points_vs_opponent`
            )
            .then(res => setPointsVsOpponent(res.data))
            .catch(() => setPointsVsOpponent([]))
    }, [team.id, isPremium])

    useEffect(() => {
        if (!isPremium) return
        axios
            .get<{ two_points: number; three_points: number; free_throws: number }>(
                `${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/basicstats/pointstype`
            )
            .then(res => setTeamPointsType(res.data))
            .catch(() => setTeamPointsType(null))
    }, [team.id, isPremium])

    useEffect(() => {
        if (!isPremium) return
        axios
            .get<{ points: number; rebounds: number; assists: number; steals: number; blocks: number }>(
                `${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/basicstats/teamradar`
            )
            .then(res => setTeamRadarProfile(res.data))
            .catch(() => setTeamRadarProfile(null))
    }, [team.id, isPremium])

    // Calcular estadísticas para el resumen del gráfico
    const getPointsStats = () => {
        if (!pointsProgression.length) return { avg: 0, max: 0, consistency: 0 }
        const points = pointsProgression.map(p => p.points)
        const avg = points.reduce((sum, p) => sum + p, 0) / points.length
        const max = Math.max(...points)
        const variance = points.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / points.length
        const stdDev = Math.sqrt(variance)
        const consistency = Math.max(0, 100 - (stdDev / avg * 100))
        return {
            avg: parseFloat(avg.toFixed(1)),
            max,
            consistency: parseFloat(consistency.toFixed(0)),
        }
    }
    const pointsStats = getPointsStats()

    // Ejes dinámicos
    const maxPoints = Math.max(...pointsProgression.map(p => p.points ?? 0), 0)
    const minPoints = Math.min(...pointsProgression.map(p => p.points ?? 0), 0)
    const yMin = Math.floor(minPoints / 20) * 20  // Cambiar a múltiplos de 20
    const yMax = Math.ceil(Math.max(60, maxPoints) / 20) * 20  // Cambiar a múltiplos de 20
    const yTicks = []
    for (let i = yMin; i <= yMax; i += 20) yTicks.push(i)  // Incrementos de 20

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dateValue = payload[0].payload.date
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">
                        {new Date(dateValue).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        })}
                    </p>
                    <p className="text-base font-bold text-primary mt-1">
                        {payload[0].value} <span className="text-sm text-muted-foreground">points</span>
                    </p>
                </div>
            )
        }
        return null
    }

    // Añadir estos cálculos después de los cálculos existentes de pointsStats:
    // Calcular estadísticas para puntos a favor vs en contra
    const getPointsVsOpponentStats = () => {
        if (!pointsVsOpponent.length) return { avgFor: 0, avgAgainst: 0, differential: 0 }
        const pointsFor = pointsVsOpponent.map(p => p.points_for)
        const pointsAgainst = pointsVsOpponent.map(p => p.points_against)
        const avgFor = pointsFor.reduce((sum, p) => sum + p, 0) / pointsFor.length
        const avgAgainst = pointsAgainst.reduce((sum, p) => sum + p, 0) / pointsAgainst.length
        const differential = avgFor - avgAgainst
        return {
            avgFor: parseFloat(avgFor.toFixed(1)),
            avgAgainst: parseFloat(avgAgainst.toFixed(1)),
            differential: parseFloat(differential.toFixed(1)),
        }
    }
    const pointsVsOpponentStats = getPointsVsOpponentStats()

    // Tooltip personalizado para puntos vs oponente
    const PointsVsOpponentTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dateValue = payload[0].payload.date
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">
                        {new Date(dateValue).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        })}
                    </p>
                    <div className="space-y-1 mt-2">
                        <p className="text-sm">
                            <span className="font-bold text-primary">{payload[0].value}</span>
                            <span className="text-muted-foreground ml-1">points scored</span>
                        </p>
                        <p className="text-sm">
                            <span className="font-bold text-destructive">{payload[1]?.value}</span>
                            <span className="text-muted-foreground ml-1">points allowed</span>
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    // Pie chart data y config para el equipo
    const teamPieData = teamPointsType
        ? [
            {
                type: "2PT",
                value: teamPointsType.two_points,
                fill: resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)",
            },
            {
                type: "3PT",
                value: teamPointsType.three_points,
                fill: resolvedTheme === "dark" ? "hsl(0, 60%, 40%)" : "hsl(214, 65%, 40%)",
            },
            {
                type: "FT",
                value: teamPointsType.free_throws,
                fill: resolvedTheme === "dark" ? "hsl(0, 40%, 70%)" : "hsl(214, 90%, 80%)",
            },
        ]
        : []

    const teamPieChartConfig: ChartConfig = {
        "2PT": {
            label: "2PT",
            color: resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)",
        },
        "3PT": {
            label: "3PT",
            color: resolvedTheme === "dark" ? "hsl(0, 60%, 40%)" : "hsl(214, 65%, 40%)",
        },
        FT: {
            label: "FT",
            color: resolvedTheme === "dark" ? "hsl(0, 40%, 70%)" : "hsl(214, 90%, 80%)",
        },
        value: { label: "Points" },
    }

    // Calcular estadísticas para el perfil ofensivo del equipo
    const getTeamOffensiveProfile = () => {
        if (!teamPointsType) return { mostUsed: "-", highestPercentage: "-", totalPoints: 0 }

        const total = teamPointsType.two_points + teamPointsType.three_points + teamPointsType.free_throws
        if (!total) return { mostUsed: "-", highestPercentage: "-", totalPoints: 0 }

        const categories = [
            { label: "2PT", value: teamPointsType.two_points },
            { label: "3PT", value: teamPointsType.three_points },
            { label: "FT", value: teamPointsType.free_throws },
        ]

        const mostUsed = categories.reduce((a, b) => (a.value > b.value ? a : b))
        const highestPercentage = `${mostUsed.label} (${Math.round((mostUsed.value / total) * 100)}%)`

        return {
            mostUsed: `${mostUsed.label} (${mostUsed.value})`,
            highestPercentage,
            totalPoints: total,
        }
    }
    const teamOffensiveStats = getTeamOffensiveProfile()

    // Después de los otros datos del pie chart, agrega la configuración del radar:
    const teamRadarData = teamRadarProfile
        ? [
            { skill: "Points", value: teamRadarProfile.points, original: teamRadarProfile.points },
            { skill: "Rebounds", value: teamRadarProfile.rebounds * 2.5, original: teamRadarProfile.rebounds }, // Escalar para visualización
            { skill: "Assists", value: teamRadarProfile.assists * 4, original: teamRadarProfile.assists }, // Escalar para visualización
            { skill: "Steals", value: teamRadarProfile.steals * 12, original: teamRadarProfile.steals }, // Escalar para visualización
            { skill: "Blocks", value: teamRadarProfile.blocks * 20, original: teamRadarProfile.blocks }, // Escalar para visualización
        ]
        : []

    const teamRadarChartConfig: ChartConfig = {
        value: {
            label: "Team Stats",
            color: resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)",
        },
    }

    // Tooltip personalizado para el radar del equipo
    const TeamRadarTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const { skill, original } = payload[0].payload
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">{skill}</p>
                    <p className="text-base font-bold text-primary mt-1">
                        {original?.toFixed(1)} per game
                    </p>
                </div>
            )
        }
        return null
    }


    return (
        <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roster">Roster</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger
                    value="premium"
                    className={cn(
                        "relative",
                        !isPremium && "cursor-not-allowed opacity-60"
                    )}
                    tabIndex={0}
                    aria-disabled={!isPremium}
                    onClick={e => {
                        if (!isPremium) e.preventDefault()
                    }}
                >
                    Premium
                    {!isPremium && (
                        <span className="absolute -top-2 -right-2 text-xs text-muted-foreground">
                            <Lock className="inline h-4 w-4" />
                        </span>
                    )}
                </TabsTrigger>
                <TabsTrigger
                    value="ultimate"
                    className={cn(
                        "relative",
                        !isUltimate && "cursor-not-allowed opacity-60"
                    )}
                    tabIndex={0}
                    aria-disabled={!isUltimate}
                    onClick={e => {
                        if (!isUltimate) e.preventDefault()
                    }}
                >
                    Ultimate
                    {!isUltimate && (
                        <span className="absolute -top-2 -right-2 text-xs text-muted-foreground">
                            <Lock className="inline h-4 w-4" />
                        </span>
                    )}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
                {/* Team Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Recent Performance
                            </CardTitle>
                            <CardDescription>Last 5 games results</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {team.recent_games.slice(0, 5).map((game) => {
                                    const isHomeTeam = game.home_team_id === team.id;
                                    const currentTeamName = team.full_name;
                                    const opponentTeamName = isHomeTeam ? game.away_team_name : game.home_team_name;

                                    return (
                                        <div
                                            key={game.id}
                                            className="flex items-center justify-between rounded-lg border border-border p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-medium">{new Date(game.date).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-2">
                                                    {/* Home team */}
                                                    <div className="flex items-center">
                                                        <span className={`font-semibold ${isHomeTeam ? "text-primary" : ""} min-w-[40px] text-right`}>
                                                            {isHomeTeam ? team.abbreviation : game.rival_team_abbreviation}
                                                        </span>

                                                        <div className="flex items-center justify-center h-10 w-10 mx-1">
                                                            {isHomeTeam ? (
                                                                // Current team is home
                                                                getNBALogo(currentTeamName, { size: 40, style: { width: '100%', height: '100%' } }) || (
                                                                    <Image
                                                                        src="/placeholder.svg"
                                                                        alt={currentTeamName}
                                                                        width={40}
                                                                        height={40}
                                                                        className="object-contain"
                                                                    />
                                                                )
                                                            ) : (
                                                                // Opponent is home
                                                                getNBALogo(opponentTeamName, { size: 40, style: { width: '100%', height: '100%' } }) || (
                                                                    <Image
                                                                        src="/placeholder.svg"
                                                                        alt={opponentTeamName}
                                                                        width={40}
                                                                        height={40}
                                                                        className="object-contain"
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span className="text-muted-foreground mx-1 flex items-center">vs</span>

                                                    {/* Away team */}
                                                    <div className="flex items-center">
                                                        <div className="flex items-center justify-center h-10 w-10 mx-1">
                                                            {isHomeTeam ? (
                                                                // Opponent is away
                                                                getNBALogo(opponentTeamName, { size: 40, style: { width: '100%', height: '100%' } }) || (
                                                                    <Image
                                                                        src="/placeholder.svg"
                                                                        alt={opponentTeamName}
                                                                        width={40}
                                                                        height={40}
                                                                        className="object-contain"
                                                                    />
                                                                )
                                                            ) : (
                                                                // Current team is away
                                                                getNBALogo(currentTeamName, { size: 40, style: { width: '100%', height: '100%' } }) || (
                                                                    <Image
                                                                        src="/placeholder.svg"
                                                                        alt={currentTeamName}
                                                                        width={40}
                                                                        height={40}
                                                                        className="object-contain"
                                                                    />
                                                                )
                                                            )}
                                                        </div>
                                                        <span className={`font-semibold ${!isHomeTeam ? "text-primary" : ""} min-w-[40px] text-left`}>
                                                            {isHomeTeam ? game.rival_team_abbreviation : team.abbreviation}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="font-bold">
                                                {game.home_score} - {game.away_score}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Achievements */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-primary" />
                                Team Achievements
                            </CardTitle>
                            <CardDescription>Championships and accolades</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="rounded-lg border border-border p-4">
                                    <h3 className="text-lg font-bold mb-2">Championships</h3>
                                    {team.championships && team.championships.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {team.championships.map((year) => (
                                                <div
                                                    key={year}
                                                    className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                                                >
                                                    {year}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No championships yet</p>
                                    )}
                                </div>

                                <div className="rounded-lg border border-border p-4">
                                    <h3 className="text-lg font-bold mb-2">Team History</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Founded</span>
                                            <span className="font-medium">{team.founded}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Conference Rank</span>
                                            <span className="font-medium">#{team.stats.conference_rank}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Players */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Top Performers
                        </CardTitle>
                        <CardDescription>{`Team's leading players`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {team.players.slice(0, 4).map((player) => (
                                <Link
                                    href={`/players/${player.id}`}
                                    key={player.id}
                                    className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-accent/50 transition-colors"
                                >
                                    <Image
                                        src={player.url_pic || "/placeholder.svg"}
                                        alt={player.name}
                                        width={80}
                                        height={80}
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className="font-semibold">{player.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {player.position} • #{player.number}
                                        </div>
                                        <div className="mt-1 text-sm font-medium text-primary">{player.stats.ppg.toFixed(1)} PPG</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="roster" className="space-y-6">
                {/* Team Roster */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Roster</CardTitle>
                        <CardDescription>All players on the {team.full_name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Player</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pos</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">No.</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Height</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Weight</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">PPG</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">RPG</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">APG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.players.map((player) => (
                                        <tr key={player.id} className="border-b border-border hover:bg-accent/50">
                                            <td className="px-4 py-3">
                                                <Link href={`/players/${player.id}`} className="flex items-center gap-3 hover:text-primary">
                                                    <Image
                                                        src={player.url_pic || "/placeholder.svg"}
                                                        alt={player.name}
                                                        width={40}
                                                        height={40}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                    <span className="font-medium">{player.name}</span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-center">{player.position}</td>
                                            <td className="px-4 py-3 text-center">{player.number}</td>
                                            <td className="px-4 py-3 text-center">{player.height} m</td>
                                            <td className="px-4 py-3 text-center">{player.weight} kg</td>
                                            <td className="px-4 py-3 text-center font-medium">{player.stats.ppg.toFixed(1)}</td>
                                            <td className="px-4 py-3 text-center">{player.stats.rpg.toFixed(1)}</td>
                                            <td className="px-4 py-3 text-center">{player.stats.apg.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
                {/* Team Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Upcoming Games
                        </CardTitle>
                        <CardDescription>Next 5 games on the schedule</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {team.upcoming_games.slice(0, 5).map((game) => (
                                <div key={game.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center w-24">
                                            <div className="text-sm font-medium">{new Date(game.date).toLocaleDateString()}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(game.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="font-medium">{game.home_team_name}</div>
                                                <div className="text-xs text-muted-foreground">Home</div>
                                            </div>
                                            {/* {game.home_team_logo ? (game.home_team_logo) : (
                                                <Image
                                                    src="/placeholder.svg"
                                                    alt={game.home_team_name}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 object-contain"
                                                />
                                            )} */}
                                            <div className="text-center text-lg font-bold text-muted-foreground">VS</div>
                                            {/* {game.away_team_logo ? (game.away_team_logo) : (
                                                <Image
                                                    src="/placeholder.svg"
                                                    alt={game.away_team_name}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 object-contain"
                                                />
                                            )} */}
                                            <div className="text-left">
                                                <div className="font-medium">{game.away_team_name}</div>
                                                <div className="text-xs text-muted-foreground">Away</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium">
                                            {game.status === "scheduled" ? "Upcoming" : "Live"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Games */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Recent Games
                        </CardTitle>
                        <CardDescription>Last 5 completed games</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Matchup</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Result</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">W/L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.recent_games.slice(0, 5).map((game) => {
                                        const isHomeTeam = game.home_team_id === team.id
                                        const teamScore = isHomeTeam ? game.home_score : game.away_score
                                        const opponentScore = isHomeTeam ? game.away_score : game.home_score
                                        const opponentName = isHomeTeam ? game.away_team_name : game.home_team_name
                                        const isWin =
                                            (isHomeTeam && game.home_score > game.away_score) ||
                                            (!isHomeTeam && game.away_score > game.home_score)

                                        return (
                                            <tr key={game.id} className="border-b border-border hover:bg-accent/50">
                                                <td className="px-4 py-3">{new Date(game.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">{isHomeTeam ? `vs ${opponentName}` : `@ ${opponentName}`}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {teamScore} - {opponentScore}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2 py-0.5 text-xs font-medium",
                                                            isWin
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                                                        )}
                                                    >
                                                        {isWin ? "W" : "L"}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="premium" className={cn(!isPremium && "pointer-events-none select-none opacity-60")}>
                {isPremium ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Primer gráfico - Points Progression */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <TrendingUp className="h-5 w-5 text-primary inline mr-2" />
                                    Points Progression
                                </CardTitle>
                                <CardDescription>
                                    Evolution of points per game throughout the season
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {pointsProgression.length > 0 ? (
                                            <ReAreaChart
                                                data={pointsProgression}
                                                margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                            >
                                                {/* Reemplaza CartesianGrid con ReferenceLines individuales */}
                                                {yTicks.map(tick => (
                                                    <ReferenceLine
                                                        key={tick}
                                                        y={tick}
                                                        stroke={resolvedTheme === 'dark' ? "rgba(255, 76, 76, 0.18)" : "rgba(66, 115, 255, 0.18)"}
                                                        strokeDasharray="3 3"
                                                        ifOverflow="extendDomain"
                                                    />
                                                ))}
                                                <XAxis
                                                    dataKey="date"
                                                    tick={false}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={0}
                                                />
                                                <YAxis
                                                    dataKey="points"
                                                    tick={false}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    ticks={yTicks}
                                                    width={0}
                                                    domain={[yMin, yMax]}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area
                                                    dataKey="points"
                                                    type="monotone"
                                                    fill={resolvedTheme === "dark"
                                                        ? "rgba(255, 76, 76, 0.18)"
                                                        : "rgba(66, 115, 255, 0.18)"
                                                    }
                                                    fillOpacity={1}
                                                    stroke={resolvedTheme === "dark"
                                                        ? "hsl(0, 80%, 60%)"
                                                        : "hsl(214, 80%, 55%)"
                                                    }
                                                    strokeWidth={1.5}
                                                    dot={{
                                                        fill: resolvedTheme === "dark"
                                                            ? "hsl(0 80% 45%)"
                                                            : "hsl(214 80% 45%)",
                                                        r: 3
                                                    }}
                                                    activeDot={{
                                                        r: 5,
                                                        fill: resolvedTheme === "dark"
                                                            ? "hsl(0 80% 60%)"
                                                            : "hsl(214 80% 60%)",
                                                        stroke: "var(--background)",
                                                        strokeWidth: 1.5
                                                    }}
                                                />
                                            </ReAreaChart>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">Loading chart data...</p>
                                            </div>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name || "Team"}'s Scoring Profile`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {pointsProgression.length} games analyzed
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">PPG</p>
                                                <p className="font-bold">{pointsStats.avg}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Season High</p>
                                                <p className="font-bold">{pointsStats.max}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Consistency</p>
                                                <p className="font-bold">{pointsStats.consistency}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Segundo gráfico - Points For vs Against */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <BarChart3 className="h-5 w-5 text-primary inline mr-2" />
                                    Points For vs Against
                                </CardTitle>
                                <CardDescription>
                                    Team offense vs defense trends
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {pointsVsOpponent.length > 0 ? (
                                            <LineChart
                                                data={pointsVsOpponent}
                                                margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                            >
                                                {/* Líneas de referencia para el eje Y */}
                                                {yTicks.map(tick => (
                                                    <ReferenceLine
                                                        key={tick}
                                                        y={tick}
                                                        stroke={resolvedTheme === 'dark' ? "rgba(255, 76, 76, 0.18)" : "rgba(66, 115, 255, 0.18)"}
                                                        strokeDasharray="3 3"
                                                        ifOverflow="extendDomain"
                                                    />
                                                ))}
                                                <XAxis
                                                    dataKey="date"
                                                    tick={false}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={0}
                                                />
                                                <YAxis
                                                    tick={false}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    ticks={yTicks}
                                                    width={0}
                                                    domain={[yMin, yMax]}
                                                />
                                                <Tooltip content={<PointsVsOpponentTooltip />} />
                                                <Line
                                                    dataKey="points_for"
                                                    type="monotone"
                                                    stroke={resolvedTheme === "dark" ? "hsl(0, 80%, 60%)" : "hsl(214, 80%, 55%)"}
                                                    strokeWidth={2}
                                                    dot={{
                                                        fill: resolvedTheme === "dark" ? "hsl(0 80% 45%)" : "hsl(214 80% 45%)",
                                                        r: 3
                                                    }}
                                                    activeDot={{
                                                        r: 5,
                                                        fill: resolvedTheme === "dark" ? "hsl(0 80% 60%)" : "hsl(214 80% 60%)",
                                                        stroke: "var(--background)",
                                                        strokeWidth: 1.5
                                                    }}
                                                />
                                                <Line
                                                    dataKey="points_against"
                                                    type="monotone"
                                                    stroke={resolvedTheme === "dark" ? "hsl(0, 40%, 50%)" : "hsl(0, 60%, 50%)"}
                                                    strokeWidth={2}
                                                    dot={{
                                                        fill: resolvedTheme === "dark" ? "hsl(0 40% 40%)" : "hsl(0 60% 40%)",
                                                        r: 3
                                                    }}
                                                    activeDot={{
                                                        r: 5,
                                                        fill: resolvedTheme === "dark" ? "hsl(0 40% 50%)" : "hsl(0 60% 50%)",
                                                        stroke: "var(--background)",
                                                        strokeWidth: 1.5
                                                    }}
                                                />
                                            </LineChart>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">No data available</p>
                                            </div>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name || "Team"}'s Offensive vs Defensive Performance`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {pointsVsOpponent.length} games analyzed
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Avg. Points For</p>
                                                <p className="font-bold">{pointsVsOpponentStats.avgFor}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="h-4 w-4 text-destructive" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Avg. Points Against</p>
                                                <p className="font-bold">{pointsVsOpponentStats.avgAgainst}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Point Differential</p>
                                                <p className={cn("font-bold", pointsVsOpponentStats.differential >= 0 ? "text-primary" : "text-destructive")}>
                                                    {pointsVsOpponentStats.differential >= 0 ? "+" : ""}{pointsVsOpponentStats.differential}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Tercer gráfico - Offensive Profile */}
                        <Card className="flex flex-col">
                            <CardHeader className="items-center pb-0">
                                <CardTitle>
                                    <Activity className="h-5 w-5 text-primary inline mr-2" />
                                    Offensive Profile
                                </CardTitle>
                                <CardDescription>
                                    Points distribution by shot type
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <div style={{ width: "100%", height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {teamPieData.length > 0 ? (
                                            <PieChart>
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0]
                                                            const total = teamPointsType ?
                                                                teamPointsType.two_points + teamPointsType.three_points + teamPointsType.free_throws : 0
                                                            const percentage = total > 0 ? ((data.value as number / total) * 100).toFixed(1) : "0"

                                                            return (
                                                                <div className="rounded-lg border bg-card p-3 shadow-md">
                                                                    <p className="font-medium text-sm">{data.payload.type}</p>
                                                                    <p className="text-base font-bold text-primary mt-1">
                                                                        {data.value} points ({percentage}%)
                                                                    </p>
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    }}
                                                />
                                                <Pie
                                                    data={teamPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={90}
                                                    innerRadius={40}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    stroke="var(--background)"
                                                    strokeWidth={2}
                                                />
                                            </PieChart>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">No data available</p>
                                            </div>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name || "Team"}'s Shot Profile`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {teamOffensiveStats.totalPoints} total points
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">3PT Reliance</p>
                                                <p className="font-bold">
                                                    {teamPointsType ? Math.round((teamPointsType.three_points / (teamPointsType.two_points + teamPointsType.three_points + teamPointsType.free_throws)) * 100) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">FT Dependency</p>
                                                <p className="font-bold">
                                                    {teamPointsType ? Math.round((teamPointsType.free_throws / (teamPointsType.two_points + teamPointsType.three_points + teamPointsType.free_throws)) * 100) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Interior Focus</p>
                                                <p className="font-bold">
                                                    {teamPointsType ? Math.round((teamPointsType.two_points / (teamPointsType.two_points + teamPointsType.three_points + teamPointsType.free_throws)) * 100) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader className="items-center pb-0">
                                <CardTitle>
                                    <Target className="h-5 w-5 text-primary inline mr-2" />
                                    Team Profile
                                </CardTitle>
                                <CardDescription>
                                    Average performance per game across key categories
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <ChartContainer
                                    config={teamRadarChartConfig}
                                    className="mx-auto aspect-square max-h-[340px] w-full flex items-center justify-center"
                                >
                                    {teamRadarData.length > 0 ? (
                                        <RadarChart
                                            data={teamRadarData}
                                            width={360}
                                            height={340}
                                            margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
                                        >
                                            <PolarAngleAxis
                                                dataKey="skill"
                                                tick={{
                                                    fontSize: 14,
                                                    fill: "var(--foreground)",
                                                    dy: 8,
                                                }}
                                                tickLine={false}
                                                radius={110}
                                            />
                                            <PolarRadiusAxis domain={[0, 120]} angle={90} tick={false} />
                                            <PolarGrid />
                                            <Radar
                                                dataKey="value"
                                                fill={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                fillOpacity={0.6}
                                                stroke={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                dot={{ r: 4, fillOpacity: 1 }}
                                            />
                                            <Tooltip content={<TeamRadarTooltip />} />
                                        </RadarChart>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-muted-foreground">No radar data available</p>
                                        </div>
                                    )}
                                </ChartContainer>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name || "Team"}'s Statistical Profile`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {teamRadarProfile ? "Per-game averages" : "No data"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Strongest Area</p>
                                                <p className="font-bold">
                                                    {teamRadarProfile
                                                        ? (() => {
                                                            const stats = [
                                                                { label: "Points", value: teamRadarProfile.points },
                                                                { label: "Rebounds", value: teamRadarProfile.rebounds },
                                                                { label: "Assists", value: teamRadarProfile.assists },
                                                                { label: "Steals", value: teamRadarProfile.steals },
                                                                { label: "Blocks", value: teamRadarProfile.blocks },
                                                            ]
                                                            const max = stats.reduce((a, b) => (a.value > b.value ? a : b))
                                                            return `${max.label} (${max.value.toFixed(1)})`
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Balanced Score</p>
                                                <p className="font-bold">
                                                    {teamRadarProfile
                                                        ? (() => {
                                                            const stats = [teamRadarProfile.points, teamRadarProfile.rebounds, teamRadarProfile.assists, teamRadarProfile.steals, teamRadarProfile.blocks]
                                                            const avg = stats.reduce((sum, stat) => sum + stat, 0) / stats.length
                                                            const variance = stats.reduce((sum, stat) => sum + Math.pow(stat - avg, 2), 0) / stats.length
                                                            const balance = Math.max(0, 100 - Math.sqrt(variance))
                                                            return `${balance.toFixed(0)}%`
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total Impact</p>
                                                <p className="font-bold">
                                                    {teamRadarProfile
                                                        ? (teamRadarProfile.points + teamRadarProfile.rebounds + teamRadarProfile.assists + teamRadarProfile.steals + teamRadarProfile.blocks).toFixed(1)
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                        <p className="text-muted-foreground mb-4 text-center max-w-xs">
                            Upgrade to Premium or Ultimate to unlock advanced analytics and visualizations for this team.
                        </p>
                        <a
                            href="/upgrade"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                        >
                            Upgrade Now
                        </a>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="ultimate" className={cn(!isUltimate && "pointer-events-none select-none opacity-60")}>
                {isUltimate ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        {/* Aquí va el contenido ultimate para equipos */}
                        <h3 className="text-lg font-semibold mb-2">Ultimate Team Analytics</h3>
                        <p className="text-muted-foreground mb-4 text-center max-w-xs">
                            Aquí puedes mostrar las visualizaciones y métricas más avanzadas solo para usuarios Ultimate.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Ultimate Feature</h3>
                        <p className="text-muted-foreground mb-4 text-center max-w-xs">
                            Upgrade to Ultimate to unlock the most advanced analytics and visualizations for this team.
                        </p>
                        <a
                            href="/upgrade"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                        >
                            Upgrade Now
                        </a>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}