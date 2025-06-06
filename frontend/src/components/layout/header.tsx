"use client"

import { useState, useEffect } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { Logo } from "@/components/ui/logo"
import { SearchBar } from "@/components/ui/search-bar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/ui/user-avatar"
import { UserRole } from "@/lib/role-colors"

export class AppUser {
    _name: string
    _email: string
    _role: string
    _profileImageUrl: string | null

    constructor(name: string, email: string, role: string, profileImageUrl: string | null = null) {
        this._name = name
        this._email = email
        this._role = role
        this._profileImageUrl = profileImageUrl
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

    get profileImageUrl() {
        return this._profileImageUrl
    }

    public getInitials(): string {
        return this._name[0]?.toUpperCase();
    }
}

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState(new AppUser("", "", ""))
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('token='))
                    ?.split('=')[1]

                if (token) {
                    setIsLoggedIn(true)

                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]))
                        console.log('Decoded payload:', payload)
                        
                        try {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/me`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            })
                            
                            if (response.ok) {
                                const profileData = await response.json()
                                setUser(new AppUser(
                                    profileData.username || payload.username || "User",
                                    profileData.email || payload.email || "",
                                    profileData.role || payload.role || "free",
                                    profileData.profile_image_url
                                ))
                            } else {
                                setUser(new AppUser(
                                    payload.username || "User",
                                    payload.email || "",
                                    payload.role || "free"
                                ))
                            }
                        } catch (profileError) {
                            console.error('Error fetching profile:', profileError)
                            setUser(new AppUser(
                                payload.username || "User",
                                payload.email || "",
                                payload.role || "free"
                            ))
                        }
                    } catch (error) {
                        console.error('Error parsing token:', error)
                    }
                } else {
                    setIsLoggedIn(false)
                }
            } catch (error) {
                console.error('Error checking auth:', error)
                setIsLoggedIn(false)
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [])

    // ✅ Nuevo useEffect para escuchar actualizaciones del perfil
    useEffect(() => {
        const handleProfileUpdate = (event: CustomEvent) => {
            const updatedProfile = event.detail
            if (updatedProfile && user) {
                setUser(new AppUser(
                    updatedProfile.username || user.name,
                    updatedProfile.email || user.email,
                    updatedProfile.role || user.role,
                    updatedProfile.profile_image_url
                ))
            }
        }

        // ✅ Escuchar el evento personalizado
        window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)

        // ✅ Limpiar el listener cuando el componente se desmonte
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
        }
    }, [user])

    const handleLogout = () => {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        setIsLoggedIn(false)
        router.push('/login')
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-10 border-b bg-card px-4 py-3 shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                <Logo />
                <SearchBar />

                <div className="hidden items-center gap-3 md:flex">
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-24 animate-pulse rounded-lg bg-accent"></div>
                        </div>
                    ) : isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            {(user.role !== 'ultimate' && user.role !== 'admin') && (
                                <Link
                                    href="/upgrade"
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                                >
                                    Upgrade
                                </Link>
                            )}
                            <div className="flex items-center gap-3">
                                <Link href="/profile">
                                    <UserAvatar
                                        fallback={user.name[0]?.toUpperCase()}
                                        role={user.role as UserRole}
                                        profileImageUrl={user.profileImageUrl}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                </Link>
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

                <button
                    className="ml-2 rounded-lg p-2 text-foreground md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {mobileMenuOpen && <MobileMenu isLoading={isLoading} isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />}
        </header>
    )
}
