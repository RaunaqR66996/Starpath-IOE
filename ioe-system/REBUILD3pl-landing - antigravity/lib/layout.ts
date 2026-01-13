export type Site = { 
  width: number; 
  depth: number; 
};

export type Zone = { 
  id: string; 
  label: string; 
  x: number; 
  z: number; 
  width: number; 
  depth: number; 
  color: string; 
};

export type Rack = {
  id: string; 
  label: string; 
  x: number; 
  z: number; 
  rotationY?: number;
  bayCount: number; 
  bayWidth: number; 
  depth: number; 
  uprightThickness: number;
  levelCount: number; 
  levelHeight: number; 
  uprightHeight: number;
};

export type StagingArea = {
  id: string;
  name: string;
  warehouseId: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  maxCapacity: number;
  dockDoorId?: string;
};

export type Layout = { 
  site: Site; 
  zones: Zone[]; 
  racks: Rack[]; 
  docks: Zone[]; 
  offices: Zone[]; 
  corridors: Zone[]; 
};

export async function loadLayout(warehouseId?: string): Promise<Layout> { 
  // Map warehouse IDs to layout files
  const warehouseLayouts: { [key: string]: string } = {
    'warehouse-001': '/layouts/kuehne-nagel-east.json',
    'warehouse-002': '/layouts/l-angeles-west.json', 
    'warehouse-003': '/layouts/laredo-south.json'
  }
  
  // Default to KuehneNagel East if no ID provided or ID not found
  const layoutFile = warehouseLayouts[warehouseId || 'warehouse-001'] || warehouseLayouts['warehouse-001']
  
  const res = await fetch(layoutFile)
  return res.json()
}

// Default staging area configurations for all 3 warehouses
export function getDefaultStagingAreas(warehouseId: string): StagingArea[] {
  const stagingConfigs: Record<string, StagingArea[]> = {
    'warehouse-001': [ // KuehneNagel East - NY
      {
        id: 'STAGE-WH1-01',
        name: 'Staging Lane A-1',
        warehouseId: 'warehouse-001',
        x: 120, y: 0, z: 270,
        length: 10, width: 6, height: 0.5,
        maxCapacity: 20,
        dockDoorId: 'dock-line'
      },
      {
        id: 'STAGE-WH1-02',
        name: 'Staging Lane A-2',
        warehouseId: 'warehouse-001',
        x: 150, y: 0, z: 270,
        length: 10, width: 6, height: 0.5,
        maxCapacity: 20,
        dockDoorId: 'dock-line'
      },
      {
        id: 'STAGE-WH1-03',
        name: 'Staging Lane A-3',
        warehouseId: 'warehouse-001',
        x: 180, y: 0, z: 270,
        length: 10, width: 6, height: 0.5,
        maxCapacity: 20,
        dockDoorId: 'dock-line'
      }
    ],
    'warehouse-002': [ // L-Angeles Dual West - LA
      {
        id: 'STAGE-WH2-01',
        name: 'Staging Lane W1-A',
        warehouseId: 'warehouse-002',
        x: 120, y: 0, z: 270,
        length: 10, width: 6, height: 0.5,
        maxCapacity: 20,
        dockDoorId: 'dock-line-1'
      },
      {
        id: 'STAGE-WH2-02',
        name: 'Staging Lane W1-B',
        warehouseId: 'warehouse-002',
        x: 150, y: 0, z: 270,
        length: 10, width: 6, height: 0.5,
        maxCapacity: 20,
        dockDoorId: 'dock-line-1'
      },
      {
        id: 'STAGE-WH2-03',
        name: 'Staging Lane W2-A',
        warehouseId: 'warehouse-002',
        x: 415.2, y: 0, z: 270,
        length: 10, width: 6, height: 0.5,
        maxCapacity: 20,
        dockDoorId: 'dock-line-2'
      },
      {
        id: 'STAGE-WH2-04',
        name: 'Staging Lane W2-B',
        warehouseId: 'warehouse-002',
        x: 445.2, y: 0, z: 270,
        length: 10, width: 6, height: 0.5,
        maxCapacity: 20,
        dockDoorId: 'dock-line-2'
      }
    ],
    'warehouse-003': [ // Laredo South - TX
      {
        id: 'STAGE-WH3-01',
        name: 'Staging Lane Dock-A',
        warehouseId: 'warehouse-003',
        x: 25, y: 0, z: 190,
        length: 8, width: 6, height: 0.5,
        maxCapacity: 15,
        dockDoorId: 'dock-a'
      },
      {
        id: 'STAGE-WH3-02',
        name: 'Staging Lane Dock-B',
        warehouseId: 'warehouse-003',
        x: 80, y: 0, z: 190,
        length: 8, width: 6, height: 0.5,
        maxCapacity: 15,
        dockDoorId: 'dock-b'
      },
      {
        id: 'STAGE-WH3-03',
        name: 'Staging Lane Dock-C',
        warehouseId: 'warehouse-003',
        x: 135, y: 0, z: 190,
        length: 8, width: 6, height: 0.5,
        maxCapacity: 15,
        dockDoorId: 'dock-c'
      }
    ]
  }

  return stagingConfigs[warehouseId] || []
}

// Camera presets
export const cameraPresets = {
  isometric: {
    position: [-220, 160, 220] as [number, number, number],
    target: [126, 0, 60] as [number, number, number] // Will be updated dynamically
  },
  top: {
    position: [126, 400, 60] as [number, number, number], // Will be updated dynamically
    target: [126, 0, 60] as [number, number, number],
    up: [0, 0, -1] as [number, number, number]
  },
  front: {
    position: [126, 80, -200] as [number, number, number], // Will be updated dynamically
    target: [126, 0, 60] as [number, number, number]
  }
};

export function getCameraPreset(presetName: keyof typeof cameraPresets, layout: Layout) {
  const preset = { ...cameraPresets[presetName] };
  const centerX = layout.site.width / 2;
  const centerZ = layout.site.depth / 2;
  
  switch (presetName) {
    case 'isometric':
      preset.target = [centerX, 0, centerZ];
      break;
    case 'top':
      preset.position = [centerX, 400, centerZ];
      preset.target = [centerX, 0, centerZ];
      break;
    case 'front':
      preset.position = [centerX, 80, -200];
      preset.target = [centerX, 0, centerZ];
      break;
  }
  
  return preset;
}
