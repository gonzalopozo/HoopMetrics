import { Calendar } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const UPCOMING_GAMES = [
    { time: "7:00 PM", teams: ["BOS", "NYK"], channel: "ESPN" },
    { time: "7:30 PM", teams: ["MIA", "PHI"], channel: "TNT" },
    { time: "10:00 PM", teams: ["LAL", "GSW"], channel: "ESPN" },
]

export function UpcomingGamesCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CardHeader title="Upcoming Games" icon={Calendar} />
            <div className="p-4">
                <div className="space-y-4">
                    {UPCOMING_GAMES.map((game, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-muted-foreground">{game.time}</div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{game.teams[0]}</span>
                                    <span className="text-muted-foreground">vs</span>
                                    <span className="font-semibold">{game.teams[1]}</span>
                                </div>
                            </div>
                            <div className="text-xs font-medium text-muted-foreground">{game.channel}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
