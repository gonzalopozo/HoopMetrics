import Image from "next/image"
import { Award } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"

const TOP_PERFORMERS = [
    {
        name: "Stephen Curry",
        team: "GSW",
        stat: "35 pts, 8 ast, 5 3PT",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        name: "Nikola Jokić",
        team: "DEN",
        stat: "28 pts, 14 reb, 11 ast",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        name: "Jayson Tatum",
        team: "BOS",
        stat: "32 pts, 9 reb, 4 stl",
        image: "/placeholder.svg?height=80&width=80",
    },
    {
        name: "Luka Dončić",
        team: "DAL",
        stat: "30 pts, 12 ast, 8 reb",
        image: "/placeholder.svg?height=80&width=80",
    },
]

export function TopPerformersCard() {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
            <CardHeader title="Top Performers" icon={Award} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {TOP_PERFORMERS.map((player, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Image
                            src={player.image || "/placeholder.svg"}
                            alt={player.name}
                            width={80}
                            height={80}
                            className="h-16 w-16 rounded-full object-cover"
                        />
                        <div>
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.team}</div>
                            <div className="mt-1 text-sm font-medium text-primary">{player.stat}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
