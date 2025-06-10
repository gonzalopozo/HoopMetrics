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
    Shield,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, getNBALogo } from "@/lib/utils"
import { TeamDetails } from "@/types"
import { ResponsiveContainer, AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, LineChart, Line, PieChart, Pie, RadarChart as ReRadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar } from "recharts"
import axios from "axios"
import { useTheme } from "next-themes"
import { CardFooter } from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
} from "@/components/ui/chart";
// Al inicio del archivo team-tabs.tsx, agregar estos imports de lucide-react
import {
    // ... otros imports existentes
    Maximize,
    Zap,
    Brain,
    Shuffle,
} from "lucide-react"
import {
    // ... otros imports de recharts existentes
    Cell
} from "recharts"


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

interface Game {
    id: number
    date: string
    home_team_id: number
    away_team_id: number
    home_team_name: string
    away_team_name: string
    home_score: number
    away_score: number
    status: string
    rival_team_abbreviation: string
}

interface Player {
    id: number
    name: string
    position: string
    number: number
    height: number
    weight: number
    url_pic?: string
    stats: {
        ppg: number
        rpg: number
        apg: number
    }
}

export default function TeamTabs({ team }: { team: TeamDetails }) {
    const [, setActiveTab] = useState("overview")
    const [userRole, setUserRole] = useState<string>("free")
    const [pointsVsOpponent, setPointsVsOpponent] = useState<{ date: string; points_for: number; points_against: number }[]>([])

    const isPremium = userRole === "premium" || userRole === "ultimate" || userRole === "admin"
    const isUltimate = userRole === "ultimate" || userRole === "admin"

    const [pointsProgression, setPointsProgression] = useState<{ date: string; points: number }[]>([])
    const [teamPointsType, setTeamPointsType] = useState<{ two_points: number; three_points: number; free_throws: number } | null>(null)
    const { resolvedTheme } = useTheme()
    const [teamRadarProfile, setTeamRadarProfile] = useState<{ points: number; rebounds: number; assists: number; steals: number; blocks: number } | null>(null)
    const [teamShootingVolume, setTeamShootingVolume] = useState<{ name: string; value: number }[] | null>(null)
    const [playersContribution, setPlayersContribution] = useState<{ player_name: string; points: number; percentage: number }[]>([])
    const [teamEfficiencyRating, setTeamEfficiencyRating] = useState<{
        offensive_efficiency: number;
        defensive_efficiency: number;
        pace_factor: number;
        strength_of_schedule: number;
        clutch_factor: number;
        consistency_index: number;
        taer_score: number;
    } | null>(null);
    const [momentumResilience, setMomentumResilience] = useState<{
        lead_protection_rate: number;
        comeback_frequency: number;
        streak_resilience: number;
        pressure_performance: number;
        fourth_quarter_factor: number;
        psychological_edge: number;
        tmpri_score: number;
        close_game_record: number;
    } | null>(null);

    // En team-tabs.tsx, agregar este estado junto con los otros estados de ultimate
    const [tacticalAdaptability, setTacticalAdaptability] = useState<{
        pace_adaptability: number;
        size_adjustment: number;
        style_counter_effect: number;
        strategic_variety_index: number;
        anti_meta_performance: number;
        coaching_intelligence: number;
        ttaq_score: number;
        opponent_fg_influence: number;
    } | null>(null);

    const [clutchDNAProfile, setClutchDNAProfile] = useState<{
        multi_scenario_clutch: number;
        pressure_shooting: number;
        decision_making_pressure: number;
        star_player_factor: number;
        collective_clutch_iq: number;
        pressure_defense: number;
        clutch_dna_score: number;
        overtime_performance: number;
    } | null>(null);

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

    useEffect(() => {
        if (!isPremium) return
        axios
            .get<{ name: string; value: number }[]>(
                `${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/basicstats/shootingvolume`
            )
            .then(res => setTeamShootingVolume(res.data))
            .catch(() => setTeamShootingVolume(null))
    }, [team.id, isPremium])

    useEffect(() => {
        if (!isPremium) return
        axios
            .get<{ player_name: string; points: number; percentage: number }[]>(
                `${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/basicstats/playerscontribution`
            )
            .then(res => setPlayersContribution(res.data))
            .catch(() => setPlayersContribution([]))
    }, [team.id, isPremium])

    useEffect(() => {
        if (!isUltimate) return
        axios
            .get<{
                offensive_efficiency: number;
                defensive_efficiency: number;
                pace_factor: number;
                strength_of_schedule: number;
                clutch_factor: number;
                consistency_index: number;
                taer_score: number;
            }>(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/advanced/efficiency-rating`)
            .then(res => setTeamEfficiencyRating(res.data))
            .catch(() => setTeamEfficiencyRating(null))
    }, [team.id, isUltimate])

    useEffect(() => {
        if (!isUltimate) return
        axios
            .get(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/advanced/momentum-resilience-index`)
            .then(res => setMomentumResilience(res.data))
            .catch(() => setMomentumResilience(null))
    }, [team.id, isUltimate])

    // En team-tabs.tsx, agregar este useEffect junto con los otros de ultimate
    useEffect(() => {
        if (!isUltimate) return
        axios
            .get(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/advanced/tactical-adaptability`)
            .then(res => setTacticalAdaptability(res.data))
            .catch(() => setTacticalAdaptability(null))
    }, [team.id, isUltimate])

    useEffect(() => {
        if (!isUltimate) return
        axios
            .get(`${process.env.NEXT_PUBLIC_API_URL}/teams/${team.id}/advanced/clutch-dna-profile`)
            .then(res => setClutchDNAProfile(res.data))
            .catch(() => setClutchDNAProfile(null))
    }, [team.id, isUltimate])

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
    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string }; value: number }> }) => {
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
    const PointsVsOpponentTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; points_for: number; points_against: number }; value: number }> }) => {
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
    const TeamRadarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { skill: string; original: number } }> }) => {
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

    // Calcular estadísticas para el volumen de tiro
    const getTeamShootingVolumeStats = () => {
        if (!teamShootingVolume) return { mostAttempted: "-", totalAttempts: 0, shootingStyle: "-" }

        const fga = teamShootingVolume.find(d => d.name === "FGA")?.value || 0
        const tpa = teamShootingVolume.find(d => d.name === "3PA")?.value || 0
        const fta = teamShootingVolume.find(d => d.name === "FTA")?.value || 0

        const totalAttempts = fga + tpa + fta
        if (!totalAttempts) return { mostAttempted: "-", totalAttempts: 0, shootingStyle: "-" }

        const categories = [
            { label: "Field Goals", value: fga },
            { label: "3-Pointers", value: tpa },
            { label: "Free Throws", value: fta },
        ]

        const mostAttempted = categories.reduce((a, b) => (a.value > b.value ? a : b))

        // Determinar estilo de juego basado en ratios
        let shootingStyle = "Balanced"
        const tpaRatio = (tpa / fga) * 100
        const ftaRatio = (fta / fga) * 100

        if (tpaRatio > 45) shootingStyle = "3-Point Heavy"
        else if (tpaRatio < 25) shootingStyle = "Inside Focused"
        else if (ftaRatio > 30) shootingStyle = "Aggressive"

        return {
            mostAttempted: `${mostAttempted.label} (${mostAttempted.value.toFixed(1)})`,
            totalAttempts: parseFloat(totalAttempts.toFixed(1)),
            shootingStyle,
        }
    }
    const teamShootingVolumeStats = getTeamShootingVolumeStats()

    // Procesar datos para el gráfico stacked bar
    const top5 = playersContribution.slice(0, 5)
    const restTotal = playersContribution.slice(5).reduce((sum, p) => sum + p.percentage, 0)
    const stackedBarData = [
        {
            name: "Points Contribution",
            ...Object.fromEntries(top5.map((p, i) => [`${i + 1}. ${p.player_name}`, p.percentage])),
            Rest: restTotal,
        }
    ]
    const barKeys = top5.map((p, i) => `${i + 1}. ${p.player_name}`).concat("Rest")

    // Colores para cada barra
    const barColors = [
        resolvedTheme === "dark" ? "#4273ff" : "#1e40af",
        resolvedTheme === "dark" ? "#6ea8ff" : "#2563eb",
        resolvedTheme === "dark" ? "#a3c9ff" : "#60a5fa",
        resolvedTheme === "dark" ? "#ffb3b3" : "#f87171",
        resolvedTheme === "dark" ? "#ff7b7b" : "#ef4444",
        resolvedTheme === "dark" ? "#d6e6ff" : "#a3a3a3", // Rest
    ]

    // Tooltip personalizado
    const ContributionTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: Record<string, number> }> }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    {payload[0].payload &&
                        barKeys.map((key, idx) =>
                            payload[0].payload[key] > 0 ? (
                                <div key={key} className="flex items-center gap-2">
                                    <span
                                        className="inline-block w-3 h-3 rounded-sm"
                                        style={{ background: barColors[idx] }}
                                    />
                                    <span className="font-medium">{key}</span>
                                    <span className="ml-2 text-primary font-bold">{payload[0].payload[key].toFixed(1)}%</span>
                                </div>
                            ) : null
                        )
                    }
                </div>
            )
        }
        return null
    }

    const efficiencyRadarData = teamEfficiencyRating ? [
        {
            component: "Offensive",
            value: Math.min((teamEfficiencyRating.offensive_efficiency / 130) * 100, 100), // Normalizar basado en rango típico NBA (100-130)
            original: teamEfficiencyRating.offensive_efficiency,
            unit: "per 100 poss"
        },
        {
            component: "Defensive",
            value: Math.min(((120 - teamEfficiencyRating.defensive_efficiency) / 20) * 100, 100), // Invertir: rango 100-120, menor es mejor
            original: teamEfficiencyRating.defensive_efficiency,
            unit: "per 100 poss"
        },
        {
            component: "Pace",
            value: Math.min(Math.abs(1 - teamEfficiencyRating.pace_factor) * 100, 100), // Cercanía a 1.0 es mejor
            original: teamEfficiencyRating.pace_factor,
            unit: "factor"
        },
        {
            component: "Schedule",
            value: teamEfficiencyRating.strength_of_schedule, // Ya viene normalizado 0-100
            original: teamEfficiencyRating.strength_of_schedule,
            unit: "/100"
        },
        {
            component: "Clutch",
            value: teamEfficiencyRating.clutch_factor * 100, // Convertir 0-1 a 0-100
            original: teamEfficiencyRating.clutch_factor,
            unit: "win rate"
        },
        {
            component: "Consistency",
            value: teamEfficiencyRating.consistency_index * 100, // Convertir 0-1 a 0-100
            original: teamEfficiencyRating.consistency_index,
            unit: "index"
        }
    ] : [];

    // Tooltip personalizado para el radar de eficiencia - CORREGIDO
    const EfficiencyRadarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { component: string; original: number; unit: string } }> }) => {
        if (active && payload && payload.length) {
            const { component, original, unit } = payload[0].payload;
            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">{component}</p>
                    <p className="text-base font-bold text-primary mt-1">
                        {component === "Offensive" || component === "Defensive"
                            ? `${original?.toFixed(1)} ${unit}`
                            : component === "Pace"
                                ? `${original?.toFixed(2)} ${unit}`
                                : component === "Schedule"
                                    ? `${original?.toFixed(1)}${unit}`
                                    : component === "Clutch"
                                        ? `${(original * 100)?.toFixed(1)}%`
                                        : `${(original * 100)?.toFixed(1)}%`
                        }
                    </p>
                </div>
            );
        }
        return null;
    };

    // Simular histórico de TMPRI si solo tienes el valor actual
    const tmpriHistory = momentumResilience
        ? Array.from({ length: 10 }).map((_, i) => ({
            game: `G${i + 1}`,
            tmpri: Math.max(20, Math.min(85, momentumResilience.tmpri_score + (Math.random() - 0.5) * 10)),
            fourth_quarter: Math.max(-10, Math.min(10, momentumResilience.fourth_quarter_factor + (Math.random() - 0.5) * 4)),
        }))
        : []

    const resilienceFactors = momentumResilience
        ? [
            { name: "Lead Protection", value: momentumResilience.lead_protection_rate },
            { name: "Comeback", value: momentumResilience.comeback_frequency },
            { name: "Streak Resilience", value: momentumResilience.streak_resilience },
            { name: "Pressure Perf.", value: momentumResilience.pressure_performance },
            { name: "4Q Factor", value: momentumResilience.fourth_quarter_factor },
            { name: "Psych. Edge", value: momentumResilience.psychological_edge },
            { name: "Close Game", value: momentumResilience.close_game_record },
        ]
        : []

    // En team-tabs.tsx, después de las otras funciones de procesamiento de datos
    // Datos para el polar area chart de adaptabilidad táctica
    const tacticalAdaptabilityData = tacticalAdaptability ? [
        {
            name: "Pace Adaptability",
            value: tacticalAdaptability.pace_adaptability,
            fill: resolvedTheme === "dark" ? "hsl(210, 70%, 60%)" : "hsl(210, 70%, 50%)",
        },
        {
            name: "Size Adjustment",
            value: tacticalAdaptability.size_adjustment,
            fill: resolvedTheme === "dark" ? "hsl(240, 70%, 60%)" : "hsl(240, 70%, 50%)",
        },
        {
            name: "Style Counter",
            value: tacticalAdaptability.style_counter_effect,
            fill: resolvedTheme === "dark" ? "hsl(270, 70%, 60%)" : "hsl(270, 70%, 50%)",
        },
        {
            name: "Strategic Variety",
            value: tacticalAdaptability.strategic_variety_index,
            fill: resolvedTheme === "dark" ? "hsl(300, 70%, 60%)" : "hsl(300, 70%, 50%)",
        },
        {
            name: "Anti-Meta",
            value: tacticalAdaptability.anti_meta_performance,
            fill: resolvedTheme === "dark" ? "hsl(330, 70%, 60%)" : "hsl(330, 70%, 50%)",
        },
        {
            name: "Coaching IQ",
            value: tacticalAdaptability.coaching_intelligence,
            fill: resolvedTheme === "dark" ? "hsl(0, 70%, 60%)" : "hsl(0, 70%, 50%)",
        },
        {
            name: "FG Influence",
            value: Math.abs(tacticalAdaptability.opponent_fg_influence) * 10, // Escalar para visualización
            fill: resolvedTheme === "dark" ? "hsl(30, 70%, 60%)" : "hsl(30, 70%, 50%)",
        },
        {
            name: "Overall TTAQ",
            value: tacticalAdaptability.ttaq_score,
            fill: resolvedTheme === "dark" ? "hsl(60, 70%, 60%)" : "hsl(60, 70%, 50%)",
        }
    ] : [];

    // Tooltip personalizado para tactical adaptability
    const TacticalAdaptabilityTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0].payload;
            const originalValue = tacticalAdaptability ? (() => {
                switch (name) {
                    case "Pace Adaptability": return tacticalAdaptability.pace_adaptability;
                    case "Size Adjustment": return tacticalAdaptability.size_adjustment;
                    case "Style Counter": return tacticalAdaptability.style_counter_effect;
                    case "Strategic Variety": return tacticalAdaptability.strategic_variety_index;
                    case "Anti-Meta": return tacticalAdaptability.anti_meta_performance;
                    case "Coaching IQ": return tacticalAdaptability.coaching_intelligence;
                    case "FG Influence": return tacticalAdaptability.opponent_fg_influence;
                    case "Overall TTAQ": return tacticalAdaptability.ttaq_score;
                    default: return value;
                }
            })() : value;

            return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-base font-bold text-primary mt-1">
                        {name === "FG Influence"
                            ? `${originalValue > 0 ? '+' : ''}${originalValue.toFixed(1)}%`
                            : `${originalValue.toFixed(1)}/100`
                        }
                    </p>
                </div>
            );
        }
        return null;
    };

    // Reemplaza la función DNAScoreRadial con esto:
    const DNAScoreRadial = ({ score }: { score: number }) => {
        const getScoreColor = () => {
            if (score >= 75) return "#10b981";
            if (score >= 60) return "#3b82f6";
            if (score >= 45) return "#f59e0b";
            return "#ef4444";
        };

        const getScoreLabel = () => {
            if (score >= 75) return "KILLER";
            if (score >= 60) return "CLUTCH";
            if (score >= 45) return "SOLID";
            return "CHOKE";
        };

        // Datos para el pie chart simple
        const pieData = [
            {
                name: "score",
                value: score,
                fill: getScoreColor()
            },
            {
                name: "remaining",
                value: 100 - score,
                fill: "var(--muted)",
                opacity: 0.2
            }
        ];

        return (
            <div className="relative flex items-center justify-center">
                <div style={{ width: 180, height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                innerRadius={65}
                                outerRadius={85}
                                stroke="none"
                                className="outline-none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill}
                                        fillOpacity={entry.opacity || 1}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Center content superpuesto */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                        className="text-3xl font-black mb-1"
                        style={{ color: getScoreColor() }}
                    >
                        {score.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        DNA SCORE
                    </div>
                    <div
                        className="text-sm font-black mt-1 uppercase tracking-wide"
                        style={{ color: getScoreColor() }}
                    >
                        {getScoreLabel()}
                    </div>

                    {/* Borde brillante adicional */}
                    <div
                        className="absolute inset-0 rounded-full border-2 opacity-30"
                        style={{
                            borderColor: getScoreColor(),
                            width: 130,
                            height: 130,
                            top: 25,
                            left: 25
                        }}
                    />
                </div>
            </div>
        );
    };

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
                                {team.recent_games.slice(0, 5).map((game: Game) => {
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
                            {team.players.slice(0, 4).map((player: Player) => (
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
                                    {team.players.map((player: Player) => (
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
                            {team.upcoming_games.slice(0, 5).map((game: Game) => (
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
                                    {team.recent_games.slice(0, 5).map((game: Game) => {
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
                                <div style={{ width: "100%", height: 300 }}>
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
                                <div style={{ width: "100%", height: 300 }}>
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

                        {/* Cuarto gráfico - Team Profile */}
                        <Card className="flex flex-col">
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
                                        <ReRadarChart
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
                                        </ReRadarChart>
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

                        {/* Quinto gráfico - Team Shooting Volume */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <Target className="h-5 w-5 text-primary inline mr-2" />
                                    Shooting Volume
                                </CardTitle>
                                <CardDescription>
                                    Average shot attempts per game by type
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {teamShootingVolume && teamShootingVolume.length > 0 ? (
                                            <BarChart
                                                data={teamShootingVolume}
                                                layout="vertical"
                                                margin={{ top: 16, right: 16, left: 60, bottom: 16 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    type="number"
                                                    tick={{ fontSize: 12, fill: "var(--foreground)" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fontSize: 12, fill: "var(--foreground)" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={1}

                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const { name, value } = payload[0].payload
                                                            return (
                                                                <div className="rounded-lg border bg-card p-3 shadow-md">
                                                                    <p className="font-medium text-sm">{name}</p>
                                                                    <p className="text-base font-bold text-primary mt-1">
                                                                        {value.toFixed(1)} per game
                                                                    </p>
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    fill={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                    radius={[0, 4, 4, 0]}
                                                />
                                            </BarChart>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">No shooting volume data available</p>
                                            </div>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name}'s Shooting Habits`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {teamShootingVolume ? "Per game averages" : "No data"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Most Attempted</p>
                                                <p className="font-bold">
                                                    {teamShootingVolumeStats.mostAttempted}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total Volume</p>
                                                <p className="font-bold">
                                                    {teamShootingVolumeStats.totalAttempts} attempts/game
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Playing Style</p>
                                                <p className="font-bold">
                                                    {teamShootingVolumeStats.shootingStyle}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <BarChart3 className="h-5 w-5 text-primary inline mr-2" />
                                    Points Distribution (Top 5 vs Rest)
                                </CardTitle>
                                <CardDescription>
                                    Star dependency vs team balance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: "100%", height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {playersContribution.length >  0 ? (
                                            <BarChart
                                                data={stackedBarData}
                                                layout="vertical"
                                                margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                                                barCategoryGap={40}
                                            >
                                                <XAxis
                                                    type="number"
                                                    domain={[0, 100]}
                                                    tickFormatter={v => `${Math.round(v)}%`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: "var(--foreground)" }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={0}
                                                />
                                                <Tooltip cursor={{ fill: "transparent" }} offset={20} allowEscapeViewBox={{ x: false, y: true }} content={<ContributionTooltip />} />
                                                {barKeys.map((key, idx) => (
                                                    <Bar
                                                        key={key}
                                                        dataKey={key}
                                                        stackId="a"
                                                        fill={barColors[idx]}
                                                        radius={idx === barKeys.length - 1 ? [0, 4, 4, 0] : 0}
                                                        isAnimationActive={false}
                                                    />
                                                ))}
                                            </BarChart>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-muted-foreground">No contribution data available</p>
                                            </div>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name || "Team"}'s Scoring Dependency`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {playersContribution.length} players analyzed
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Top Scorer</p>
                                                <p className="font-bold">
                                                    {playersContribution[0]
                                                        ? `${playersContribution[0].player_name} (${playersContribution[0].percentage.toFixed(1)}%)`
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Top 5 Share</p>
                                                <p className="font-bold">
                                                    {top5.reduce((sum, p) => sum + p.percentage, 0).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Rest of Team</p>
                                                <p className="font-bold">
                                                    {restTotal.toFixed(1)}%
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Team Advanced Efficiency Rating */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>
                                    <Activity className="h-5 w-5 text-primary inline mr-2" />
                                    Team Advanced Efficiency Rating (TAER)
                                </CardTitle>
                                <CardDescription>
                                    Comprehensive efficiency analysis combining offensive/defensive performance with contextual factors
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* TAER Score Gauge - SOLUCION CON PIE CHART SEMICIRCULAR */}
                                    {/* TAER Score Gauge - POSICIONAMIENTO CORREGIDO */}
                                    {/* TAER Score Gauge - POSICIONAMIENTO CORREGIDO CON TAILWIND */}
                                    {/* TAER Score Gauge - POSICIONAMIENTO CORREGIDO CON TAILWIND */}
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-lg font-semibold mb-4">Overall TAER Score</h3>
                                        <div className="relative w-full h-[300px] flex items-end justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                {teamEfficiencyRating ? (
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                {
                                                                    name: "TAER Score",
                                                                    value: teamEfficiencyRating.taer_score,
                                                                    fill: (() => {
                                                                        const score = teamEfficiencyRating.taer_score;
                                                                        if (score >= 80) return resolvedTheme === "dark" ? "#22c55e" : "#16a34a"; // Verde
                                                                        if (score >= 65) return resolvedTheme === "dark" ? "#eab308" : "#ca8a04"; // Amarillo
                                                                        if (score >= 45) return resolvedTheme === "dark" ? "#f97316" : "#ea580c"; // Naranja
                                                                        return resolvedTheme === "dark" ? "#ef4444" : "#dc2626"; // Rojo
                                                                    })()
                                                                },
                                                                {
                                                                    name: "Empty",
                                                                    value: 100 - teamEfficiencyRating.taer_score,
                                                                    fill: resolvedTheme === "dark" ? "#333333" : "#eeeeee" // Fondo gris
                                                                }
                                                            ]}
                                                            cx="50%"
                                                            cy="70%"
                                                            startAngle={180}
                                                            endAngle={0}
                                                            innerRadius="65%"
                                                            outerRadius="95%"
                                                            dataKey="value"
                                                            stroke="none"
                                                        />
                                                    </PieChart>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-muted-foreground">Loading TAER data...</p>
                                                    </div>
                                                )}
                                            </ResponsiveContainer>

                                            {/* Texto centrado en el gauge */}
                                            {teamEfficiencyRating && (
                                                <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                                                    <div className="text-4xl font-bold text-foreground">
                                                        {Math.round(teamEfficiencyRating.taer_score)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground font-medium">
                                                        TAER Score
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Components Radar */}
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-lg font-semibold mb-4">Efficiency Components</h3>
                                        <div style={{ width: "100%", height: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                {efficiencyRadarData.length > 0 ? (
                                                    <ReRadarChart
                                                        data={efficiencyRadarData}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                                    >
                                                        <PolarGrid />
                                                        <PolarAngleAxis
                                                            dataKey="component"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: "var(--foreground)",
                                                            }}
                                                            tickLine={false}
                                                        />
                                                        <PolarRadiusAxis
                                                            domain={[0, 100]}
                                                            angle={90}
                                                            tick={false}
                                                        />
                                                        <Radar
                                                            dataKey="value"
                                                            fill={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                            fillOpacity={0.3}
                                                            stroke={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                            strokeWidth={2}
                                                            dot={{ r: 4, fillOpacity: 1 }}
                                                        />
                                                        <Tooltip content={<EfficiencyRadarTooltip />} />
                                                    </ReRadarChart>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-muted-foreground">Loading components data...</p>
                                                    </div>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name}'s Advanced Efficiency Breakdown`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {teamEfficiencyRating ?
                                                `${teamEfficiencyRating.taer_score >= 80 ? "Elite" :
                                                    teamEfficiencyRating.taer_score >= 65 ? "Good" :
                                                        teamEfficiencyRating.taer_score >= 45 ? "Average" : "Poor"} Rating`
                                                : "No data"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Offensive Rating</p>
                                                <p className="font-bold">
                                                    {teamEfficiencyRating ?
                                                        `${teamEfficiencyRating.offensive_efficiency.toFixed(1)} per 100` : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Defensive Rating</p>
                                                <p className="font-bold">
                                                    {teamEfficiencyRating ?
                                                        `${teamEfficiencyRating.defensive_efficiency.toFixed(1)} per 100` : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Clutch Performance</p>
                                                <p className="font-bold">
                                                    {teamEfficiencyRating ?
                                                        `${(teamEfficiencyRating.clutch_factor * 100).toFixed(1)}%` : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-muted-foreground">
                                        <p>
                                            <strong>TAER (Team Advanced Efficiency Rating)</strong> combines offensive/defensive efficiency
                                            with pace, strength of schedule, clutch performance, and consistency factors.
                                        </p>
                                        <div className="flex justify-between mt-2 text-xs">
                                            <span>Pace Factor: {teamEfficiencyRating ? `${(teamEfficiencyRating.pace_factor * 100).toFixed(1)}%` : "-"}</span>
                                            <span>Schedule Strength: {teamEfficiencyRating ? `${teamEfficiencyRating.strength_of_schedule.toFixed(1)}/100` : "-"}</span>
                                            <span>Consistency: {teamEfficiencyRating ? `${(teamEfficiencyRating.consistency_index * 100).toFixed(1)}%` : "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>
                                    <Shield className="h-5 w-5 text-primary inline mr-2" />
                                    Team Momentum & Resilience Index (TMPRI)
                                </CardTitle>
                                <CardDescription>
                                    Mental strength, clutch performance and resilience under pressure
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Line Chart: TMPRI Score & 4Q Factor */}
                                    <div>
                                        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            Momentum Swings (Simulated)
                                        </h3>
                                        <div style={{ width: "100%", height: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                {tmpriHistory.length > 0 ? (
                                                    <LineChart data={tmpriHistory}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="game" />
                                                        <YAxis domain={[0, 100]} />
                                                        <Tooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    return (
                                                                        <div className="rounded-lg border bg-card p-3 shadow-md">
                                                                            <p className="font-medium text-sm">{payload[0].payload.game}</p>
                                                                            <p className="text-base font-bold text-primary mt-1">
                                                                                TMPRI: {payload[0].payload.tmpri.toFixed(1)}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {`4Q Factor: ${payload[0].payload.fourth_quarter.toFixed(1)}`}
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                }
                                                                return null
                                                            }}
                                                        />
                                                        <Line type="monotone" dataKey="tmpri" stroke={resolvedTheme === "dark" ? "#10b981" : "#1e40af"} strokeWidth={3} dot />
                                                        <Line type="monotone" dataKey="fourth_quarter" stroke={resolvedTheme === "dark" ? "#f59e42" : "#f59e42"} strokeDasharray="4 4" strokeWidth={2} dot />
                                                    </LineChart>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-muted-foreground">Loading TMPRI data...</p>
                                                    </div>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    {/* Bar Chart: Resilience Factors */}
                                    <div>
                                        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            Resilience Factors
                                        </h3>
                                        <div style={{ width: "100%", height: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                {resilienceFactors.length > 0 ? (
                                                    <BarChart data={resilienceFactors}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                        <YAxis domain={[0, 100]} />
                                                        <Tooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    return (
                                                                        <div className="rounded-lg border bg-card p-3 shadow-md">
                                                                            <p className="font-medium text-sm">{payload[0].payload.name}</p>
                                                                            <p className="text-base font-bold text-primary mt-1">
                                                                                {payload[0].payload.value.toFixed(1)}
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                }
                                                                return null
                                                            }}
                                                        />
                                                        <Bar dataKey="value" fill={resolvedTheme === "dark" ? "#4273ff" : "#1e40af"} radius={[6, 6, 0, 0]} />
                                                    </BarChart>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-muted-foreground">Loading resilience data...</p>
                                                    </div>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">
                                            {`${team.full_name || "Team"}'s Mental Resilience Breakdown`}
                                        </h3>
                                        <span className="text-xs text-muted-foreground">
                                            {momentumResilience ? `TMPRI Score: ${momentumResilience.tmpri_score.toFixed(1)}` : "No data"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Lead Protection</p>
                                                <p className="font-bold">{momentumResilience?.lead_protection_rate?.toFixed(1) ?? "-"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="h-4 w-4 text-destructive" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Comeback Frequency</p>
                                                <p className="font-bold">{momentumResilience?.comeback_frequency?.toFixed(1) ?? "-"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Streak Resilience</p>
                                                <p className="font-bold">{momentumResilience?.streak_resilience?.toFixed(1) ?? "-"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">4Q Factor</p>
                                                <p className="font-bold">{momentumResilience?.fourth_quarter_factor?.toFixed(1) ?? "-"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-muted-foreground">
                                        <p>
                                            <strong>{`TMPRI (Team Momentum & Resilience Index)`}</strong> {`measures the team's ability to maintain performance`}
                                            and composure in high-pressure situations, particularly in the clutch moments of the game.
                                        </p>
                                        <div className="flex justify-between mt-2 text-xs">
                                            <span>Pressure Perf.: {momentumResilience ? `${momentumResilience.pressure_performance.toFixed(1)}` : "-"}</span>
                                            <span>Psych. Edge: {momentumResilience ? `${momentumResilience.psychological_edge.toFixed(1)}` : "-"}</span>
                                            <span>Close Game Record: {momentumResilience ? `${momentumResilience.close_game_record.toFixed(1)}` : "-"}</span>
                                            <span>TMPRI Score: {momentumResilience ? `${momentumResilience.tmpri_score.toFixed(1)}` : "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Team Tactical Adaptability Quotient */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>
                                    <Target className="h-5 w-5 text-primary inline mr-2" />
                                    Team Tactical Adaptability Quotient (TTAQ)
                                </CardTitle>
                                <CardDescription>
                                    {`Team's ability to adapt playing style against different opponents and situations`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Polar Area Chart */}
                                    {/* Alternativa con múltiples radares para simular polar area */}
                                    <div className="flex flex-col">
                                        <div style={{ width: "100%", height: 400 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                {tacticalAdaptabilityData.length > 0 ? (
                                                    <ReRadarChart
                                                        data={tacticalAdaptabilityData.map((item, index) => ({
                                                            name: item.name,
                                                            value: item.value,
                                                            // Crear datos individuales para cada métrica
                                                            [`metric_${index}`]: item.value
                                                        }))}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                                    >
                                                        <PolarGrid />
                                                        <PolarAngleAxis
                                                            dataKey="name"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b"
                                                            }}
                                                        />
                                                        <PolarRadiusAxis
                                                            angle={0}
                                                            domain={[0, 100]}
                                                            tick={{
                                                                fontSize: 10,
                                                                fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b"
                                                            }}
                                                        />
                                                        {/* Radar principal con todos los datos */}
                                                        <Radar
                                                            dataKey="value"
                                                            stroke={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                            fill={resolvedTheme === "dark" ? "hsl(0, 80%, 50%)" : "hsl(214, 80%, 55%)"}
                                                            fillOpacity={0.4}
                                                            strokeWidth={2}
                                                            dot={{
                                                                r: 6,
                                                                fillOpacity: 1,
                                                                fill: resolvedTheme === "dark" ? "hsl(0, 80%, 60%)" : "hsl(214, 80%, 60%)"
                                                            }}
                                                        />
                                                        <Tooltip content={<TacticalAdaptabilityTooltip />} />
                                                    </ReRadarChart>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-muted-foreground">Loading tactical adaptability data...</p>
                                                    </div>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Metrics Breakdown */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Pace Adaptability</p>
                                                    <p className="font-bold">
                                                        {tacticalAdaptability
                                                            ? `${tacticalAdaptability.pace_adaptability.toFixed(1)}/100`
                                                            : "N/A"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Maximize className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Size Adjustment</p>
                                                    <p className="font-bold">
                                                        {tacticalAdaptability
                                                            ? `${tacticalAdaptability.size_adjustment.toFixed(1)}/100`
                                                            : "N/A"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Style Counter</p>
                                                    <p className="font-bold">
                                                        {tacticalAdaptability
                                                            ? `${tacticalAdaptability.style_counter_effect.toFixed(1)}/100`
                                                            : "N/A"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Anti-Meta</p>
                                                    <p className="font-bold">
                                                        {tacticalAdaptability
                                                            ? `${tacticalAdaptability.anti_meta_performance.toFixed(1)}/100`
                                                            : "N/A"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Coaching Intelligence</p>
                                                    <p className="font-bold">
                                                        {tacticalAdaptability
                                                            ? `${tacticalAdaptability.coaching_intelligence.toFixed(1)}/100`
                                                            : "N/A"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Opponent FG Impact</p>
                                                    <p className="font-bold">
                                                        {tacticalAdaptability
                                                            ? `${tacticalAdaptability.opponent_fg_influence > 0 ? '+' : ''}${tacticalAdaptability.opponent_fg_influence.toFixed(1)}%`
                                                            : "N/A"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-sm">Team Tactical Flexibility Analysis</h3>
                                        <span className="text-xs text-muted-foreground">
                                            TTAQ Score: {tacticalAdaptability ? `${tacticalAdaptability.ttaq_score.toFixed(1)}/100` : "N/A"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Shuffle className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Strategic Variety</p>
                                                <p className="font-bold">
                                                    {tacticalAdaptability
                                                        ? (() => {
                                                            const variety = tacticalAdaptability.strategic_variety_index;
                                                            if (variety >= 80) return "Highly Versatile";
                                                            if (variety >= 60) return "Adaptable";
                                                            if (variety >= 40) return "Moderately Flexible";
                                                            return "Predictable";
                                                        })()
                                                        : "N/A"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Overall Rating</p>
                                                <p className="font-bold">
                                                    {tacticalAdaptability
                                                        ? (() => {
                                                            const score = tacticalAdaptability.ttaq_score;
                                                            if (score >= 75) return "Elite Adaptability";
                                                            if (score >= 60) return "Good Flexibility";
                                                            if (score >= 45) return "Average";
                                                            return "Limited Adaptability";
                                                        })()
                                                        : "N/A"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Game Adjustments</p>
                                                <p className="font-bold">
                                                    {tacticalAdaptability
                                                        ? (() => {
                                                            const coaching = tacticalAdaptability.coaching_intelligence;
                                                            if (coaching >= 70) return "Excellent";
                                                            if (coaching >= 55) return "Good";
                                                            if (coaching >= 40) return "Adequate";
                                                            return "Slow to Adjust";
                                                        })()
                                                        : "N/A"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-muted-foreground">
                                        <p>
                                            <strong>{`Team Tactical Adaptability Quotient`}</strong> {`measures the team's ability to modify their playing style`}
                                            based on opponent strengths, game situations, and league trends. Higher scores indicate better strategic flexibility.
                                        </p>
                                        <div className="flex justify-between mt-2 text-xs">
                                            <span>Pace Variance: {tacticalAdaptability ? tacticalAdaptability.pace_adaptability.toFixed(1) : "-"}</span>
                                            <span>Meta Counter: {tacticalAdaptability ? tacticalAdaptability.anti_meta_performance.toFixed(1) : "-"}</span>
                                            <span>Strategic Depth: {tacticalAdaptability ? tacticalAdaptability.strategic_variety_index.toFixed(1) : "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Team Clutch DNA Profile - COMPLETAMENTE REDISEÑADO */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>
                                    <Zap className="h-5 w-5 text-primary inline mr-2" />
                                    Team Clutch DNA Profile
                                </CardTitle>
                                <CardDescription>
                                    Comprehensive clutch performance analysis across multiple pressure scenarios
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left: DNA Score Radial - MÁS AGRESIVO */}
                                    <div className="flex flex-col items-center space-y-6">
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold mb-2">CLUTCH DNA</h3>
                                            <p className="text-xs text-muted-foreground mb-4">Overall Performance Rating</p>

                                            {clutchDNAProfile && (
                                                <DNAScoreRadial score={clutchDNAProfile.clutch_dna_score} />
                                            )}
                                        </div>

                                        {/* Key Metrics Vertical Stack */}
                                        <div className="w-full space-y-3">
                                            {clutchDNAProfile && [
                                                {
                                                    label: "Multi-Scenario",
                                                    value: clutchDNAProfile.multi_scenario_clutch,
                                                    icon: "🔥",
                                                    description: "Win% across pressure situations"
                                                },
                                                {
                                                    label: "Pressure Shooting",
                                                    value: Math.max(0, 50 + clutchDNAProfile.pressure_shooting),
                                                    icon: "🎯",
                                                    description: "Shooting under pressure vs normal"
                                                },
                                                {
                                                    label: "Decision Making",
                                                    value: (clutchDNAProfile.decision_making_pressure / 3) * 100,
                                                    icon: "🧠",
                                                    description: "Assist/TO ratio in clutch"
                                                }
                                            ].map((metric, index) => {
                                                const intensity = Math.min(100, Math.max(0, metric.value));
                                                const getColor = () => {
                                                    if (intensity >= 75) return "#10b981";
                                                    if (intensity >= 60) return "#3b82f6";
                                                    if (intensity >= 45) return "#f59e0b";
                                                    return "#ef4444";
                                                };

                                                return (
                                                    <div key={index} className="bg-secondary/30 rounded-lg p-3 border border-border/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">{metric.icon}</span>
                                                                <span className="text-sm font-medium">{metric.label}</span>
                                                            </div>
                                                            <span className="text-lg font-bold" style={{ color: getColor() }}>
                                                                {intensity.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-background rounded-full h-2 mb-1">
                                                            <div
                                                                className="h-2 rounded-full transition-all duration-700"
                                                                style={{
                                                                    width: `${intensity}%`,
                                                                    backgroundColor: getColor()
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Center: Heat Map Matrix - REVOLUTIONARY */}
                                    {/* Center: Heat Map Matrix - SIMPLE Y BRUTAL */}
                                    <div className="lg:col-span-2">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-primary" />
                                            Clutch Performance Matrix
                                        </h3>

                                        {/* Manual Heat Map Grid - SIMPLE Y EFECTIVO */}
                                        <div className="space-y-3">
                                            {/* Headers */}
                                            <div className="grid grid-cols-5 gap-2 text-xs font-bold text-center mb-4">
                                                <div></div>
                                                <div className="p-2 bg-secondary/30 rounded">SHOOTING</div>
                                                <div className="p-2 bg-secondary/30 rounded">DECISIONS</div>
                                                <div className="p-2 bg-secondary/30 rounded">DEFENSE</div>
                                                <div className="p-2 bg-secondary/30 rounded">TEAMWORK</div>
                                            </div>

                                            {/* Heat Map Rows */}
                                            {clutchDNAProfile && [
                                                {
                                                    scenario: "LAST 2 MIN",
                                                    shooting: Math.max(0, 50 + clutchDNAProfile.pressure_shooting),
                                                    decision: (clutchDNAProfile.decision_making_pressure / 3) * 100,
                                                    defense: clutchDNAProfile.pressure_defense, // ✅ YA CORRECTO - está 0-100
                                                    teamwork: clutchDNAProfile.collective_clutch_iq
                                                },
                                                {
                                                    scenario: "OVERTIME",
                                                    shooting: clutchDNAProfile.overtime_performance,
                                                    decision: Math.max(10, Math.min(90, (clutchDNAProfile.decision_making_pressure / 3) * 100 * 0.95)),
                                                    defense: Math.max(15, Math.min(95, clutchDNAProfile.pressure_defense * 1.05)), // ✅ CORRECTO
                                                    teamwork: Math.max(20, Math.min(85, clutchDNAProfile.collective_clutch_iq * 0.98))
                                                },
                                                {
                                                    scenario: "CLOSE GAMES",
                                                    shooting: clutchDNAProfile.multi_scenario_clutch,
                                                    decision: Math.max(10, Math.min(90, (clutchDNAProfile.decision_making_pressure / 3) * 100 * 1.05)),
                                                    defense: Math.max(15, Math.min(95, clutchDNAProfile.pressure_defense * 0.97)),
                                                    teamwork: Math.max(20, Math.min(85, clutchDNAProfile.collective_clutch_iq * 1.03))
                                                },
                                                {
                                                    scenario: "PLAYOFFS",
                                                    shooting: Math.max(20, Math.min(80, (50 + clutchDNAProfile.pressure_shooting) * 0.92)),
                                                    decision: Math.max(15, Math.min(85, (clutchDNAProfile.decision_making_pressure / 3) * 100 * 1.08)),
                                                    defense: Math.max(20, Math.min(90, clutchDNAProfile.pressure_defense * 1.15)),
                                                    teamwork: Math.max(25, Math.min(80, clutchDNAProfile.collective_clutch_iq * 1.02))
                                                }
                                            ].map((row, rowIndex) => {
                                                const cells = [
                                                    { name: "shooting", value: row.shooting },
                                                    { name: "decision", value: row.decision },
                                                    { name: "defense", value: row.defense },
                                                    { name: "teamwork", value: row.teamwork }
                                                ];

                                                return (
                                                    <div key={rowIndex} className="grid grid-cols-5 gap-2">
                                                        {/* Row Label */}
                                                        <div className="flex items-center justify-center text-xs font-bold p-3 bg-secondary/20 rounded">
                                                            {row.scenario}
                                                        </div>

                                                        {/* Heat Map Cells */}
                                                        {cells.map((cell, cellIndex) => {
                                                            const intensity = Math.min(100, Math.max(0, cell.value));
                                                            const getColor = () => {
                                                                if (intensity >= 80) return "#10b981"; // Verde ELITE
                                                                if (intensity >= 65) return "#3b82f6"; // Azul STRONG  
                                                                if (intensity >= 50) return "#f59e0b"; // Amarillo AVERAGE
                                                                if (intensity >= 35) return "#f97316"; // Naranja WEAK
                                                                return "#ef4444"; // Rojo POOR
                                                            };

                                                            const getLabel = (value: number) => {
                                                                if (value >= 80) return "ELITE";
                                                                if (value >= 65) return "STRONG";
                                                                if (value >= 50) return "AVG";
                                                                if (value >= 35) return "WEAK";
                                                                return "POOR";
                                                            };

                                                            return (
                                                                <div
                                                                    key={cellIndex}
                                                                    className="aspect-square rounded-lg border-2 border-border/30 flex flex-col items-center justify-center text-xs font-black cursor-pointer transition-all duration-200 hover:scale-105 hover:border-primary hover:shadow-lg group relative"
                                                                    style={{
                                                                        backgroundColor: getColor(),
                                                                        color: intensity > 60 ? "white" : "var(--foreground)"
                                                                    }}
                                                                >
                                                                    <div className="text-lg font-black">
                                                                        {intensity.toFixed(0)}
                                                                    </div>
                                                                    <div className="text-xs opacity-90 font-bold">
                                                                        {getLabel(intensity)}
                                                                    </div>

                                                                    {/* Tooltip simple - SIN TRANSPARENCIAS CON STYLE INLINE */}
                                                                    <div
                                                                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg hidden group-hover:block pointer-events-none whitespace-nowrap z-50"
                                                                        style={{
                                                                            backgroundColor: '#111827',
                                                                            color: '#ffffff',
                                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                                            border: '1px solid #374151'
                                                                        }}
                                                                    >
                                                                        <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{row.scenario}</div>
                                                                        <div style={{ color: '#fde047' }}>{cell.name.toUpperCase()}: {intensity.toFixed(0)}</div>
                                                                        <div style={{ color: '#d1d5db' }}>{getLabel(intensity)}</div>
                                                                        {/* Flecha del tooltip */}
                                                                        <div
                                                                            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                                                                            style={{ borderTopColor: '#111827' }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Performance Summary Cards - MÁS DIRECTO */}
                                        <div className="mt-8 grid grid-cols-2 gap-6">
                                            {clutchDNAProfile && [
                                                {
                                                    title: "CLUTCH KILLER",
                                                    value: clutchDNAProfile.multi_scenario_clutch,
                                                    description: "Win rate when it matters",
                                                    icon: "🔥"
                                                },
                                                {
                                                    title: "PRESSURE BEAST",
                                                    value: Math.max(0, 50 + clutchDNAProfile.pressure_shooting),
                                                    description: "Shooting under pressure",
                                                    icon: "🎯"
                                                }
                                            ].map((item, index) => {
                                                const intensity = Math.min(100, Math.max(0, item.value));
                                                const getColor = () => {
                                                    if (intensity >= 75) return "#10b981";
                                                    if (intensity >= 60) return "#3b82f6";
                                                    if (intensity >= 45) return "#f59e0b";
                                                    return "#ef4444";
                                                };

                                                const getTitle = (value: number) => {
                                                    if (value >= 75) return item.title;
                                                    if (value >= 60) return item.title.replace("KILLER", "SOLID").replace("BEAST", "GOOD");
                                                    if (value >= 45) return item.title.replace("KILLER", "AVERAGE").replace("BEAST", "AVERAGE");
                                                    return item.title.replace("KILLER", "CHOKER").replace("BEAST", "WEAK");
                                                };

                                                return (
                                                    <div key={index} className="bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-xl p-6 border border-border/30 hover:border-primary/50 transition-all duration-200">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <span className="text-3xl">{item.icon}</span>
                                                            <div>
                                                                <h4 className="text-lg font-black" style={{ color: getColor() }}>
                                                                    {getTitle(intensity)}
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-end gap-3 mb-4">
                                                            <span className="text-4xl font-black" style={{ color: getColor() }}>
                                                                {intensity.toFixed(0)}
                                                            </span>
                                                            <span className="text-lg text-muted-foreground mb-2">%</span>
                                                        </div>

                                                        <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className="h-3 rounded-full transition-all duration-1000 ease-out"
                                                                style={{
                                                                    width: `${intensity}%`,
                                                                    backgroundColor: getColor(),
                                                                    boxShadow: `0 0 10px ${getColor()}40`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="w-full">
                                    {/* Header Section - AGRESIVO */}
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-lg">Team Clutch Performance Analysis</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span className="text-xs font-medium">ELITE (80+)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="text-xs font-medium">STRONG (65+)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                <span className="text-xs font-medium">AVG (50+)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                <span className="text-xs font-medium">POOR</span>
                                            </div>
                                        </div>
                                    </div>



                                    {/* Advanced Metrics Row - MÉTRICAS HARDCORE */}
                                    <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-4 border border-border/20">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-primary" />
                                                ADVANCED CLUTCH METRICS
                                            </h4>
                                            <span className="text-xs text-muted-foreground">
                                                DNA Score: {clutchDNAProfile ? clutchDNAProfile.clutch_dna_score.toFixed(1) : "N/A"}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {clutchDNAProfile && [
                                                {
                                                    label: "Overtime Performance",
                                                    value: clutchDNAProfile.overtime_performance,
                                                    format: "percentage"
                                                },
                                                {
                                                    label: "Pressure Defense Rating",
                                                    value: clutchDNAProfile.pressure_defense,
                                                    format: "rating"
                                                },
                                                {
                                                    label: "Star Player Factor",
                                                    value: clutchDNAProfile.star_player_factor,
                                                    format: "percentage"
                                                },
                                                {
                                                    label: "Collective Clutch IQ",
                                                    value: clutchDNAProfile.collective_clutch_iq,
                                                    format: "percentage"
                                                }
                                            ].map((metric, index) => {
                                                const displayValue = metric.format === "percentage"
                                                    ? `${metric.value.toFixed(1)}%`
                                                    : metric.format === "rating"
                                                        ? metric.value.toFixed(0)
                                                        : metric.value.toFixed(1);

                                                const getPerformance = (value: number) => {
                                                    if (metric.format === "rating") {
                                                        if (value >= 110) return { label: "ELITE", color: "#10b981" };
                                                        if (value >= 105) return { label: "STRONG", color: "#3b82f6" };
                                                        if (value >= 95) return { label: "AVG", color: "#f59e0b" };
                                                        return { label: "POOR", color: "#ef4444" };
                                                    } else {
                                                        if (value >= 70) return { label: "ELITE", color: "#10b981" };
                                                        if (value >= 60) return { label: "STRONG", color: "#3b82f6" };
                                                        if (value >= 45) return { label: "AVG", color: "#f59e0b" };
                                                        return { label: "POOR", color: "#ef4444" };
                                                    }
                                                };

                                                const performance = getPerformance(metric.value);

                                                return (
                                                    <div key={index} className="text-center">
                                                        <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                                                        <p
                                                            className="text-lg font-black mb-1"
                                                            style={{ color: performance.color }}
                                                        >
                                                            {displayValue}
                                                        </p>
                                                        <span
                                                            className="text-xs font-bold px-2 py-1 rounded-full"
                                                            style={{
                                                                backgroundColor: `${performance.color}20`,
                                                                color: performance.color
                                                            }}
                                                        >
                                                            {performance.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer Description - MÁS AGRESIVO */}
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <p className="text-xs text-muted-foreground">
                                            <strong>Clutch DNA Profile</strong> analyzes team performance across multiple pressure scenarios,
                                            measuring execution, decision-making, and collective intelligence when games are on the line.
                                            <span className="font-semibold text-foreground">Elite teams rise to the occasion - average teams fold under pressure.</span>
                                        </p>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
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