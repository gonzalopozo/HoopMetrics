"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  dateRange: DateRange
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDateRangeChange: (range: any) => void
  className?: string
}

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              if (range) {
                onDateRangeChange(range)
                setIsOpen(false)
              }
            }}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between border-t border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date()
                onDateRangeChange({
                  from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30),
                  to: today,
                })
                setIsOpen(false)
              }}
            >
              Last 30 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date()
                onDateRangeChange({
                  from: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
                  to: today,
                })
                setIsOpen(false)
              }}
            >
              Last Quarter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date()
                onDateRangeChange({
                  from: new Date(today.getFullYear(), 0, 1),
                  to: today,
                })
                setIsOpen(false)
              }}
            >
              Year to Date
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
