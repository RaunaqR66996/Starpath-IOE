import { X12Segment } from '../x12-parser';

export class EDI214Generator {
    static generate(shipmentNumber: string, status: string, location: string, date: Date): X12Segment[] {
        const segments: X12Segment[] = [];

        // ST
        segments.push({ tag: 'ST', elements: ['214', '0001'] });

        // B10: Beginning Segment
        segments.push({ tag: 'B10', elements: [shipmentNumber, shipmentNumber, 'SCAC'] });

        // LX: Assigned Number
        segments.push({ tag: 'LX', elements: ['1'] });

        // AT7: Shipment Status Details
        // Map internal status to EDI status codes (simplified)
        let statusCode = 'AF'; // Departed
        if (status === 'DELIVERED') statusCode = 'D1'; // Delivered
        if (status === 'PICKED_UP') statusCode = 'X3'; // Arrived at Pickup

        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');

        segments.push({ tag: 'AT7', elements: [statusCode, 'NS', '', '', dateStr, timeStr] });

        // MS1: Location
        segments.push({ tag: 'MS1', elements: [location, 'City', 'State', 'USA'] });

        // SE
        segments.push({ tag: 'SE', elements: [String(segments.length + 1), '0001'] });

        return segments;
    }
}
