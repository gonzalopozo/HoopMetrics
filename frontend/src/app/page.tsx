import { Search, Bell, Star, TrendingUp, Calendar, BarChart2, Award, Users, Table } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
              <BarChart2 className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-slate-800">HoopMetrics</span>
          </Link>

          {/* Search Bar */}
          <div className="relative mx-4 flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search players, teams, or stats..."
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Log in
            </button>
            <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600">
              Try HoopMetrics for free
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-r bg-white p-4 md:block">
          <nav className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Main</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Users className="h-4 w-4" />
                    <span>Players</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Table className="h-4 w-4" />
                    <span>Teams</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Games</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Award className="h-4 w-4" />
                    <span>Stats Leaders</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Your Content</h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Star className="h-4 w-4" />
                    <span>Favorites</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
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
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-6 text-2xl font-bold text-slate-800">NBA Insights Dashboard</h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Trending Queries */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm lg:col-span-2">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
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
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-600">
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
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <Calendar className="h-5 w-5 text-orange-500" />
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
                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-slate-500">{game.time}</div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{game.teams[0]}</span>
                            <span className="text-slate-400">vs</span>
                            <span className="font-semibold">{game.teams[1]}</span>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-slate-500">{game.channel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm lg:col-span-2">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <Award className="h-5 w-5 text-orange-500" />
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
                    <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                      <Image
                        src={player.image || "/placeholder.svg"}
                        alt={player.name}
                        width={80}
                        height={80}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-xs text-slate-500">{player.team}</div>
                        <div className="mt-1 text-sm font-medium text-orange-600">{player.stat}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <BarChart2 className="h-5 w-5 text-orange-500" />
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
                          <span className="text-sm text-slate-600">{stat.label}</span>
                          <span className="font-semibold">{stat.value}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{ width: `${(Number.parseInt(stat.value) / 40) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Standings */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <Table className="h-5 w-5 text-orange-500" />
                    Team Standings
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-2 text-sm font-medium">Eastern Conference</div>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="p-2 text-left font-medium text-slate-500">Team</th>
                          <th className="p-2 text-center font-medium text-slate-500">W</th>
                          <th className="p-2 text-center font-medium text-slate-500">L</th>
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
                          <tr key={index} className={`border-b ${team.team === "BOS" ? "bg-orange-50" : ""}`}>
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
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <Bell className="h-5 w-5 text-orange-500" />
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
                      <li key={index} className="border-b pb-2 last:border-0 last:pb-0">
                        <Link href="#" className="block py-1 text-sm hover:text-orange-600">
                          {news}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Your Watchlist */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <Star className="h-5 w-5 text-orange-500" />
                    Your Watchlist
                  </h2>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Sign in to see your watchlist</span>
                    <button className="text-xs font-medium text-orange-600 hover:text-orange-700">Sign In</button>
                  </div>
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-sm text-slate-500">Track your favorite players and teams</p>
                    <button className="mt-2 rounded-lg bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-200">
                      Try HoopMetrics Pro
                    </button>
                  </div>
                </div>
              </div>

              {/* Seasonal Milestones */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <Award className="h-5 w-5 text-orange-500" />
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
                      <li key={index} className="rounded-lg border p-3">
                        <div className="font-medium">{milestone.player}</div>
                        <div className="text-sm text-slate-600">{milestone.achievement}</div>
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
