"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Player } from "@/lib/data"
import { getAge } from "@/lib/utils"

interface PlayerCardProps {
  player: Player
  onClick: (player: Player) => void
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  return (
    <Card
      className="overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:border-primary/50 cursor-pointer group p-0" 
      onClick={() => onClick(player)}
    >
      {/* Removed div wrapper around Image */}
      <Image
        src={player.url_pic || "/placeholder.svg"}
        alt={player.name}
        width={400}
        height={400}
        className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
      />
      {/* Overlay for stats on hover */}
      <div className="absolute inset-0 top-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <div className="text-white">
          <div className="font-bold">{player.average_stats.points} PPG</div>
          <div className="text-sm">
            {player.average_stats.rebounds} RPG | {player.average_stats.assists} APG
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold">{player.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{player.team.full_name}</span>
          <Badge variant="outline">{player.position}</Badge>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Age: {getAge(player.birth_date)}</div>
      </CardContent>
    </Card>
  )
}