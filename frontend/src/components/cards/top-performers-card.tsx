import Image from "next/image"
import { Award } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"
import { cn, getNBALogo } from "@/lib/utils"
import { TopPerformer } from "@/types"

export function TopPerformersCard({ data } : { data: TopPerformer[] }) {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
            <CardHeader title="Top Performers" icon={Award} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {data.map((player, index) => (
                    <div key={index} className="relative flex items-center gap-3 rounded-lg border border-border p-3">
                        {/* Team Logo Circle in Top Right */}
                        <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {getNBALogo(player.team.full_name, { size: 24 })}
                        </div>
                        <Image
                            src={player.url_pic || "/placeholder.svg"}
                            alt={player.name}
                            width={80}
                            height={80}
                            className="h-16 w-16 rounded-full object-cover"
                        />
                        <div>
                            {/* <div className="font-semibold">{player.name}</div> */}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{player.name}</span>
                                <span
                                    className={cn(
                                        "text-xs",
                                        "font-bold",
                                        "px-1.5",
                                        "py-0.5",
                                        "rounded",
                                        player.isWinner
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    )}
                                >
                                    {player.isWinner ? 'W' : 'L'}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{player.team.full_name}</div>
                            <div className="mt-1 text-sm font-medium text-primary">{`${player.points}PTS ${player.rebounds}REB ${player.assists}AST`}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
