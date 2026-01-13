import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Mock tracking data - in production, this would query real shipping APIs
    const mockVesselData = {
      id: 'vessel-002',
      name: 'COSCO SHIPPING',
      image: '/vessel-placeholder.jpg',
      imo: '9321483',
      mmsi: '413926000',
      callsign: 'VRWF8',
      flag: 'China',
      type: 'Container ship',
      origin: 'Shanghai, China',
      destination: 'CNSHA > USNYC',
      eta: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      latitude: 35.2234,
      longitude: -150.4567,
      course: 82,
      speed: 21.5,
      draught: 14.2,
      navigationStatus: 'Under way',
      lastPositionUpdate: new Date(Date.now() - 8 * 60 * 1000),
      length: 366,
      beam: 48,
      lastPort: 'Shanghai, China',
      lastPortDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      portCalls: [
        {
          port: 'Shanghai',
          country: 'China',
          arrival: new Date('2025-09-18T06:15:00'),
          departure: new Date('2025-09-22T14:30:00'),
        },
        {
          port: 'Ningbo',
          country: 'China',
          arrival: new Date('2025-09-15T11:20:00'),
          departure: new Date('2025-09-17T19:45:00'),
        },
        {
          port: 'Shenzhen',
          country: 'China',
          arrival: new Date('2025-09-12T08:30:00'),
          departure: new Date('2025-09-14T22:15:00'),
        },
        {
          port: 'Hong Kong',
          country: 'Hong Kong',
          arrival: new Date('2025-09-10T14:00:00'),
          departure: new Date('2025-09-11T20:30:00'),
        },
      ],
    };

    const mockPurchaseOrder = {
      poNumber: 'PO-2025-CN-001',
      supplier: 'Shanghai Manufacturing Co., Ltd.',
      buyer: 'ABC Trading Company',
      description: 'Electronics & Components',
      totalValue: 485000,
      currency: 'USD',
      incoterms: 'FOB Shanghai',
      cargoWeight: '42,500 kg',
      packages: 1250,
      hsCode: '8517.62',
    };

    const mockContainers = ['COSU4567890', 'COSU4567891'];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if query matches any known identifiers
    const queryLower = query.toLowerCase();
    const isKnownQuery = 
      queryLower.includes('po-2025-cn-001') ||
      queryLower.includes('cosu4567890') ||
      queryLower.includes('cosco') ||
      queryLower.includes('vessel');

    if (!isKnownQuery) {
      return NextResponse.json({
        success: false,
        error: 'No tracking information found for this query'
      });
    }

    return NextResponse.json({
      success: true,
      vessel: mockVesselData,
      containerId: 'COSU4567890',
      purchaseOrder: mockPurchaseOrder,
      containers: mockContainers
    });

  } catch (error) {
    console.error('Container tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}