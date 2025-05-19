"use client"

import { useEffect, useState } from "react"
import { ListChecks, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"

interface TaskQueueCardProps {
  className?: string
  dateRange: DateRange
}

export function TaskQueueCard({ className, dateRange }: TaskQueueCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [queueData, setQueueData] = useState({
    pendingTasks: 0,
    processingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgProcessingTime: 0,
    queues: [] as { name: string; count: number; status: "healthy" | "warning" | "critical" }[],
  })

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setQueueData({
        pendingTasks: 24,
        processingTasks: 8,
        completedTasks: 1452,
        failedTasks: 12,
        avgProcessingTime: 3.2,
        queues: [
          { name: "Data Updates", count: 15, status: "healthy" },
          { name: "Email Notifications", count: 8, status: "healthy" },
          { name: "Report Generation", count: 6, status: "warning" },
          { name: "API Sync", count: 3, status: "critical" },
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
            <ListChecks className="mr-2 h-4 w-4 text-primary" />
            Task Queue
          </CardTitle>
          <CardDescription>Background jobs and processing</CardDescription>
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
                <div className="text-sm text-muted-foreground">Pending Tasks</div>
                <div className="mt-1 text-xl font-bold">{queueData.pendingTasks}</div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-sm text-muted-foreground">Processing</div>
                <div className="mt-1 text-xl font-bold">{queueData.processingTasks}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Avg. Processing Time</span>
              </div>
              <span className="font-bold">{queueData.avgProcessingTime} sec</span>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-sm font-medium">Queue Status</div>
              <div className="rounded-lg border border-border">
                <div className="max-h-[120px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Queue</th>
                        <th className="px-3 py-2 text-center font-medium">Count</th>
                        <th className="px-3 py-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueData.queues.map((queue, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">{queue.name}</td>
                          <td className="px-3 py-2 text-center">{queue.count}</td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                queue.status === "healthy"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : queue.status === "warning"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {queue.status === "healthy" && "Healthy"}
                              {queue.status === "warning" && "Warning"}
                              {queue.status === "critical" && "Critical"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {queueData.failedTasks > 0 && (
              <div className="mt-3 flex items-center rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">{queueData.failedTasks} failed tasks require attention</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
