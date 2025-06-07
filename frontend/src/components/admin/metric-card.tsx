"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
    title: string
    value: string | number
    description?: string
    icon?: ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
    valueClassName?: string
}

export function MetricCard({
    title,
    value,
    description,
    icon,
    trend,
    className,
    valueClassName
}: MetricCardProps) {
    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && (
                    <div className="text-muted-foreground">
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", valueClassName)}>
                    {value}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
                {trend && (
                    <div className="flex items-center text-xs mt-2">
                        <span
                            className={cn(
                                "font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {trend.isPositive ? "+" : ""}{trend.value}%
                        </span>
                        <span className="text-muted-foreground ml-1">from last month</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}