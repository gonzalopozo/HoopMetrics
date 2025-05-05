import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type { Player } from "@/lib/data"
import { getAge } from "@/lib/utils"

interface PlayerProfileProps {
  player: Player
}

const calculatePercentage = (parte: number, total: number): number | string => {
  if (total === 0) return 0;
  return ((parte / total) * 100).toFixed(2);
}

export function PlayerProfile({ player }: PlayerProfileProps) {
  return (
    <div className="w-full bg-gradient-to-b from-primary/90 to-primary/70 text-white p-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white mb-4">
          <Image src={player.url_pic || "/placeholder.svg"} alt={player.name} fill className="object-cover" />
        </div>

        <h2 className="text-3xl font-bold mb-1">{player.name}</h2>
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-white/20 hover:bg-white/30 text-white">{player.position}</Badge>
          <span className="text-white/80">#{Math.floor(Math.random() * 99) + 1}</span>
        </div>
        <p className="text-xl mb-6">{player.team.full_name}</p>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{player.average_stats.points}</div>
            <div className="text-xs text-white/80 uppercase tracking-wider">PPG</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{player.average_stats.rebounds}</div>
            <div className="text-xs text-white/80 uppercase tracking-wider">RPG</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{player.average_stats.assists}</div>
            <div className="text-xs text-white/80 uppercase tracking-wider">APG</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-3xl font-bold">{getAge(player.birth_date)}</div>
            <div className="text-xs text-white/80 uppercase tracking-wider">Age</div>
          </div>
        </div>

        <div className="mt-6 w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">FG%</span>
            <span className="text-sm font-bold">{calculatePercentage(player.average_stats.field_goals_made, player.average_stats.field_goals_attempted)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full" style={{ width: `${calculatePercentage(player.average_stats.field_goals_made, player.average_stats.field_goals_attempted)}%` }}></div>
          </div>

          <div className="flex items-center justify-between mb-2 mt-4">
            <span className="text-sm">3PT%</span>
            <span className="text-sm font-bold">{calculatePercentage(player.average_stats.three_points_made, player.average_stats.three_points_attempted)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full" style={{ width: `${calculatePercentage(player.average_stats.three_points_made, player.average_stats.three_points_attempted)}%` }}></div>
          </div>

          <div className="flex items-center justify-between mb-2 mt-4">
            <span className="text-sm">FT%</span>
            <span className="text-sm font-bold">{calculatePercentage(player.average_stats.free_throws_made, player.average_stats.free_throws_attempted)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full" style={{ width: `${calculatePercentage(player.average_stats.free_throws_made, player.average_stats.free_throws_attempted)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
