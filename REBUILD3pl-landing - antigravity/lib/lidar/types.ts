/**
 * Type definitions for LiDAR scanning and AI cycle counting system
 */

export interface PointCloudData {
  points: Float32Array;
  count: number;
  resolution: 'high' | 'medium' | 'low';
  timestamp: Date;
  metadata: {
    warehouseId: string;
    scanDensity: number;
    coordinateSystem: string;
  };
  processed?: boolean;
  filters?: string[];
}

export interface ScanResult {
  warehouseId: string;
  scanId: string;
  timestamp: Date;
  lidarData: PointCloudData;
  stitchedImage: Buffer;
  fusedData: any;
  cycleCountResults: CycleCountResult;
  metrics: ScanMetrics;
}

export interface CycleCountResult {
  totalItems: number;
  detectedItems: DetectedItem[];
  discrepancies: Discrepancy[];
  confidence: number;
  processingTime: number;
  aiModel: string;
  recommendations: string[];
}

export interface DetectedItem {
  sku: string;
  detectedQuantity: number;
  expectedQuantity: number;
  confidence: number;
  location: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  material?: string;
  condition?: 'good' | 'damaged' | 'unknown';
}

export interface Discrepancy {
  sku: string;
  expectedQuantity: number;
  detectedQuantity: number;
  variance: number;
  severity: 'low' | 'medium' | 'high';
  location: string;
  recommendation: string;
}

export interface ScanMetrics {
  totalItemsDetected: number;
  accuracy: number;
  scanDuration: number;
  coverageArea: number;
  processingTime?: number;
  imageQuality?: number;
  pointCloudDensity?: number;
}

export interface CustomerMasterData {
  sku: string;
  description: string;
  expectedQuantity: number;
  location: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight?: number;
  category?: string;
  supplier?: string;
  lastUpdated?: Date;
}

export interface LidarScanConfig {
  resolution: 'high' | 'medium' | 'low';
  scanDensity: number;
  imageQuality: '4K' | '8K' | '12K';
  stitchingAlgorithm: 'SIFT' | 'SURF' | 'ORB';
  aiModel: 'GPT-4V' | 'Claude-3-Vision' | 'Custom-Vision';
  scanPattern?: 'grid' | 'spiral' | 'random';
  overlapPercentage?: number;
  maxScanHeight?: number;
}

export interface WarehouseScanJob {
  id: string;
  warehouseId: string;
  config: LidarScanConfig;
  status: 'pending' | 'scanning' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  results?: ScanResult;
  error?: string;
  customerMasterData?: CustomerMasterData[];
}

export interface ScanSession {
  id: string;
  warehouseId: string;
  operatorId: string;
  startTime: Date;
  endTime?: Date;
  jobs: string[];
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface LidarDevice {
  id: string;
  model: string;
  manufacturer: string;
  capabilities: {
    maxRange: number;
    accuracy: number;
    scanRate: number;
    resolution: string[];
  };
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  lastCalibration?: Date;
  location?: string;
}

export interface ImageCaptureDevice {
  id: string;
  model: string;
  resolution: string;
  capabilities: {
    maxResolution: string;
    frameRate: number;
    lowLight: boolean;
  };
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
}

export interface AIAnalysisResult {
  model: string;
  version: string;
  confidence: number;
  processingTime: number;
  detectedObjects: DetectedObject[];
  recommendations: string[];
  warnings?: string[];
}

export interface DetectedObject {
  id: string;
  type: string;
  sku?: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    depth: number;
  };
  attributes: {
    color?: string;
    material?: string;
    condition?: string;
    orientation?: string;
  };
}

export interface ScanQualityMetrics {
  pointCloudQuality: number;
  imageSharpness: number;
  stitchingAccuracy: number;
  coverageCompleteness: number;
  overallScore: number;
  issues?: string[];
}

export interface CycleCountReport {
  scanId: string;
  warehouseId: string;
  timestamp: Date;
  summary: {
    totalItems: number;
    discrepanciesFound: number;
    accuracy: number;
    processingTime: number;
  };
  detailedResults: DetectedItem[];
  discrepancies: Discrepancy[];
  recommendations: string[];
  qualityMetrics: ScanQualityMetrics;
  exportFormats: ('PDF' | 'Excel' | 'CSV')[];
}


















