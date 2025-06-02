"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Trophy, BarChart3, Lock, TrendingUp, Target } from "lucide-react"
import { LineChart, Line, Tooltip, ResponsiveContainer, TooltipProps, YAxis, ReferenceLine } from "recharts"
import axios from "axios"
import { useTheme } from "next-themes"
import { Pie, PieChart as RePieChart } from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";
import { RadarChart as ReRadarChart, Radar, PolarAngleAxis, PolarGrid, PolarRadiusAxis } from "recharts"
import { BarChart as ReBarChart, Bar, XAxis, CartesianGrid, LabelList, Tooltip as BarTooltip, } from "recharts";
import { AreaChart as ReAreaChart, Area, Tooltip as AreaTooltip } from "recharts";
import { RadialBarChart, RadialBar, Tooltip as RadialTooltip } from "recharts";


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
    const [pointsType, setPointsType] = useState<{ two_points: number; three_points: number; free_throws: number } | null>(null);
    const [skillProfile, setSkillProfile] = useState<{
        points: number
        rebounds: number
        assists: number
        steals: number
        blocks: number
    } | null>(null);
    const [barCompareData, setBarCompareData] = useState<{ name: string; value: number }[]>([]);
    const [minutesProgression, setMinutesProgression] = useState<{ date: string; minutes: number }[]>([]);
    const [participationRates, setParticipationRates] = useState<{ label: string; value: number }[]>([]);

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

    // Hook para la distribución de puntos por tipo de tiro
    useEffect(() => {
        async function fetchPointsType() {
            try {
                const res = await axios.get<{ two_points: number; three_points: number; free_throws: number }>(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/basicstats/pointstype`
                );
                setPointsType(res.data);
            } catch (e) {
                console.error("Error fetching points type:", e);
                setPointsType(null);
            }
        }
        if (isPremium) fetchPointsType();
    }, [player.id, isPremium]);

    // Fetch skill profile for premium tab
    useEffect(() => {
        async function fetchSkillProfile() {
            try {
                const res = await axios.get<{ points: number; rebounds: number; assists: number; steals: number; blocks: number }>(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/basicstats/skillprofile`
                );
                setSkillProfile(res.data);
            } catch (e) {
                console.error("Error fetching skill profile:", e);
                setSkillProfile(null);
            }
        }
        if (isPremium) fetchSkillProfile();
    }, [player.id, isPremium]);

    // Fetch bar chart comparison data for premium tab
    useEffect(() => {
        async function fetchBarCompare() {
            try {
                const res = await axios.get<{ name: string; value: number }[]>(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/basicstats/barcompare`
                );
                setBarCompareData(res.data);
            } catch (e) {
                setBarCompareData([]);
            }
        }
        if (isPremium) fetchBarCompare();
    }, [player.id, isPremium]);

    useEffect(() => {
        async function fetchMinutesProgression() {
            try {
                const res = await axios.get<{ date: string; minutes: number }[]>(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/basicstats/minutesprogression`
                );
                setMinutesProgression(res.data);
            } catch (e) {
                setMinutesProgression([]);
            }
        }
        if (isPremium) fetchMinutesProgression();
    }, [player.id, isPremium]);
    useEffect(() => {
        async function fetchParticipationRates() {
            try {
                const res = await axios.get<{ label: string; value: number }[]>(
                    `${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/basicstats/participationrates`
                );
                setParticipationRates(res.data);
            } catch (e) {
                setParticipationRates([]);
            }
        }
        if (isPremium) fetchParticipationRates();
    }, [player.id, isPremium]);

    const areaChartConfig: ChartConfig = {
        minutes: {
            label: "Minutes",
            color: resolvedTheme === "dark"
                ? "hsl(43, 74%, 66%)"
                : "hsl(43, 74%, 66%)",
        },
    };
    const radialChartConfig: ChartConfig = {
        value: {
            label: "Participation %",
            color: resolvedTheme === "dark"
                ? "hsl(0, 80%, 60%)"
                : "hsl(214, 80%, 55%)",
        },
    };

    const radialColors = [
        resolvedTheme === "dark" ? "#ff4c4c" : "#4273ff",
        resolvedTheme === "dark" ? "#ff7b7b" : "#6ea8ff",
        resolvedTheme === "dark" ? "#ffb3b3" : "#a3c9ff",
        resolvedTheme === "dark" ? "#ffdddd" : "#d6e6ff",
        resolvedTheme === "dark" ? "#ff2e2e" : "#1e40af",
    ];

    // Modificar el tooltip para mostrar los valores totales (no porcentajes)
    const ParticipationTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
        if (active && payload && payload.length) {
            const { label, value } = payload[0].payload;
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-base font-bold text-primary mt-1">
                        {value} / 85 games
                    </p>
                </div>
            );
        }
        return null;
    };

    const MinutesAreaTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
        if (active && payload && payload.length) {
            const { date, minutes } = payload[0].payload;
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">
                        {new Date(date).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        })}
                    </p>
                    <p className="text-base font-bold text-primary mt-1">
                        {minutes} <span className="text-sm text-muted-foreground">min</span>
                    </p>
                </div>
            );
        }
        return null;
    };

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

    // Calcula el máximo de puntos para ajustar el grid dinámicamente
    const maxPoints = Math.max(...pointsProgression.map(p => p.points ?? 0), 0);
    const minPoints = Math.min(...pointsProgression.map(p => p.points ?? 0), 0);
    const yMin = Math.floor(minPoints / 10) * 10;
    const yMax = Math.ceil(Math.max(60, maxPoints) / 10) * 10;
    const yTicks = [];
    for (let i = yMin; i <= yMax; i += 10) yTicks.push(i);

    // Pie chart data y config adaptados a tema con tonos más legibles
    const pieData = pointsType
        ? [
            {
                type: "2PT",
                value: pointsType.two_points,
                fill:
                    resolvedTheme === "dark"
                        ? "hsl(0, 80%, 50%)"      // Rojo vivo (principal dark)
                        : "hsl(214, 80%, 55%)",  // Azul vivo (principal light)
            },
            {
                type: "3PT",
                value: pointsType.three_points,
                fill:
                    resolvedTheme === "dark"
                        ? "hsl(0, 60%, 40%)"      // Rojo más oscuro, mejor contraste dark
                        : "hsl(214, 65%, 40%)",   // Azul más oscuro, mejor contraste light
            },
            {
                type: "FT",
                value: pointsType.free_throws,
                fill:
                    resolvedTheme === "dark"
                        ? "hsl(0, 40%, 70%)"      // Rojo claro, buen contraste dark
                        : "hsl(214, 90%, 80%)",   // Azul claro, buen contraste light
            },
        ]
        : [];

    const pieChartConfig: ChartConfig = {
        "2PT": {
            label: "2PT",
            color:
                resolvedTheme === "dark"
                    ? "hsl(0, 80%, 50%)"
                    : "hsl(214, 80%, 55%)",
        },
        "3PT": {
            label: "3PT",
            color:
                resolvedTheme === "dark"
                    ? "hsl(0, 60%, 40%)"
                    : "hsl(214, 65%, 40%)",
        },
        FT: {
            label: "FT",
            color:
                resolvedTheme === "dark"
                    ? "hsl(0, 40%, 70%)"
                    : "hsl(214, 90%, 80%)",
        },
        value: { label: "Points" },
    };

    // Radar chart data/config adaptados a tema y estructura shadcn
    const radarData = skillProfile
        ? [
            { skill: "Points", value: skillProfile.points, original: skillProfile.points },
            { skill: "Rebounds", value: skillProfile.rebounds * 2, original: skillProfile.rebounds },
            { skill: "Assists", value: skillProfile.assists * (40 / 15), original: skillProfile.assists },
            { skill: "Steals", value: skillProfile.steals * 10, original: skillProfile.steals },
            { skill: "Blocks", value: skillProfile.blocks * (40 / 6), original: skillProfile.blocks },
        ]
        : [];

    const radarChartConfig: ChartConfig = {
        value: {
            label: "Skill",
            color: resolvedTheme === "dark"
                ? "hsl(0, 80%, 50%)"
                : "hsl(214, 80%, 55%)",
        },
    };

    // Bar chart config for Stat Comparison
    const barChartConfig: ChartConfig = {
        value: {
            label: "Stat",
            color: resolvedTheme === "dark"
                ? "hsl(0, 80%, 50%)"
                : "hsl(214, 80%, 55%)",
        },
    };

    // Tooltip personalizado para RadarChart
    const RadarTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
        if (active && payload && payload.length) {
            const { skill, original } = payload[0].payload;
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">{skill}</p>
                    <p className="text-base font-bold text-primary mt-1">
                        {original?.toFixed(1)}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Tooltip para BarChart
    const BarChartTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0].payload;
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-base font-bold text-primary mt-1">
                        {value}
                    </p>
                </div>
            );
        }
        return null;
    };

    const participationMax = {
        "Games Played": 85,
        "20+ Points": 85,
        "Double-Doubles": 85,
        "3PT Made": 85,
    };

    // Ordena de mayor a menor máximo (más adentro los de mayor máximo)
    const sortedParticipation = [...participationRates]
        .map(d => {
            const max = participationMax[d.label as keyof typeof participationMax] || 85;
            return {
                ...d,
                max,
                percent: Math.min((d.value / max) * 100, 100), // Calculate percentage based on max value
            };
        })
        .sort((a, b) => b.max - a.max);

    const baseInner = 40;
    const barWidth = 18;
    const radialData = sortedParticipation.map((d, i) => ({
        ...d,
        innerRadius: baseInner + i * barWidth,
        outerRadius: baseInner + (i + 1) * barWidth - 4,
        fill: radialColors[i % radialColors.length],
    }));

    // Escalado para el bar chart (máximo visual = 100 para todas las barras)
    const barChartMax = 100;
    const barChartScales = {
        MIN: 48,
        FGA: 40,
        FGM: 20,
        "3PA": 14,
        "3PM": 6,
        FTA: 18,
        FTM: 11,
        TO: 5,
        PF: 5,
    };

    const barCompareDataScaled = barCompareData.map(d => ({
        ...d,
        scaled: barChartScales[d.name]
            ? Math.min((d.value / barChartScales[d.name]) * barChartMax, barChartMax)
            : d.value,
        original: d.value,
    }));

    // Modificar los datos para escalar respecto al máximo de 85
    const scaledParticipationData = [
        ...participationRates.map((d, i) => ({
            ...d,
            scaledValue: (d.value / 85) * 100, // Escala respecto al máximo de 85
            fill: radialColors[i % radialColors.length],
        })),
        // Añadir valor de referencia oculto para ajustar el máximo
        {
            label: "", // Sin label para que no se muestre
            value: 85,
            scaledValue: 100, // 100% del máximo
            fill: "transparent", // Transparente para que no se vea
            opacity: 0, // Completamente invisible
        }
    ];

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
                        {/* Gráfico de línea de progresión de puntos */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Points Progression</CardTitle>
                                <CardDescription>
                                    Evolution of points per game throughout the season
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            accessibilityLayer
                                            data={pointsProgression.length ? pointsProgression : [{ date: "", points: 0 }]}
                                            margin={{ left: 12, right: 12 }}
                                        >
                                            {/* Reemplaza las líneas SVG manuales con ReferenceLines */}
                                            {yTicks.map(tick => (
                                                <ReferenceLine
                                                    key={tick}
                                                    y={tick}
                                                    stroke={resolvedTheme === 'dark' ? "rgba(255, 76, 76, 0.18)" : "rgba(66, 115, 255, 0.18)"}
                                                    strokeDasharray="3 3"
                                                    ifOverflow="extendDomain"
                                                />
                                            ))}
                                            <YAxis
                                                dataKey="points"
                                                tick={false}
                                                axisLine={false}
                                                tickLine={false}
                                                ticks={yTicks}
                                                width={0}
                                                domain={[0, yMax]}
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
                                                    r: 3
                                                }}
                                                activeDot={{
                                                    r: 5,
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

                        {/* Pie Chart de distribución de puntos */}
                        <Card className="flex flex-col">
                            <CardHeader className="items-center pb-0">
                                <CardTitle>Points Distribution</CardTitle>
                                <CardDescription>
                                    Distribution of total points by shot type
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <ChartContainer
                                    config={pieChartConfig}
                                    className="mx-auto aspect-square max-h-[300px]"
                                >
                                    <RePieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="type"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            innerRadius={60}
                                            label={({ percent }) =>
                                                percent > 0 ? `${Math.round(percent * 100)}%` : ""
                                            }
                                            isAnimationActive={false}
                                        />
                                        <ChartLegend
                                            content={<ChartLegendContent nameKey="type" />}
                                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                                        />
                                    </RePieChart>
                                </ChartContainer>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${player.name || "Player"}'s Shot Profile`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {pointsType
                                                ? `${pointsType.two_points + pointsType.three_points + pointsType.free_throws} total points`
                                                : "No data"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Most Used</p>
                                                <p className="font-bold">
                                                    {pointsType
                                                        ? (() => {
                                                            const arr = [
                                                                { label: "2PT", value: pointsType.two_points },
                                                                { label: "3PT", value: pointsType.three_points },
                                                                { label: "FT", value: pointsType.free_throws },
                                                            ];
                                                            const max = arr.reduce((a, b) => (a.value > b.value ? a : b));
                                                            return `${max.label} (${max.value})`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Highest %</p>
                                                <p className="font-bold">
                                                    {pointsType
                                                        ? (() => {
                                                            const total = pointsType.two_points + pointsType.three_points + pointsType.free_throws;
                                                            if (!total) return "-";
                                                            const arr = [
                                                                { label: "2PT", value: pointsType.two_points },
                                                                { label: "3PT", value: pointsType.three_points },
                                                                { label: "FT", value: pointsType.free_throws },
                                                            ];
                                                            const max = arr.reduce((a, b) => (a.value / total > b.value / total ? a : b));
                                                            return `${max.label} (${Math.round((max.value / total) * 100)}%)`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Closest Split</p>
                                                <p className="font-bold">
                                                    {pointsType
                                                        ? (() => {
                                                            const arr = [
                                                                { label: "2PT", value: pointsType.two_points },
                                                                { label: "3PT", value: pointsType.three_points },
                                                                { label: "FT", value: pointsType.free_throws },
                                                            ];
                                                            arr.sort((a, b) => a.value - b.value);
                                                            // Most similar pair
                                                            const diffs = [
                                                                { pair: `${arr[0].label} & ${arr[1].label}`, diff: Math.abs(arr[0].value - arr[1].value) },
                                                                { pair: `${arr[1].label} & ${arr[2].label}`, diff: Math.abs(arr[1].value - arr[2].value) },
                                                                { pair: `${arr[0].label} & ${arr[2].label}`, diff: Math.abs(arr[0].value - arr[2].value) },
                                                            ];
                                                            const min = diffs.reduce((a, b) => (a.diff < b.diff ? a : b));
                                                            return `${min.pair} (${min.diff} pts diff)`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Radar Chart de perfil de habilidades */}
                        <Card>
                            <CardHeader className="items-center pb-0">
                                <CardTitle>Skill Profile</CardTitle>
                                <CardDescription>
                                    {`Player's average performance in key categories`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <ChartContainer
                                    config={radarChartConfig}
                                    className="mx-auto aspect-square max-h-[340px] w-full flex items-center justify-center"
                                >
                                    <ReRadarChart
                                        data={radarData}
                                        width={360}
                                        height={340}
                                        margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
                                    >
                                        <PolarAngleAxis
                                            dataKey="skill"
                                            tick={{
                                                fontSize: 14,
                                                fill: "var(--foreground)",
                                                dy: 8, // Desplaza las labels hacia fuera
                                            }}
                                            tickLine={false}
                                            // Ajusta el radio para que las labels no se corten
                                            radius={110}
                                        />
                                        <PolarRadiusAxis domain={[0, 40]} angle={90} tick={false} />
                                        <PolarGrid />
                                        <Radar
                                            dataKey="value"
                                            fill={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                            fillOpacity={0.6}
                                            stroke={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                            dot={{ r: 4, fillOpacity: 1 }}
                                        />
                                        <Tooltip content={<RadarTooltip />} />
                                    </ReRadarChart>
                                </ChartContainer>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${player.name || "Player"}'s Skill Profile`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {skillProfile
                                                ? "Scaled for visual comparison"
                                                : "No data"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Best Stat</p>
                                                <p className="font-bold">
                                                    {skillProfile
                                                        ? (() => {
                                                            const arr = [
                                                                { label: "Points", value: skillProfile.points },
                                                                { label: "Rebounds", value: skillProfile.rebounds },
                                                                { label: "Assists", value: skillProfile.assists },
                                                                { label: "Steals", value: skillProfile.steals },
                                                                { label: "Blocks", value: skillProfile.blocks },
                                                            ];
                                                            const max = arr.reduce((a, b) => (a.value > b.value ? a : b));
                                                            return `${max.label} (${max.value.toFixed(1)})`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Most Balanced Pair</p>
                                                <p className="font-bold">
                                                    {skillProfile
                                                        ? (() => {
                                                            const arr = [
                                                                { label: "Points", value: skillProfile.points },
                                                                { label: "Rebounds", value: skillProfile.rebounds },
                                                                { label: "Assists", value: skillProfile.assists },
                                                                { label: "Steals", value: skillProfile.steals },
                                                                { label: "Blocks", value: skillProfile.blocks },
                                                            ];
                                                            let minDiff = Infinity;
                                                            let pair = "";
                                                            for (let i = 0; i < arr.length; i++) {
                                                                for (let j = i + 1; j < arr.length; j++) {
                                                                    const diff = Math.abs(arr[i].value - arr[j].value);
                                                                    if (diff < minDiff) {
                                                                        minDiff = diff;
                                                                        pair = `${arr[i].label} & ${arr[j].label}`;
                                                                    }
                                                                }
                                                            }
                                                            return `${pair} (${minDiff.toFixed(1)} diff)`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Lowest Stat</p>
                                                <p className="font-bold">
                                                    {skillProfile
                                                        ? (() => {
                                                            const arr = [
                                                                { label: "Points", value: skillProfile.points },
                                                                { label: "Rebounds", value: skillProfile.rebounds },
                                                                { label: "Assists", value: skillProfile.assists },
                                                                { label: "Steals", value: skillProfile.steals },
                                                                { label: "Blocks", value: skillProfile.blocks },
                                                            ];
                                                            const min = arr.reduce((a, b) => (a.value < b.value ? a : b));
                                                            return `${min.label} (${min.value.toFixed(1)})`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Bar Chart de comparación de estadísticas */}
                        <Card>
                            <CardHeader className="items-center pb-0">
                                <CardTitle>Stat Comparison</CardTitle>
                                <CardDescription>
                                    Volume and habits per game (not shown in radar)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <ChartContainer
                                    config={barChartConfig}
                                    className="mx-auto aspect-video h-full w-full flex items-center justify-center"
                                >
                                    <ResponsiveContainer>
                                        <ReBarChart
                                            data={barCompareDataScaled}
                                            margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                            barCategoryGap={60}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 14, fill: "var(--foreground)" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            {/* YAxis sigue oculto */}
                                            <BarTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const { name, original } = payload[0].payload;
                                                        return (
                                                            <div className="rounded-lg border bg-card p-3 shadow-md">
                                                                <p className="font-medium text-sm">{name}</p>
                                                                <p className="text-base font-bold text-primary mt-1">
                                                                    {original}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar
                                                dataKey="scaled"
                                                radius={8}
                                                fill={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                maxBarSize={72}
                                                barSize={72}
                                            />
                                        </ReBarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${player.name || "Player"}'s Game Habits`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {barCompareData.length ? "Scaled for visual comparison" : "No data"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Shot Preference</p>
                                                <p className="font-bold">
                                                    {barCompareData.length
                                                        ? (() => {
                                                            const shootingData = barCompareData.filter(d =>
                                                                ['FGA', '3PA', 'FTA'].includes(d.name));
                                                            if (!shootingData.length) return "-";
                                                            const max = shootingData.reduce((a, b) =>
                                                                (a.value > b.value ? a : b));
                                                            return `${max.name} (${max.value.toFixed(1)})`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Best Efficiency</p>
                                                <p className="font-bold">
                                                    {barCompareData.length
                                                        ? (() => {
                                                            const fgm = barCompareData.find(d => d.name === 'FGM')?.value || 0;
                                                            const fga = barCompareData.find(d => d.name === 'FGA')?.value || 0;
                                                            const tpm = barCompareData.find(d => d.name === '3PM')?.value || 0;
                                                            const tpa = barCompareData.find(d => d.name === '3PA')?.value || 0;
                                                            const ftm = barCompareData.find(d => d.name === 'FTM')?.value || 0;
                                                            const fta = barCompareData.find(d => d.name === 'FTA')?.value || 0;

                                                            const efficiencies = [
                                                                { label: "FG", value: fga > 0 ? (fgm / fga * 100) : 0 },
                                                                { label: "3PT", value: tpa > 0 ? (tpm / tpa * 100) : 0 },
                                                                { label: "FT", value: fta > 0 ? (ftm / fta * 100) : 0 }
                                                            ].filter(e => e.value > 0);

                                                            if (!efficiencies.length) return "-";
                                                            const max = efficiencies.reduce((a, b) =>
                                                                (a.value > b.value ? a : b));
                                                            return `${max.label} (${max.value.toFixed(1)}%)`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Usage Rate</p>
                                                <p className="font-bold">
                                                    {barCompareData.length
                                                        ? (() => {
                                                            const min = barCompareData.find(d => d.name === 'MIN')?.value || 0;
                                                            const fga = barCompareData.find(d => d.name === 'FGA')?.value || 0;
                                                            const tpa = barCompareData.find(d => d.name === '3PA')?.value || 0;
                                                            const fta = barCompareData.find(d => d.name === 'FTA')?.value || 0;

                                                            if (!min) return "-";
                                                            // Shots attempted per minute
                                                            const shotsPerMin = ((fga + tpa + fta) / min).toFixed(1);
                                                            return `${shotsPerMin} per min`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader className="items-center pb-0">
                                <CardTitle>Minutes Progression</CardTitle>
                                <CardDescription>
                                    Evolution of minutes played per game throughout the season
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <ChartContainer
                                    config={areaChartConfig}
                                    className="mx-auto aspect-video h-full w-full flex items-center justify-center"
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ReAreaChart
                                            data={minutesProgression}
                                            margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                        >
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tick={false}
                                                axisLine={false}
                                                tickLine={false}
                                                width={0}
                                            />
                                            <YAxis
                                                dataKey="minutes"
                                                tick={false}
                                                axisLine={false}
                                                tickLine={false}
                                                width={0}
                                                domain={[0, 48]}
                                            />
                                            <AreaTooltip content={<MinutesAreaTooltip />} />
                                            <Area
                                                dataKey="minutes"
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
                                                    fill: resolvedTheme === 'dark' ? "hsl(0 80% 45%)" : "hsl(214 80% 45%)",
                                                    r: 3
                                                }}
                                                activeDot={{
                                                    r: 5,
                                                    fill: resolvedTheme === 'dark' ? "hsl(0 80% 60%)" : "hsl(214 80% 60%)",
                                                    stroke: "var(--background)",
                                                    strokeWidth: 1.5
                                                }}
                                            />
                                        </ReAreaChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${player.name || "Player"}'s Minutes Trend`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {minutesProgression.length} games analyzed
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Avg. Minutes</p>
                                                <p className="font-bold">
                                                    {minutesProgression.length
                                                        ? (
                                                            minutesProgression.reduce((sum, d) => sum + d.minutes, 0) /
                                                            minutesProgression.length
                                                        ).toFixed(1)
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Season High</p>
                                                <p className="font-bold">
                                                    {minutesProgression.length
                                                        ? Math.max(...minutesProgression.map(d => d.minutes)).toFixed(1)
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Consistency</p>
                                                <p className="font-bold">
                                                    {minutesProgression.length
                                                        ? (() => {
                                                            const avg = minutesProgression.reduce((sum, d) => sum + d.minutes, 0) / minutesProgression.length;
                                                            const variance = minutesProgression.reduce((sum, d) => sum + Math.pow(d.minutes - avg, 2), 0) / minutesProgression.length;
                                                            const stdDev = Math.sqrt(variance);
                                                            return Math.max(0, 100 - (stdDev / avg * 100)).toFixed(0) + "%";
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader className="items-center pb-0">
                                <CardTitle>Participation Rates</CardTitle>
                                <CardDescription>
                                    Percentage of games with key actions this season
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-0">
                                <ChartContainer
                                    config={radialChartConfig}
                                    className="mx-auto aspect-square max-h-[500px] w-full"
                                >
                                    <ResponsiveContainer width="100%" height={480}>
                                        <RadialBarChart
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={200}
                                            data={scaledParticipationData}
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            <RadialTooltip content={<ParticipationTooltip />} cursor={false} />
                                            <RadialBar
                                                dataKey="scaledValue"
                                                cornerRadius={4}
                                                fill="#8884d8"
                                                background
                                                label={{
                                                    position: "insideStart",
                                                    fill: "#fff",
                                                    fontSize: 12,
                                                    formatter: (value, entry) => entry?.label || "" // Solo muestra labels no vacías
                                                }}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${player.name || "Player"}'s Impact Analysis`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            Based on 85-game season
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Elite Performance</p>
                                                <p className="font-bold">
                                                    {participationRates.length
                                                        ? (() => {
                                                            // Excluir "Games Played" y encontrar el mejor logro
                                                            const achievements = participationRates.filter(d => d.label !== "Games Played");
                                                            if (!achievements.length) return "-";
                                                            const max = achievements.reduce((a, b) => (a.value > b.value ? a : b));

                                                            // Calcular qué tan élite es (>70% = Elite, >50% = Good, >30% = Average, <30% = Poor)
                                                            const rate = (max.value / 85) * 100;
                                                            let level = "Poor";
                                                            if (rate >= 70) level = "Elite";
                                                            else if (rate >= 50) level = "Good";
                                                            else if (rate >= 30) level = "Average";

                                                            return `${max.label.replace("Double-Doubles", "2x2").replace("3PT Made", "3PT")} (${level})`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Durability Score</p>
                                                <p className="font-bold">
                                                    {participationRates.length
                                                        ? (() => {
                                                            const gamesPlayed = participationRates.find(d => d.label === "Games Played")?.value || 0;
                                                            const percentage = (gamesPlayed / 85) * 100;

                                                            // Score basado en games played
                                                            let grade = "F";
                                                            if (percentage >= 95) grade = "A+";
                                                            else if (percentage >= 90) grade = "A";
                                                            else if (percentage >= 85) grade = "A-";
                                                            else if (percentage >= 80) grade = "B+";
                                                            else if (percentage >= 75) grade = "B";
                                                            else if (percentage >= 70) grade = "B-";
                                                            else if (percentage >= 65) grade = "C+";
                                                            else if (percentage >= 60) grade = "C";
                                                            else if (percentage >= 50) grade = "D";

                                                            return `${grade} (${gamesPlayed}/85)`;
                                                        })()
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Clutch Factor</p>
                                                <p className="font-bold">
                                                    {participationRates.length
                                                        ? (() => {
                                                            const gamesPlayed = participationRates.find(d => d.label === "Games Played")?.value || 0;
                                                            const points20Plus = participationRates.find(d => d.label === "20+ Points")?.value || 0;
                                                            const doubleDoubles = participationRates.find(d => d.label === "Double-Doubles")?.value || 0;
                                                            const threePointers = participationRates.find(d => d.label === "3PT Made")?.value || 0;

                                                            if (gamesPlayed === 0) return "No Data";

                                                            // Clutch factor: promedio de "big performances" por juego
                                                            const bigPerformances = points20Plus + doubleDoubles + threePointers;
                                                            const clutchRate = (bigPerformances / (gamesPlayed * 3)) * 100;

                                                            let clutchLevel = "Cold";
                                                            if (clutchRate >= 60) clutchLevel = "Clutch";
                                                            else if (clutchRate >= 45) clutchLevel = "Reliable";
                                                            else if (clutchRate >= 30) clutchLevel = "Solid";
                                                            else if (clutchRate >= 15) clutchLevel = "Inconsistent";

                                                            return `${clutchLevel} (${clutchRate.toFixed(0)}%)`;
                                                        })()
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