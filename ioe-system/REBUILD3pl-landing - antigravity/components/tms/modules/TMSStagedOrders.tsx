"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Truck,
    Package,
    Loader2,
    CheckCircle,
    MapPin,
    DollarSign,
    Calendar
} from 'lucide-react'
import { ERPNextBadge } from '@/components/ui/erpnext-badge'
import { toast } from 'sonner'

interface StagedOrder {
    id: string
    status: string
    order: {
        id: string
        orderNumber: string
        customer: {
            name: string
        }
        items: any[]
        totalAmount: number
        erpnextOrderNumber?: string
    }
    zone: {
        zoneCode: string
    }
    createdAt: string
}

export function TMSStagedOrders() {
    const [stagedOrders, setStagedOrders] = useState<StagedOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchStagedOrders = async () => {
        try {
            const response = await fetch('/api/tms/staged-orders')
            const data = await response.json()

            if (data.success) {
                setStagedOrders(data.data || [])
            } else {
                toast.error('Failed to load staged orders')
            }
        } catch (error) {
            console.error('Failed to fetch staged orders', error)
            toast.error('Failed to load staged orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStagedOrders()
        // Refresh every 30 seconds
        const interval = setInterval(fetchStagedOrders, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleCreateLoadPlan = async (orderId: string) => {
        setProcessingId(orderId)
        try {
            const response = await fetch('/api/tms/load-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderIds: [orderId],
                    equipmentType: '53ft Trailer' // Default
                })
            })

            const result = await response.json()

            if (result.success) {
                toast.success('Load plan created successfully!')
                fetchStagedOrders()
            } else {
                toast.error('Failed to create load plan')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setProcessingId(null)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span className="text-sp-text-muted">Loading staged orders...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-sp-text-strong">Staged Orders</h2>
                    <p className="text-sm text-sp-text-muted mt-1">
                        Orders ready for load planning from WMS
                    </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    {stagedOrders.length} Ready
                </Badge>
            </div>

            {/* Orders Grid */}
            {stagedOrders.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Staged Orders</h3>
                        <p className="text-sm text-gray-500 text-center max-w-md">
                            Orders will appear here after they are packed and moved to staging in WMS.
                            <br />
                            Go to WMS Outbound to process orders.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stagedOrders.map((item) => (
                        <Card key={item.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-base">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{item.order.orderNumber}</span>
                                        {item.order.erpnextOrderNumber && (
                                            <ERPNextBadge
                                                orderNumber={item.order.erpnextOrderNumber}
                                                className="text-xs"
                                            />
                                        )}
                                    </div>
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                        <Truck className="h-3 w-3 mr-1" />
                                        {item.status}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Customer */}
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">{item.order.customer?.name}</span>
                                </div>

                                {/* Order Details */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{item.order.items?.length || 0} items</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{formatCurrency(Number(item.order.totalAmount))}</span>
                                    </div>
                                </div>

                                {/* Staged Time */}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>Staged: {formatDate(item.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <MapPin className="h-3 w-3" />
                                    <span>Zone: {item.zone?.zoneCode}</span>
                                </div>

                                {/* Action Button */}
                                <Button
                                    className="w-full mt-2"
                                    onClick={() => handleCreateLoadPlan(item.order.id)}
                                    disabled={processingId === item.order.id}
                                >
                                    {processingId === item.order.id ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Create Load Plan
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info Banner */}
            {stagedOrders.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 rounded-full p-2">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-blue-900 mb-1">Ready for Load Planning</h4>
                                <p className="text-sm text-blue-700">
                                    These orders have been packed and staged in the warehouse. Click "Create Load Plan" to optimize loading and assign to carriers.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
