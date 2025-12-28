'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function verifyHandshake(nfcTagId: string, shipmentId: string) {
    console.log(`Verifying handshake for tag ${nfcTagId} on shipment ${shipmentId}`);

    // 1. Verify User/Driver from NFC Tag
    // In a real app, nfcTagId maps to a User or Carrier Driver.
    // For simulation, we assume nfcTagId is the User ID or Employee ID.

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { id: nfcTagId },
                { employeeId: nfcTagId }
            ]
        }
    });

    if (!user) {
        return { success: false, error: 'Invalid NFC Tag. User not found.' };
    }

    // 2. Verify Shipment
    const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
    });

    if (!shipment) {
        return { success: false, error: 'Shipment not found.' };
    }

    // 3. Perform Handshake Logic (State Transition)
    // If shipment is READY_TO_SHIP -> IN_TRANSIT (Driver Pickup)
    // If shipment is IN_TRANSIT -> DELIVERED (Customer Receive - requires Customer NFC?)

    let newStatus = shipment.status;
    let message = '';

    if (shipment.status === 'READY_TO_SHIP' || shipment.status === 'CREATED') {
        newStatus = 'IN_TRANSIT';
        message = `Custody transferred to ${user.fullName} (Driver). Shipment In Transit.`;
    } else if (shipment.status === 'IN_TRANSIT') {
        newStatus = 'DELIVERED';
        message = `Custody transferred to ${user.fullName} (Receiver). Shipment Delivered.`;
    } else {
        return { success: false, error: `Invalid status transition from ${shipment.status}` };
    }

    await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
            status: newStatus,
            metadata: {
                ...((shipment.metadata as object) || {}),
                lastHandshake: {
                    user: user.fullName,
                    timestamp: new Date(),
                    location: 'Simulated Location'
                }
            }
        }
    });

    return { success: true, message, newStatus, user: user.fullName };
}
