import { PrismaClient } from '@prisma/client'

export class SpecNFCService {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
  }

  async transfer(shipmentId: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const exists = await this.prisma.specIdempotency.findUnique({ where: { key: idempotencyKey } })
      if (exists) return { ok: true, replay: true }
    }
    const shipment = await this.prisma.specShipment.findUnique({ where: { id: shipmentId } })
    if (!shipment) throw new Error('Shipment not found')
    const lines = await this.prisma.specShipmentLine.findMany({ where: { shipmentId } })
    const payload = {
      shipment_id: shipment.id,
      bol_no: shipment.bolNo,
      items: lines.map((l) => ({ sku: l.sku, qty: l.qty })),
      documents: {
        packing_slip_url: `/docs/packing-slip/${shipment.id}.pdf`,
        bol_url: `/docs/bol/${shipment.id}.pdf`,
      },
      timestamp: Date.now(),
    }
    if (idempotencyKey) await this.prisma.specIdempotency.create({ data: { key: idempotencyKey } })
    await this.prisma.specEvent.create({ data: { type: 'NFC_HANDSHAKE_CONFIRMED', payloadJson: JSON.stringify({ shipmentId, payload }) } })
    return { ok: true, payload }
  }
}



