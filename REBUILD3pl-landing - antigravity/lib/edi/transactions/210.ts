import { X12Segment } from '../x12-parser';

export class EDI210Generator {
    static generate(invoiceNumber: string, amount: number, date: Date): X12Segment[] {
        const segments: X12Segment[] = [];

        // ST
        segments.push({ tag: 'ST', elements: ['210', '0001'] });

        // B3: Beginning Segment
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        segments.push({ tag: 'B3', elements: ['', invoiceNumber, '', 'PP', '', dateStr, String(amount)] });

        // L5: Description
        segments.push({ tag: 'L5', elements: ['1', 'Freight Charges'] });

        // L1: Rate and Charges
        segments.push({ tag: 'L1', elements: ['1', String(amount), 'FR', '0'] });

        // L3: Total Weight and Charges
        segments.push({ tag: 'L3', elements: ['100', 'G', String(amount)] });

        // SE
        segments.push({ tag: 'SE', elements: [String(segments.length + 1), '0001'] });

        return segments;
    }
}
