"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TrendingQueriesCard } from "@/components/cards/trending-queries-card"
import { UpcomingGamesCard } from "@/components/cards/upcoming-games-card"
import { TopPerformersCard } from "@/components/cards/top-performers-card"
import { QuickStatsCard } from "@/components/cards/quick-stats-card"
import { TeamStandingsCard } from "@/components/cards/team-standings-card"
import { NewsInsightsCard } from "@/components/cards/news-insights-card"
import { WatchlistCard } from "@/components/cards/watchlist-card"
import { SeasonalMilestonesCard } from "@/components/cards/seasonal-milestones-card"

export default function HomePage() {
  return (
    <DashboardLayout>
      <h1 className="mb-6 text-xl font-bold text-foreground md:text-2xl">NBA Insights Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TrendingQueriesCard />
        <UpcomingGamesCard />
        <TopPerformersCard />
        <QuickStatsCard />
        <TeamStandingsCard />
        <NewsInsightsCard />
        <WatchlistCard />
        <SeasonalMilestonesCard />
      </div>
    </DashboardLayout>
  )
}
