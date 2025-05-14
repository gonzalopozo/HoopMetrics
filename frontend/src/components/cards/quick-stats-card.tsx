import { BarChart2 } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const PLAYER_STATS = [
    { label: "Points", value: "26.8", trend: [22, 28, 25, 30, 32, 24, 26] },
    { label: "Rebounds", value: "7.5", trend: [6, 8, 7, 9, 6, 8, 8] },
    { label: "Assists", value: "8.3", trend: [7, 9, 8, 10, 7, 9, 8] },
]

export function QuickStatsCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <CardHeader title="Quick Stats" icon={BarChart2} />
            <div className="p-4">
                <div className="mb-2 text-center text-sm font-medium">LeBron James - Season Trends</div>
                <div className="space-y-4">
                    {PLAYER_STATS.map((stat, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{stat.label}</span>
                                <span className="font-semibold">{stat.value}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${(Number.parseInt(stat.value) / 40) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
