"use client"

import { useEffect, useState } from "react"
import { LifeBuoy, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

interface SupportTicketsCardProps {
  className?: string
  dateRange: DateRange
}

export function SupportTicketsCard({ className, dateRange }: SupportTicketsCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [ticketData, setTicketData] = useState({
    open: 0,
    closed: 0,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    categories: [] as { name: string; count: number }[],
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setTicketData({
        open: 42,
        closed: 128,
        avgResponseTime: 2.5,
        avgResolutionTime: 8.2,
        categories: [
          { name: "Account Issues", count: 35 },
          { name: "Billing", count: 28 },
          { name: "Feature Requests", count: 45 },
          { name: "Technical Support", count: 62 },
        ],
      })

      setIsLoading(false)
    }

    fetchData()
  }, [dateRange])

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center text-base">
            <LifeBuoy className="mr-2 h-4 w-4 text-primary" />
            Support Tickets
          </CardTitle>
          <CardDescription>Ticket volume and response times</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-sm text-muted-foreground">Open Tickets</div>
                <div className="text-2xl font-bold">{ticketData.open}</div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-sm text-muted-foreground">Closed Tickets</div>
                <div className="text-2xl font-bold">{ticketData.closed}</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Avg. Response Time</span>
                </div>
                <span className="font-bold">{ticketData.avgResponseTime} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Avg. Resolution Time</span>
                </div>
                <span className="font-bold">{ticketData.avgResolutionTime} hours</span>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-sm font-medium">Ticket Categories</div>
              <div className="space-y-2">
                {ticketData.categories.map((category, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{category.name}</span>
                      <span>{category.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(category.count / (ticketData.open + ticketData.closed)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
