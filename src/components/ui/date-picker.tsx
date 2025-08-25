
"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  value?: { start: Date; end: Date }
  onChange?: (range: { start: Date; end: Date }) => void
}

export function DatePickerWithRange({
  className,
  value,
  onChange
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: value?.start || addDays(new Date(), -30),
    to: value?.end || new Date(),
  })

  React.useEffect(() => {
    if (value) {
      setDate({
        from: value.start,
        to: value.end,
      })
    }
  }, [value])

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    if (range?.from && range?.to && onChange) {
      onChange({
        start: range.from,
        end: range.to,
      })
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd LLL y", { locale: id })} -{" "}
                  {format(date.to, "dd LLL y", { locale: id })}
                </>
              ) : (
                format(date.from, "dd LLL y", { locale: id })
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={id}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
