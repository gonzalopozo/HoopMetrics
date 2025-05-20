
import Image from "next/image"
import Link from "next/link"
import {
    ArrowLeft,
    Users,
    Trophy,
    BarChart2,
    MapPin,
    Building,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Types based on the API response
interface TeamDetails {
    id: number
    full_name: string
    abbreviation: string
    conference: string
    division: string
    stadium: string
    city: string
    logo: string
    stats: {
        wins: number
        losses: number
        conference_rank: number | null
        ppg: number
        oppg: number
        rpg: number
        apg: number
        spg: number
        bpg: number
        topg: number
        fgp: number
        tpp: number
        ftp: number
    }
    players: Player[]
    recent_games: Game[]
    upcoming_games: Game[]
    championships: number[] | null
    founded: number | null
}

interface Player {
    id: number
    name: string
    height: number
    weight: number
    position: string
    number: number
    url_pic: string
    stats: {
        ppg: number
        rpg: number
        apg: number
        spg: number
        bpg: number
        mpg: number
    }
}

interface Game {
    id: number
    date: string
    season: string | null
    home_team_id: number
    away_team_id: number
    home_team_name: string
    away_team_name: string
    home_score: number
    away_score: number
    status: "completed" | "scheduled"
}

// Server component
async function getTeamData(id: string): Promise<TeamDetails> {
    const response = await fetch(`http://localhost:8000/teams/${id}`, {
        // This ensures fresh data for each request
        cache: "no-store" 
    });
    
    if (!response.ok) {
        throw new Error("Failed to fetch team data");
    }
    
    return response.json();
}

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
    const teamId = params.id;
    let team: TeamDetails;
    
    try {
        team = await getTeamData(teamId);
    } catch (error) {
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

            {/* Tabs for different views - Made static since it's a server component */}
            <div className="mb-8">
                <div className="mb-4 flex items-center border-b">
                    <div className="border-b-2 border-primary px-4 py-2 font-medium">Overview</div>
                </div>
                
                <div className="space-y-6">
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
                                    {team.recent_games.slice(0, 5).map((game) => (
                                        <div
                                            key={game.id}
                                            className="flex items-center justify-between rounded-lg border border-border p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-medium">{new Date(game.date).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-2">
                                                    <Image
                                                        src="/placeholder.svg"
                                                        alt={game.home_team_name}
                                                        width={24}
                                                        height={24}
                                                        className="h-6 w-6 object-contain"
                                                    />
                                                    <span className={cn("font-semibold", game.home_team_id === team.id && "text-primary")}>
                                                        {game.home_team_name}
                                                    </span>
                                                    <span className="text-muted-foreground">vs</span>
                                                    <Image
                                                        src="/placeholder.svg"
                                                        alt={game.away_team_name}
                                                        width={24}
                                                        height={24}
                                                        className="h-6 w-6 object-contain"
                                                    />
                                                    <span className={cn("font-semibold", game.away_team_id === team.id && "text-primary")}>
                                                        {game.away_team_name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="font-bold">
                                                {game.home_score} - {game.away_score}
                                            </div>
                                        </div>
                                    ))}
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
                                                <span className="font-medium">{team.founded || "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Conference Rank</span>
                                                <span className="font-medium">#{team.stats.conference_rank || "N/A"}</span>
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
                            <CardDescription>${`Team's leading players`}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {team.players
                                    .sort((a, b) => b.stats.ppg - a.stats.ppg)
                                    .slice(0, 4)
                                    .map((player) => (
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
                </div>
            </div>
            
            {/* Roster Table */}
            <Card className="mb-8">
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
                                        <td className="px-4 py-3 text-center">{player.height > 0 ? `${player.height} m` : 'N/A'}</td>
                                        <td className="px-4 py-3 text-center">{player.weight > 0 ? `${player.weight} kg` : 'N/A'}</td>
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
            
            {/* Recent Games */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Games
                    </CardTitle>
                    <CardDescription>Last 10 completed games</CardDescription>
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
                                {team.recent_games.map((game) => {
                                    const isHomeTeam = game.home_team_id === team.id;
                                    const teamScore = isHomeTeam ? game.home_score : game.away_score;
                                    const opponentScore = isHomeTeam ? game.away_score : game.home_score;
                                    const opponentName = isHomeTeam ? game.away_team_name : game.home_team_name;
                                    const isWin =
                                        (isHomeTeam && game.home_score > game.away_score) ||
                                        (!isHomeTeam && game.away_score > game.home_score);

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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            
            {/* Advanced Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Advanced Team Statistics</CardTitle>
                    <CardDescription>Detailed performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Offensive Stats */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Offensive Stats</h3>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Points Per Game</span>
                                        <span className="font-medium">{team.stats.ppg.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${(team.stats.ppg / 130) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Field Goal %</span>
                                        <span className="font-medium">{team.stats.fgp.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${team.stats.fgp}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">3-Point %</span>
                                        <span className="font-medium">{team.stats.tpp.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${team.stats.tpp}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Free Throw %</span>
                                        <span className="font-medium">{team.stats.ftp.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${team.stats.ftp}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Assists Per Game</span>
                                        <span className="font-medium">{team.stats.apg.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${(team.stats.apg / 30) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Defensive Stats */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Defensive Stats</h3>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Opponent PPG</span>
                                        <span className="font-medium">{team.stats.oppg.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div
                                            className="h-full rounded-full bg-red-500"
                                            style={{ width: `${(team.stats.oppg / 130) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Rebounds Per Game</span>
                                        <span className="font-medium">{team.stats.rpg.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div
                                            className="h-full rounded-full bg-blue-500"
                                            style={{ width: `${(team.stats.rpg / 50) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Steals Per Game</span>
                                        <span className="font-medium">{team.stats.spg.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div
                                            className="h-full rounded-full bg-green-500"
                                            style={{ width: `${(team.stats.spg / 10) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Blocks Per Game</span>
                                        <span className="font-medium">{team.stats.bpg.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div
                                            className="h-full rounded-full bg-purple-500"
                                            style={{ width: `${(team.stats.bpg / 8) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Turnovers Per Game</span>
                                        <span className="font-medium">{team.stats.topg.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                        <div
                                            className="h-full rounded-full bg-amber-500"
                                            style={{ width: `${(team.stats.topg / 20) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
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