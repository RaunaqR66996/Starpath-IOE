export type Vector3 = { x: number; y: number; z: number };
export type Quaternion = { x: number; y: number; z: number; w: number };

// --- SENSOR RAW DATA TYPES ---

export interface LidarPoint {
    x: number;
    y: number;
    z: number;
    intensity: number; // 0-255 reflectivity
    ring: number; // 0-127 laser channel
    timestamp: number;
}

export interface ImuReading {
    linearAcceleration: Vector3;
    angularVelocity: Vector3;
    timestamp: number;
}

// --- HYDRANET ARCHITECTURE TYPES ---

// 1. Perception Head (Semantic Segmentation)
export interface SemanticObject {
    id: string;
    classId: 'pallet' | 'rack' | 'ground' | 'obstacle' | 'human' | 'forklift';
    confidence: number;
    boundingBox: {
        center: Vector3;
        dimensions: Vector3;
        orientation: Quaternion;
    };
    velocity: Vector3; // m/s
}

// 2. Geometry Head (Depth & Voxelization)
export interface VoxelState {
    index: string; // "x,y,z" key
    occupancyProbability: number; // Log-odds or 0-1 probability
    semanticLabel?: string;
    lastUpdated: number;
}

// 3. Flow Head (Motion Prediction)
export interface FlowVector {
    objectId: string;
    predictedTrajectory: Vector3[]; // Next 2 seconds (0.1s steps)
}

// --- FUSION & OUTPUT TYPES ---

export interface SensorFusionFrame {
    timestamp: number;
    pose: {
        position: Vector3;
        orientation: Quaternion;
    };
    objects: SemanticObject[];
    voxels: VoxelState[];
    status: {
        lidarHealth: 'ok' | 'degraded' | 'offline';
        cameraHealth: 'ok' | 'blocked' | 'offline';
        fusionLatencyMs: number;
    };
}
