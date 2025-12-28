"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, CheckCircle2 } from "lucide-react"

interface Equipment {
  id: string
  type: string
  length: number
  capacity: number
  features: string[]
  available: boolean
}

const mockEquipment: Equipment[] = [] // TODO: Fetch from API

export function EquipmentSelection() {
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockEquipment.map((equipment) => (
          <div
            key={equipment.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedEquipment === equipment.id
                ? 'border-blue-500 bg-blue-50'
                : equipment.available
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-200 opacity-50'
              }`}
            onClick={() => equipment.available && setSelectedEquipment(equipment.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">{equipment.type}</div>
                  <div className="text-sm text-gray-600">
                    {equipment.length}ft • {equipment.capacity.toLocaleString()} lbs capacity
                  </div>
                  <div className="flex gap-1 mt-1">
                    {equipment.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                {selectedEquipment === equipment.id && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                )}
                {!equipment.available && (
                  <Badge variant="outline" className="bg-gray-100">
                    Unavailable
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {selectedEquipment && (
          <Button className="w-full">
            Confirm Selection
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

