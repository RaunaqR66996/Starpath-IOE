
// --- IOE Network Definition (PMESII Framework) ---
// Used to render the "Command Graph" visualizer

export type NodeType =
    | 'INFRASTRUCTURE'   // Warehouses, Factories, Ports
    | 'ECONOMIC'         // Customers, Suppliers, Banks
    | 'INFORMATION'      // Satellites, Data Centers, Sensors
    | 'SOCIAL'           // Labor Unions, Regulatory Bodies
    | 'MILITARY'         // (Optional) Secure Sites / Gov Contracts
    | 'POLITICAL';       // Trade Zones, Embargos

export type LinkType =
    | 'PHYSICAL'         // Truck Route, Conveyor Belt
    | 'FINANCIAL'        // Payment Flow, Credit Line
    | 'INFORMATION'      // API Data, Sensor Stream
    | 'DEPENDENCY';      // Power Grid, Regulatory Approval

export interface NetworkNode {
    id: string;
    label: string;
    type: NodeType;
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';

    // Spatial Data
    lat?: number;
    lng?: number;

    // Real Data Link
    relatedEntityId?: string; // Links to "WarehouseId" or "CustomerId"
    metrics?: Record<string, number>; // { temperature: 20, cash: 50000 }
}

export interface NetworkLink {
    source: string; // Node ID
    target: string; // Node ID
    type: LinkType;
    throughput: number; // 0-100% (Health of the link)
    isActive: boolean;
}

export interface OperationalGraph {
    nodes: NetworkNode[];
    links: NetworkLink[];
    updatedAt: Date;
}
