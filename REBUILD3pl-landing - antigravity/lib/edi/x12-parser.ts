export interface X12Segment {
    tag: string;
    elements: string[];
}

export interface X12Interchange {
    senderId: string;
    receiverId: string;
    controlNumber: string;
    segments: X12Segment[];
}

export class X12Parser {
    private segmentDelimiter = '~';
    private elementDelimiter = '*';

    constructor(segmentDelimiter = '~', elementDelimiter = '*') {
        this.segmentDelimiter = segmentDelimiter;
        this.elementDelimiter = elementDelimiter;
    }

    parse(raw: string): X12Interchange {
        // Basic cleanup
        const cleaned = raw.trim();

        // Split segments
        const lines = cleaned.split(this.segmentDelimiter).filter(l => l.length > 0);

        const segments: X12Segment[] = lines.map(line => {
            const elements = line.split(this.elementDelimiter);
            const tag = elements[0];
            return { tag, elements: elements.slice(1) };
        });

        // Extract ISA details
        const isa = segments.find(s => s.tag === 'ISA');
        if (!isa) {
            throw new Error('Missing ISA segment');
        }

        return {
            senderId: isa.elements[5].trim(),
            receiverId: isa.elements[7].trim(),
            controlNumber: isa.elements[12],
            segments
        };
    }

    generate(segments: X12Segment[]): string {
        return segments.map(s => {
            return [s.tag, ...s.elements].join(this.elementDelimiter);
        }).join(this.segmentDelimiter) + this.segmentDelimiter;
    }
}
