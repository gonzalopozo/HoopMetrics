"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
    Users,
    Calendar,
    Trophy,
    Activity,
    Clock,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TeamDetails } from "@/types"

export default function TeamTabs({ team }: { team: TeamDetails }) {
    const [activeTab, setActiveTab] = useState("overview")

    return (
        <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="roster">Roster</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="stats">Advanced Stats</TabsTrigger>
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
                                {team.recent_games.slice(0, 5).map((game) => (
                                    <div
                                        key={game.id}
                                        className="flex items-center justify-between rounded-lg border border-border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm font-medium">{new Date(game.date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-2">

                                                {game.home_team_logo ? (game.home_team_logo) : (<Image
                                                    src="/placeholder.svg"
                                                    alt={game.home_team_name}
                                                    width={24}
                                                    height={24}
                                                    className="h-6 w-6 object-contain"
                                                />)}

                                                <span className={cn("font-semibold", game.home_team_id === team.id && "text-primary")}>
                                                    {game.home_team_name}
                                                </span>
                                                <span className="text-muted-foreground">vs</span>
                                                {game.away_team_logo ? (game.away_team_logo) : (
                                                    <Image
                                                        src="/placeholder.svg"
                                                        alt={game.away_team_name}
                                                        width={24}
                                                        height={24}
                                                        className="h-6 w-6 object-contain"
                                                    />)}
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
                        <CardDescription>Team's leading players</CardDescription>
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
                                            {game.home_team_logo ? (game.home_team_logo) : (
                                                <Image
                                                    src="/placeholder.svg"
                                                    alt={game.home_team_name}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 object-contain"
                                                />
                                            )}
                                            <div className="text-center text-lg font-bold text-muted-foreground">VS</div>
                                            {game.away_team_logo ? (game.away_team_logo) : (
                                                <Image
                                                    src="/placeholder.svg"
                                                    alt={game.away_team_name}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 object-contain"
                                                />
                                            )}
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

            <TabsContent value="stats" className="space-y-6">
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
            </TabsContent>
        </Tabs>
    )
}