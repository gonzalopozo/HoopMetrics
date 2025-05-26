"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Trophy, BarChart3 } from "lucide-react"

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

interface PlayerTabsProps {
    player: Player;
    careerHighs: CareerHighs;
    shootingPercentages: ShootingPercentages;
}

export default function PlayerTabs({ player, careerHighs, shootingPercentages }: PlayerTabsProps) {
    const [, setActiveTab] = useState("overview")
    const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null)

    return (
        <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="shooting">Shooting</TabsTrigger>
                <TabsTrigger value="gamelog">Game Log</TabsTrigger>
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

                {/* Rest of the overview tab content */}
                {/* ... efficiency metrics card from the original code ... */}
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
    )
}