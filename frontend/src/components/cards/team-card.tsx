"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Team } from "@/types"

export function TeamCard({ id, name, logo, record, win_percentage, stats }: Team) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Team Logo Section */}
            <div className="relative flex h-40 w-full items-center justify-center bg-accent/30 p-4">
                {logo}
            </div>

            {/* Team Info Section */}
            <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold group-hover:text-primary truncate">{name}</h3>
                        {/* <div className="flex items-center text-xs text-muted-foreground">
                            <span className="truncate">{conference} Conference</span>
                            <span className="mx-1 shrink-0">•</span>
                            <span className="truncate">{division} Division</span>
                        </div> */}
                    </div>
                    {/* <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background font-bold text-sm">
                        {abbreviation}
                    </div> */}
                </div>

                <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-background p-2">
                    <div className="text-center">
                        <div className="text-xs text-muted-foreground">Record</div>
                        <div className="text-base font-bold">
                            {record.wins}-{record.losses}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-muted-foreground">Win %</div>
                        <div className="text-base font-bold">{(win_percentage * 100).toFixed(1)}%</div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="mb-1 flex items-center gap-1">
                        <BarChart2 className="h-3 w-3 text-primary" />
                        <h4 className="text-xs font-medium">Team Stats</h4>
                    </div>
                    <div className="grid grid-cols-5 gap-2 rounded-lg border border-border bg-background p-2 text-center">
                        <div>
                            <div className="text-[10px] text-muted-foreground">PPG</div>
                            <div className="text-xs font-medium">{stats.ppg}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground">RPG</div>
                            <div className="text-xs font-medium">{stats.rpg}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground">APG</div>
                            <div className="text-xs font-medium">{stats.apg}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground">SPG</div>
                            <div className="text-xs font-medium">{stats.spg}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground">BPG</div>
                            <div className="text-xs font-medium">{stats.bpg}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <Link
                        href={`/teams/${id}`}
                        className={cn(
                            "flex w-full items-center justify-center gap-1 rounded-lg border border-primary bg-transparent px-3 py-1.5 text-xs font-medium text-primary transition-colors",
                            "hover:bg-primary hover:text-primary-foreground",
                            isHovered && "bg-primary text-primary-foreground",
                        )}
                    >
                        <span>Team Details</span>
                        <ArrowRight className={cn("h-3 w-3 transition-transform duration-300", isHovered && "translate-x-1")} />
                    </Link>
                </div>
            </div>

            {/* Card Border Glow Effect */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl border border-primary/0 transition-all duration-300 pointer-events-none z-0",
                    isHovered && "border-primary/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
                )}
            />
        </div>
    )
}
