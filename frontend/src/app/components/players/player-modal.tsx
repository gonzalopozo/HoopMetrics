"use client"

import { X, TrendingUp, Award, Activity } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { PointsChart } from "@/components/charts/points-chart"
// import { SkillsChart } from "@/components/charts/skills-chart"
// import { SeasonChart } from "@/components/charts/season-chart"
import type { Player } from "@/lib/data"
import { PlayerProfile } from "./player-profile"

interface PlayerModalProps {
  player: Player | null
  isOpen: boolean
  onClose: () => void
}

export function PlayerModal({ player, isOpen, onClose }: PlayerModalProps) {
  if (!player) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl min-w-3xl p-0 overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        {/* Main content */}
        <div className="flex flex-col md:flex-row">
          {/* Left sidebar with player info */}
          <div className="w-full md:w-1/3">
            <PlayerProfile player={player} />
          </div>

          {/* Right content area with tabs */}
          <div className="w-full md:w-2/3 p-6">
            <Tabs defaultValue="points" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="points" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Points</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>Skills</span>
                </TabsTrigger>
                <TabsTrigger value="season" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Season</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="points">
                {/* <PointsChart player={player} /> */}
              </TabsContent>

              <TabsContent value="skills">
                {/* <SkillsChart player={player} /> */}
              </TabsContent>

              <TabsContent value="season">
                {/* <SeasonChart player={player} /> */}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
