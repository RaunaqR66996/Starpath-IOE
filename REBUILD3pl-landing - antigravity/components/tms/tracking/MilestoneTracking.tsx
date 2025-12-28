"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Circle } from "lucide-react"

interface Milestone {
  id: string
  name: string
  status: 'completed' | 'pending' | 'in_progress'
  timestamp?: string
  location?: string
}

const mockMilestones: Milestone[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function MilestoneTracking() {
  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Milestone Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockMilestones.map((milestone, index) => (
          <div key={milestone.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {getMilestoneIcon(milestone.status)}
              {index < mockMilestones.length - 1 && (
                <div className={`w-0.5 h-8 ${
                  milestone.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  milestone.status === 'completed' ? 'text-green-800' :
                  milestone.status === 'in_progress' ? 'text-blue-800' :
                  'text-gray-500'
                }`}>
                  {milestone.name}
                </span>
                {milestone.status === 'completed' && milestone.timestamp && (
                  <span className="text-xs text-gray-500">{milestone.timestamp}</span>
                )}
              </div>
              {milestone.location && (
                <div className="text-xs text-gray-600 mt-1">{milestone.location}</div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

