export interface Bin {
    id: string
    x: number
    y: number
    z: number
    length: number
    width: number
    height: number
    zone: string
    aisle: string
    bay: string
    level: string
    capacity: number
    fillPercentage: number
    contents: Array<{
        sku: string
        name: string
        qty: number
    }>
}

export interface Rack {
    id: string
    x: number
    y: number
    z: number
    length?: number
    width: number
    height?: number
    zone?: string
    aisle?: string
    // Complex rack properties
    label?: string
    rotationY?: number
    bayCount?: number
    bayWidth?: number
    depth?: number
    uprightThickness?: number
    levelCount?: number
    levelHeight?: number
    uprightHeight?: number
}

export interface DockDoor {
    id: string
    x: number
    y: number
    z: number
    length: number
    width: number
    height: number
    zone: string
}

export interface StagingLane {
    id: string
    x: number
    y: number
    z: number
    length: number
    width: number
    height: number
    zone: string
    status?: 'EMPTY' | 'FILLING' | 'READY' | 'DISPATCHED'
    orders?: Array<{
        orderNumber: string
        status: string
        filledPallets: number
        requiredPallets: number
    }>
}

export interface Zone {
    id: string
    label: string
    x: number
    z: number
    width: number
    depth: number
    color: string
}

export interface Office {
    id: string
    label: string
    x: number
    z: number
    width: number
    depth: number
    color: string
}

export interface Corridor {
    id: string
    label: string
    x: number
    z: number
    width: number
    depth: number
    color: string
}

export interface Dock {
    id: string
    label: string
    x: number
    z: number
    width: number
    depth: number
    color: string
}

export interface Wall {
    id: string
    x: number
    z: number
    width: number
    height: number
    length: number
    rotationY?: number
    color?: string
}

export interface Column {
    id: string
    x: number
    z: number
    radius: number
    height: number
    color?: string
}

export interface Layout {
    bins?: Bin[]
    racks: Rack[]
    dockDoors?: DockDoor[]
    stagingLanes?: StagingLane[]
    zones?: Zone[]
    offices?: Office[]
    corridors?: Corridor[]
    docks?: Dock[]
    walls?: Wall[]
    columns?: Column[]
    site?: { width: number; depth: number }
}

export function generateMockLayout(): Layout {
    const bins: Bin[] = []
    const racks: Rack[] = []
    const dockDoors: DockDoor[] = []
    const stagingLanes: StagingLane[] = []

    // Generate Dock Doors
    for (let i = 0; i < 4; i++) {
        dockDoors.push({
            id: `dock-${i}`,
            x: -15,
            y: 0,
            z: (i - 1.5) * 6,
            length: 1,
            width: 4,
            height: 5,
            zone: 'RECEIVING'
        })
    }

    // Generate Staging Lanes
    for (let i = 0; i < 4; i++) {
        stagingLanes.push({
            id: `lane-${i}`,
            x: -8,
            y: 0,
            z: (i - 1.5) * 6,
            length: 6,
            width: 4,
            height: 0.1,
            zone: 'STAGING',
            status: i === 1 ? 'FILLING' : i === 2 ? 'READY' : 'EMPTY',
            orders: i === 1 ? [{ orderNumber: 'ORD-101', status: 'FILLING', filledPallets: 4, requiredPallets: 8 }] : []
        })
    }

    // Generate Racks and Bins
    const zones = ['ZONE-A', 'ZONE-B']
    const aisleHeight = 8
    const rackLength = 10
    const rackWidth = 2

    for (let zIndex = 0; zIndex < zones.length; zIndex++) {
        const zone = zones[zIndex]
        for (let aisle = 1; aisle <= 3; aisle++) {
            const aisleX = zIndex * 15 + aisle * 6

            // Create Rack
            racks.push({
                id: `rack-${zone}-${aisle}`,
                x: aisleX,
                y: 0,
                z: 0,
                length: rackLength,
                width: rackWidth,
                height: aisleHeight,
                zone,
                aisle: aisle.toString()
            })

            // Create Bins for this rack (3 levels, 4 bays)
            for (let level = 1; level <= 3; level++) {
                for (let bay = 1; bay <= 4; bay++) {
                    const binZ = (bay - 2.5) * 2.5
                    bins.push({
                        id: `bin-${zone}-${aisle}-${bay}-${level}`,
                        x: aisleX,
                        y: (level - 1) * 2.5 + 0.5,
                        z: binZ,
                        length: 1.2,
                        width: 1.2,
                        height: 1.2,
                        zone,
                        aisle: aisle.toString(),
                        bay: bay.toString(),
                        level: level.toString(),
                        capacity: 100,
                        fillPercentage: Math.random() * 100,
                        contents: Math.random() > 0.3 ? [{ sku: `SKU-${Math.floor(Math.random() * 1000)}`, name: 'Product Name', qty: 10 }] : []
                    })
                }
            }
        }
    }

    return { bins, racks, dockDoors, stagingLanes }
}
