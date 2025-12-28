import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/mobile/sessions - Get active mobile sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const deviceId = searchParams.get('deviceId')

    // Mock mobile session data
    const mockSessions = [
      {
        id: 'session-001',
        userId: 'user-001',
        userName: 'Mike R.',
        deviceId: 'TC-001',
        deviceType: 'handheld_scanner',
        currentTask: {
          id: 'task-001',
          type: 'PICK',
          description: 'Picking Wave-001',
          location: 'Zone A',
          progress: 60,
          estimatedCompletion: '15 min'
        },
        batteryLevel: 85,
        signalStrength: 'excellent',
        isOnline: true,
        lastActivity: '2024-01-15T14:35:00Z',
        startedAt: '2024-01-15T08:00:00Z',
        features: {
          barcodeScanning: true,
          voicePicking: true,
          offlineMode: true,
          photoCapture: true,
          digitalSignature: true
        },
        syncStatus: {
          pendingTransactions: 3,
          lastSync: '2024-01-15T14:33:00Z',
          syncErrors: 0
        }
      },
      {
        id: 'session-002',
        userId: 'user-002',
        userName: 'Lisa K.',
        deviceId: 'TC-002',
        deviceType: 'handheld_scanner',
        currentTask: {
          id: 'task-002',
          type: 'PUTAWAY',
          description: 'Putaway Tasks',
          location: 'Zone B',
          progress: 80,
          estimatedCompletion: '8 min'
        },
        batteryLevel: 62,
        signalStrength: 'good',
        isOnline: true,
        lastActivity: '2024-01-15T14:34:00Z',
        startedAt: '2024-01-15T08:30:00Z',
        features: {
          barcodeScanning: true,
          voicePicking: false,
          offlineMode: true,
          photoCapture: true,
          digitalSignature: true
        },
        syncStatus: {
          pendingTransactions: 1,
          lastSync: '2024-01-15T14:32:00Z',
          syncErrors: 0
        }
      },
      {
        id: 'session-003',
        userId: 'user-003',
        userName: 'John D.',
        deviceId: 'TC-003',
        deviceType: 'handheld_scanner',
        currentTask: {
          id: 'task-003',
          type: 'COUNT',
          description: 'Cycle Count Zone C',
          location: 'Zone C',
          progress: 25,
          estimatedCompletion: '35 min'
        },
        batteryLevel: 91,
        signalStrength: 'excellent',
        isOnline: true,
        lastActivity: '2024-01-15T14:35:00Z',
        startedAt: '2024-01-15T09:00:00Z',
        features: {
          barcodeScanning: true,
          voicePicking: false,
          offlineMode: true,
          photoCapture: true,
          digitalSignature: false
        },
        syncStatus: {
          pendingTransactions: 5,
          lastSync: '2024-01-15T14:30:00Z',
          syncErrors: 0
        }
      },
      {
        id: 'session-004',
        userId: 'user-004',
        userName: 'Sarah M.',
        deviceId: 'TC-004',
        deviceType: 'tablet',
        currentTask: {
          id: 'task-004',
          type: 'RECEIVING',
          description: 'Receiving PO-12345',
          location: 'Dock 1',
          progress: 45,
          estimatedCompletion: '20 min'
        },
        batteryLevel: 45,
        signalStrength: 'fair',
        isOnline: true,
        lastActivity: '2024-01-15T14:33:00Z',
        startedAt: '2024-01-15T10:00:00Z',
        features: {
          barcodeScanning: true,
          voicePicking: false,
          offlineMode: true,
          photoCapture: true,
          digitalSignature: true
        },
        syncStatus: {
          pendingTransactions: 12,
          lastSync: '2024-01-15T14:25:00Z',
          syncErrors: 1
        }
      }
    ]

    // Filter by user or device if provided
    let filteredSessions = mockSessions
    if (userId) {
      filteredSessions = mockSessions.filter(session => session.userId === userId)
    }
    if (deviceId) {
      filteredSessions = mockSessions.filter(session => session.deviceId === deviceId)
    }

    // Calculate summary statistics
    const summary = {
      totalSessions: filteredSessions.length,
      activeSessions: filteredSessions.filter(s => s.isOnline).length,
      lowBatterySessions: filteredSessions.filter(s => s.batteryLevel < 30).length,
      pendingSyncTransactions: filteredSessions.reduce((sum, s) => sum + s.syncStatus.pendingTransactions, 0),
      totalSyncErrors: filteredSessions.reduce((sum, s) => sum + s.syncStatus.syncErrors, 0),
      averageBatteryLevel: Math.round(filteredSessions.reduce((sum, s) => sum + s.batteryLevel, 0) / filteredSessions.length)
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions: filteredSessions,
        summary
      }
    })
  } catch (error) {
    console.error('Failed to fetch mobile sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mobile sessions' },
      { status: 500 }
    )
  }
}

// POST /api/mobile/sessions - Create new mobile session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, deviceId, deviceType } = body

    // Validate required fields
    if (!userId || !deviceId || !deviceType) {
      return NextResponse.json(
        { success: false, error: 'User ID, device ID, and device type are required' },
        { status: 400 }
      )
    }

    // Mock session creation
    const session = {
      id: `session-${Date.now()}`,
      userId,
      deviceId,
      deviceType,
      startedAt: new Date().toISOString(),
      isOnline: true,
      batteryLevel: 100,
      signalStrength: 'excellent',
      features: {
        barcodeScanning: true,
        voicePicking: deviceType === 'handheld_scanner',
        offlineMode: true,
        photoCapture: true,
        digitalSignature: deviceType === 'tablet'
      },
      syncStatus: {
        pendingTransactions: 0,
        lastSync: new Date().toISOString(),
        syncErrors: 0
      }
    }

    return NextResponse.json({
      success: true,
      data: session
    })
  } catch (error) {
    console.error('Failed to create mobile session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create mobile session' },
      { status: 500 }
    )
  }
}






























































