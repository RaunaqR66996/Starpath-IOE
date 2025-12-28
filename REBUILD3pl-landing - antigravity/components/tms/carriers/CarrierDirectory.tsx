"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Star, MapPin } from "lucide-react"

interface Carrier {
  id: string
  name: string
  type: string
  status: string
  rating: number
  onTimeDelivery: number
  coverage: string[]
}

const mockCarriers: Carrier[] = []

export function CarrierDirectory() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCarriers = mockCarriers.filter(carrier =>
    carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carrier.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier Directory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search carriers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {filteredCarriers.map((carrier) => (
            <div key={carrier.id} className="border rounded-lg p-3 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{carrier.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{carrier.type}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span>{carrier.rating}</span>
                      </div>
                      <span>• {carrier.onTimeDelivery}% on-time</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{carrier.coverage.join(', ')}</span>
                    </div>
                  </div>
                </div>
                <Badge className={carrier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {carrier.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

