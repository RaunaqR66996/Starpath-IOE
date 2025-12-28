"use server"

import { prisma } from "@/lib/prisma"

export async function getInventory(siteId: string) {
    try {
        const inventory = await prisma.inventoryItem.findMany({
            where: {
                warehouseCode: siteId
            },
            include: {
                item: true,
                location: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })
        return inventory
    } catch (error) {
        console.error("Failed to fetch inventory:", error)
        return []
    }
}
