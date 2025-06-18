"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

type TimeSlot = {
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY"
  startTime: string
  endTime: string
  venue: string
}

type TimeSlotPickerProps = {
  value: TimeSlot[]
  onChange: (value: TimeSlot[]) => void
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const

export function TimeSlotPicker({ value, onChange }: TimeSlotPickerProps) {
  const [newTimeSlot, setNewTimeSlot] = useState<TimeSlot>({
    day: "MONDAY",
    startTime: "",
    endTime: "",
    venue: "",
  })

  const addTimeSlot = () => {
    if (
      !newTimeSlot.day ||
      !newTimeSlot.startTime ||
      !newTimeSlot.endTime ||
      !newTimeSlot.venue
    ) {
      return
    }

    onChange([...value, newTimeSlot])
    setNewTimeSlot({
      day: "MONDAY",
      startTime: "",
      endTime: "",
      venue: "",
    })
  }

  const removeTimeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Select
          value={newTimeSlot.day}
          onValueChange={(day: TimeSlot["day"]) =>
            setNewTimeSlot({ ...newTimeSlot, day })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((day) => (
              <SelectItem key={day} value={day}>
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="time"
          value={newTimeSlot.startTime}
          onChange={(e) =>
            setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })
          }
          placeholder="Start Time"
        />

        <Input
          type="time"
          value={newTimeSlot.endTime}
          onChange={(e) =>
            setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })
          }
          placeholder="End Time"
        />

        <Input
          value={newTimeSlot.venue}
          onChange={(e) =>
            setNewTimeSlot({ ...newTimeSlot, venue: e.target.value })
          }
          placeholder="Venue"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addTimeSlot}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Time Slot
      </Button>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((slot, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div className="grid gap-2 grid-cols-4 flex-1 mr-4">
                <div>{slot.day.charAt(0) + slot.day.slice(1).toLowerCase()}</div>
                <div>{slot.startTime}</div>
                <div>{slot.endTime}</div>
                <div>{slot.venue}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTimeSlot(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 