"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  DollarSign, 
  Search, 
  Plus, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  MapPin,
  Weight,
  Calendar
} from 'lucide-react'

export function TMSRates() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])

  const quotes = [
    {
      id: 'Q001',
      carrier: 'FedEx Ground',
      origin: 'Dallas, TX',
      destination: 'New York, NY',
      service: 'Ground',
      cost: 245.50,
      transitTime: '3-5 days',
      status: 'active',
      validUntil: '2024-02-15',
      features: ['Tracking', 'Insurance', 'Signature Required'],
      rating: 4.8
    },
    {
      id: 'Q002',
      carrier: 'UPS Ground',
      origin: 'Dallas, TX',
      destination: 'New York, NY',
      service: 'Ground',
      cost: 238.75,
      transitTime: '2-4 days',
      status: 'active',
      validUntil: '2024-02-20',
      features: ['Tracking', 'Insurance'],
      rating: 4.6
    },
    {
      id: 'Q003',
      carrier: 'DHL Express',
      origin: 'Dallas, TX',
      destination: 'New York, NY',
      service: 'Express',
      cost: 445.00,
      transitTime: '1-2 days',
      status: 'active',
      validUntil: '2024-02-18',
      features: ['Tracking', 'Insurance', 'Signature Required', 'Saturday Delivery'],
      rating: 4.9
    },
    {
      id: 'Q004',
      carrier: 'USPS Priority',
      origin: 'Dallas, TX',
      destination: 'New York, NY',
      service: 'Priority',
      cost: 189.25,
      transitTime: '2-3 days',
      status: 'expired',
      validUntil: '2024-01-30',
      features: ['Tracking'],
      rating: 4.2
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    )
  }

  const filteredQuotes = quotes.filter(quote =>
    quote.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rate Quotes & Tendering</h2>
          <p className="text-sm text-gray-600">Compare rates and manage tenders</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Request Quote
          </Button>
        </div>
      </div>

      {/* Quote Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuotes.map((quote) => (
          <Card key={quote.id} className={`hover:shadow-md transition-shadow ${
            selectedQuotes.includes(quote.id) ? 'ring-2 ring-blue-500' : ''
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{quote.carrier}</CardTitle>
                  <p className="text-sm text-gray-600">{quote.service}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(quote.status)}>
                    {quote.status}
                  </Badge>
                  <input
                    type="checkbox"
                    checked={selectedQuotes.includes(quote.id)}
                    onChange={() => handleSelectQuote(quote.id)}
                    className="rounded"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Route and Cost */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{quote.origin} → {quote.destination}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">${quote.cost}</p>
                    <p className="text-xs text-gray-500">Total cost</p>
                  </div>
                </div>

                {/* Transit Time and Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{quote.transitTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{quote.rating}</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-sm font-medium mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {quote.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Valid Until */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Valid until:</span>
                  <span className="font-medium">{quote.validUntil}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Quote
                  </Button>
                  <Button size="sm" variant="outline">
                    <Truck className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Quotes Summary */}
      {selectedQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Quotes ({selectedQuotes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Cost Range:</span>
                <span className="font-medium">$238.75 - $445.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fastest Delivery:</span>
                <span className="font-medium">1-2 days (DHL Express)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Most Cost Effective:</span>
                <span className="font-medium">UPS Ground ($238.75)</span>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Selected
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Pickup
                </Button>
                <Button variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Negotiate Rates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Comparison Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Rate Comparison Chart</p>
              <p className="text-sm text-gray-500">Visual comparison of carrier rates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





