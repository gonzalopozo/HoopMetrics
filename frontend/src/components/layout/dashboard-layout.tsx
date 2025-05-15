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
            <main className="flex flex-1 pt-[73px]">
                <Sidebar />
                <main className="flex-1 md:ml-64 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto max-w-6xl">{children}</div>
                </main>
            </main>
        </div>
    )
}
