"use client"

import Link from "next/link"
import { TrendingUp, Users, Table, Calendar, Award, Star, Bell, LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";


type Link = {
    name: string;
    href: string;
    icon: LucideIcon;
}

export function Sidebar() {
    const pathname = usePathname();

    const links: Link[] = [
        { name: "Dashboard", href: '/', icon: TrendingUp },
        { name: "Players", href: '/players', icon: Users },
        { name: "Teams", href: '/teams', icon: Table },
        { name: "Games", href: '/games', icon: Calendar },
        { name: "Stats leaders", href: '/stats-leaders', icon: Award },
    ]

    const userLinks: Link[] = [
        // TODO: añadir rutas de perfil
        { name: "Favorites", href: '/null', icon: Star },
        { name: "Alerts", href: '/null', icon: Bell },
    ]

    return (
        <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card p-4 md:block">
            <nav className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Main</h3>
                    <ul className="space-y-1">
                        <>
                            {links.map(link => {
                                const { name, href, icon } = link

                                const LinkIcon = icon;
                                const isActive = pathname === href

                                return (
                                    <Link
                                        key={name}
                                        href={href}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-foreground transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary",
                                        )}
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{name}</span>
                                    </Link>
                                )
                            })}
                        </>
                    </ul>
                </div>
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Your Content</h3>
                    <ul className="space-y-1">
                        <>
                            {userLinks.map(link => {
                                const { name, href, icon } = link

                                const LinkIcon = icon;
                                const isActive = pathname === href

                                return (
                                    <Link
                                        key={name}
                                        href={href}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-foreground transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary",
                                        )}
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{name}</span>
                                    </Link>
                                )
                            })}
                        </>
                    </ul>
                </div>
            </nav>
        </aside>
    )
}
