"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowDown, ArrowUp } from "lucide-react"

interface Stop {
  id: string
  sequence: number
  address: string
  city: string
  timeWindow: string
}

const mockStops: Stop[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function MultiStopSequencing() {
  const [stops, setStops] = useState<Stop[]>(mockStops)

  const moveStop = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newStops = [...stops]
      const temp = newStops[index]
      newStops[index] = { ...newStops[index - 1], sequence: index + 1 }
      newStops[index - 1] = { ...temp, sequence: index }
      setStops(newStops)
    } else if (direction === 'down' && index < stops.length - 1) {
      const newStops = [...stops]
      const temp = newStops[index]
      newStops[index] = { ...newStops[index + 1], sequence: index + 1 }
      newStops[index + 1] = { ...temp, sequence: index + 2 }
      setStops(newStops)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Stop Sequencing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600 mb-3">
          Arrange stops in optimal delivery sequence
        </div>
        {stops.map((stop, index) => (
          <div key={stop.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                  {stop.sequence}
                </Badge>
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">{stop.address}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {stop.city} • Window: {stop.timeWindow}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveStop(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveStop(index, 'down')}
                  disabled={index === stops.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

