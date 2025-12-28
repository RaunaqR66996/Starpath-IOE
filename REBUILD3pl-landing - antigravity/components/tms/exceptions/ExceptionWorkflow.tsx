"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Clock, CheckCircle2 } from "lucide-react"

interface WorkflowStep {
  id: string
  step: string
  assignee: string
  status: string
  completedAt?: string
}

const mockWorkflow: WorkflowStep[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ExceptionWorkflow() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-300" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exception Workflow Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockWorkflow.map((step, index) => (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {getStatusIcon(step.status)}
              {index < mockWorkflow.length - 1 && (
                <div className={`w-0.5 h-8 ${
                  step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  step.status === 'completed' ? 'text-green-800' :
                  step.status === 'in_progress' ? 'text-blue-800' :
                  'text-gray-500'
                }`}>
                  {step.step}
                </span>
                <Badge className={
                  step.status === 'completed' ? 'bg-green-100 text-green-800' :
                  step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {step.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                <User className="h-3 w-3" />
                <span>{step.assignee}</span>
                {step.completedAt && <span>• {step.completedAt}</span>}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

