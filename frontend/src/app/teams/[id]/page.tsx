import Image from "next/image"
import Link from "next/link"
import {
    ArrowLeft,
    Trophy,
    BarChart2,
    MapPin,
    Building,
    TrendingUp,
    TrendingDown,
    Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TeamDetails } from "@/types"
import TeamTabs from "@/components/ui/team-tabs"
import axios from "axios"

// Server-side data fetching function
async function fetchTeam(id: string): Promise<TeamDetails | null> {
    try {
        const response = await axios.get<TeamDetails>(`http://localhost:8000/teams/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching team data:", error);
        return null;
    }
}


export default async function TeamDetailPage({ params }: { params: { id: string } }) {
    const props = await params;
    const teamId = props.id;
    const team: TeamDetails | null = await fetchTeam(teamId)


    if (!team) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex flex-col items-center justify-center py-20">
                    <h1 className="text-2xl font-bold mb-4">Team not found</h1>
                    <p className="text-muted-foreground mb-6">${`The team you're looking for doesn't exist or has been removed.`}</p>
                    <Link href="/teams" className="flex items-center gap-2 text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Teams
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate win percentage
    const winPercentage = (team.stats.wins / (team.stats.wins + team.stats.losses)) * 100;

    return (
        <div className="container mx-auto py-8 px-4">
            <Link href="/teams" className="mb-6 flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Teams
            </Link>

            {/* Team Hero Section */}
            <div className="relative mb-8 overflow-hidden rounded-xl border border-border bg-gradient-to-r from-primary/10 via-background to-background">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none">
                    <Image
                        src={team.logo || "/placeholder.svg"}
                        alt={team.full_name}
                        fill
                        className="object-contain object-right"
                    />
                </div>

                <div className="flex flex-col md:flex-row items-center p-6 md:p-8">
                    {/* Team Logo */}
                    <div className="relative h-48 w-48 md:h-56 md:w-56 mb-6 md:mb-0 md:mr-8 flex-shrink-0">
                        <Image
                            src={team.logo || "/placeholder.svg"}
                            alt={team.full_name}
                            width={224}
                            height={224}
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{team.full_name}</h1>
                            <div className="flex items-center justify-center md:justify-start">
                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                    {team.abbreviation}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <span className="font-medium text-foreground">{team.conference} Conference</span>
                                <span className="text-muted-foreground">•</span>
                                <span>{team.division} Division</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Record</span>
                                <div className="flex items-center gap-1">
                                    <Trophy className="h-4 w-4 text-primary" />
                                    <span className="font-medium">
                                        {team.stats.wins}-{team.stats.losses}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Win %</span>
                                <div className="flex items-center gap-1">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{winPercentage.toFixed(1)}%</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Home</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{team.city}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Arena</span>
                                <div className="flex items-center gap-1">
                                    <Building className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{team.stadium}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Stats Overview */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Team Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard
                        title="Points Per Game"
                        value={team.stats.ppg.toFixed(1)}
                        icon={<TrendingUp className="h-5 w-5 text-primary" />}
                        isHighlight={true}
                    />
                    <StatCard
                        title="Opponent PPG"
                        value={team.stats.oppg.toFixed(1)}
                        icon={<TrendingDown className="h-5 w-5 text-primary" />}
                    />
                    <StatCard
                        title="Rebounds"
                        value={team.stats.rpg.toFixed(1)}
                        icon={<Activity className="h-5 w-5 text-primary" />}
                    />
                    <StatCard
                        title="Assists"
                        value={team.stats.apg.toFixed(1)}
                        icon={<BarChart2 className="h-5 w-5 text-primary" />}
                    />
                    <StatCard
                        title="Steals"
                        value={team.stats.spg.toFixed(1)}
                        icon={<Activity className="h-5 w-5 text-primary" />}
                    />
                    <StatCard
                        title="Blocks"
                        value={team.stats.bpg.toFixed(1)}
                        icon={<Activity className="h-5 w-5 text-primary" />}
                    />
                </div>
            </div>

            {/* Team Tabs */}
            <TeamTabs team={team} />
        </div>
    );
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
            <span className={cn("text-2xl font-bold", isHighlight && "text-primary")}>{value}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 text-center">{title}</span>
        </div>
    );
}