"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CheckCircle2, TrendingDown } from "lucide-react"

interface Quote {
  id: string
  carrier: string
  cost: number
  transitTime: string
  service: string
  rating: number
}

const mockQuotes: Quote[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function RateShopping() {
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)

  const cheapestQuote = mockQuotes.reduce((min, quote) => 
    quote.cost < min.cost ? quote : min
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Shopping - Multi-Carrier Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockQuotes.map((quote) => (
          <div
            key={quote.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedQuote === quote.id
                ? 'border-blue-500 bg-blue-50'
                : quote.id === cheapestQuote.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedQuote(quote.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{quote.carrier}</span>
                  {quote.id === cheapestQuote.id && (
                    <Badge className="bg-green-100 text-green-800">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Best Price
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {quote.service} • {quote.transitTime} • Rating: {quote.rating}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${quote.cost.toFixed(2)}</div>
                {selectedQuote === quote.id && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mx-auto mt-1" />
                )}
              </div>
            </div>
          </div>
        ))}

        {selectedQuote && (
          <Button className="w-full">
            Select This Quote
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

