import { create } from 'zustand';

export interface TrailerSpec {
  id: string;
  name: string;
  type: 'dry_van' | 'reefer' | 'flatbed' | 'step_deck' | 'double_drop' | 'curtain_side' | 'intermodal_20' | 'intermodal_40' | 'intermodal_45' | 'box_truck_26' | 'pup_28';
  innerLength: number; // inches
  innerWidth: number;
  innerHeight: number;
  tareWeight: number; // lbs
  maxGrossWeight: number;
  axleConfig: 'tandem' | 'tridem' | 'spread';
  floorFriction: number; // coefficient 0-1
  hasRamps: boolean;
  temperatureControlled: boolean;
  color: string;
}

export interface CargoItem {
  id: string;
  sku: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  stackable: boolean;
  maxStack: number;
  rotatable: boolean;
  family: 'fragile' | 'hazmat' | 'frozen' | 'ambient' | 'high_value' | 'heavy';
  fragility: number; // 0-100
  temperature: number | null; // °F
  crushStrength: number; // lbs
  priority: number; // 1-10
  stopSequence: number;
  color: string;
}

export interface PlacedCargo extends CargoItem {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  instanceId: string;
}

export interface OptimizationResult {
  placedItems: PlacedCargo[];
  volumeUtilization: number;
  weightUtilization: number;
  centerOfGravityX: number;
  centerOfGravityY: number;
  centerOfGravityZ: number;
  stabilityScore: number;
  axleLoadFront: number;
  axleLoadRear: number;
  complianceScore: number;
  loadingTime: number; // minutes
  carbonFootprint: number; // kg CO2
  cost: number;
}

interface LoadOptimizerState {
  // Trailer
  selectedTrailer: TrailerSpec | null;
  trailers: TrailerSpec[];
  
  // Cargo
  cargoItems: CargoItem[];
  placedCargo: PlacedCargo[];
  
  // Optimization
  isOptimizing: boolean;
  optimizationProgress: number;
  optimizationResult: OptimizationResult | null;
  
  // UI State
  activeTab: string;
  viewMode: '2d' | '3d';
  showGrid: boolean;
  showAxles: boolean;
  showCenterOfGravity: boolean;
  highlightedItem: string | null;
  
  // Constraints
  constraints: {
    maxHeight: boolean;
    maxWeight: boolean;
    fragileProtection: boolean;
    temperatureZoning: boolean;
    sequenceRespect: boolean;
    hazmatSeparation: boolean;
  };
  
  // Actions
  setSelectedTrailer: (trailer: TrailerSpec) => void;
  addCargoItem: (item: CargoItem) => void;
  removeCargoItem: (id: string) => void;
  updateCargoItem: (id: string, updates: Partial<CargoItem>) => void;
  setPlacedCargo: (cargo: PlacedCargo[]) => void;
  setOptimizing: (isOptimizing: boolean) => void;
  setOptimizationProgress: (progress: number) => void;
  setOptimizationResult: (result: OptimizationResult) => void;
  setActiveTab: (tab: string) => void;
  setViewMode: (mode: '2d' | '3d') => void;
  toggleConstraint: (constraint: keyof LoadOptimizerState['constraints']) => void;
  setHighlightedItem: (id: string | null) => void;
  reset: () => void;
}

// Standard trailer presets
export const TRAILER_PRESETS: TrailerSpec[] = [
  {
    id: 'dry-van-53',
    name: '53\' Dry Van',
    type: 'dry_van',
    innerLength: 636,
    innerWidth: 102,
    innerHeight: 110,
    tareWeight: 14000,
    maxGrossWeight: 80000,
    axleConfig: 'tandem',
    floorFriction: 0.6,
    hasRamps: false,
    temperatureControlled: false,
    color: '#9CA3AF'
  },
  {
    id: 'reefer-53',
    name: '53\' Reefer',
    type: 'reefer',
    innerLength: 630,
    innerWidth: 100,
    innerHeight: 108,
    tareWeight: 16000,
    maxGrossWeight: 80000,
    axleConfig: 'tandem',
    floorFriction: 0.7,
    hasRamps: false,
    temperatureControlled: true,
    color: '#60A5FA'
  },
  {
    id: 'flatbed-48',
    name: '48\' Flatbed',
    type: 'flatbed',
    innerLength: 576,
    innerWidth: 102,
    innerHeight: 108,
    tareWeight: 12000,
    maxGrossWeight: 80000,
    axleConfig: 'tandem',
    floorFriction: 0.8,
    hasRamps: false,
    temperatureControlled: false,
    color: '#F59E0B'
  },
  {
    id: 'step-deck-48',
    name: '48\' Step Deck',
    type: 'step_deck',
    innerLength: 576,
    innerWidth: 102,
    innerHeight: 132,
    tareWeight: 15000,
    maxGrossWeight: 80000,
    axleConfig: 'tridem',
    floorFriction: 0.8,
    hasRamps: true,
    temperatureControlled: false,
    color: '#8B5CF6'
  },
  {
    id: 'container-40',
    name: '40\' Intermodal',
    type: 'intermodal_40',
    innerLength: 480,
    innerWidth: 94,
    innerHeight: 110,
    tareWeight: 8600,
    maxGrossWeight: 67200,
    axleConfig: 'tandem',
    floorFriction: 0.6,
    hasRamps: false,
    temperatureControlled: false,
    color: '#EF4444'
  },
  {
    id: 'container-20',
    name: '20\' Intermodal',
    type: 'intermodal_20',
    innerLength: 240,
    innerWidth: 94,
    innerHeight: 110,
    tareWeight: 5070,
    maxGrossWeight: 67200,
    axleConfig: 'tandem',
    floorFriction: 0.6,
    hasRamps: false,
    temperatureControlled: false,
    color: '#10B981'
  }
];

export const useLoadOptimizerStore = create<LoadOptimizerState>((set) => ({
  // Initial state
  selectedTrailer: TRAILER_PRESETS[0],
  trailers: TRAILER_PRESETS,
  cargoItems: [],
  placedCargo: [],
  isOptimizing: false,
  optimizationProgress: 0,
  optimizationResult: null,
  activeTab: 'cargo',
  viewMode: '3d',
  showGrid: true,
  showAxles: true,
  showCenterOfGravity: true,
  highlightedItem: null,
  constraints: {
    maxHeight: true,
    maxWeight: true,
    fragileProtection: true,
    temperatureZoning: false,
    sequenceRespect: true,
    hazmatSeparation: true,
  },
  
  // Actions
  setSelectedTrailer: (trailer) => set({ selectedTrailer: trailer }),
  
  addCargoItem: (item) => set((state) => ({ 
    cargoItems: [...state.cargoItems, item] 
  })),
  
  removeCargoItem: (id) => set((state) => ({ 
    cargoItems: state.cargoItems.filter((item) => item.id !== id) 
  })),
  
  updateCargoItem: (id, updates) => set((state) => ({
    cargoItems: state.cargoItems.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  setPlacedCargo: (cargo) => set({ placedCargo: cargo }),
  
  setOptimizing: (isOptimizing) => set({ isOptimizing }),
  
  setOptimizationProgress: (progress) => set({ optimizationProgress: progress }),
  
  setOptimizationResult: (result) => set({ optimizationResult: result }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  toggleConstraint: (constraint) => set((state) => ({
    constraints: {
      ...state.constraints,
      [constraint]: !state.constraints[constraint]
    }
  })),
  
  setHighlightedItem: (id) => set({ highlightedItem: id }),
  
  reset: () => set({
    placedCargo: [],
    optimizationResult: null,
    optimizationProgress: 0,
    isOptimizing: false,
  }),
}));


