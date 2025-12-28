import { NextRequest, NextResponse } from 'next/server';
import { LidarScanningEngine } from '@/lib/lidar/scanning-engine';
import { LidarScanConfig, CustomerMasterData } from '@/lib/lidar/types';

const scanningEngine = new LidarScanningEngine();

/**
 * POST /api/lidar/scan
 * Start a new LiDAR warehouse scan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { warehouseId, config, customerMasterData } = body;

    // Validate required fields
    if (!warehouseId) {
      return NextResponse.json(
        { success: false, error: 'Warehouse ID is required' },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Scan configuration is required' },
        { status: 400 }
      );
    }

    // Validate scan configuration
    const validatedConfig: LidarScanConfig = {
      resolution: config.resolution || 'high',
      scanDensity: config.scanDensity || 1000,
      imageQuality: config.imageQuality || '4K',
      stitchingAlgorithm: config.stitchingAlgorithm || 'SIFT',
      aiModel: config.aiModel || 'GPT-4V',
      scanPattern: config.scanPattern || 'grid',
      overlapPercentage: config.overlapPercentage || 30,
      maxScanHeight: config.maxScanHeight || 10
    };

    // Validate customer master data
    const validatedMasterData: CustomerMasterData[] = customerMasterData || [];

    // Start the scan
    const jobId = await scanningEngine.startWarehouseScan(
      warehouseId,
      validatedConfig,
      validatedMasterData
    );

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: 'started',
        message: 'LiDAR scan initiated successfully'
      }
    });

  } catch (error) {
    console.error('Error starting LiDAR scan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lidar/scan
 * Get scan status or list all scans
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const warehouseId = searchParams.get('warehouseId');

    if (jobId) {
      // Get specific scan job status
      const job = scanningEngine.getScanJobStatus(jobId);
      
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Scan job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: job
      });

    } else if (warehouseId) {
      // Get all scans for a specific warehouse
      const allJobs = scanningEngine.getAllScanJobs();
      const warehouseJobs = allJobs.filter(job => job.warehouseId === warehouseId);

      return NextResponse.json({
        success: true,
        data: warehouseJobs
      });

    } else {
      // Get all scan jobs
      const allJobs = scanningEngine.getAllScanJobs();

      return NextResponse.json({
        success: true,
        data: allJobs
      });
    }

  } catch (error) {
    console.error('Error getting scan data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lidar/scan
 * Cancel a scan job
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Note: In a real implementation, you would add cancel functionality
    // to the scanning engine
    
    return NextResponse.json({
      success: true,
      message: 'Scan cancellation requested'
    });

  } catch (error) {
    console.error('Error cancelling scan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}


















