"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, CheckCircle2 } from "lucide-react"

export function BOLGeneration() {
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    // TODO: Integrate with BOL generation API
    setGenerated(true)
    setTimeout(() => setGenerated(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bill of Lading Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Shipment Information</div>
          <div className="space-y-1 text-sm">
            <div>Shipment: SHIP-001</div>
            <div>Carrier: FedEx Ground</div>
            <div>Origin: Dallas, TX</div>
            <div>Destination: New York, NY</div>
          </div>
        </div>

        {generated && (
          <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">BOL generated successfully!</span>
          </div>
        )}

        <Button onClick={handleGenerate} disabled={generated} className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Generate BOL
        </Button>

        {generated && (
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download BOL
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

