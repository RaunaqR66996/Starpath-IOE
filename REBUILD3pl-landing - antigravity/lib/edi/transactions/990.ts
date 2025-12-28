import { X12Segment } from '../x12-parser';

export class EDI990Generator {
    static generate(shipmentNumber: string, action: 'A' | 'D', notes?: string): X12Segment[] {
        // A = Accept, D = Decline
        const segments: X12Segment[] = [];

        // ST: Transaction Set Header
        segments.push({ tag: 'ST', elements: ['990', '0001'] });

        // B1: Beginning Segment
        // B1*SCAC*SHIPMENT_ID*DATE*ACTION~
        segments.push({
            tag: 'B1',
            elements: ['SCAC', shipmentNumber, new Date().toISOString().split('T')[0].replace(/-/g, ''), action]
        });

        // K1: Remarks (Optional)
        if (notes) {
            segments.push({ tag: 'K1', elements: [notes] });
        }

        // SE: Transaction Set Trailer
        segments.push({ tag: 'SE', elements: [String(segments.length + 1), '0001'] });

        return segments;
    }
}
