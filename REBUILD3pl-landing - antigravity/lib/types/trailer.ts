// 3D Trailer Load Optimizer Types
export interface AxleSpec {
  pos_ft: number;
  type: 'dual' | 'single' | 'super_single';
}

export interface TrailerSpec {
  length_ft: number;
  width_ft: number;
  height_ft: number;
  axles: AxleSpec[];
  max_gvw_lbs: number;
}

export interface CargoItem {
  id: string;
  l: number; // length (ft)
  w: number; // width (ft) 
  h: number; // height (ft)
  weight_lbs: number;
  stackable: boolean;
  orientations: number[][]; // [x,y,z] orientation permutations
}

export interface PlacedItem {
  id: string;
  x: number;
  y: number;
  z: number;
  rot: number;
  l: number;
  w: number;
  h: number;
  color?: string;
}

export interface AxleLoad {
  axle_index: number;
  load_lbs: number;
  limit_lbs: number;
  percentage: number;
}

export interface OptimizeResult {
  placed: PlacedItem[];
  unplaced: string[];
  axle_loads: AxleLoad[];
  cog: [number, number, number];
  utilization_pct: number;
}

// Mock data for development
export const STANDARD_53FT_TRAILER: TrailerSpec = {
  length_ft: 53,
  width_ft: 8.5,
  height_ft: 9.0,
  max_gvw_lbs: 80000,
  axles: [
    { pos_ft: 45.0, type: 'dual' },
    { pos_ft: 48.0, type: 'dual' }
  ]
};

export const SAMPLE_CARGO: CargoItem[] = [
  { id: "PAL-001", l: 4, w: 4, h: 5, weight_lbs: 2200, stackable: true, orientations: [[0,1,2], [1,0,2]] },
  { id: "PAL-002", l: 4, w: 4, h: 5, weight_lbs: 2100, stackable: true, orientations: [[0,1,2], [1,0,2]] },
  { id: "CRT-010", l: 3, w: 2.5, h: 2.5, weight_lbs: 400, stackable: true, orientations: [[0,1,2], [1,2,0], [2,1,0]] },
  { id: "CRT-011", l: 3, w: 2.5, h: 2.5, weight_lbs: 400, stackable: true, orientations: [[0,1,2], [1,2,0], [2,1,0]] },
  { id: "FRG-900", l: 2, w: 2, h: 3, weight_lbs: 300, stackable: false, orientations: [[0,1,2]] }
];








