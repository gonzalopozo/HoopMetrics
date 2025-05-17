"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Player } from "@/types"
import Link from "next/link"


export function PlayerCard({ id, name, position, team, image, stats }: Player) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className="group relative h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Player Image with Overlay */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                <Image
                    src={image || "/placeholder.svg"}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Gradient Overlay (always visible, intensifies on hover) */}
                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40 transition-opacity duration-300",
                        isHovered && "opacity-80",
                    )}
                />

                {/* Stats Overlay (visible on hover) */}
                <div
                    className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-primary/80 to-black/80 p-4 text-white opacity-0 backdrop-blur-sm transition-all duration-300 ease-in-out",
                        isHovered ? "opacity-100 translate-y-0" : "translate-y-8 opacity-0",
                    )}
                >
                    <div className="mb-4 text-center">
                        <div className="text-sm font-medium uppercase tracking-wider text-white/80">Season Averages</div>
                        <div className="h-0.5 w-12 mx-auto mt-1 bg-white/30 rounded-full"></div>
                    </div>

                    <div className="flex w-full justify-around px-2">
                        {/* Points */}
                        <div
                            className="flex flex-col items-center transition-transform duration-300 ease-out group-hover:translate-y-0"
                            style={{ transitionDelay: "50ms" }}
                        >
                            <span className="text-lg font-bold sm:text-xl">{stats.points.toFixed(1)}</span>
                            <span className="text-xs font-medium text-white/70">PTS</span>
                        </div>

                        {/* Vertical Separator Line */}
                        <div className="h-12 w-px bg-white/20"></div>

                        {/* Rebounds */}
                        <div
                            className="flex flex-col items-center transition-transform duration-300 ease-out group-hover:translate-y-0"
                            style={{ transitionDelay: "100ms" }}
                        >
                            <span className="text-lg font-bold sm:text-xl">{stats.rebounds.toFixed(1)}</span>
                            <span className="text-xs font-medium text-white/70">REB</span>
                        </div>

                        {/* Vertical Separator Line */}
                        <div className="h-12 w-px bg-white/20"></div>

                        {/* Assists */}
                        <div
                            className="flex flex-col items-center transition-transform duration-300 ease-out group-hover:translate-y-0"
                            style={{ transitionDelay: "150ms" }}
                        >
                            <span className="text-lg font-bold sm:text-xl">{stats.assists.toFixed(1)}</span>
                            <span className="text-xs font-medium text-white/70">AST</span>
                        </div>
                    </div>

                    <Link
                        className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/30 hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-black/50 active:translate-y-0 active:shadow-primary/10 w-full max-w-[180px]"
                        href={`/players/${id}`}
                        key={id}
                    >
                        <span>Player Details</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Player Info */}
            <div className="p-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors duration-200">{name}</h3>
                    <div className="h-6 w-6 overflow-hidden rounded-full border border-border/50 transition-transform duration-300 group-hover:scale-110">
                        <Image
                            src={team.logo || "/placeholder.svg"}
                            alt={team.name}
                            width={24}
                            height={24}
                            className="h-full w-full object-contain"
                        />
                    </div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                    <span>{position}</span>
                </div>
            </div>

            {/* Card Border Glow Effect */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl border border-primary/0 transition-all duration-300",
                    isHovered && "border-primary/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
                )}
            />
        </div>
    )
}
