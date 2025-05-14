import Link from "next/link"
import { TrendingUp, Users, Table, Calendar, Award, Star, Bell } from "lucide-react"

export function Sidebar() {
    return (
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
    )
}
