import type { ReactNode } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

interface DashboardLayoutProps {
    children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="mx-auto max-w-6xl">{children}</div>
                </div>
            </main>
        </div>
    )
}
