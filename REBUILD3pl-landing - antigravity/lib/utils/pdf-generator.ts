import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Define types for the data we expect
interface InvoiceData {
    invoiceNumber: string
    date: string
    dueDate: string
    customer: {
        name: string
        address: string
        city: string
        state: string
        zip: string
        country: string
    }
    items: {
        description: string
        quantity: number
        unitPrice: number
        total: number
    }[]
    subtotal: number
    tax: number
    total: number
}

interface BOLData {
    bolNumber: string
    date: string
    carrier: string
    shipper: {
        name: string
        address: string
        city: string
        state: string
        zip: string
    }
    consignee: {
        name: string
        address: string
        city: string
        state: string
        zip: string
    }
    commodities: {
        pieces: number
        type: string
        weight: number
        description: string
        nmfc?: string
        class?: string
    }[]
    totalWeight: number
    totalPieces: number
}

export class PDFGenerator {

    static generateInvoice(data: InvoiceData): Blob {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.text('INVOICE', 14, 22)

        doc.setFontSize(10)
        doc.text(`Invoice #: ${data.invoiceNumber}`, 14, 30)
        doc.text(`Date: ${data.date}`, 14, 35)
        doc.text(`Due Date: ${data.dueDate}`, 14, 40)

        // Company Info (Right side)
        const pageWidth = doc.internal.pageSize.width
        doc.text('BlueShip Logistics', pageWidth - 14, 22, { align: 'right' })
        doc.text('123 Logistics Way', pageWidth - 14, 27, { align: 'right' })
        doc.text('New York, NY 10001', pageWidth - 14, 32, { align: 'right' })

        // Bill To
        doc.text('Bill To:', 14, 55)
        doc.setFont('helvetica', 'bold')
        doc.text(data.customer.name, 14, 60)
        doc.setFont('helvetica', 'normal')
        doc.text(data.customer.address, 14, 65)
        doc.text(`${data.customer.city}, ${data.customer.state} ${data.customer.zip}`, 14, 70)

        // Line Items
        const tableColumn = ["Description", "Quantity", "Unit Price", "Total"]
        const tableRows = []

        data.items.forEach(item => {
            const itemData = [
                item.description,
                item.quantity,
                `$${item.unitPrice.toFixed(2)}`,
                `$${item.total.toFixed(2)}`
            ]
            tableRows.push(itemData)
        })

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 80,
        })

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY + 10

        doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' })
        doc.text(`Tax: $${data.tax.toFixed(2)}`, pageWidth - 14, finalY + 5, { align: 'right' })
        doc.setFont('helvetica', 'bold')
        doc.text(`Total: $${data.total.toFixed(2)}`, pageWidth - 14, finalY + 10, { align: 'right' })

        return doc.output('blob')
    }

    static generateBOL(data: BOLData): Blob {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(18)
        doc.text('BILL OF LADING', 105, 15, { align: 'center' })

        doc.setFontSize(10)
        doc.text(`BOL #: ${data.bolNumber}`, 14, 25)
        doc.text(`Date: ${data.date}`, 14, 30)
        doc.text(`Carrier: ${data.carrier}`, 14, 35)

        // Shipper & Consignee
        doc.line(14, 40, 196, 40)

        doc.text('SHIP FROM:', 14, 45)
        doc.setFont('helvetica', 'bold')
        doc.text(data.shipper.name, 14, 50)
        doc.setFont('helvetica', 'normal')
        doc.text(data.shipper.address, 14, 55)
        doc.text(`${data.shipper.city}, ${data.shipper.state} ${data.shipper.zip}`, 14, 60)

        doc.text('SHIP TO:', 105, 45)
        doc.setFont('helvetica', 'bold')
        doc.text(data.consignee.name, 105, 50)
        doc.setFont('helvetica', 'normal')
        doc.text(data.consignee.address, 105, 55)
        doc.text(`${data.consignee.city}, ${data.consignee.state} ${data.consignee.zip}`, 105, 60)

        // Commodities
        const tableColumn = ["Pieces", "Type", "Description", "Weight (lbs)", "Class"]
        const tableRows = []

        data.commodities.forEach(item => {
            const itemData = [
                item.pieces,
                item.type,
                item.description,
                item.weight,
                item.class || '50'
            ]
            tableRows.push(itemData)
        })

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'grid'
        })

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 10
        doc.text(`Total Pieces: ${data.totalPieces}`, 14, finalY)
        doc.text(`Total Weight: ${data.totalWeight} lbs`, 60, finalY)

        doc.setFontSize(8)
        doc.text('Received subject to the classifications and tariffs in effect on the date of the issue of this Bill of Lading.', 14, finalY + 15)
        doc.text('Shipper Signature: __________________________ Date: __________', 14, finalY + 25)
        doc.text('Carrier Signature: __________________________ Date: __________', 14, finalY + 35)

        return doc.output('blob')
    }

    static generatePackingSlip(data: BOLData): Blob {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.text('PACKING SLIP', 14, 22)

        doc.setFontSize(10)
        doc.text(`Order #: ${data.bolNumber}`, 14, 30) // Using BOL/Shipment number as reference
        doc.text(`Date: ${data.date}`, 14, 35)

        // Company Info (Right side)
        const pageWidth = doc.internal.pageSize.width
        doc.text('BlueShip Logistics', pageWidth - 14, 22, { align: 'right' })
        doc.text('123 Logistics Way', pageWidth - 14, 27, { align: 'right' })
        doc.text('New York, NY 10001', pageWidth - 14, 32, { align: 'right' })

        // Ship To
        doc.text('Ship To:', 14, 55)
        doc.setFont('helvetica', 'bold')
        doc.text(data.consignee.name, 14, 60)
        doc.setFont('helvetica', 'normal')
        doc.text(data.consignee.address, 14, 65)
        doc.text(`${data.consignee.city}, ${data.consignee.state} ${data.consignee.zip}`, 14, 70)

        // Items
        const tableColumn = ["Item", "Description", "Quantity"]
        const tableRows = []

        data.commodities.forEach(item => {
            const itemData = [
                item.type, // Using type as Item code/SKU placeholder if available, or just generic
                item.description,
                item.pieces
            ]
            tableRows.push(itemData)
        })

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 80,
        })

        return doc.output('blob')
    }

    static generatePickTicket(data: PickTicketData): Blob {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.text('PICK TICKET', 14, 22)

        doc.setFontSize(10)
        doc.text(`Order #: ${data.orderNumber}`, 14, 30)
        doc.text(`Date: ${data.date}`, 14, 35)

        // Items to Pick
        const tableColumn = ["Location", "SKU", "Description", "Qty", "Check"]
        const tableRows = []

        data.items.forEach(item => {
            const itemData = [
                item.location,
                item.sku,
                item.description,
                item.quantity,
                "[ ]"
            ]
            tableRows.push(itemData)
        })

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            styles: { fontSize: 12, cellPadding: 3 }
        })

        return doc.output('blob')
    }
}

export interface PickTicketData {
    orderNumber: string
    date: string
    items: {
        sku: string
        description: string
        quantity: number
        location: string
    }[]
}
