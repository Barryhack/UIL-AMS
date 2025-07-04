"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface PrerequisiteSelectorProps {
  prerequisites: string[]
  onChange: (prerequisites: string[]) => void
}

export function PrerequisiteSelector({ prerequisites, onChange }: PrerequisiteSelectorProps) {
  const [newPrerequisite, setNewPrerequisite] = useState("")

  const addPrerequisite = () => {
    if (newPrerequisite.trim() && !prerequisites.includes(newPrerequisite.trim())) {
      onChange([...prerequisites, newPrerequisite.trim()])
      setNewPrerequisite("")
    }
  }

  const removePrerequisite = (index: number) => {
    onChange(prerequisites.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Label>Prerequisites</Label>
      <div className="flex gap-2">
        <Input
          value={newPrerequisite}
          onChange={(e) => setNewPrerequisite(e.target.value)}
          placeholder="Enter course code (e.g., CSC 201)"
          onKeyPress={(e) => e.key === "Enter" && addPrerequisite()}
        />
        <Button type="button" onClick={addPrerequisite}>
          Add
        </Button>
      </div>
      {prerequisites.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {prerequisites.map((prereq, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>{prereq}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePrerequisite(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 