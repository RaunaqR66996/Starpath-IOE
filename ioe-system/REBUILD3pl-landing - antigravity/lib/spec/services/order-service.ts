import { PrismaClient } from '@prisma/client'
import { SpecInventoryService } from './inventory-service'

export class SpecOrderService {
  private prisma: PrismaClient
  private inv: SpecInventoryService

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
    this.inv = new SpecInventoryService(this.prisma)
  }

  async approveOrder(orderId: string) {
    const order = await this.prisma.specOrder.findUnique({ where: { id: orderId } })
    if (!order) throw new Error('Order not found')
    if (order.status !== 'DRAFT') throw new Error('Only DRAFT can be approved')
    await this.prisma.specOrder.update({ where: { id: orderId }, data: { status: 'APPROVED' } })
    await this.prisma.specEvent.create({ data: { type: 'ORDER_APPROVED', payloadJson: JSON.stringify({ orderId }) } })
  }

  async allocate(orderId: string) {
    const lines = await this.prisma.specOrderLine.findMany({ where: { orderId } })
    let allAllocated = true
    for (const line of lines) {
      if (line.status !== 'OPEN') continue
      const reserved = await this.inv.reserve(line.sku, line.qty)
      if (reserved === line.qty) {
        await this.prisma.specOrderLine.update({ where: { id: line.id }, data: { status: 'ALLOCATED', qty: reserved } })
      } else {
        if (reserved > 0) {
          await this.prisma.specOrderLine.update({ where: { id: line.id }, data: { status: 'ALLOCATED', qty: reserved } })
        } else {
          await this.prisma.specOrderLine.update({ where: { id: line.id }, data: { status: 'BACKORDERED' } })
        }
        const remaining = line.qty - reserved
        if (remaining > 0) {
          await this.prisma.specOrderLine.create({ data: { orderId, sku: line.sku, qty: remaining, uom: line.uom, unitPriceMinor: line.unitPriceMinor, status: 'BACKORDERED' } })
          allAllocated = false
        }
      }
    }
    await this.prisma.specOrder.update({ where: { id: orderId }, data: { status: allAllocated ? 'ALLOCATED' : 'APPROVED' } })
    if (allAllocated) await this.prisma.specEvent.create({ data: { type: 'ORDER_ALLOCATED', payloadJson: JSON.stringify({ orderId }) } })
  }
}



