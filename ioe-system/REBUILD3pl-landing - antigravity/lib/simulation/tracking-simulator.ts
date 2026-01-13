import { Server } from 'socket.io';

interface Coordinate {
    lat: number;
    lng: number;
}

interface SimulatedShipment {
    id: string;
    trackingNumber: string;
    origin: Coordinate;
    destination: Coordinate;
    currentLocation: Coordinate;
    status: 'in_transit' | 'delivered' | 'exception';
    speed: number; // km/h (simulated speed factor)
    progress: number; // 0-100
}

// Mock Data to Simulate
const ACTIVE_SHIPMENTS: SimulatedShipment[] = [
    {
        id: 'ship_1',
        trackingNumber: '1Z999AA1234567890',
        origin: { lat: 25.6866, lng: -100.3161 }, // Monterrey
        destination: { lat: 39.9612, lng: -82.9988 }, // Columbus
        currentLocation: { lat: 32.7767, lng: -96.7970 }, // Dallas (Starting point)
        status: 'in_transit',
        speed: 0.05, // Movement per tick
        progress: 45
    },
    {
        id: 'ship_2',
        trackingNumber: '9400100000000000000000',
        origin: { lat: 20.6597, lng: -103.3496 }, // Guadalajara
        destination: { lat: 32.7767, lng: -96.7970 }, // Dallas
        currentLocation: { lat: 29.4241, lng: -98.4936 }, // San Antonio
        status: 'in_transit',
        speed: 0.04,
        progress: 60
    }
];

export class TrackingSimulator {
    private io: Server;
    private interval: NodeJS.Timeout | null = null;

    constructor(io: Server) {
        this.io = io;
    }

    start() {
        console.log('🚚 Tracking Simulator Started');

        this.interval = setInterval(() => {
            this.updateShipments();
        }, 2000); // Update every 2 seconds
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    private updateShipments() {
        ACTIVE_SHIPMENTS.forEach(shipment => {
            if (shipment.status === 'in_transit') {
                // Simple linear interpolation for movement
                // Move 1% closer to destination per tick (for demo purposes)
                const dx = shipment.destination.lng - shipment.origin.lng;
                const dy = shipment.destination.lat - shipment.origin.lat;

                // Update progress
                shipment.progress += 0.5;
                if (shipment.progress >= 100) {
                    shipment.progress = 0; // Loop for demo
                    shipment.currentLocation = { ...shipment.origin }; // Reset to origin
                }

                // Calculate new position based on progress
                const ratio = shipment.progress / 100;
                shipment.currentLocation.lat = shipment.origin.lat + (dy * ratio);
                shipment.currentLocation.lng = shipment.origin.lng + (dx * ratio);

                // Add some random jitter to make it look "live"
                shipment.currentLocation.lat += (Math.random() - 0.5) * 0.01;
                shipment.currentLocation.lng += (Math.random() - 0.5) * 0.01;
            }
        });

        // Broadcast updates
        this.io.emit('tracking-update', ACTIVE_SHIPMENTS);
    }
}
