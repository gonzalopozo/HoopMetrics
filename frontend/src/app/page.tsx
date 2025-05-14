"use client"

import { useState } from "react"
import { Search, Bell, Star, TrendingUp, Calendar, BarChart2, Award, Users, Table, Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo - Only icon on mobile, full logo on larger screens */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart2 className="h-6 w-6" />
            </div>
            <span className="hidden text-xl font-bold text-foreground md:block">HoopMetrics</span>
          </Link>

          {/* Search Bar - Expanded on mobile */}
          <div className="relative mx-2 flex-1 max-w-md md:max-w-2xl md:mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search players, teams, or stats..."
                className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <button className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
              Log in
            </button>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
              Try HoopMetrics for free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="ml-2 rounded-lg p-2 text-foreground md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-[100%] z-20 border-b border-border bg-card p-4 shadow-lg md:hidden">
            <div className="flex flex-col gap-3">
              <button className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                Log in
              </button>
              <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                Try HoopMetrics for free
              </button>

              {/* Mobile Navigation Links */}
              <div className="mt-4 pt-4 border-t border-border">
                <nav className="space-y-2">
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent"
                  >
                    <Users className="h-4 w-4" />
                    <span>Players</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent"
                  >
                    <Table className="h-4 w-4" />
                    <span>Teams</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Games</span>
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent"
                  >
                    <Award className="h-4 w-4" />
                    <span>Stats Leaders</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card p-4 md:block">
          <nav className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Main</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Users className="h-4 w-4" />
                    <span>Players</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Table className="h-4 w-4" />
                    <span>Teams</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Games</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Award className="h-4 w-4" />
                    <span>Stats Leaders</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Your Content</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Star className="h-4 w-4" />
                    <span>Favorites</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Alerts</span>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Bento Grid Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-6 text-xl font-bold text-foreground md:text-2xl">NBA Insights Dashboard</h1>

            <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Trending Queries */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Trending Queries
                  </h2>
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    {[
                      "LeBron James last 5 games",
                      "Top scorers today",
                      "Rookie watch",
                      "Triple doubles this season",
                      "Clutch performers",
                      "Best 3PT shooters",
                    ].map((query, index) => (
                      <li key={index}>
                        <Link
                          href="#"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                            {index + 1}
                          </span>
                          <span>{query}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Upcoming Games */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Games
                  </h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {[
                      { time: "7:00 PM", teams: ["BOS", "NYK"], channel: "ESPN" },
                      { time: "7:30 PM", teams: ["MIA", "PHI"], channel: "TNT" },
                      { time: "10:00 PM", teams: ["LAL", "GSW"], channel: "ESPN" },
                    ].map((game, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-muted-foreground">{game.time}</div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{game.teams[0]}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="font-semibold">{game.teams[1]}</span>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">{game.channel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <Award className="h-5 w-5 text-primary" />
                    Top Performers
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                  {[
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
                  ].map((player, index) => (
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

              {/* Quick Stats */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Quick Stats
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-2 text-center text-sm font-medium">LeBron James - Season Trends</div>
                  <div className="space-y-4">
                    {[
                      { label: "Points", value: "26.8", trend: [22, 28, 25, 30, 32, 24, 26] },
                      { label: "Rebounds", value: "7.5", trend: [6, 8, 7, 9, 6, 8, 8] },
                      { label: "Assists", value: "8.3", trend: [7, 9, 8, 10, 7, 9, 8] },
                    ].map((stat, index) => (
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

              {/* Team Standings */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <Table className="h-5 w-5 text-primary" />
                    Team Standings
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-2 text-sm font-medium">Eastern Conference</div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-accent">
                          <th className="p-2 text-left font-medium text-muted-foreground">Team</th>
                          <th className="p-2 text-center font-medium text-muted-foreground">W</th>
                          <th className="p-2 text-center font-medium text-muted-foreground">L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { team: "BOS", wins: 58, losses: 24 },
                          { team: "MIL", wins: 56, losses: 26 },
                          { team: "PHI", wins: 54, losses: 28 },
                          { team: "CLE", wins: 51, losses: 31 },
                          { team: "NYK", wins: 47, losses: 35 },
                        ].map((team, index) => (
                          <tr
                            key={index}
                            className={`border-b border-border ${team.team === "BOS" ? "bg-accent/50" : ""}`}
                          >
                            <td className="p-2 font-medium">{team.team}</td>
                            <td className="p-2 text-center">{team.wins}</td>
                            <td className="p-2 text-center">{team.losses}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* News & Insights */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <Bell className="h-5 w-5 text-primary" />
                    News & Insights
                  </h2>
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    {[
                      "Lakers' Anthony Davis questionable for next game with ankle sprain",
                      "Celtics extend winning streak to 8 games with victory over Bulls",
                      "Rookie sensation Victor Wembanyama records fifth triple-double",
                      "Trade deadline approaching: Teams looking to make moves",
                    ].map((news, index) => (
                      <li key={index} className="border-b border-border pb-2 last:border-0 last:pb-0">
                        <Link href="#" className="block py-1 text-sm hover:text-primary">
                          {news}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Your Watchlist */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <Star className="h-5 w-5 text-primary" />
                    Your Watchlist
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sign in to see your watchlist</span>
                    <button className="text-xs font-medium text-primary hover:text-primary/90">Sign In</button>
                  </div>
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-sm text-muted-foreground">Track your favorite players and teams</p>
                    <button className="mt-2 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/80">
                      Try HoopMetrics Pro
                    </button>
                  </div>
                </div>
              </div>

              {/* Seasonal Milestones */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <h2 className="flex items-center gap-2 font-bold text-foreground">
                    <Award className="h-5 w-5 text-primary" />
                    Seasonal Milestones
                  </h2>
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    {[
                      { player: "Nikola Jokić", achievement: "Most triple-doubles (18)" },
                      { player: "Shai Gilgeous-Alexander", achievement: "Leading scorer (31.4 PPG)" },
                      { player: "Rudy Gobert", achievement: "Most blocks (189)" },
                      { player: "Tyrese Haliburton", achievement: "Most assists (10.9 APG)" },
                    ].map((milestone, index) => (
                      <li key={index} className="rounded-lg border border-border p-3">
                        <div className="font-medium">{milestone.player}</div>
                        <div className="text-sm text-muted-foreground">{milestone.achievement}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
