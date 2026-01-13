"use server";

export interface AMRUnit {
    id: string;
    model: string;
    status: 'IDLE' | 'MOVING' | 'CHARGING' | 'ERROR';
    battery: number;
    currentPosition: [number, number, number];
    targetPosition?: [number, number, number];
    taskId?: string;
}

export async function getFleetStatus() {
    // Mock fleet of AMRs (Autonomous Mobile Robots)
    return [
        { id: 'AMR-01', model: 'StarPath Alpha', status: 'MOVING', battery: 84, currentPosition: [10, 0, 10], targetPosition: [50, 0, 80], taskId: 'PICK-901' },
        { id: 'AMR-02', model: 'StarPath Alpha', status: 'IDLE', battery: 92, currentPosition: [150, 0, 20], targetPosition: [150, 0, 20] },
        { id: 'AMR-03', model: 'StarPath Heavy', status: 'CHARGING', battery: 12, currentPosition: [5, 0, 190], targetPosition: [5, 0, 190] },
        { id: 'AMR-04', model: 'StarPath Alpha', status: 'MOVING', battery: 65, currentPosition: [80, 0, 50], targetPosition: [20, 0, 150], taskId: 'STG-102' },
    ] as AMRUnit[];
}

export async function dispatchRobot(robotId: string, targetX: number, targetZ: number) {
    console.log(`[WCS] Dispatching ${robotId} to ${targetX}, ${targetZ}`);
    return {
        success: true,
        eta: "2m 14s",
        pathId: `PTH-${Math.floor(Math.random() * 1000)}`
    };
}

export async function emergencyStopAll() {
    console.warn("[WCS] EMERGENCY STOP TRIGGERED ACROSS FLEET");
    return { success: true, timestamp: new Date().toISOString() };
}
