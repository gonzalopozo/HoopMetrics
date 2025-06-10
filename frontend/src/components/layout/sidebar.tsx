"use client"

import Link from "next/link"
import { TrendingUp, Users, Table, Star, User, LucideIcon, FileText, Shield, Palette } from "lucide-react"
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    ]

    const userLinks: Link[] = [
        { name: "Profile", href: '/profile', icon: User },
        { name: "Favorites", href: '/favorites', icon: Star },
    ]

    const otherLinks: Link[] = [
        { name: "Terms of Service", href: '/terms', icon: FileText },
        { name: "Privacy Policy", href: '/privacy', icon: Shield },
    ]

    return (
        <aside className="fixed top-[66px] left-0 bottom-0 w-64 border-r border-border bg-card p-4 hidden md:block overflow-y-auto border-t-0 scrollbar-elegant">
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
                {/* ✅ Nueva sección "Tools" con mejor diseño */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Tools</h3>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-foreground bg-accent/30">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                <span className="text-sm font-medium">Theme</span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
                {/* ✅ Sección "Other Stuff" */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Other Stuff</h3>
                    <ul className="space-y-1">
                        <>
                            {otherLinks.map(link => {
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
