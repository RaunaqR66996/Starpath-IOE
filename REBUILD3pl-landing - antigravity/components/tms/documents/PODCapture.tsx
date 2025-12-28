"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, CheckCircle2 } from "lucide-react"

export function PODCapture() {
  const [shipmentId, setShipmentId] = useState('')
  const [podFile, setPodFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPodFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (podFile && shipmentId) {
      // TODO: Integrate with POD capture API
      setUploaded(true)
      setTimeout(() => setUploaded(false), 3000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proof of Delivery Capture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Shipment ID</label>
          <Input
            placeholder="Enter shipment ID"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Upload POD Document</label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pod-upload"
            />
            <label htmlFor="pod-upload" className="cursor-pointer">
              <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {podFile ? podFile.name : 'Click to upload POD (Image or PDF)'}
              </p>
            </label>
          </div>
        </div>

        {uploaded && (
          <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">POD captured successfully!</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!podFile || !shipmentId || uploaded}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Capture POD
        </Button>
      </CardContent>
    </Card>
  )
}

