import { PrismaClient } from '@prisma/client';
import { X12Segment } from '../x12-parser';

const prisma = new PrismaClient();

export class EDI204Handler {
    static async handle(segments: X12Segment[], organizationId: string, partnerId: string) {
        // 1. Extract Shipment Details
        const b2 = segments.find(s => s.tag === 'B2');
        if (!b2) throw new Error('Missing B2 segment');

        const shipmentNumber = b2.elements[3]; // SCAC or Shipment ID
        const paymentMethod = b2.elements[5]; // PP (Prepaid) or CC (Collect)

        // 2. Extract Stops (S5 Loop)
        // Simplified logic: Just find all S5 segments
        const stops = segments.filter(s => s.tag === 'S5').map((s, index) => ({
            sequence: Number(s.elements[0]),
            type: s.elements[1] // LD (Load) or UL (Unload)
        }));

        // 3. Create/Update Shipment
        // In a real implementation, we would map N1 loops to addresses, L11 to refs, etc.

        const shipment = await prisma.shipment.create({
            data: {
                organizationId,
                shipmentNumber: `EDI-${shipmentNumber}-${Date.now()}`, // Ensure uniqueness
                status: 'TENDERED',
                mode: 'FTL',
                metadata: {
                    source: 'EDI-204',
                    partnerId,
                    rawStops: stops
                }
            }
        });

        console.log(`Processed EDI 204: Created Shipment ${shipment.shipmentNumber}`);
        return shipment;
    }
}
