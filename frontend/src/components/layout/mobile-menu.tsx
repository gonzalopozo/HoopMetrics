import Link from "next/link"
import { TrendingUp, Users, Table, Calendar, Award, Star, Bell } from "lucide-react"

export function MobileMenu() {
    return (
        <div className="absolute left-0 right-0 top-[100%] z-20 border-b border-border bg-card p-4 shadow-lg md:hidden">
            <div className="flex flex-col gap-3">
                <button className="w-full rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                    Log in
                </button>
                <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                    Try HoopMetrics for free
                </button>

                {/* Mobile Navigation Links */}
                <div className="mt-4 border-t border-border pt-4">
                    <nav className="space-y-2">
                        <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                            <TrendingUp className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                            <Users className="h-4 w-4" />
                            <span>Players</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                            <Table className="h-4 w-4" />
                            <span>Teams</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                            <Calendar className="h-4 w-4" />
                            <span>Games</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                            <Award className="h-4 w-4" />
                            <span>Stats Leaders</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                            <Star className="h-4 w-4" />
                            <span>Favorites</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                            <Bell className="h-4 w-4" />
                            <span>Alerts</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </div>
    )
}
