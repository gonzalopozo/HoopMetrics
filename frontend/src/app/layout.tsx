import type { ReactNode } from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "HoopMetrics - NBA Statistics & Analytics",
  description: "Advanced NBA statistics, analytics, and insights for basketball fans and analysts",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <DashboardLayout>
              {children}
            </DashboardLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
