// Core production entities
export interface ProductionOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPriority: number;
  productId: string;
  productName: string;
  quantity: number;
  priority: number;
  deadline: Date;
  revenue: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  setupTime?: number;
  processingTime: number;
  requiredResources: string[];
  requiredMaterials: string[];
  requiredSkills: string[];
  aiReasoning?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'machine' | 'labor' | 'material';
  capacity: number;
  availability: number;
  costPerHour: number;
  skills?: string[];
  location: string;
  status: 'available' | 'busy' | 'maintenance' | 'broken';
  currentUtilization: number;
  maxUtilization: number;
}

export interface Machine extends Resource {
  type: 'machine';
  machineType: string;
  setupTimes: SetupTime[];
  maintenanceSchedule: MaintenanceSchedule[];
  efficiency: number;
  quality: number;
}

export interface Labor extends Resource {
  type: 'labor';
  skillLevel: number;
  experience: number;
  shift: string;
  overtimeEligible: boolean;
  currentAssignment?: string;
}

export interface Material extends Resource {
  type: 'material';
  supplier: string;
  leadTime: number;
  reorderPoint: number;
  currentStock: number;
  unitCost: number;
}

export interface SetupTime {
  fromProduct: string;
  toProduct: string;
  setupTime: number;
  complexity: 'low' | 'medium' | 'high';
  requiredTools?: string[];
}

export interface MaintenanceSchedule {
  id: string;
  machineId: string;
  type: 'preventive' | 'corrective';
  scheduledDate: Date;
  duration: number;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

// Scheduling and optimization
export interface Schedule {
  id: string;
  orders: ProductionOrder[];
  startTime: Date;
  endTime: Date;
  totalMakespan: number;
  resourceUtilization: number;
  setupTimeReduction: number;
  constraintSatisfaction: number;
  aiInsights?: any;
}

export interface Constraint {
  id: string;
  type: 'capacity' | 'material' | 'labor' | 'deadline' | 'setup' | 'maintenance';
  resourceId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isHard: boolean;
  value: number;
  unit: string;
  priority: number;
}

export interface OptimizationResult {
  schedule: Schedule;
  metrics: OptimizationMetrics;
  aiInsights: any;
  executionTime: number;
  iterations: number;
  convergence: boolean;
}

export interface OptimizationMetrics {
  totalMakespan: number;
  resourceUtilization: number;
  setupTimeReduction: number;
  constraintSatisfaction: number;
  optimizationTime: number;
  costSavings?: number;
  qualityImprovement?: number;
}

// Disruption and replanning
export interface DisruptionEvent {
  id: string;
  type: 'machine_breakdown' | 'material_shortage' | 'labor_absence' | 'rush_order' | 'quality_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedResourceId: string;
  description: string;
  startTime: Date;
  estimatedEndTime?: Date;
  actualEndTime?: Date;
  impact: {
    affectedOrders: string[];
    delayedOrders: string[];
    costImpact: number;
    timeImpact: number;
  };
  status: 'active' | 'resolved' | 'mitigated';
}

export interface ReplanningResult {
  originalSchedule: Schedule;
  newSchedule: Schedule;
  disruption: DisruptionEvent;
  impactAnalysis: any;
  replanningTime: number;
  success: boolean;
  metrics: ReplanningMetrics;
  strategies: ReplanningStrategy[];
}

export interface ReplanningMetrics {
  ordersAffected: number;
  makespanChange: number;
  resourceUtilizationChange: number;
  costImpact: number;
  recoveryTime: number;
}

export interface ReplanningStrategy {
  id: string;
  type: 'resource_reallocation' | 'order_resequencing' | 'alternative_routing' | 'capacity_adjustment' | 'outsourcing';
  description: string;
  feasibility: number;
  impact: number;
  implementationTime: number;
  cost: number;
  aiRecommendation: string;
}

// AI Integration
export interface AIProvider {
  name: string;
  model: string;
  capabilities: string[];
  costPerToken: number;
  responseTime: number;
  availability: number;
}

export interface AIQuery {
  provider: string;
  task: string;
  prompt: string;
  context?: any;
  constraints?: any;
}

export interface AIResponse {
  provider: string;
  task: string;
  response: any;
  confidence: number;
  executionTime: number;
  cost: number;
  metadata?: any;
}

// Priority and SLA
export interface PriorityLevel {
  level: number;
  name: string;
  description: string;
  slaHours: number;
  costMultiplier: number;
  aiWeight: number;
}

export interface SLA {
  id: string;
  customerId: string;
  orderType: string;
  targetHours: number;
  penaltyCost: number;
  bonusReward: number;
  priority: number;
}

// Performance monitoring
export interface PerformanceMetrics {
  id: string;
  timestamp: Date;
  scheduleId: string;
  makespan: number;
  resourceUtilization: number;
  setupTimeEfficiency: number;
  constraintViolations: number;
  costPerUnit: number;
  qualityScore: number;
  onTimeDelivery: number;
  aiOptimizationImpact: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  affectedResources?: string[];
  affectedOrders?: string[];
  actionRequired: boolean;
  actionTaken?: string;
  resolved: boolean;
}

// Real-time updates
export interface ScheduleUpdate {
  type: 'order_scheduled' | 'order_started' | 'order_completed' | 'disruption_detected' | 'replanning_executed';
  timestamp: Date;
  data: any;
  scheduleId: string;
}

export interface ResourceUpdate {
  type: 'status_change' | 'utilization_update' | 'maintenance_scheduled' | 'breakdown_detected';
  timestamp: Date;
  resourceId: string;
  data: any;
}

// Configuration
export interface SchedulingConfig {
  optimizationAlgorithm: 'genetic' | 'simulated_annealing' | 'tabu_search' | 'ai_hybrid';
  aiProviders: AIProvider[];
  constraints: Constraint[];
  priorities: PriorityLevel[];
  slas: SLA[];
  updateInterval: number;
  maxOptimizationTime: number;
  fallbackStrategy: string;
}

// Database models
export interface ProductionLine {
  id: string;
  name: string;
  description: string;
  machines: Machine[];
  labor: Labor[];
  materials: Material[];
  capacity: number;
  efficiency: number;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface WorkOrder {
  id: string;
  orderId: string;
  productionLineId: string;
  status: 'created' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedResources: string[];
  startTime?: Date;
  endTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  qualityMetrics?: QualityMetrics;
  costMetrics?: CostMetrics;
}

export interface QualityMetrics {
  defectRate: number;
  reworkRate: number;
  scrapRate: number;
  customerComplaints: number;
  qualityScore: number;
}

export interface CostMetrics {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerUnit: number;
  variance: number;
} 