"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Trophy, BarChart3, Lock, TrendingUp, Target } from "lucide-react"
import { LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps, YAxis } from "recharts"
import axios from "axios"
import { useTheme } from "next-themes"

// Añadir este import para el tooltip personalizado
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

// Añade el componente CustomTooltip para personalizar la apariencia del tooltip
const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
        // Obtiene la fecha directamente del payload para asegurar que sea la correcta
        const dateValue = payload[0].payload.date;
        
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
        );
    }
    return null;
};

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
    name: string; // Added name property
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

export default function PlayerTabs({ player, careerHighs, shootingPercentages }: PlayerTabsProps) {
    const [, setActiveTab] = useState("overview")
    const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null)
    const [userRole, setUserRole] = useState<string>("free")
    const [pointsProgression, setPointsProgression] = useState<PointsProgression[]>([])
    const isPremium = userRole === "premium" || userRole === "ultimate"
    const isUltimate = userRole === "ultimate"
    const { resolvedTheme } = useTheme()

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

    // Calcular estadísticas para el resumen del gráfico
    const getPointsStats = () => {
        if (!pointsProgression.length) return { avg: 0, max: 0, consistency: 0 };

        const points = pointsProgression.map(p => p.points);
        const avg = points.reduce((sum, p) => sum + p, 0) / points.length;
        const max = Math.max(...points);

        // Calcular consistencia (menor desviación estándar = mayor consistencia)
        const variance = points.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / points.length;
        const stdDev = Math.sqrt(variance);
        const consistency = Math.max(0, 100 - (stdDev / avg * 100));

        return {
            avg: parseFloat(avg.toFixed(1)),
            max,
            consistency: parseFloat(consistency.toFixed(0))
        };
    };

    const pointsStats = getPointsStats();

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
                                    Evolución de puntos por partido a lo largo de la temporada
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            accessibilityLayer
                                            data={pointsProgression}
                                            margin={{ left: 12, right: 12 }}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                horizontal={true}
                                                strokeDasharray="3 3"
                                                stroke={resolvedTheme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                                            />
                                            {/* Añade YAxis para controlar las líneas horizontales cada 10 unidades */}
                                            <YAxis 
                                                tickLine={false}
                                                axisLine={false}
                                                tick={false} // Oculta los números
                                                ticks={[0, 10, 20, 30, 40, 50, 60]} // Incrementos de 10 en 10
                                                domain={[0, 'dataMax + 5']} // Asegura que hay espacio arriba del valor máximo
                                            />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "3 3" }}
                                            />
                                            <Line
                                                dataKey="points"
                                                type="monotone"
                                                stroke={resolvedTheme === 'dark' ? "hsl(0 80% 45%)" : "hsl(214 80% 45%)"}
                                                strokeWidth={2}
                                                dot={{
                                                    fill: resolvedTheme === 'dark' ? "hsl(0 80% 45%)" : "hsl(214 80% 45%)",
                                                    r: 3 // Puntos más pequeños (antes 4)
                                                }}
                                                activeDot={{
                                                    r: 5, // Puntos activos más pequeños (antes 7)
                                                    fill: resolvedTheme === 'dark' ? "hsl(0 80% 60%)" : "hsl(214 80% 60%)",
                                                    stroke: "var(--background)",
                                                    strokeWidth: 1.5
                                                }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${player.name || "Player"}'s Scoring Profile`}
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
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Consistency</p>
                                                <p className="font-bold">{pointsStats.consistency}%</p>
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