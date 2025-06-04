"use client"

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Trophy,
    BarChart3,
    Lock,
    TrendingUp,
    Target,
    Activity,
    Clock,
    Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import axios from "axios"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    RadarChart as ReRadarChart,
    Radar,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Tooltip,
    Cell
} from "recharts"
import { BarChart as ReBarChart, Bar, CartesianGrid, LabelList, Tooltip as BarTooltip, ReferenceLine } from "recharts";
import { AreaChart as ReAreaChart, Area, Tooltip as AreaTooltip } from "recharts";
import { RadialBarChart, RadialBar, Tooltip as RadialTooltip } from "recharts";
import {
    ScatterChart,
    Scatter,
} from "recharts";


// Añadir este import para el tooltip personalizado
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import { TooltipProps } from "recharts"

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
    const [advancedImpactMatrix, setAdvancedImpactMatrix] = useState<{
        win_shares: number;
        vorp: number;
        true_shooting_pct: number;
        box_plus_minus: number;
        games_played: number;
        minutes_per_game: number;
    } | null>(null);

    const [positionAverages, setPositionAverages] = useState<{
        position: string;
        offensive_rating: number;
        defensive_rating: number;
        minutes_per_game: number;
        win_shares: number;
        vorp: number;
        box_plus_minus: number;
        is_player_position: boolean;
    }[]>([]);

    // Add this state for LEBRON impact data
    const [lebronImpact, setLebronImpact] = useState<{
        lebron_score: number;
        box_component: number;
        plus_minus_component: number;
        luck_adjustment: number;
        context_adjustment: number;
        usage_adjustment: number;
        percentile_rank: number;
        games_played: number;
        minutes_per_game: number;
    } | null>(null);

    // Añadir este estado junto con los otros estados
    const [pipmpImpact, setPipmpImpact] = useState<{
        total_pipm: number;
        offensive_pimp: number;
        defensive_pimp: number;
        box_prior_weight: number;
        plus_minus_weight: number;
        stability_factor: number;
        minutes_confidence: number;
        games_played: number;
        usage_rate: number;
    } | null>(null);

    // Añadir este estado para los datos PIPM por posición
    const [pipmpPositionAverages, setPipmpPositionAverages] = useState<{
        position: string;
        total_pipm: number;
        offensive_pimp: number;
        defensive_pimp: number;
        box_prior_weight: number;
        plus_minus_weight: number;
        stability_factor: number;
        minutes_confidence: number;
        usage_rate: number;
        minutes_per_game: number;
        is_player_position: boolean;
    }[]>([]);

    // Añadir este estado para controlar la animación
    const [needleAnimated, setNeedleAnimated] = useState(false);

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

    // Fetch advanced impact matrix for ultimate tab
    useEffect(() => {
        async function fetchAdvancedImpactMatrix() {
            try {
                const res = await axios.get<{
                    win_shares: number;
                    vorp: number;
                    true_shooting_pct: number;
                    box_plus_minus: number;
                    games_played: number;
                    minutes_per_game: number;
                }>(`${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/advanced/impact-matrix`);
                setAdvancedImpactMatrix(res.data);
            } catch (e) {
                console.error("Error fetching advanced impact matrix:", e);
                setAdvancedImpactMatrix(null);
            }
        }
        if (isUltimate) fetchAdvancedImpactMatrix();
    }, [player.id, isUltimate]);

    // Fetch position averages for ultimate tab
    useEffect(() => {
        async function fetchPositionAverages() {
            try {
                const res = await axios.get<{
                    position: string;
                    offensive_rating: number;
                    defensive_rating: number;
                    minutes_per_game: number;
                    win_shares: number;
                    vorp: number;
                    box_plus_minus: number;
                    is_player_position: boolean;
                }[]>(`${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/advanced/position-averages`);
                setPositionAverages(res.data);
            } catch (e) {
                console.error("Error fetching position averages:", e);
                setPositionAverages([]);
            }
        }
        if (isUltimate) fetchPositionAverages();
    }, [player.id, isUltimate]);

    // Fetch LEBRON impact data
    useEffect(() => {
        async function fetchLebronImpact() {
            try {
                const res = await axios.get<{
                    lebron_score: number;
                    box_component: number;
                    plus_minus_component: number;
                    luck_adjustment: number;
                    context_adjustment: number;
                    usage_adjustment: number;
                    percentile_rank: number;
                    games_played: number;
                    minutes_per_game: number;
                }>(`${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/advanced/lebron-impact`);
                setLebronImpact(res.data);
            } catch (e) {
                console.error("Error fetching LEBRON impact:", e);
                setLebronImpact(null);
            }
        }
        if (isUltimate) fetchLebronImpact();
    }, [player.id, isUltimate]);

    // Fetch PIPM impact data
    useEffect(() => {
        async function fetchPipmpImpact() {
            try {
                const res = await axios.get<{
                    total_pipm: number;
                    offensive_pimp: number;
                    defensive_pimp: number;
                    box_prior_weight: number;
                    plus_minus_weight: number;
                    stability_factor: number;
                    minutes_confidence: number;
                    games_played: number;
                    usage_rate: number;
                }>(`${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/advanced/pipm-impact`);
                setPipmpImpact(res.data);
            } catch (e) {
                console.error("Error fetching PIPM impact:", e);
                setPipmpImpact(null);
            }
        }
        if (isUltimate) fetchPipmpImpact();
    }, [player.id, isUltimate]);

    // Añadir este useEffect para obtener los datos PIPM por posición
    useEffect(() => {
        async function fetchPipmpPositionAverages() {
            try {
                const res = await axios.get<{
                    position: string;
                    total_pipm: number;
                    offensive_pimp: number;
                    defensive_pimp: number;
                    box_prior_weight: number;
                    plus_minus_weight: number;
                    stability_factor: number;
                    minutes_confidence: number;
                    usage_rate: number;
                    minutes_per_game: number;
                    is_player_position: boolean;
                }[]>(`${process.env.NEXT_PUBLIC_API_URL}/players/${player.id}/advanced/pipm-position-averages`);
                setPipmpPositionAverages(res.data);
            } catch (e) {
                console.error("Error fetching PIPM position averages:", e);
                setPipmpPositionAverages([]);
            }
        }
        if (isUltimate) fetchPipmpPositionAverages();
    }, [player.id, isUltimate]);

    // Añadir este useEffect para activar la animación cuando se entra a Ultimate
    useEffect(() => {
        if (isUltimate && lebronImpact && !needleAnimated) {
            // Pequeño delay para que se vea la animación
            const timer = setTimeout(() => {
                setNeedleAnimated(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isUltimate, lebronImpact, needleAnimated]);

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

    // Ejes dinámicos para Minutes Progression (cada 12 minutos)
    const maxMinutes = Math.max(...minutesProgression.map(m => m.minutes ?? 0), 0)
    const minMinutes = Math.min(...minutesProgression.map(m => m.minutes ?? 0), 0)
    const yMinMinutes = Math.floor(minMinutes / 12) * 12  // Múltiplos de 12
    const yMaxMinutes = Math.ceil(Math.max(48, maxMinutes) / 12) * 12  // Múltiplos de 12
    const yTicksMinutes = []
    for (let i = yMinMinutes; i <= yMaxMinutes; i += 12) yTicksMinutes.push(i)  // Incrementos de 12

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

    const scatterData = useMemo(() => {
        const data = [];

        // Añadir promedios por posición
        positionAverages.forEach(pos => {
            data.push({
                name: `${pos.position} Average`,
                position: pos.position,
                offensive_rating: pos.offensive_rating,
                defensive_rating: pos.defensive_rating,
                minutes: pos.minutes_per_game,
                win_shares: pos.win_shares,
                vorp: pos.vorp,
                box_plus_minus: pos.box_plus_minus,
                is_player: false,
                is_player_position: pos.is_player_position
            });
        });

        // Añadir datos del jugador
        if (advancedImpactMatrix) {
            data.push({
                name: player.name || "Player",
                position: "Player",
                offensive_rating: advancedImpactMatrix.true_shooting_pct,
                defensive_rating: Math.max(0, 100 - advancedImpactMatrix.box_plus_minus),
                minutes: advancedImpactMatrix.minutes_per_game,
                win_shares: advancedImpactMatrix.win_shares,
                vorp: advancedImpactMatrix.vorp,
                box_plus_minus: advancedImpactMatrix.box_plus_minus,
                is_player: true,
                is_player_position: false
            });
        }

        return data;
    }, [positionAverages, advancedImpactMatrix, player.name]);

    // Tooltip del scatter plot
    const ScatterTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">{data.name}</p>
                    <div className="space-y-1 mt-2">
                        <p className="text-xs">
                            <span className="text-muted-foreground">Win Shares:</span>
                            <span className="font-bold text-primary ml-1">{data.win_shares.toFixed(1)}</span>
                        </p>
                        <p className="text-xs">
                            <span className="text-muted-foreground">VORP:</span>
                            <span className="font-bold text-primary ml-1">{data.vorp.toFixed(2)}</span>
                        </p>
                        <p className="text-xs">
                            <span className="text-muted-foreground">True Shooting %:</span>
                            <span className="font-bold text-primary ml-1">{data.offensive_rating.toFixed(1)}%</span>
                        </p>
                        <p className="text-xs">
                            <span className="text-muted-foreground">Minutes/Game:</span>
                            <span className="font-bold text-primary ml-1">{data.minutes.toFixed(1)}</span>
                        </p>
                        <p className="text-xs">
                            <span className="text-muted-foreground">Box +/-:</span>
                            <span className="font-bold text-primary ml-1">{data.box_plus_minus.toFixed(1)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Función para obtener color por posición
    const getPositionColor = (data: any) => {
        if (data.is_player) {
            return resolvedTheme === "dark" ? "hsl(0, 80%, 60%)" : "hsl(214, 80%, 55%)"; // Color principal para el jugador
        }

        // Colores diferentes para cada posición
        const positionColors = {
            'PG': resolvedTheme === "dark" ? "hsl(270, 70%, 60%)" : "hsl(270, 70%, 50%)", // Púrpura
            'SG': resolvedTheme === "dark" ? "hsl(195, 70%, 60%)" : "hsl(195, 70%, 50%)", // Cian
            'SF': resolvedTheme === "dark" ? "hsl(120, 70%, 60%)" : "hsl(120, 70%, 50%)", // Verde
            'PF': resolvedTheme === "dark" ? "hsl(45, 70%, 60%)" : "hsl(45, 70%, 50%)",   // Amarillo
            'C': resolvedTheme === "dark" ? "hsl(15, 70%, 60%)" : "hsl(15, 70%, 50%)",    // Naranja
        };

        return positionColors[data.position as keyof typeof positionColors] || "hsl(0, 0%, 50%)";
    };

    // Add the gauge chart data processing
    const gaugeData = lebronImpact ? [
        {
            name: "LEBRON Score",
            value: lebronImpact.lebron_score,
            fill: (() => {
                const score = lebronImpact.lebron_score;
                if (score >= 6) return resolvedTheme === "dark" ? "hsl(120, 70%, 60%)" : "hsl(120, 70%, 50%)"; // Elite - Green
                if (score >= 2) return resolvedTheme === "dark" ? "hsl(43, 70%, 60%)" : "hsl(43, 70%, 50%)"; // Good - Yellow
                if (score >= -2) return resolvedTheme === "dark" ? "hsl(30, 70%, 60%)" : "hsl(30, 70%, 50%)"; // Average - Orange
                return resolvedTheme === "dark" ? "hsl(0, 70%, 60%)" : "hsl(0, 70%, 50%)"; // Poor - Red
            })()
        }
    ] : [];

    const pipmpScatterData = useMemo(() => {
        const data = [];

        // Añadir promedios PIPM por posición
        pipmpPositionAverages.forEach(pos => {
            data.push({
                name: `${pos.position} Average`,
                position: pos.position,
                offensive_pimp: pos.offensive_pimp,
                defensive_pimp: pos.defensive_pimp,
                total_pipm: pos.total_pipm,
                usage_rate: pos.usage_rate,
                minutes_per_game: pos.minutes_per_game,
                box_prior_weight: pos.box_prior_weight,
                plus_minus_weight: pos.plus_minus_weight,
                stability_factor: pos.stability_factor,
                minutes_confidence: pos.minutes_confidence,
                is_player: false,
                is_player_position: pos.is_player_position
            });
        });

        // Añadir datos del jugador
        if (pipmpImpact) {
            data.push({
                name: player.name || "Player",
                position: "Player",
                offensive_pimp: pipmpImpact.offensive_pimp,
                defensive_pimp: pipmpImpact.defensive_pimp,
                total_pipm: pipmpImpact.total_pipm,
                usage_rate: pipmpImpact.usage_rate,
                minutes_per_game: 0, // No tenemos esto en pipmpImpact
                box_prior_weight: pipmpImpact.box_prior_weight,
                plus_minus_weight: pipmpImpact.plus_minus_weight,
                stability_factor: pipmpImpact.stability_factor,
                minutes_confidence: pipmpImpact.minutes_confidence,
                is_player: true,
                is_player_position: false
            });
        }

        return data;
    }, [pipmpPositionAverages, pipmpImpact, player.name]);

    // Tooltip del scatter plot PIPM (actualizar el existente)
    const PipmpScatterTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm mb-2">{data.name}</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total PIPM:</span>
                            <span className="font-medium">{data.total_pipm?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Offensive:</span>
                            <span className="font-medium">{data.offensive_pimp?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Defensive:</span>
                            <span className="font-medium">{data.defensive_pimp?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Usage Rate:</span>
                            <span className="font-medium">{data.usage_rate?.toFixed(1)}%</span>
                        </div>
                        {data.stability_factor !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Stability:</span>
                                <span className="font-medium">{data.stability_factor?.toFixed(3)}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

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
                                <div style={{ width: "100%", height: 300 }}>
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
                                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                    >
                                        <PolarGrid
                                            stroke={resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                                            radialLines={true}
                                        />
                                        <PolarAngleAxis
                                            dataKey="skill"
                                            stroke={resolvedTheme === "dark" ? "#e2e8f0" : "#475569"}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            content={<RadarTooltip />}
                                        />
                                        <Radar
                                            dataKey="value"
                                            stroke={resolvedTheme === "dark" ? "hsl(0 80% 45%)" : "hsl(214 80% 45%)"}
                                            fill={resolvedTheme === "dark" ? "hsl(0 80% 45%)" : "hsl(214 80% 45%)"}
                                            fillOpacity={0.6}
                                        />
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
                                            {/* Reemplaza CartesianGrid con ReferenceLines individuales cada 12 minutos */}
                                            {yTicksMinutes.map(tick => (
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
                                                dataKey="minutes"
                                                tick={false}
                                                axisLine={false}
                                                tickLine={false}
                                                ticks={yTicksMinutes}
                                                width={0}
                                                domain={[yMinMinutes, yMaxMinutes]}
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
                                <CardTitle>Game Participation</CardTitle>
                                <CardDescription>
                                    Number of games with specific achievements this season
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
                        {/* Position Comparison */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Position Comparison</CardTitle>
                                <CardDescription>Player vs positional averages</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart
                                            data={scatterData}
                                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke={resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                                                horizontal={true}
                                                vertical={true}
                                            />
                                            <XAxis
                                                type="number"
                                                dataKey="win_shares"
                                                name="Win Shares"
                                                domain={[-0.5, 3.5]} // Dominio fijo de 0 a 4
                                                tick={{
                                                    fontSize: 12,
                                                    fill: resolvedTheme === "dark" ? "#e2e8f0" : "#475569"
                                                }}
                                                axisLine={{
                                                    stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                    strokeWidth: 1
                                                }}
                                                tickLine={{
                                                    stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                    strokeWidth: 1
                                                }}
                                                ticks={[-0.5, 0.5, 1.5, 2.5, 3.5]} // Intervalos fijos de 0.5 en 0.5

                                                tickFormatter={(value) => value.toFixed(1)}
                                                label={{
                                                    value: 'Win Shares',
                                                    position: 'insideBottom',
                                                    offset: -10,
                                                    style: {
                                                        textAnchor: 'middle',
                                                        fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b"
                                                    }
                                                }}
                                            />
                                            <YAxis
                                                type="number"
                                                dataKey="vorp"
                                                name="VORP"
                                                domain={[-0.5, 6.5]} // Dominio fijo de -2 a 4
                                                tick={{
                                                    fontSize: 12,
                                                    fill: resolvedTheme === "dark" ? "#e2e8f0" : "#475569"
                                                }}
                                                axisLine={{
                                                    stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                    strokeWidth: 1
                                                }}
                                                tickLine={{
                                                    stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                    strokeWidth: 1
                                                }}
                                                ticks={[-0.5, 0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5]} // Intervalos fijos de 1 en 1
                                                tickFormatter={(value) => value.toFixed(2)}
                                                label={{
                                                    value: 'VORP',
                                                    angle: -90,
                                                    position: 'insideLeft',
                                                    style: {
                                                        textAnchor: 'middle',
                                                        fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b"
                                                    }
                                                }}
                                            />
                                            <Tooltip content={<ScatterTooltip />} />

                                            {/* Scatter para promedios de posiciones */}
                                            <Scatter
                                                dataKey="win_shares"
                                                data={scatterData.filter(d => !d.is_player)}
                                                fill="#8884d8"
                                                shape={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    return (
                                                        <circle
                                                            cx={cx}
                                                            cy={cy}
                                                            r={6} // Aumentado de 6 a 8
                                                            fill={getPositionColor(payload)}
                                                            stroke="none"
                                                            strokeWidth={0}
                                                            opacity={0.8}
                                                        />
                                                    );
                                                }}
                                            />

                                            {/* Scatter para el jugador (más grande y destacado) */}
                                            <Scatter
                                                dataKey="win_shares"
                                                data={scatterData.filter(d => d.is_player)}
                                                fill="#8884d8"
                                                shape={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    return (
                                                        <circle
                                                            cx={cx}
                                                            cy={cy}
                                                            r={12} // Aumentado de 10 a 12
                                                            fill={getPositionColor(payload)}
                                                            stroke="none"
                                                            strokeWidth={0}
                                                        />
                                                    );
                                                }}
                                            />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            Position Comparison Analysis
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            vs League Averages
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Rank vs Position</p>
                                                <p className="font-bold">
                                                    {advancedImpactMatrix && positionAverages.length ? (() => {
                                                        const playerPosition = positionAverages.find(p => p.is_player_position);
                                                        if (!playerPosition) return "-";

                                                        const playerWS = advancedImpactMatrix.win_shares;
                                                        const avgWS = playerPosition.win_shares;

                                                        return playerWS > avgWS ? "Above Average" : playerWS > avgWS - 1 ? "Average" : "Below Average";
                                                    })() : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Best Position Match</p>
                                                <p className="font-bold">
                                                    {advancedImpactMatrix && positionAverages.length ? (() => {
                                                        const playerVORP = advancedImpactMatrix.vorp;
                                                        let bestMatch = "";
                                                        let smallestDiff = Infinity;

                                                        positionAverages.forEach(pos => {
                                                            const diff = Math.abs(playerVORP - pos.vorp);
                                                            if (diff < smallestDiff) {
                                                                smallestDiff = diff;
                                                                bestMatch = pos.position;
                                                            }
                                                        });

                                                        return bestMatch || "-";
                                                    })() : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Impact Level</p>
                                                <p className="font-bold">
                                                    {advancedImpactMatrix ? (
                                                        advancedImpactMatrix.vorp > 4 ? "Elite" :
                                                            advancedImpactMatrix.vorp > 2 ? "All-Star" :
                                                                advancedImpactMatrix.vorp > 0 ? "Starter" : "Bench"
                                                    ) : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* LEBRON Impact Score */}
                        <Card>
                            <CardHeader>
                                <CardTitle>LEBRON Impact Score</CardTitle>
                                <CardDescription>Luck-adjusted player impact evaluation (-10 to +10 scale)</CardDescription>
                            </CardHeader>
                            <CardContent className="relative">
                                <div style={{ width: "100%", height: 300, position: "relative" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <defs>
                                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="hsl(0, 70%, 50%)" />
                                                    <stop offset="20%" stopColor="hsl(30, 70%, 50%)" />
                                                    <stop offset="60%" stopColor="hsl(43, 70%, 50%)" />
                                                    <stop offset="100%" stopColor="hsl(120, 70%, 50%)" />
                                                </linearGradient>

                                                {/* Gradiente metálico para la aguja */}
                                                <linearGradient id="needleMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor={resolvedTheme === "dark" ? "#e2e8f0" : "#475569"} />
                                                    <stop offset="30%" stopColor={resolvedTheme === "dark" ? "#ffffff" : "#1e293b"} />
                                                    <stop offset="70%" stopColor={resolvedTheme === "dark" ? "#cbd5e1" : "#374151"} />
                                                    <stop offset="100%" stopColor={resolvedTheme === "dark" ? "#94a3b8" : "#6b7280"} />
                                                </linearGradient>

                                                {/* Sombra para la aguja */}
                                                <filter id="needleShadow">
                                                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                                                </filter>
                                            </defs>

                                            {/* Gauge background with segments */}
                                            <Pie
                                                data={[
                                                    { value: 8, name: "Poor (-10 to -2)", fill: "hsl(0, 70%, 50%)" },
                                                    { value: 4, name: "Average (-2 to 2)", fill: "hsl(30, 70%, 50%)" },
                                                    { value: 4, name: "Good (2 to 6)", fill: "hsl(43, 70%, 50%)" },
                                                    { value: 4, name: "Elite (6 to 10)", fill: "hsl(120, 70%, 50%)" }
                                                ]}
                                                dataKey="value"
                                                cx="50%"
                                                cy="80%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={80}
                                                outerRadius={120}
                                                stroke={resolvedTheme === "dark" ? "#1e293b" : "#f8fafc"}
                                                strokeWidth={2}
                                                isAnimationActive={false}
                                            />

                                            {/* Tooltip restaurado */}
                                            <Tooltip content={({ active, payload }) => {
                                                if (active && lebronImpact) {
                                                    return (
                                                        <div className="rounded-lg border bg-card p-3 shadow-md">
                                                            <p className="font-medium text-sm">LEBRON Score</p>
                                                            <p className="text-lg font-bold text-primary">
                                                                {lebronImpact.lebron_score.toFixed(2)}
                                                            </p>
                                                            <div className="space-y-1 mt-2 text-xs">
                                                                <p>Box Component: {lebronImpact.box_component.toFixed(2)}</p>
                                                                <p>Plus/Minus: {lebronImpact.plus_minus_component.toFixed(2)}</p>
                                                                <p>Percentile: {lebronImpact.percentile_rank.toFixed(1)}%</p>
                                                                <p>Luck Adj: {lebronImpact.luck_adjustment.toFixed(3)}</p>
                                                                <p>Context Adj: {lebronImpact.context_adjustment.toFixed(3)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                        </RePieChart>
                                    </ResponsiveContainer>

                                    {lebronImpact && (
                                        <div style={{
                                            position: "absolute",
                                            top: "0",
                                            left: "0",
                                            width: "100%",
                                            height: "100%",
                                            pointerEvents: "none",
                                            zIndex: 10
                                        }}>
                                            <div style={{
                                                position: "relative",
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}>
                                                {(() => {
                                                    // Clamp the LEBRON score between -10 (left) and +10 (right)
                                                    const clampedScore = Math.max(-10, Math.min(10, lebronImpact.lebron_score));
                                                    const scoreNormalized = (clampedScore + 10) / 20;
                                                    const targetAngle = 266 + (scoreNormalized * 180);
                                                    const needleAngle = needleAnimated ? targetAngle : 180;

                                                    return (
                                                        <div style={{
                                                            position: "absolute",
                                                            bottom: "20%", // Centro del semicírculo
                                                            left: "50%",
                                                            transform: "translateX(-50%)",
                                                            transformOrigin: "center bottom"
                                                        }}>
                                                            {/* CUERPO DE LA AGUJA - Más grueso en la base (MUCHO MÁS LARGO) */}
                                                            <div style={{
                                                                position: "absolute",
                                                                bottom: "0px",
                                                                left: "50%",
                                                                width: "8px",
                                                                height: "95px", // Aumentado de 75px a 95px
                                                                background: `linear-gradient(to top, ${resolvedTheme === "dark" ? "#e2e8f0" : "#374151"}, ${resolvedTheme === "dark" ? "#94a3b8" : "#6b7280"})`,
                                                                transformOrigin: "bottom center",
                                                                borderRadius: "4px 4px 1px 1px",
                                                                transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                                                                zIndex: 1,
                                                                filter: "url(#needleShadow)",
                                                                transition: needleAnimated ? "transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none"
                                                            }} />

                                                            {/* CÍRCULO BASE - Estilo metálico (LIGERAMENTE MÁS GRANDE) */}
                                                            <div style={{
                                                                position: "absolute",
                                                                bottom: "-14px", // Ajustado para el tamaño mayor
                                                                left: "50%",
                                                                transform: "translateX(-50%)",
                                                                width: "28px", // Aumentado de 24px a 28px
                                                                height: "28px", // Aumentado de 24px a 28px
                                                                background: `radial-gradient(circle at 30% 30%, ${resolvedTheme === "dark" ? "#ffffff" : "#1e293b"}, ${resolvedTheme === "dark" ? "#94a3b8" : "#6b7280"})`,
                                                                borderRadius: "50%",
                                                                zIndex: 4,
                                                                border: `2px solid ${resolvedTheme === "dark" ? "#64748b" : "#e2e8f0"}`,
                                                                boxShadow: `0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.1)`
                                                            }} />

                                                            {/* CÍRCULO INTERIOR - Efecto de profundidad (LIGERAMENTE MÁS GRANDE) */}
                                                            <div style={{
                                                                position: "absolute",
                                                                bottom: "-10px", // Ajustado para el tamaño mayor
                                                                left: "50%",
                                                                transform: "translateX(-50%)",
                                                                width: "20px", // Aumentado de 16px a 20px
                                                                height: "20px", // Aumentado de 16px a 20px
                                                                background: `radial-gradient(circle at 40% 40%, ${resolvedTheme === "dark" ? "#f1f5f9" : "#0f172a"}, ${resolvedTheme === "dark" ? "#64748b" : "#475569"})`,
                                                                borderRadius: "50%",
                                                                zIndex: 5,
                                                                boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3)`
                                                            }} />

                                                            {/* PUNTO CENTRAL (LIGERAMENTE MÁS GRANDE) */}
                                                            <div style={{
                                                                position: "absolute",
                                                                bottom: "-6px", // Ajustado para el tamaño mayor
                                                                left: "50%",
                                                                transform: "translateX(-50%)",
                                                                width: "12px", // Aumentado de 8px a 12px
                                                                height: "12px", // Aumentado de 8px a 12px
                                                                background: resolvedTheme === "dark" ? "#ef4444" : "#dc2626",
                                                                borderRadius: "50%",
                                                                zIndex: 6,
                                                                boxShadow: `0 0 6px ${resolvedTheme === "dark" ? "#ef4444" : "#dc2626"}`
                                                            }} />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Indicadores de zona */}
                                    <div className="absolute top-4 left-4 text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(0, 70%, 50%)" }}></div>
                                            <span className="text-muted-foreground">Poor</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(30, 70%, 50%)" }}></div>
                                            <span className="text-muted-foreground">Average</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(43, 70%, 50%)" }}></div>
                                            <span className="text-muted-foreground">Good</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(120, 70%, 50%)" }}></div>
                                            <span className="text-muted-foreground">Elite</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            Impact Analysis
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            Advanced metric evaluation
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Box Component</p>
                                                <p className="font-bold">
                                                    {lebronImpact ? lebronImpact.box_component.toFixed(1) : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Plus/Minus</p>
                                                <p className="font-bold">
                                                    {lebronImpact ? lebronImpact.plus_minus_component.toFixed(1) : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Percentile</p>
                                                <p className="font-bold">
                                                    {lebronImpact ? `${lebronImpact.percentile_rank.toFixed(0)}%` : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-muted-foreground">
                                        <p>
                                            <strong>LEBRON</strong> (Luck-adjusted player Estimate using Box prior Regularized ON-off)
                                            combines box score statistics with team impact metrics, adjusting for luck, context, and usage rate.
                                            Uses Bayesian regularization to weight box score vs plus/minus based on sample size.
                                        </p>
                                        <div className="flex justify-between mt-2 text-xs">
                                            <span>Games: {lebronImpact ? lebronImpact.games_played : "-"}</span>
                                            <span>Minutes/Game: {lebronImpact ? lebronImpact.minutes_per_game.toFixed(1) : "-"}</span>
                                            <span>Luck Adj: {lebronImpact ? lebronImpact.luck_adjustment.toFixed(3) : "-"}</span>
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs">
                                            <span>Context Adj: {lebronImpact ? lebronImpact.context_adjustment.toFixed(3) : "-"}</span>
                                            <span>Usage Adj: {lebronImpact ? lebronImpact.usage_adjustment.toFixed(3) : "-"}</span>
                                            <span>Percentile: {lebronImpact ? `${lebronImpact.percentile_rank.toFixed(0)}%` : "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <BarChart3 className="h-5 w-5 text-primary inline mr-2" />
                                    PIPM Impact Analysis
                                </CardTitle>
                                <CardDescription>
                                    Offensive vs Defensive PIPM by position
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {pipmpScatterData.length > 0 ? (
                                            <ScatterChart
                                                data={pipmpScatterData}
                                                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke={resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                                                    horizontal={true}
                                                    vertical={true}
                                                />
                                                <XAxis
                                                    type="number"
                                                    dataKey="offensive_pimp"
                                                    name="Offensive PIMP"
                                                    domain={[-0.5, 2.0]} // Cambiado a rango fijo
                                                    tick={{
                                                        fontSize: 12,
                                                        fill: resolvedTheme === "dark" ? "#e2e8f0" : "#475569"
                                                    }}
                                                    axisLine={{
                                                        stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                        strokeWidth: 1
                                                    }}
                                                    tickLine={{
                                                        stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                        strokeWidth: 1
                                                    }}
                                                    ticks={[-0.5, 0.0, 0.5, 1.0, 1.5, 2.0]} // Intervalos de 0.5
                                                    tickFormatter={(value) => value.toFixed(1)}
                                                    label={{
                                                        value: 'Offensive PIMP',
                                                        position: 'insideBottom',
                                                        offset: -10,
                                                        style: {
                                                            textAnchor: 'middle',
                                                            fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b"
                                                        }
                                                    }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="defensive_pimp"
                                                    name="Defensive PIMP"
                                                    domain={[-0.5, 4.0]} // Cambiado a rango fijo
                                                    tick={{
                                                        fontSize: 12,
                                                        fill: resolvedTheme === "dark" ? "#e2e8f0" : "#475569"
                                                    }}
                                                    axisLine={{
                                                        stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                        strokeWidth: 1
                                                    }}
                                                    tickLine={{
                                                        stroke: resolvedTheme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                                                        strokeWidth: 1
                                                    }}
                                                    ticks={[-0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]} // Intervalos de 0.5
                                                    tickFormatter={(value) => value.toFixed(1)}
                                                    label={{
                                                        value: 'Defensive PIMP',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        style: {
                                                            textAnchor: 'middle',
                                                            fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b"
                                                        }
                                                    }}
                                                />
                                                <Tooltip content={<PipmpScatterTooltip />} />

                                                {/* Líneas de referencia en 0 */}
                                                <ReferenceLine
                                                    x={0}
                                                    stroke={resolvedTheme === 'dark' ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                                                    strokeDasharray="2 2"
                                                />
                                                <ReferenceLine
                                                    y={0}
                                                    stroke={resolvedTheme === 'dark' ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                                                    strokeDasharray="2 2"
                                                />

                                                {/* Scatter para promedios de posiciones (mismo estilo que el primer gráfico) */}
                                                <Scatter
                                                    dataKey="offensive_pimp"
                                                    data={pipmpScatterData.filter(d => !d.is_player)}
                                                    fill="#8884d8"
                                                    shape={(props) => {
                                                        const { cx, cy, payload } = props;
                                                        return (
                                                            <circle
                                                                cx={cx}
                                                                cy={cy}
                                                                r={6}
                                                                fill={getPositionColor(payload)}
                                                                stroke={payload?.is_player_position ? 
                                                                    (resolvedTheme === "dark" ? "hsl(0, 80%, 60%)" : "hsl(0, 80%, 50%)") : 
                                                                    "none"
                                                                }
                                                                strokeWidth={payload?.is_player_position ? 3 : 0}
                                                                opacity={0.8}
                                                            />
                                                        );
                                                    }}
                                                />

                                                {/* Scatter para el jugador (más grande y destacado, mismo estilo que el primer gráfico) */}
                                                <Scatter
                                                    dataKey="offensive_pimp"
                                                    data={pipmpScatterData.filter(d => d.is_player)}
                                                    fill="#8884d8"
                                                    shape={(props) => {
                                                        const { cx, cy, payload } = props;
                                                        return (
                                                            <circle
                                                                cx={cx}
                                                                cy={cy}
                                                                r={12} // Aumentado de 10 a 12
                                                                fill={getPositionColor(payload)}
                                                                stroke="none"
                                                                strokeWidth={0}
                                                            />
                                                        );
                                                    }}
                                                />
                                            </ScatterChart>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">Loading PIPM data...</p>
                                            </div>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            {/* Añadir leyenda como en el primer gráfico */}
                            <div className="px-6 pb-4">
                                <div className="flex flex-wrap justify-center gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(270, 70%, 50%)" }}></div>
                                        <span>Point Guard</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(195, 70%, 50%)" }}></div>
                                        <span>Shooting Guard</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(120, 70%, 50%)" }}></div>
                                        <span>Small Forward</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(45, 70%, 50%)" }}></div>
                                        <span>Power Forward</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(15, 70%, 50%)" }}></div>
                                        <span>Center</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: resolvedTheme === "dark" ? "hsl(0, 80%, 60%)" : "hsl(214, 80%, 55%)" }}></div>
                                        <span>Current Player</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border-2" style={{ 
                                            backgroundColor: resolvedTheme === "dark" ? "#0f172a" : "#f8fafc", 
                                            borderColor: resolvedTheme === "dark" ? "hsl(0, 80%, 60%)" : "hsl(0, 80%, 50%)" 
                                        }}></div>
                                        <span>Player's Position Average</span>
                                    </div>
                                </div>
                            </div>

                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">PIPM Breakdown</h3>
                                        <span className="text-xs text-muted-foreground">
                                            {pipmpImpact?.games_played} games • {pipmpImpact?.usage_rate?.toFixed(1)}% usage
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total PIPM</p>
                                                <p className="font-bold">{pipmpImpact?.total_pipm?.toFixed(2) || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Offensive</p>
                                                <p className="font-bold">{pipmpImpact?.offensive_pimp?.toFixed(2) || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Defensive</p>
                                                <p className="font-bold">{pipmpImpact?.defensive_pimp?.toFixed(2) || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* ...rest of existing cards... */}
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