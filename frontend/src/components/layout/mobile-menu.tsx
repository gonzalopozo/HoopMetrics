import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Users, Table, Calendar, Award, Star, Bell, LogOut } from "lucide-react";
import { AppUser } from "@/components/layout/header";
import { SearchBar } from "@/components/ui/search-bar";

// Add isLoading to the interface props
interface MobileMenuProps {
    isLoading: boolean; // Add this line
    isLoggedIn: boolean;
    user?: AppUser;
    onLogout: () => void;
}

export function MobileMenu({ isLoading, isLoggedIn, user, onLogout }: MobileMenuProps) {
    return (
        <div className="fixed inset-0 top-[57px] z-[9999] bg-background md:hidden">
            <nav className="flex flex-col p-4">
                {/* Mobile Search Bar - Wider */}
                <div className="mb-4">
                    <div className="w-full">
                        <SearchBar />
                    </div>
                </div>

                {/* Your existing navigation links */}
                <div className="flex flex-col gap-3">
                    {/* Mobile Navigation Links */}
                    <div className="border-t border-border pt-4">
                        <nav className="space-y-2">
                            <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                                <TrendingUp className="h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>
                            <Link href="/players" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                                <Users className="h-4 w-4" />
                                <span>Players</span>
                            </Link>
                            <Link href="/teams" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
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
                            {isLoggedIn && (
                                <>
                                    <Link href="/favorites" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                                        <Star className="h-4 w-4" />
                                        <span>Favorites</span>
                                    </Link>
                                    <Link href="#" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
                                        <Bell className="h-4 w-4" />
                                        <span>Alerts</span>
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>

                {/* Auth section */}
                <div className="mt-4 space-y-3">
                    {isLoading ? (
                        // Show skeleton during loading
                        <div className="h-10 w-full animate-pulse rounded-lg bg-accent"></div>
                    ) : !isLoggedIn ? (
                        <>
                            <Link 
                                className="block rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                                href="/login"
                            >
                                Log in
                            </Link>
                            <Link 
                                className="block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                                href="/signup"
                            >
                                Try HoopMetrics for free
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-2 rounded-lg border border-border">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.name || "User"} />
                                        <AvatarFallback>{user?.getInitials()}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm font-medium">{user?.name || "User"}</div>
                                </div>
                            </div>
                            {(user?.role !== 'ultimate' && user?.role !== 'admin') && (
                                <Link 
                                    href="/upgrade" 
                                    className="block w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                                >
                                    Upgrade
                                </Link>
                            )}
                            <button
                                onClick={onLogout}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}
