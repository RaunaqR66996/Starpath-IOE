"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

export function DataExport() {
  const [exportType, setExportType] = useState<'shipments' | 'carriers' | 'rates'>('shipments')
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    // TODO: Integrate with export API
    setTimeout(() => setExporting(false), 2000)
  }

  const getFormatIcon = () => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Export Type</label>
          <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shipments">Shipments</SelectItem>
              <SelectItem value="carriers">Carriers</SelectItem>
              <SelectItem value="rates">Rates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Export Format</label>
          <Select value={format} onValueChange={(value: any) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} disabled={exporting} className="w-full">
          {getFormatIcon()}
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </CardContent>
    </Card>
  )
}

