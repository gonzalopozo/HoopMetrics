import Image from "next/image"
import { Award } from "lucide-react"
import { CardHeader } from "@/components/cards/card-header"
import { cn, getNBALogo } from "@/lib/utils"
import { TopPerformer } from "@/types"

export function TopPerformersCard({ data } : { data: TopPerformer[] }) {
    return (
        <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2 min-h-[400px] flex flex-col">
            <CardHeader title="Top Performers" icon={Award} />
            <div className="grid grid-cols-2 gap-6 p-6 flex-1">
                {data.slice(0, 4).map((player, index) => (
                    <div key={index} className="relative flex items-center gap-4 rounded-lg border border-border p-4 min-h-[140px]">
                        {/* Team Logo Circle in Top Right - MÁS GRANDE */}
                        <div className="absolute top-3 right-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {getNBALogo(player.team.full_name, { size: 32 })}
                        </div>
                        {/* Imagen del jugador - MÁS GRANDE */}
                        <Image
                            src={player.url_pic || "/placeholder.svg"}
                            alt={player.name}
                            width={100}
                            height={100}
                            className="h-24 w-24 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 pr-8">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-base">{player.name}</span>
                                <span
                                    className={cn(
                                        "text-xs",
                                        "font-bold",
                                        "px-2",
                                        "py-1",
                                        "rounded-md",
                                        player.isWinner
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    )}
                                >
                                    {player.isWinner ? 'W' : 'L'}
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">{player.team.full_name}</div>
                            <div className="mt-2 text-sm font-medium text-primary">{`${player.points} PTS | ${player.rebounds} REB | ${player.assists} AST`}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
