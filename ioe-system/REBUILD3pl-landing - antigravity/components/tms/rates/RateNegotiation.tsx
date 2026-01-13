"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare } from "lucide-react"

export function RateNegotiation() {
  const [negotiationRate, setNegotiationRate] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    // TODO: Integrate with negotiation API
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Negotiation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Current Quote</div>
          <div className="flex items-center justify-between">
            <span className="font-medium">FedEx Ground</span>
            <span className="text-xl font-bold">$245.50</span>
          </div>
        </div>

        <div>
          <Label htmlFor="negotiationRate">Proposed Rate</Label>
          <Input
            id="negotiationRate"
            type="number"
            placeholder="Enter proposed rate"
            value={negotiationRate}
            onChange={(e) => setNegotiationRate(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="message">Negotiation Message</Label>
          <textarea
            id="message"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
            placeholder="Add your negotiation message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {sent && (
          <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-sm text-green-800">
            <MessageSquare className="h-4 w-4" />
            <span>Negotiation request sent to carrier</span>
          </div>
        )}

        <Button onClick={handleSend} disabled={!negotiationRate || sent} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Send Negotiation Request
        </Button>
      </CardContent>
    </Card>
  )
}

