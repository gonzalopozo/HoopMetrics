import Link from "next/link"
import { TrendingUp, Users, Table, Calendar, Award, Star, Bell, LucideProps } from "lucide-react"
import { ForwardRefExoticComponent, RefAttributes } from "react";

type Link = {
    name: string;
    href: string;
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
}

export function Sidebar() {
    const links: Link[] = [
        { name: "Dashboard", href: '/', icon: TrendingUp },
        { name: "Players", href: '/players', icon: Users },
        { name: "Teams", href: '/teams', icon: Table },
        { name: "Games", href: '/games', icon: Calendar },
        { name: "Stats leaders", href: '/stats-leaders', icon: Award },
    ]

    const userLinks: Link[] = [
        // TODO: añadir rutas de perfil
        { name: "Favorites", href: '/', icon: Star },
        { name: "Alerts", href: '/', icon: Bell },
    ]

    return (
        <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card p-4 md:block">
            <nav className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Main</h3>
                    <ul className="space-y-1">
                        <>
                            {links.map(link => {
                                const LinkIcon = link.icon;

                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{link.name}</span>
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
                                const LinkIcon = link.icon;

                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        <span>{link.name}</span>
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
