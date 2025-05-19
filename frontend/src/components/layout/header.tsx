"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { MobileMenu } from "@/components/layout/mobile-menu"
import { Logo } from "@/components/ui/logo"
import { SearchBar } from "@/components/ui/search-bar"
import Link from "next/link"

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-10 border-b bg-card px-4 py-3 shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                {/* Logo - Only icon on mobile, full logo on larger screens */}
                <Logo />

                {/* Search Bar - Expanded on mobile */}
                <SearchBar />

                {/* Desktop Auth Buttons */}
                <div className="hidden items-center gap-3 md:flex">
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

            {/* Mobile Menu */}
            {mobileMenuOpen && <MobileMenu />}
        </header>
    )
}
