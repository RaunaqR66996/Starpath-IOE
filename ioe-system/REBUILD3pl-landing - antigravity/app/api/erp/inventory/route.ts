import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET /api/erp/inventory
// Returns:
// [
//   { "sku": "SKU-001", "quantity": 100, "siteId": "warehouse-001" }
// ]
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const siteId = searchParams.get('siteId')

        const where = siteId ? { warehouseCode: siteId } : {}

        const inventory = await prisma.inventoryItem.findMany({
            where,
            include: {
                item: true,
                location: true
            }
        })

        const result = inventory.map(inv => ({
            sku: inv.item.sku,
            quantity: inv.quantityOnHand,
            available: inv.quantityAvailable,
            siteId: inv.warehouseCode,
            location: inv.location?.locationId || 'N/A'
        }))

        return NextResponse.json(result)

    } catch (error) {
        console.error("ERP Inventory API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
