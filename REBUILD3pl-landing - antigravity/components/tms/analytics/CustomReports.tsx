"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Download } from "lucide-react"

interface Report {
  id: string
  name: string
  type: string
  lastGenerated: string
  status: string
}

const mockReports: Report[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CustomReports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Custom Reports</span>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockReports.map((report) => (
          <div key={report.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">{report.name}</span>
              </div>
              <Badge variant="outline" className="text-xs">{report.type}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">Last Generated: {report.lastGenerated}</div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

