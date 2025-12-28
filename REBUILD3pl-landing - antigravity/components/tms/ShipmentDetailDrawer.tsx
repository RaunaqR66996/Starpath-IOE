"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  X, 
  Package, 
  MapPin, 
  Truck, 
  FileText, 
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { Shipment, Quote, Label } from "@/types/tms"
import { useRateShipment, useChooseQuote, useGenerateLabels, useCreateLoadPlan } from "@/hooks/use-tms"
import { LoadOptimizer3D } from "./LoadOptimizer3D"
import toast from "react-hot-toast"

interface ShipmentDetailDrawerProps {
  shipment: Shipment
  isOpen: boolean
  onClose: () => void
}

export function ShipmentDetailDrawer({ shipment, isOpen, onClose }: ShipmentDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("quotes")
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [labels, setLabels] = useState<Label[]>([])

  const rateShipmentMutation = useRateShipment()
  const chooseQuoteMutation = useChooseQuote()
  const generateLabelsMutation = useGenerateLabels()
  const createLoadPlanMutation = useCreateLoadPlan()

  const handleRateShipment = async () => {
    try {
      const result = await rateShipmentMutation.mutateAsync({ shipment_id: shipment.id })
      setQuotes(result.quotes)
      toast.success("Shipment rated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rate shipment")
    }
  }

  const handleChooseQuote = async (quote: Quote) => {
    try {
      await chooseQuoteMutation.mutateAsync({
        shipment_id: shipment.id,
        carrier: quote.carrierId,
        service: quote.serviceLevel,
        cost: quote.cost
      })
      toast.success("Quote selected successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to select quote")
    }
  }

  const handleGenerateLabels = async () => {
    try {
      const result = await generateLabelsMutation.mutateAsync({ shipment_id: shipment.id })
      setLabels(result.labels)
      toast.success("Labels generated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate labels")
    }
  }

  const handleCreateLoadPlan = async () => {
    try {
      const planRequest = {
        shipmentId: shipment.id,
        equipmentType: "TRAILER_53" as const,
        equipmentSpecs: {
          length: 630, // 53 feet in inches
          width: 102,
          height: 110,
          maxWeight: 80000
        },
        pieces: shipment.pieces.map(piece => ({
          id: piece.id,
          sku: piece.sku,
          description: piece.description,
          quantity: piece.quantity,
          weight: piece.weight,
          length: piece.length,
          width: piece.width,
          height: piece.height,
          orientation: piece.orientation,
          stackable: piece.stackable,
          stopSequence: piece.stopSequence,
          isFragile: false,
          isHazardous: false
        })),
        constraints: {
          allowRotation: true,
          maxStackHeight: 120,
          fragileOnTop: true,
          hazardousSeparation: false
        }
      }

      await createLoadPlanMutation.mutateAsync(planRequest)
      toast.success("Load plan created successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create load plan")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <Card className="uber-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="uber-heading-2">{shipment.shipmentNumber}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {shipment.status}
                  </Badge>
                  <Badge variant="outline">{shipment.mode}</Badge>
                  <Badge variant="outline">{shipment.consolidation}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
                <TabsTrigger value="labels">Labels</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="3d-plan">3D Plan</TabsTrigger>
              </TabsList>

              <TabsContent value="quotes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="uber-heading-3">Rate Quotes</h3>
                  <Button 
                    onClick={handleRateShipment}
                    disabled={rateShipmentMutation.isPending}
                    className="uber-button"
                  >
                    {rateShipmentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 mr-2" />
                    )}
                    Get Quotes
                  </Button>
                </div>

                {quotes.length > 0 && (
                  <div className="space-y-3">
                    {quotes.map((quote, index) => (
                      <Card key={index} className="uber-card">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{quote.carrierName}</h4>
                                <Badge variant="outline">{quote.serviceLevel}</Badge>
                                {quote.guaranteed && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Guaranteed
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Cost:</span> ${quote.cost.toFixed(2)}
                                </div>
                                <div>
                                  <span className="font-medium">Transit:</span> {quote.transitDays} days
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="text-sm text-gray-600">Features: </span>
                                <span className="text-sm">{quote.features.join(', ')}</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleChooseQuote(quote)}
                              disabled={chooseQuoteMutation.isPending}
                              className="uber-button"
                            >
                              {chooseQuoteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Select'
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="labels" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="uber-heading-3">Shipping Labels</h3>
                  <Button 
                    onClick={handleGenerateLabels}
                    disabled={generateLabelsMutation.isPending || shipment.status !== 'RATED'}
                    className="uber-button"
                  >
                    {generateLabelsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate Labels
                  </Button>
                </div>

                {labels.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labels.map((label) => (
                      <Card key={label.id} className="uber-card">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{label.type.replace('_', ' ')}</h4>
                              <p className="text-sm text-gray-600">
                                {label.format} • {label.size}
                              </p>
                              <p className="text-xs text-gray-500">
                                Generated: {new Date(label.generatedAt).toLocaleString()}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="uber-button">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <h3 className="uber-heading-3">Tracking Events</h3>
                <div className="space-y-3">
                  {shipment.events.map((event) => (
                    <Card key={event.id} className="uber-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Truck className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{event.type.replace('_', ' ')}</span>
                              {event.nfcVerified && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  NFC Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                              {event.location && <span>{event.location}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="3d-plan" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="uber-heading-3">3D Load Optimizer</h3>
                  <Button 
                    onClick={handleCreateLoadPlan}
                    disabled={createLoadPlanMutation.isPending}
                    className="uber-button"
                  >
                    {createLoadPlanMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    Optimize Load
                  </Button>
                </div>

                <LoadOptimizer3D shipment={shipment} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}







