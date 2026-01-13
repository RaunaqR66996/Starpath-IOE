"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, FileText } from 'lucide-react'
import { getInvoices, getInvoiceDetails } from '@/app/actions/invoices'
import { PDFGenerator } from '@/lib/utils/pdf-generator'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Invoice {
    id: string
    invoiceNumber: string
    customerName: string
    amount: number
    status: string
    dueDate: Date
    createdAt: Date
    orderNumber: string
}

export function TMSInvoices() {
    const [searchTerm, setSearchTerm] = useState('')
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                const data = await getInvoices()
                setInvoices(data)
            } catch (error) {
                console.error('Failed to load invoices', error)
            } finally {
                setLoading(false)
            }
        }
        loadInvoices()
    }, [])

    const handleDownloadPDF = async (invoiceId: string) => {
        try {
            const details = await getInvoiceDetails(invoiceId)
            if (!details) {
                toast.error('Failed to load invoice details')
                return
            }

            const pdfBlob = PDFGenerator.generateInvoice(details)
            const url = URL.createObjectURL(pdfBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Invoice-${details.invoiceNumber}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Invoice PDF downloaded')
        } catch (error) {
            console.error('PDF Generation Error:', error)
            toast.error('Failed to generate PDF')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800'
            case 'SENT': return 'bg-blue-100 text-blue-800'
            case 'OVERDUE': return 'bg-red-100 text-red-800'
            case 'DRAFT': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(new Date(date))
    }

    const filteredInvoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span className="text-gray-500">Loading invoices...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2 font-medium">Invoice #</th>
                                    <th className="text-left p-2 font-medium">Customer</th>
                                    <th className="text-left p-2 font-medium">Order #</th>
                                    <th className="text-left p-2 font-medium">Amount</th>
                                    <th className="text-left p-2 font-medium">Status</th>
                                    <th className="text-left p-2 font-medium">Due Date</th>
                                    <th className="text-left p-2 font-medium">Created</th>
                                    <th className="text-left p-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                                        <td className="p-2 font-medium">{invoice.invoiceNumber}</td>
                                        <td className="p-2">{invoice.customerName}</td>
                                        <td className="p-2">{invoice.orderNumber}</td>
                                        <td className="p-2 font-medium">{formatCurrency(invoice.amount)}</td>
                                        <td className="p-2">
                                            <Badge className={getStatusColor(invoice.status)}>
                                                {invoice.status}
                                            </Badge>
                                        </td>
                                        <td className="p-2">{formatDate(invoice.dueDate)}</td>
                                        <td className="p-2">{formatDate(invoice.createdAt)}</td>
                                        <td className="p-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadPDF(invoice.id)}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
