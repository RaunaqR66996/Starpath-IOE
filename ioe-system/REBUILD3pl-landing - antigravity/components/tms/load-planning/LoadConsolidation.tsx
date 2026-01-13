"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp } from "lucide-react"

interface Load {
  id: string
  loadNumber: string
  origin: string
  destination: string
  weight: number
  volume: number
}

const mockLoads: Load[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function LoadConsolidation() {
  const [selectedLoads, setSelectedLoads] = useState<string[]>([])
  const [consolidationResult, setConsolidationResult] = useState<any>(null)

  const toggleLoad = (loadId: string) => {
    setSelectedLoads(prev =>
      prev.includes(loadId)
        ? prev.filter(id => id !== loadId)
        : [...prev, loadId]
    )
  }

  const handleConsolidate = () => {
    // TODO: Integrate with consolidation API
    const selected = mockLoads.filter(l => selectedLoads.includes(l.id))
    setConsolidationResult({
      consolidatedLoad: 'LOAD-CONS-001',
      totalWeight: selected.reduce((sum, l) => sum + l.weight, 0),
      totalVolume: selected.reduce((sum, l) => sum + l.volume, 0),
      estimatedSavings: 450.75
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Load Consolidation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Combine multiple loads into a single shipment for cost efficiency.
        </div>

        <div className="space-y-2">
          {mockLoads.map((load) => (
            <div
              key={load.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedLoads.includes(load.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => toggleLoad(load.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedLoads.includes(load.id)}
                    onChange={() => toggleLoad(load.id)}
                    className="rounded"
                  />
                  <Package className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{load.loadNumber}</div>
                    <div className="text-sm text-gray-600">
                      {load.origin} → {load.destination}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>{load.weight.toLocaleString()} lbs</div>
                  <div className="text-gray-500">{load.volume} cu ft</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedLoads.length > 1 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Selected Loads: {selectedLoads.length}</span>
              <Button size="sm" onClick={handleConsolidate}>
                Consolidate
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Total Weight: {mockLoads
                .filter(l => selectedLoads.includes(l.id))
                .reduce((sum, l) => sum + l.weight, 0)
                .toLocaleString()} lbs
            </div>
          </div>
        )}

        {consolidationResult && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-medium">Consolidation Successful</span>
            </div>
            <div className="text-sm space-y-1">
              <div>Consolidated Load: <Badge>{consolidationResult.consolidatedLoad}</Badge></div>
              <div>Estimated Savings: <span className="font-medium text-green-600">${consolidationResult.estimatedSavings}</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

