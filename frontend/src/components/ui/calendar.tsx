import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  className?: string
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  )

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  const endDate = new Date(monthEnd)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const days: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleDayClick = (day: Date) => {
    if (disabled && disabled(day)) return
    onSelect?.(day)
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const isSelected = (date: Date) => {
    return selected ? isSameDay(date, selected) : false
  }

  const isOutsideMonth = (date: Date) => {
    return date.getMonth() !== currentMonth.getMonth()
  }

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className={cn("p-3", className)}>
      <div className="space-y-4">
        <div className="flex justify-center pt-1 relative items-center">
          <Button
            variant="outline"
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
            onClick={previousMonth}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <Button
            variant="outline"
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
            onClick={nextMonth}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <table className="w-full border-collapse space-y-1">
          <thead>
            <tr className="flex">
              {weekDays.map((day) => (
                <th
                  key={day}
                  className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
              <tr key={weekIndex} className="flex w-full mt-2">
                {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                  const isDisabled = disabled ? disabled(day) : false
                  const selected = isSelected(day)
                  const today = isToday(day)
                  const outside = isOutsideMonth(day)

                  return (
                    <td
                      key={dayIndex}
                      className="h-9 w-9 text-center text-sm p-0 relative"
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "h-9 w-9 p-0 font-normal",
                          selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          today && !selected && "bg-accent text-accent-foreground",
                          outside && "text-muted-foreground opacity-50",
                          isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleDayClick(day)}
                        disabled={isDisabled}
                        type="button"
                      >
                        {day.getDate()}
                      </Button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
