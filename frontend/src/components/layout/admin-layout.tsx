"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart2, LogOut, Menu, X } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    // In a real app, this would call your auth logout function
    // For now, we'll just redirect to the login page
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">HoopMetrics</span>
              <span className="text-xs text-muted-foreground">Admin Dashboard</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavItem href="/admin/dashboard" label="Dashboard" />
            <NavItem href="/admin/users" label="Users" />
            <NavItem href="/admin/subscriptions" label="Subscriptions" />
            <NavItem href="/admin/settings" label="Settings" />
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="rounded-lg p-2 text-foreground md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[57px] z-20 bg-background md:hidden">
          <nav className="flex flex-col p-4">
            <MobileNavItem href="/admin/dashboard" label="Dashboard" />
            <MobileNavItem href="/admin/users" label="Users" />
            <MobileNavItem href="/admin/subscriptions" label="Subscriptions" />
            <MobileNavItem href="/admin/settings" label="Settings" />

            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-[1800px]">{children}</div>
      </main>
    </div>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
    >
      {label}
    </Link>
  )
}

function MobileNavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground hover:bg-accent">
      {label}
    </Link>
  )
}
