"use client"

import { useState, useEffect } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { Logo } from "@/components/ui/logo"
import { SearchBar } from "@/components/ui/search-bar"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserAvatar } from "../ui/user-avatar"
import { UserRole } from "@/lib/role-colors"

export class AppUser {
    _name: string
    _email: string
    _role: string

    constructor(name: string, email: string, role: string) {
        this._name = name
        this._email = email
        this._role = role
    }

    get name() {
        return this._name
    }

    get email() {
        return this._email
    }

    get role() {
        return this._role
    }


    public getInitials(): string {
        return this._name[0]?.toUpperCase();
    }
}

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState(new AppUser("", "", ""))
    const [isLoading, setIsLoading] = useState(true) // Add loading state
    const router = useRouter()

    useEffect(() => {
        // Check if token exists in cookies
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1]

        if (token) {
            setIsLoggedIn(true)

            // Decode JWT token to get user info
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                console.log('Decoded payload:', payload)
                const name = payload.username 
                setUser(new AppUser(
                    name,
                    payload.email,
                    payload.role
                ))
            } catch (error) {
                console.error('Error parsing token:', error)
            }
        } else {
            setIsLoggedIn(false)
        }

        setIsLoading(false) // Set loading to false after checking token
    }, [])

    const handleLogout = () => {
        // Clear the token cookie
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        setIsLoggedIn(false)
        router.push('/login')
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-10 border-b bg-card px-4 py-3 shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                {/* Logo - Only icon on mobile, full logo on larger screens */}
                <Logo />

                {/* Search Bar - Expanded on mobile */}
                <SearchBar />

                {/* Desktop Auth Buttons - Only show when not loading */}
                <div className="hidden items-center gap-3 md:flex">
                    {isLoading ? (
                        // Show placeholder skeleton during loading
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-24 animate-pulse rounded-lg bg-accent"></div>
                        </div>
                    ) : isLoggedIn ? (
                        // When logged in
                        <div className="flex items-center gap-3">
                            {(user.role !== 'premium' && user.role !== 'ultimate' && user.role !== 'admin') && (
                                <Link
                                    href="/upgrade"
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                                >
                                    Upgrade
                                </Link>
                            )}
                            <div className="flex items-center gap-3">
                                {/* <Avatar>
                                    // <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user.name} />
                                    <AvatarFallback>{user.getInitials()}</AvatarFallback>
                                </Avatar> */}
                                <UserAvatar
                                    // src="/placeholder.svg?height=32&width=32"
                                    fallback={user.name[0]?.toUpperCase()}
                                    role={user.role as UserRole}
                                    // size="md"
                                />
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent cursor-pointer"
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </button>
                        </div>
                    ) : (
                        // When not logged in
                        <>
                            <Link
                                className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                                href="/login"
                            >
                                Log in
                            </Link>
                            <Link
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                                href="/signup"
                            >
                                Try HoopMetrics for free
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="ml-2 rounded-lg p-2 text-foreground md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu - Pass authentication state and user data */}
            {mobileMenuOpen && <MobileMenu isLoading={isLoading} isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />}
        </header>
    )
}
