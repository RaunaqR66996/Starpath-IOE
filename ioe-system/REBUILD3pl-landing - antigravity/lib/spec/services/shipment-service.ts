import { PrismaClient } from '@prisma/client'
import { SpecInventoryService } from './inventory-service'

export class SpecShipmentService {
  private prisma: PrismaClient
  private inv: SpecInventoryService

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
    this.inv = new SpecInventoryService(this.prisma)
  }

  async createFromAllocated(orderId: string) {
    const lines = await this.prisma.specOrderLine.findMany({ where: { orderId, status: 'ALLOCATED' } })
    if (lines.length === 0) throw new Error('No allocated lines')
    const shipment = await this.prisma.specShipment.create({ data: { orderId, status: 'PLANNED', fromLocation: 'WH1', toLocation: 'Customer' } })
    for (const l of lines) {
      await this.prisma.specShipmentLine.create({ data: { shipmentId: shipment.id, sku: l.sku, qty: l.qty } })
    }
    await this.prisma.specOrder.update({ where: { id: orderId }, data: { status: 'FULFILLING' } })
    await this.prisma.specEvent.create({ data: { type: 'SHIPMENT_PLANNED', payloadJson: JSON.stringify({ shipmentId: shipment.id, orderId }) } })
    return shipment.id
  }

  async pick(shipmentId: string) {
    await this.prisma.specShipment.update({ where: { id: shipmentId }, data: { status: 'PICKING' } })
  }

  async pack(shipmentId: string) {
    const bol = `BOL-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    await this.prisma.specShipment.update({ where: { id: shipmentId }, data: { status: 'PACKED', bolNo: bol } })
  }

  async dispatch(shipmentId: string) {
    const lines = await this.prisma.specShipmentLine.findMany({ where: { shipmentId } })
    for (const l of lines) await this.inv.consume(l.sku, l.qty)
    await this.prisma.specShipment.update({ where: { id: shipmentId }, data: { status: 'IN_TRANSIT' } })
    const shipment = await this.prisma.specShipment.findUnique({ where: { id: shipmentId } })
    if (shipment) {
      await this.prisma.specOrder.update({ where: { id: shipment.orderId }, data: { status: 'SHIPPED' } })
    }
    await this.prisma.specEvent.create({ data: { type: 'SHIPMENT_DISPATCHED', payloadJson: JSON.stringify({ shipmentId }) } })
  }

  async deliver(shipmentId: string) {
    await this.prisma.specShipment.update({ where: { id: shipmentId }, data: { status: 'DELIVERED' } })
  }
}



