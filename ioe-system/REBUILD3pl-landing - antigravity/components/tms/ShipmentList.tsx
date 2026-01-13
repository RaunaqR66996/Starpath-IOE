"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Truck,
  Package,
  Clock,
  DollarSign,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Route,
  Settings,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Zap,
  Brain,
  Eye,
  EyeOff,
  Layout
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Shipment {
  id: string
  trackingNumber: string
  customer: string
  origin: string
  destination: string
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception'
  carrier: string
  service: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  cost: number
  estimatedDelivery: string
  actualDelivery?: string
  routeOptimization: {
    optimized: boolean
    savings: number
    originalCost: number
    optimizedCost: number
    route: string[]
  }
  aiInsights: {
    riskScore: number
    delayProbability: number
    costOptimization: number
    recommendations: string[]
  }
}

interface Carrier {
  id: string
  name: string
  logo: string
  services: string[]
  rating: number
  costRange: string
  deliveryTime: string
  coverage: string[]
}

export function ShipmentList() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [carrierFilter, setCarrierFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'detailed' | 'light'>('detailed')
  const [shippingMetrics, setShippingMetrics] = useState({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    exceptions: 0,
    totalCost: 0,
    averageCost: 0,
    onTimeDelivery: 0,
    routeOptimizations: 0,
    totalSavings: 0
  })

  // Mock carriers data
  const carriers: Carrier[] = [
    {
      id: "fedex",
      name: "FedEx",
      logo: "/fedex-logo.png",
      services: ["Ground", "Express", "Priority", "Economy"],
      rating: 4.5,
      costRange: "$15-$150",
      deliveryTime: "1-5 days",
      coverage: ["US", "Canada", "Mexico", "International"]
    },
    {
      id: "ups",
      name: "UPS",
      logo: "/ups-logo.png",
      services: ["Ground", "Next Day Air", "2nd Day Air", "3 Day Select"],
      rating: 4.3,
      costRange: "$12-$200",
      deliveryTime: "1-7 days",
      coverage: ["US", "Canada", "Mexico", "International"]
    },
    {
      id: "usps",
      name: "USPS",
      logo: "/usps-logo.png",
      services: ["Priority Mail", "First Class", "Media Mail", "Parcel Select"],
      rating: 4.0,
      costRange: "$8-$100",
      deliveryTime: "2-10 days",
      coverage: ["US", "Canada", "Mexico", "International"]
    },
    {
      id: "dhl",
      name: "DHL",
      logo: "/dhl-logo.png",
      services: ["Express", "Ground", "Economy", "Same Day"],
      rating: 4.2,
      costRange: "$20-$300",
      deliveryTime: "1-8 days",
      coverage: ["US", "Canada", "Mexico", "International"]
    }
  ]

  // Mock shipments data
  useEffect(() => {
    const mockShipments: Shipment[] = []

    setShipments(mockShipments)
    setFilteredShipments(mockShipments)

    // Calculate metrics
    const metrics = {
      totalShipments: mockShipments.length,
      inTransit: mockShipments.filter(s => s.status === 'in_transit').length,
      delivered: mockShipments.filter(s => s.status === 'delivered').length,
      exceptions: mockShipments.filter(s => s.status === 'exception').length,
      totalCost: mockShipments.reduce((sum, s) => sum + s.cost, 0),
      averageCost: mockShipments.reduce((sum, s) => sum + s.cost, 0) / mockShipments.length,
      onTimeDelivery: mockShipments.filter(s => s.status === 'delivered' && s.actualDelivery === s.estimatedDelivery).length,
      routeOptimizations: mockShipments.filter(s => s.routeOptimization.optimized).length,
      totalSavings: mockShipments.reduce((sum, s) => sum + s.routeOptimization.savings, 0)
    }
    setShippingMetrics(metrics)
  }, [])

  // Filter shipments
  useEffect(() => {
    let filtered = shipments

    if (searchTerm) {
      filtered = filtered.filter(shipment =>
        shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.destination.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(shipment => shipment.status === statusFilter)
    }

    if (carrierFilter !== "all") {
      filtered = filtered.filter(shipment => shipment.carrier.toLowerCase() === carrierFilter)
    }

    setFilteredShipments(filtered)
  }, [shipments, searchTerm, statusFilter, carrierFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-white text-black border border-black", icon: Clock },
      in_transit: { color: "bg-white text-black border border-black", icon: Truck },
      out_for_delivery: { color: "bg-white text-black border border-black", icon: Package },
      delivered: { color: "bg-white text-black border border-black", icon: CheckCircle },
      exception: { color: "bg-white text-black border border-black", icon: AlertTriangle }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getRiskLevel = (riskScore: number) => {
    if (riskScore < 0.2) return { level: "Low", color: "text-black" }
    if (riskScore < 0.5) return { level: "Medium", color: "text-gray-600" }
    return { level: "High", color: "text-black" }
  }

  const handleRouteOptimization = (shipmentId: string) => {
    setIsLoading(true)
    setTimeout(() => {
      setShipments(prev => prev.map(s =>
        s.id === shipmentId
          ? { ...s, routeOptimization: { ...s.routeOptimization, optimized: true, savings: 15.00 } }
          : s
      ))
      setIsLoading(false)
    }, 2000)
  }

  const handleCarrierIntegration = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 3000)
  }

  return (
    <div className="space-y-6">
      {/* Shipping Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippingMetrics.totalShipments}</div>
            <p className="text-xs text-muted-foreground">
              Active and completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{shippingMetrics.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              Currently shipping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${shippingMetrics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${shippingMetrics.averageCost.toFixed(2)} per shipment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">${shippingMetrics.totalSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {shippingMetrics.routeOptimizations} optimizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Route Optimization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-black" />
                AI Route Optimization
              </CardTitle>
              <CardDescription>
                Machine learning-powered route optimization and cost analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCarrierIntegration} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Carriers
              </Button>
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Optimize All Routes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-black">
              <Route className="h-8 w-8 mx-auto text-black mb-2" />
              <div className="text-2xl font-bold text-black">{shippingMetrics.routeOptimizations}</div>
              <div className="text-sm text-gray-600">Optimized Routes</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-black">
              <DollarSign className="h-8 w-8 mx-auto text-black mb-2" />
              <div className="text-2xl font-bold text-black">${shippingMetrics.totalSavings.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Savings</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-black">
              <BarChart3 className="h-8 w-8 mx-auto text-black mb-2" />
              <div className="text-2xl font-bold text-black">
                {shippingMetrics.totalShipments > 0
                  ? Math.round((shippingMetrics.routeOptimizations / shippingMetrics.totalShipments) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Optimization Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carrier Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-black" />
            Carrier Integration
          </CardTitle>
          <CardDescription>
            Real-time rates, tracking, and service comparison across carriers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {carriers.map((carrier) => (
              <div key={carrier.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{carrier.name}</span>
                  </div>
                  <Badge variant="outline">{carrier.rating}★</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Cost:</span> {carrier.costRange}</div>
                  <div><span className="font-medium">Delivery:</span> {carrier.deliveryTime}</div>
                  <div><span className="font-medium">Services:</span> {carrier.services.slice(0, 2).join(", ")}</div>
                </div>
                <Button size="sm" className="w-full mt-3">
                  Get Rates
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipments Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shipments</CardTitle>
              <CardDescription>
                Track and manage all shipments with AI-powered insights
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('detailed')}
                  className="h-8 px-3"
                >
                  <Layout className="h-4 w-4 mr-1" />
                  Detailed
                </Button>
                <Button
                  variant={viewMode === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('light')}
                  className="h-8 px-3"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Light
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Shipment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by tracking number, customer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
              </SelectContent>
            </Select>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="dhl">DHL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shipments Table */}
          <div className={`rounded-md ${viewMode === 'light' ? 'border-2 border-dashed border-gray-300 bg-gray-50/50' : 'border'}`}>
            <Table>
              <TableHeader>
                <TableRow className={viewMode === 'light' ? 'bg-gray-100/80 border-b-2 border-dashed border-gray-400' : ''}>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700 border-r border-dashed border-gray-300' : ''}>Tracking</TableHead>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700 border-r border-dashed border-gray-300' : ''}>Customer</TableHead>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700 border-r border-dashed border-gray-300' : ''}>Route</TableHead>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700 border-r border-dashed border-gray-300' : ''}>Carrier</TableHead>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700 border-r border-dashed border-gray-300' : ''}>Status</TableHead>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700 border-r border-dashed border-gray-300' : ''}>Cost</TableHead>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700 border-r border-dashed border-gray-300' : ''}>AI Insights</TableHead>
                  <TableHead className={viewMode === 'light' ? 'font-semibold text-gray-700' : ''}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow
                    key={shipment.id}
                    className={viewMode === 'light' ? 'border-b border-dashed border-gray-300 hover:bg-gray-100/60' : ''}
                  >
                    <TableCell className={`font-medium ${viewMode === 'light' ? 'border-r border-dashed border-gray-300' : ''}`}>{shipment.trackingNumber}</TableCell>
                    <TableCell className={viewMode === 'light' ? 'border-r border-dashed border-gray-300' : ''}>{shipment.customer}</TableCell>
                    <TableCell className={viewMode === 'light' ? 'border-r border-dashed border-gray-300' : ''}>
                      <div className="text-sm">
                        <div>{shipment.origin} → {shipment.destination}</div>
                        <div className="text-xs text-muted-foreground">
                          {shipment.routeOptimization.route.join(" → ")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={viewMode === 'light' ? 'border-r border-dashed border-gray-300' : ''}>
                      <div className="text-sm">
                        <div className="font-medium">{shipment.carrier}</div>
                        <div className="text-xs text-muted-foreground">{shipment.service}</div>
                      </div>
                    </TableCell>
                    <TableCell className={viewMode === 'light' ? 'border-r border-dashed border-gray-300' : ''}>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell className={viewMode === 'light' ? 'border-r border-dashed border-gray-300' : ''}>
                      <div className="text-sm">
                        <div className="font-medium">${shipment.cost}</div>
                        {shipment.routeOptimization.optimized && (
                          <div className="text-xs text-black">
                            Saved ${shipment.routeOptimization.savings}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={viewMode === 'light' ? 'border-r border-dashed border-gray-300' : ''}>
                      <div className="space-y-1">
                        <div className="text-xs">
                          Risk: <span className={getRiskLevel(shipment.aiInsights.riskScore).color}>
                            {getRiskLevel(shipment.aiInsights.riskScore).level}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((1 - shipment.aiInsights.delayProbability) * 100)}% on-time
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRouteOptimization(shipment.id)}
                          disabled={isLoading || shipment.routeOptimization.optimized}
                          className={viewMode === 'light' ? 'border-dashed border-gray-400 hover:border-solid' : ''}
                        >
                          <Route className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={viewMode === 'light' ? 'border-dashed border-gray-400 hover:border-solid' : ''}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-black" />
            AI Shipping Recommendations
          </CardTitle>
          <CardDescription>
            Intelligent suggestions for cost optimization and risk mitigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shipments
              .filter(shipment => shipment.aiInsights.recommendations.length > 0)
              .map((shipment) => (
                <div key={shipment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{shipment.trackingNumber}</h4>
                    {getStatusBadge(shipment.status)}
                  </div>
                  <div className="space-y-2">
                    {shipment.aiInsights.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 flex-shrink-0"></div>
                        {rec}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-xs">
                      <span>Risk Score: {Math.round(shipment.aiInsights.riskScore * 100)}%</span>
                      <span>Cost Optimization: {Math.round(shipment.aiInsights.costOptimization * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}























