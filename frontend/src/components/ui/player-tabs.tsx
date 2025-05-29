"use client"

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Trophy, BarChart3, Lock } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps, ResponsiveContainer, ReferenceArea } from "recharts"

import axios from "axios"
import { useTheme } from "next-themes"

interface PlayerStats {
    minutes_played: number;
    field_goals_made: number;
    field_goals_attempted: number;
    three_points_made: number;
    three_points_attempted: number;
    free_throws_made: number;
    free_throws_attempted: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
}

interface Player {
    id: number;
    average_stats: PlayerStats;
    stats: PlayerStats[];
}

interface CareerHighs {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
}

interface ShootingPercentages {
    fg: string | number;
    threePoint: string | number;
    ft: string | number;
}

interface PointsProgression {
    date: string;
    points: number;
}

interface PlayerTabsProps {
    player: Player;
    careerHighs: CareerHighs;
    shootingPercentages: ShootingPercentages;
}

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

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
    if (active && payload && payload.length) {
        const { date, points } = payload[0].payload
        return (
            <div
                className="rounded-lg border border-border p-3 shadow-lg min-w-[120px]"
                style={{
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                }}
            >
                <div className="text-xs text-muted-foreground mb-1">
                    {new Date(date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    })}
                </div>
                <div className="font-bold text-lg text-primary">{points} points</div>
            </div>
        )
    }
    return null
}

export default function PlayerTabs({ player, careerHighs, shootingPercentages }: PlayerTabsProps) {
    const [, setActiveTab] = useState("overview")
    const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null)
    const [userRole, setUserRole] = useState<string>("free")
    const [pointsProgression, setPointsProgression] = useState<PointsProgression[]>([])
    const { resolvedTheme } = useTheme()
    const isPremium = userRole === "premium" || userRole === "ultimate"
    const isUltimate = userRole === "ultimate"

    useEffect(() => {
        setUserRole(getUserRoleFromToken())
    }, [])

    // Fetch points progression for premium tab
    useEffect(() => {
        async function fetchPointsProgression() {
            try {
                const res = await axios.get<PointsProgression[]>(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/basicstats/pointsprogression`
                )
                setPointsProgression(res.data)
            } catch (e) {
                console.error("Error fetching points progression:", e)
                setPointsProgression([])
            }
        }
        if (isPremium) fetchPointsProgression()
    }, [player.id, isPremium])

    // Colores según tema
    const lineColor =
        resolvedTheme === "dark"
            ? "#f83c3c" // rojo NBA
            : "#4273ff" // azul NBA
    const dotColor = lineColor

    // Agrupa los partidos por mes para la barra de meses
    const monthsData = useMemo(() => {
        const months: { key: string, label: string, count: number }[] = []
        // let lastKey = ""
        pointsProgression.forEach(({ date }) => {
            const d = new Date(date)
            const key = `${d.getFullYear()}-${d.getMonth()}`
            if (months.length === 0 || months[months.length - 1].key !== key) {
                months.push({
                    key,
                    label: d.toLocaleDateString("es-ES", { month: "long" }),
                    count: 1,
                })
            } else {
                months[months.length - 1].count += 1
            }
            // lastKey = key
        })
        return months
    }, [pointsProgression])

    return (
        <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="shooting">Shooting</TabsTrigger>
                <TabsTrigger value="gamelog">Game Log</TabsTrigger>
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
                {/* Career Highs */}
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

                {/* Efficiency Metrics */}
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
                                                    width: player.average_stats.field_goals_attempted > 0
                                                        ? `${(player.average_stats.field_goals_made / player.average_stats.field_goals_attempted) * 100}%`
                                                        : "0%",
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
                                                    width: player.average_stats.free_throws_attempted > 0
                                                        ? `${(player.average_stats.free_throws_made / player.average_stats.free_throws_attempted) * 100}%`
                                                        : "0%",
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
                                                selectedGameIndex === index && "bg-accent"
                                            )}
                                            onClick={() => setSelectedGameIndex(index === selectedGameIndex ? null : index)}
                                        >
                                            <td className="px-4 py-3 font-medium">Game {player.stats.length - index}</td>
                                            <td
                                                className={cn(
                                                    "px-4 py-3 text-center",
                                                    game.points > player.average_stats.points && "text-primary font-medium"
                                                )}
                                            >
                                                {game.points}
                                            </td>
                                            <td
                                                className={cn(
                                                    "px-4 py-3 text-center",
                                                    game.rebounds > player.average_stats.rebounds && "text-primary font-medium"
                                                )}
                                            >
                                                {game.rebounds}
                                            </td>
                                            <td
                                                className={cn(
                                                    "px-4 py-3 text-center",
                                                    game.assists > player.average_stats.assists && "text-primary font-medium"
                                                )}
                                            >
                                                {game.assists}
                                            </td>
                                            <td
                                                className={cn(
                                                    "px-4 py-3 text-center",
                                                    game.steals > player.average_stats.steals && "text-primary font-medium"
                                                )}
                                            >
                                                {game.steals}
                                            </td>
                                            <td
                                                className={cn(
                                                    "px-4 py-3 text-center",
                                                    game.blocks > player.average_stats.blocks && "text-primary font-medium"
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

            <TabsContent value="premium" className={cn(!isPremium && "pointer-events-none select-none opacity-60")}>
                {isPremium ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Points Progression</CardTitle>
                                <CardDescription>
                                    Evolución de puntos por partido (Line Chart)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 300, position: "relative" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={pointsProgression}
                                            margin={{ left: 24, right: 12, top: 16, bottom: 32 }}
                                        >
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                type="category"
                                                tickFormatter={date => {
                                                    const d = new Date(date)
                                                    return d.toLocaleDateString("es-ES", { day: "2-digit" })
                                                }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                            />
                                            <YAxis
                                                domain={[
                                                    (dataMin: number) => Math.floor(dataMin / 10) * 10,
                                                    (dataMax: number) => Math.ceil(dataMax / 10) * 10
                                                ]}
                                                tickCount={5}
                                                tickFormatter={v => `${v}`}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            
                                            {/* Áreas de referencia para los meses */}
                                            {monthsData.map((month, index) => {
                                                // Encuentra el primer y último partido del mes
                                                const firstDate = pointsProgression.find(p => {
                                                    const d = new Date(p.date)
                                                    return `${d.getFullYear()}-${d.getMonth()}` === month.key
                                                })?.date
                                                
                                                const lastDate = [...pointsProgression].reverse().find(p => {
                                                    const d = new Date(p.date)
                                                    return `${d.getFullYear()}-${d.getMonth()}` === month.key
                                                })?.date
                                                
                                                if (!firstDate || !lastDate) return null
                                                
                                                // Alterna colores para mejor visibilidad
                                                const fillColor = index % 2 === 0 
                                                    ? "var(--accent)" 
                                                    : "var(--background)"
                                                    
                                                return (
                                                    <ReferenceArea 
                                                        key={month.key}
                                                        x1={firstDate} 
                                                        x2={lastDate}
                                                        fillOpacity={0.1}
                                                        fill={fillColor}
                                                        label={{
                                                            value: month.label,
                                                            position: "insideBottom",
                                                            offset: 10,
                                                            fontSize: 12,
                                                            fill: "var(--muted-foreground)"
                                                        }}
                                                    />
                                                )
                                            })}
                                            
                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ stroke: lineColor, strokeDasharray: "3 3" }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="points"
                                                stroke={lineColor}
                                                strokeWidth={2}
                                                dot={{ fill: dotColor }}
                                                activeDot={{ r: 6, fill: dotColor, stroke: lineColor, strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Barra de meses personalizada alineada con el gráfico */}
                                <div
                                    style={{
                                        display: "flex",
                                        width: "100%",
                                        marginTop: 0,
                                        marginLeft: 0,
                                        marginRight: 0,
                                        position: "relative",
                                        zIndex: 1,
                                        userSelect: "none",
                                    }}
                                >
                                    {monthsData.map((month, idx) => (
                                        <div
                                            key={month.key}
                                            style={{
                                                flex: month.count,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "flex-start",
                                                borderLeft: idx === 0 ? "none" : "1px solid var(--border)",
                                                minWidth: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    color: "var(--muted-foreground)",
                                                    fontWeight: 500,
                                                    textTransform: "capitalize",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {month.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                        <p className="text-muted-foreground mb-4 text-center max-w-xs">
                            Upgrade to Premium or Ultimate to unlock advanced analytics and visualizations for this player.
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* <Card>
                            <CardHeader>
                                <CardTitle>Advanced Efficiency</CardTitle>
                                <CardDescription>PER, Usage, TS%, PIE</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <BarChart data={advancedBarData} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>VORP by Game</CardTitle>
                                <CardDescription>Value Over Replacement Player (last 5 games)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LineChart
                                    data={advancedLineData.map(d => ({ game: d.game, points: d.vorp }))}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Play Type Distribution</CardTitle>
                                <CardDescription>Offensive play types (sample)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PieChart data={advancedPieData} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Advanced Impact Radar</CardTitle>
                                <CardDescription>Composite advanced metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadarChart data={advancedRadarData} />
                            </CardContent>
                        </Card> */}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Lock className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Ultimate Feature</h3>
                        <p className="text-muted-foreground mb-4 text-center max-w-xs">
                            Upgrade to Ultimate to unlock the most advanced analytics and visualizations for this player.
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