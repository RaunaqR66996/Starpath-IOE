"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, FileText, Bell } from "lucide-react"

interface PortalMessage {
  id: string
  from: string
  subject: string
  date: string
  unread: boolean
}

const mockMessages: PortalMessage[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CarrierPortal() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier Communication Portal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Messages</span>
          <Badge variant="outline">{mockMessages.filter(m => m.unread).length} unread</Badge>
        </div>

        <div className="space-y-2">
          {mockMessages.map((message) => (
            <div
              key={message.id}
              className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                message.unread ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">{message.subject}</div>
                    <div className="text-xs text-gray-600">{message.from} • {message.date}</div>
                  </div>
                </div>
                {message.unread && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            View All Documents
          </Button>
          <Button variant="outline" className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

