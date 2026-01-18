import { Vector3, Quaternion, SensorFusionFrame, SemanticObject, VoxelState } from './types';
import { OccupancyGrid } from './occupancy_grid';

/**
 * HydraNet Simulator
 * Simulates a Multi-Head Neural Network running on Edge Compute (Jetson Orin).
 * Generates semantic outputs based on a virtual forklift's position.
 */
export class HydraNetSim {
    private grid: OccupancyGrid;
    private isRunning: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;
    private lastPosition: Vector3 = { x: 0, y: 0, z: 0 };

    // Simulation constraints (from Production Specs)
    private readonly LATENCY_MS = 50; // Edge compute latency
    private readonly NOISE_FACTOR = 0.05; // 5% signal noise

    public onFrame?: (frame: SensorFusionFrame) => void;

    constructor() {
        this.grid = new OccupancyGrid(0.2); // 20cm resolution
    }

    public startSimulation() {
        if (this.isRunning) return;
        this.isRunning = true;

        // Simulate 30Hz Inference Loop
        this.intervalId = setInterval(() => {
            const frame = this.generateFrame();
            if (this.onFrame) {
                // Simulate inference latency
                setTimeout(() => this.onFrame!(frame), this.LATENCY_MS);
            }
        }, 33); // ~30 FPS
    }

    public stopSimulation() {
        this.isRunning = false;
        if (this.intervalId) clearInterval(this.intervalId);
    }

    public updateForkliftPosition(pos: Vector3, rot: Quaternion) {
        this.lastPosition = pos;
        // As the forklift moves, it "maps" the world (Bayesian Update)
        this.simulateMapping(pos);
    }

    private generateFrame(): SensorFusionFrame {
        // 1. Perception Head: Simulate seeing objects nearby
        const objects = this.simulateObjectDetection();

        // 2. Geometry Head: Get current voxel map state
        const voxels = this.grid.getRenderData();

        return {
            timestamp: Date.now(),
            pose: {
                position: { ...this.lastPosition },
                orientation: { x: 0, y: 0, z: 0, w: 1 } // Simplified for MVP
            },
            objects,
            voxels,
            status: {
                lidarHealth: Math.random() > 0.99 ? 'degraded' : 'ok', // Occasional glitch
                cameraHealth: 'ok',
                fusionLatencyMs: 48 + Math.random() * 5 // Jitter around 50ms
            }
        };
    }

    private simulateObjectDetection(): SemanticObject[] {
        // Determine what's "visible" based on Mock Database or hardcoded logic
        // For MVP: We return a "Pallet" if we are near a specific coordinate (Test Rack)
        const detections: SemanticObject[] = [];

        // Mock Rack at (10, 0, 5)
        const distToRack = Math.hypot(this.lastPosition.x - 10, this.lastPosition.z - 5);

        if (distToRack < 5) {
            detections.push({
                id: 'rack-01',
                classId: 'rack',
                confidence: 0.95 + (Math.random() * 0.04), // High confidence
                boundingBox: {
                    center: { x: 10, y: 0, z: 5 },
                    dimensions: { x: 2, y: 3, z: 1 },
                    orientation: { x: 0, y: 0, z: 0, w: 1 }
                },
                velocity: { x: 0, y: 0, z: 0 }
            });
        }

        // Mock "Flow" (Human walking)
        if (Math.random() > 0.95) { // Occasional ghost detection
            detections.push({
                id: 'human-01',
                classId: 'human',
                confidence: 0.65, // Low confidence (Ghost)
                boundingBox: {
                    center: { x: this.lastPosition.x + 2, y: 0, z: this.lastPosition.z },
                    dimensions: { x: 0.5, y: 1.8, z: 0.5 },
                    orientation: { x: 0, y: 0, z: 0, w: 1 }
                },
                velocity: { x: 1.2, y: 0, z: 0.1 }
            });
        }

        return detections;
    }

    private simulateMapping(pos: Vector3) {
        // "Lidar" hits objects around the forklift
        // We update the Occupancy Grid with fake hits for demo
        // Create a "wall" of voxels 2m away
        for (let y = 0; y < 3; y += 0.2) {
            // Mock a wall at X+2
            this.grid.update({
                x: pos.x + 2 + (Math.random() * 0.05), // Lidar noise
                y: y,
                z: pos.z
            }, 0.9); // High probability occupied
        }
    }
}
