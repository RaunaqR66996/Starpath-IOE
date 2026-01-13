"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const rows: Array<{ innovation: string; application: string }> = [
  {
    innovation: "Blockchain-backed predictive contracts",
    application: "Dynamic freight rate locking and settlement proof",
  },
  {
    innovation: "Autonomous agent network",
    application: "Self-operating modules coordinating TMS/WMS operations",
  },
  {
    innovation: "Hybrid cloud-edge cognitive AI",
    application: "Offline decision-making at port/warehouse level",
  },
  {
    innovation: "LiDAR-digital twin feedback loop",
    application: "Real-time reality synchronization to AI training datasets",
  },
  {
    innovation: "Cognitive workflow scripting",
    application: "Natural language task generation for planners/operators",
  },
]

export function InnovationApplications() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Innovation → Application</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2 pr-4">Innovation</th>
                <th className="py-2">Application</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2 pr-4 align-top font-medium">{row.innovation}</td>
                  <td className="py-2 align-top">{row.application}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}














