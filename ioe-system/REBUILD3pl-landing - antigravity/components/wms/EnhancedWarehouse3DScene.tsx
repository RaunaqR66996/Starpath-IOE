"use client"

import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box, Grid, Environment, Html } from '@react-three/drei'
import * as THREE from 'three'

// Warehouse Configuration Constants
const WAREHOUSE_CONFIG = {
  // Standard pallet dimensions (meters)
  PALLET: {
    LENGTH: 1.2,
    WIDTH: 1.0,
    HEIGHT: 0.14
  },
  // Rack configuration
  RACK: {
    DEPTH: 1.2, // Same as pallet length
    WIDTH: 2.4, // Two pallets side by side
    HEIGHT: 2.0, // 2 shelf levels (reduced for performance)
    SHELF_HEIGHT: 1.0, // Height between shelves
    BEAM_THICKNESS: 0.1,
    POST_THICKNESS: 0.1
  },
  // Aisle configuration
  AISLE: {
    WIDTH: 3.0 // 3m aisles for forklift access
  },
  // Warehouse dimensions (rectangular = 120m x 80m)
  WAREHOUSE: {
    LENGTH: 120.0, // Length = 120m
    WIDTH: 80.0    // Width = 80m
  }
}

interface Zone {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  color: string;
}

const ZONES: Zone[] = [
    { id: 'inbound-a', name: 'Inbound A', x: -50, z: 30, width: 20, depth: 15, color: '#3b82f6' },
    { id: 'inbound-b', name: 'Inbound B', x: -30, z: 30, width: 20, depth: 15, color: '#60a5fa' },
    { id: 'outbound-a', name: 'Outbound A', x: 50, z: 30, width: 20, depth: 15, color: '#f97316' },
    { id: 'outbound-b', name: 'Outbound B', x: 30, z: 30, width: 20, depth: 15, color: '#fb923c' },
    { id: 'staging', name: 'Staging', x: 0, z: 30, width: 20, depth: 15, color: '#ca8a04' },
    { id: 'storage-a', name: 'Storage', x: 0, z: -10, width: 110, depth: 50, color: '#a3a3a3' },
];

// Pallet Component
interface PalletProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  hasBoxes?: boolean
  boxColor?: string
}

const Pallet: React.FC<PalletProps> = ({ 
  position, 
  rotation = [0, 0, 0], 
  color = "#8B4513",
  hasBoxes = false,
  boxColor = '#facc15'
}) => {
  const { PALLET } = WAREHOUSE_CONFIG;
  
  return (
    <group position={position} rotation={rotation}>
      {/* Pallet Base */}
      <Box args={[PALLET.WIDTH, PALLET.HEIGHT, PALLET.LENGTH]} position={[0, PALLET.HEIGHT / 2, 0]}>
        <meshStandardMaterial color="#d2b48c" />
      </Box>

      {hasBoxes && (
        <>
          <Box args={[0.4, 0.4, 0.4]} position={[-0.25, PALLET.HEIGHT + 0.2, -0.3]}>
            <meshStandardMaterial color={boxColor} />
          </Box>
          <Box args={[0.4, 0.4, 0.4]} position={[0.25, PALLET.HEIGHT + 0.2, -0.3]}>
            <meshStandardMaterial color={boxColor} />
          </Box>
          <Box args={[0.4, 0.4, 0.4]} position={[-0.25, PALLET.HEIGHT + 0.2, 0.3]}>
            <meshStandardMaterial color={boxColor} />
          </Box>
          <Box args={[0.4, 0.4, 0.4]} position={[0.25, PALLET.HEIGHT + 0.2, 0.3]}>
            <meshStandardMaterial color={boxColor} />
          </Box>
        </>
      )}
    </group>
  );
};

// Warehouse Rack Component
interface WarehouseRackProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  hasPallets?: boolean
  palletColors?: string[]
  boxColors?: string[]
}

const WarehouseRack: React.FC<WarehouseRackProps> = ({ 
  position, 
  rotation = [0, 0, 0],
  hasPallets = true,
  palletColors = ["#8B4513", "#A0522D", "#CD853F"],
  boxColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
}) => {
  const rackConfig = WAREHOUSE_CONFIG.RACK
  
  return (
    <group position={position} rotation={rotation}>
      {/* Rack posts - Removed */}
      {/* Horizontal beams - Removed */}
      
      {/* Pallets on each shelf - reduced for performance */}
      {hasPallets && [0, 1].map(level => (
        <group key={level}>
          {/* Only front pallets for better performance */}
          <Pallet 
            position={[-0.6, level * rackConfig.SHELF_HEIGHT + WAREHOUSE_CONFIG.PALLET.HEIGHT/2, -rackConfig.DEPTH/2 - WAREHOUSE_CONFIG.PALLET.WIDTH/2]}
            color={palletColors[level % palletColors.length]}
            hasBoxes={false}
          />
          <Pallet 
            position={[0.6, level * rackConfig.SHELF_HEIGHT + WAREHOUSE_CONFIG.PALLET.HEIGHT/2, -rackConfig.DEPTH/2 - WAREHOUSE_CONFIG.PALLET.WIDTH/2]}
            color={palletColors[level % palletColors.length]}
            hasBoxes={false}
          />
        </group>
      ))}
    </group>
  )
}

// Function to generate warehouse rack layout (optimized for performance)
const generateWarehouseRacks = () => {
  const racks: Array<{ position: [number, number, number], rotation: [number, number, number] }> = []
  const config = WAREHOUSE_CONFIG
  
  // Calculate how many racks can fit
  const rackWidth = config.RACK.WIDTH
  const aisleWidth = config.AISLE.WIDTH
  const totalWidthPerRow = rackWidth + aisleWidth
  
  // Reduce density for better performance - only use 1/4 of the space
  const maxRacksPerRow = Math.floor((config.WAREHOUSE.WIDTH - aisleWidth) / totalWidthPerRow / 2)
  const maxRows = Math.floor((config.WAREHOUSE.LENGTH - aisleWidth) / totalWidthPerRow / 2)
  
  // Generate racks in rows and columns with reduced density
  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < maxRacksPerRow; col++) {
      const x = (col * totalWidthPerRow * 2) - (config.WAREHOUSE.WIDTH / 2) + (rackWidth / 2)
      const z = (row * totalWidthPerRow * 2) - (config.WAREHOUSE.LENGTH / 2) + (rackWidth / 2)
      
      // Skip if too close to walls (leave space for aisles)
      if (Math.abs(x) < config.WAREHOUSE.WIDTH / 2 - 10 && Math.abs(z) < config.WAREHOUSE.LENGTH / 2 - 10) {
        racks.push({
          position: [x, 0, z],
          rotation: [0, 0, 0]
        })
      }
    }
  }
  
  return racks
}

// Enhanced interfaces for the new features
interface Bin {
  id: string
  x: number
  y: number
  z: number
  length: number
  width: number
  height: number
  zone: string
  aisle: string
  bay: string
  level: string
  capacity: number
  fillPercentage: number
  contents: Array<{
    sku: string
    name: string
    qty: number
    lot?: string
    serial?: string
  }>
  lastActivity?: string
  restrictions?: {
    hazmat?: boolean
    fragile?: boolean
    weightMax?: number
  }
}

interface Rack {
  id: string
  x: number
  y: number
  z: number
  length: number
  width: number
  height: number
  zone: string
  aisle: string
}

interface DockDoor {
  id: string
  x: number
  y: number
  z: number
  length: number
  width: number
  height: number
  zone: string
}

interface StagingLane {
  id: string
  x: number
  y: number
  z: number
  length: number
  width: number
  height: number
  zone: string
}

interface SafetyZone {
  id: string
  name: string
  coords: Array<{ x: number; y: number; z: number }>
  rule: string
  color: string
}

interface TaskPath {
  id: string
  type: 'PICK' | 'PUTAWAY' | 'REPLEN'
  points: Array<{ x: number; y: number; z: number }>
  color: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

interface Layout {
  bins: Bin[]
  racks: Rack[]
  dockDoors: DockDoor[]
  stagingLanes: StagingLane[]
  safetyZones?: SafetyZone[]
  taskPaths?: TaskPath[]
}

// Helper to get a color based on fill percentage
const getHeatmapColor = (fillPercentage: number) => {
  const hue = (1 - fillPercentage / 100) * 0.4 // Green to Red (0.4 is green, 0 is red)
  return new THREE.Color().setHSL(hue, 1, 0.5)
}

interface EnhancedWarehouse3DSceneProps {
  layout: Layout
  selectedBinId: string
  highlightedBinIds: string[]
  showHeatmap: boolean
  showLabels: boolean
  showPickPath: boolean
  showSafetyZones: boolean
  heatmapMode: 'fill' | 'aging' | 'activity'
  onBinClick: (binId: string) => void
  onBinHover: (binId: string | null) => void
  onCameraFocus: (position: THREE.Vector3, target: THREE.Vector3) => void
  warehouseConfig?: {
    length: number
    width: number
    wallHeight: number
  }
  siteId?: string
}

// Instanced Bin Mesh Component for Performance
function InstancedBinMesh({ 
  bins, 
  selectedBinId, 
  highlightedBinIds, 
  showHeatmap, 
  heatmapMode,
  onBinClick, 
  onBinHover 
}: {
  bins: Bin[]
  selectedBinId: string
  highlightedBinIds: string[]
  showHeatmap: boolean
  heatmapMode: 'fill' | 'aging' | 'activity'
  onBinClick: (binId: string) => void
  onBinHover: (binId: string | null) => void
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

  // Create instanced mesh data
  const { positions, colors, scales } = useMemo(() => {
    const positions = new Float32Array(bins.length * 3)
    const colors = new Float32Array(bins.length * 3)
    const scales = new Float32Array(bins.length * 3)

    bins.forEach((bin, index) => {
      const i = index * 3
      
      // Position
      positions[i] = bin.x
      positions[i + 1] = bin.y
      positions[i + 2] = bin.z

      // Scale
      scales[i] = bin.width
      scales[i + 1] = bin.height
      scales[i + 2] = bin.length

      // Color based on state and heatmap
      let color = new THREE.Color('lightgray')
      
      if (bin.id === selectedBinId) {
        color = new THREE.Color('hotpink')
      } else if (highlightedBinIds.includes(bin.id)) {
        color = new THREE.Color('yellow')
      } else if (showHeatmap) {
        let intensity = 0
        switch (heatmapMode) {
          case 'fill':
            intensity = bin.fillPercentage / 100
            break
          case 'aging':
            // Simulate aging based on last activity
            const daysSinceActivity = bin.lastActivity ? 
              (Date.now() - new Date(bin.lastActivity).getTime()) / (1000 * 60 * 60 * 24) : 0
            intensity = Math.min(daysSinceActivity / 30, 1) // 30 days max
            break
          case 'activity':
            // Simulate activity based on contents count
            intensity = Math.min(bin.contents.length / 10, 1) // 10 items max
            break
        }
        const hue = (1 - intensity) * 0.4 // Green to Red
        color = new THREE.Color().setHSL(hue, 1, 0.5)
      }

      colors[i] = color.r
      colors[i + 1] = color.g
      colors[i + 2] = color.b
    })

    return { positions, colors, scales }
  }, [bins, selectedBinId, highlightedBinIds, showHeatmap, heatmapMode])

  // Update colors when selection changes
  useEffect(() => {
    if (meshRef.current) {
      const colorAttribute = meshRef.current.geometry.getAttribute('color') as THREE.BufferAttribute
      if (colorAttribute) {
        colorAttribute.needsUpdate = true
      }
    }
  }, [colors])

  const { camera, raycaster: sceneRaycaster } = useThree()

  const handlePointerMove = useCallback((event: any) => {
    if (!meshRef.current) return
    
    // Convert mouse position to normalized device coordinates
    const rect = event.target.getBoundingClientRect()
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast
    sceneRaycaster.setFromCamera(mouse.current, camera)
    const intersects = sceneRaycaster.intersectObject(meshRef.current)

    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId
      if (instanceId !== undefined && instanceId !== hoveredIndex) {
        setHoveredIndex(instanceId)
        onBinHover(bins[instanceId]?.id || null)
      }
    } else if (hoveredIndex !== null) {
      setHoveredIndex(null)
      onBinHover(null)
    }
  }, [bins, hoveredIndex, onBinHover, camera, sceneRaycaster])

  const handleClick = useCallback((event: any) => {
    if (!meshRef.current) return
    
    // Convert mouse position to normalized device coordinates
    const rect = event.target.getBoundingClientRect()
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast
    sceneRaycaster.setFromCamera(mouse.current, camera)
    const intersects = sceneRaycaster.intersectObject(meshRef.current)

    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId
      if (instanceId !== undefined) {
        onBinClick(bins[instanceId].id)
      }
    }
  }, [bins, onBinClick, camera, sceneRaycaster])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, bins.length]}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <boxGeometry>
        <instancedBufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <instancedBufferAttribute
          attach="attributes-scale"
          args={[scales, 3]}
        />
      </boxGeometry>
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  )
}

// LOD System for Performance
function LODBinMesh({ 
  bins, 
  selectedBinId, 
  highlightedBinIds, 
  showHeatmap, 
  heatmapMode,
  onBinClick, 
  onBinHover 
}: {
  bins: Bin[]
  selectedBinId: string
  highlightedBinIds: string[]
  showHeatmap: boolean
  heatmapMode: 'fill' | 'aging' | 'activity'
  onBinClick: (binId: string) => void
  onBinHover: (binId: string | null) => void
}) {
  const { camera } = useThree()
  const [distance, setDistance] = useState(0)

  useFrame(() => {
    if (camera) {
      setDistance(camera.position.length())
    }
  })

  // Use instanced meshes for distant bins, individual meshes for close ones
  const threshold = 50 // meters
  const useInstanced = distance > threshold || bins.length > 1000

  if (useInstanced) {
    return (
      <InstancedBinMesh
        bins={bins}
        selectedBinId={selectedBinId}
        highlightedBinIds={highlightedBinIds}
        showHeatmap={showHeatmap}
        heatmapMode={heatmapMode}
        onBinClick={onBinClick}
        onBinHover={onBinHover}
      />
    )
  }

  // Individual meshes for close-up view
  return (
    <>
      {bins.map((bin) => {
        const isSelected = bin.id === selectedBinId
        const isHighlighted = highlightedBinIds.includes(bin.id)
        
        let color = 'lightgray'
        if (isSelected) color = 'hotpink'
        else if (isHighlighted) color = 'yellow'
        else if (showHeatmap) {
          let intensity = 0
          switch (heatmapMode) {
            case 'fill':
              intensity = bin.fillPercentage / 100
              break
            case 'aging':
              const daysSinceActivity = bin.lastActivity ? 
                (Date.now() - new Date(bin.lastActivity).getTime()) / (1000 * 60 * 60 * 24) : 0
              intensity = Math.min(daysSinceActivity / 30, 1)
              break
            case 'activity':
              intensity = Math.min(bin.contents.length / 10, 1)
              break
          }
          const hue = (1 - intensity) * 0.4
          color = new THREE.Color().setHSL(hue, 1, 0.5).getHexString()
        }

        return (
          <Box
            key={bin.id}
            position={[bin.x, bin.y, bin.z]}
            args={[bin.width, bin.height, bin.length]}
            onClick={() => onBinClick(bin.id)}
            onPointerOver={() => onBinHover(bin.id)}
            onPointerOut={() => onBinHover(null)}
          >
            <meshStandardMaterial color={color} transparent opacity={0.8} />
          </Box>
        )
      })}
    </>
  )
}

// Mini-map Component (moved outside Canvas)
export function MiniMap({ 
  layout, 
  onTeleport, 
  cameraPosition, 
  cameraTarget 
}: {
  layout: Layout
  onTeleport: (position: THREE.Vector3, target: THREE.Vector3) => void
  cameraPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
}) {
  const [isVisible, setIsVisible] = useState(true)

  const handleMiniMapClick = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const z = (event.clientY - rect.top) / rect.height

    // Convert to world coordinates (simplified)
    const worldX = (x - 0.5) * 100
    const worldZ = (z - 0.5) * 100

    const newPosition = new THREE.Vector3(worldX, 20, worldZ)
    const newTarget = new THREE.Vector3(worldX, 0, worldZ)

    onTeleport(newPosition, newTarget)
  }, [onTeleport])

  if (!isVisible) return null

  return (
    <div className="absolute top-20 right-2 w-32 h-32 bg-white bg-opacity-90 rounded-lg shadow-lg border z-10">
      <div className="p-1 border-b text-xs font-medium">Mini-map</div>
      <div 
        className="w-full h-28 cursor-crosshair relative"
        onClick={handleMiniMapClick}
      >
        {/* Simplified 2D representation */}
        <svg className="w-full h-full">
          {/* Racks */}
          {layout.racks.map((rack) => (
            <rect
              key={rack.id}
              x={rack.x * 0.5 + 50}
              y={rack.z * 0.5 + 50}
              width={rack.length * 0.5}
              height={rack.width * 0.5}
              fill="#8b5cf6"
              opacity={0.6}
            />
          ))}
          
          {/* Bins (simplified) */}
          {layout.bins.slice(0, 100).map((bin) => (
            <rect
              key={bin.id}
              x={bin.x * 0.5 + 50}
              y={bin.z * 0.5 + 50}
              width={bin.width * 0.5}
              height={bin.length * 0.5}
              fill="#10b981"
              opacity={0.4}
            />
          ))}
          
          {/* Camera position indicator */}
          <circle
            cx={cameraPosition.x * 0.5 + 50}
            cy={cameraPosition.z * 0.5 + 50}
            r={3}
            fill="#ef4444"
          />
        </svg>
      </div>
            <div className="p-1 text-xs text-gray-500">
              Click to teleport
            </div>
    </div>
  )
}

// Performance Monitor (moved outside Canvas)
export function PerformanceMonitor() {
  const [fps, setFps] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const [lastTime, setLastTime] = useState(performance.now())

  useEffect(() => {
    let animationId: number

    const updateFPS = () => {
      setFrameCount(prev => prev + 1)
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)))
        setFrameCount(0)
        setLastTime(now)
      }
      animationId = requestAnimationFrame(updateFPS)
    }

    animationId = requestAnimationFrame(updateFPS)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [frameCount, lastTime])

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'text-green-600'
    if (fps >= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs z-10">
      FPS: <span className={getFpsColor(fps)}>{fps}</span>
    </div>
  )
}

const ZonePlane: React.FC<{ zone: Zone }> = ({ zone }) => {
  return (
    <group position={[zone.x, 0.01, zone.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[zone.width, zone.depth]} />
        <meshStandardMaterial color={zone.color} transparent opacity={0.3} />
      </mesh>
      <Text
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {zone.name}
      </Text>
    </group>
  );
};

const WarehouseFloor = () => {
  const { WAREHOUSE } = WAREHOUSE_CONFIG;
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[WAREHOUSE.LENGTH, WAREHOUSE.WIDTH]} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
};

const Rack = ({ position, rotation }: { position: [number, number, number], rotation?: [number, number, number] }) => {
    const { RACK } = WAREHOUSE_CONFIG;
    return (
        <group position={position} rotation={rotation}>
            {/* Posts */}
            <Box args={[RACK.POST_THICKNESS, RACK.HEIGHT, RACK.POST_THICKNESS]} position={[-RACK.WIDTH / 2, RACK.HEIGHT / 2, -RACK.DEPTH / 2]}><meshStandardMaterial color="grey" /></Box>
            <Box args={[RACK.POST_THICKNESS, RACK.HEIGHT, RACK.POST_THICKNESS]} position={[RACK.WIDTH / 2, RACK.HEIGHT / 2, -RACK.DEPTH / 2]}><meshStandardMaterial color="grey" /></Box>
            <Box args={[RACK.POST_THICKNESS, RACK.HEIGHT, RACK.POST_THICKNESS]} position={[-RACK.WIDTH / 2, RACK.HEIGHT / 2, RACK.DEPTH / 2]}><meshStandardMaterial color="grey" /></Box>
            <Box args={[RACK.POST_THICKNESS, RACK.HEIGHT, RACK.POST_THICKNESS]} position={[RACK.WIDTH / 2, RACK.HEIGHT / 2, RACK.DEPTH / 2]}><meshStandardMaterial color="grey" /></Box>
            {/* Shelves */}
            <Box args={[RACK.WIDTH, RACK.BEAM_THICKNESS, RACK.DEPTH]} position={[0, 1, 0]}><meshStandardMaterial color="lightgrey" /></Box>
            <Box args={[RACK.WIDTH, RACK.BEAM_THICKNESS, RACK.DEPTH]} position={[0, RACK.HEIGHT - RACK.BEAM_THICKNESS, 0]}><meshStandardMaterial color="lightgrey" /></Box>
        </group>
    );
}

export const FilledWarehouseScene = () => {
    return (
        <Canvas camera={{ position: [0, 60, 80], fov: 55 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 100, 50]} intensity={2.5} />
            <WarehouseFloor />
            {ZONES.map(zone => <ZonePlane key={zone.id} zone={zone} />)}

            {/* Inbound Pallets */}
            <Pallet position={[-50, 0, 30]} hasBoxes />
            <Pallet position={[-47, 0, 30]} hasBoxes />
            <Pallet position={[-30, 0, 30]} hasBoxes />

            {/* Outbound Pallets */}
            <Pallet position={[50, 0, 30]} hasBoxes />
            <Pallet position={[47, 0, 30]} hasBoxes />
            
            {/* Racking Layout */}
            {Array.from({ length: 15 }).map((_, i) => <Rack key={`rack-a-${i}`} position={[-40, 0, -25 + i * 2.5]} />)}
            {Array.from({ length: 15 }).map((_, i) => <Rack key={`rack-b-${i}`} position={[-30, 0, -25 + i * 2.5]} />)}
            {Array.from({ length: 15 }).map((_, i) => <Rack key={`rack-c-${i}`} position={[-10, 0, -25 + i * 2.5]} />)}
            {Array.from({ length: 15 }).map((_, i) => <Rack key={`rack-d-${i}`} position={[0, 0, -25 + i * 2.5]} />)}
            {Array.from({ length: 15 }).map((_, i) => <Rack key={`rack-e-${i}`} position={[20, 0, -25 + i * 2.5]} />)}
            {Array.from({ length: 15 }).map((_, i) => <Rack key={`rack-f-${i}`} position={[30, 0, -25 + i * 2.5]} />)}
            
            {/* Pallets in Racks */}
            <Pallet position={[-40, 1.1, -25]} hasBoxes />
            <Pallet position={[-30, 1.1, -20]} hasBoxes />
            <Pallet position={[-10, 1.1, -15]} hasBoxes />
            <Pallet position={[0, 1.1, -10]} hasBoxes />
            <Pallet position={[20, 1.1, -5]} hasBoxes />
            <Pallet position={[30, 1.1, 0]} hasBoxes />

            <OrbitControls />
            <Environment preset="sunset" />
        </Canvas>
    );
};

// Main Enhanced Scene Component
export function EnhancedWarehouse3DScene({
  layout,
  selectedBinId,
  highlightedBinIds,
  showHeatmap,
  showLabels,
  showPickPath,
  showSafetyZones,
  heatmapMode,
  onBinClick,
  onBinHover,
  onCameraFocus,
  warehouseConfig,
  siteId
}: EnhancedWarehouse3DSceneProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(50, 50, 50))
  const [cameraTarget, setCameraTarget] = useState(new THREE.Vector3(0, 0, 0))

  // Use warehouse config or default values
  const config = warehouseConfig || {
    length: 120.0,
    width: 80.0,
    wallHeight: 12.0
  }

  // Update camera position tracking
  useFrame(() => {
    if (camera) {
      setCameraPosition(camera.position.clone())
      if (controlsRef.current) {
        setCameraTarget(controlsRef.current.target.clone())
      }
    }
  })

  // Handle camera teleport
  const handleTeleport = useCallback((position: THREE.Vector3, target: THREE.Vector3) => {
    if (camera && controlsRef.current) {
      camera.position.copy(position)
      controlsRef.current.target.copy(target)
      controlsRef.current.update()
      onCameraFocus(position, target)
    }
  }, [camera, onCameraFocus])

  // Handle bin click with camera focus
  const handleBinClick = useCallback((binId: string) => {
    const bin = layout.bins.find(b => b.id === binId)
    if (bin && camera && controlsRef.current) {
      const targetPosition = new THREE.Vector3(bin.x, bin.y + bin.height / 2, bin.z)
      const cameraPosition = new THREE.Vector3(
        bin.x + 10,
        bin.y + bin.height + 10,
        bin.z + 10
      )
      
      camera.position.copy(cameraPosition)
      controlsRef.current.target.copy(targetPosition)
      controlsRef.current.update()
      onCameraFocus(cameraPosition, targetPosition)
    }
    onBinClick(binId)
  }, [layout.bins, camera, onBinClick, onCameraFocus])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 100, 50]} intensity={1} castShadow />
      <pointLight position={[-100, -100, -100]} intensity={0.5} />

             {/* Grid - Removed */}

             {/* Dynamic Warehouse Walls */}
             {/* North Wall */}
             <mesh position={[0, config.wallHeight/2, -config.width/2]} rotation={[0, 0, 0]}>
               <boxGeometry args={[config.width, config.wallHeight, 0.3]} />
               <meshStandardMaterial color="#374151" />
             </mesh>
             {/* South Wall */}
             <mesh position={[0, config.wallHeight/2, config.width/2]} rotation={[0, 0, 0]}>
               <boxGeometry args={[config.width, config.wallHeight, 0.3]} />
               <meshStandardMaterial color="#374151" />
             </mesh>
             {/* West Wall */}
             <mesh position={[-config.length/2, config.wallHeight/2, 0]} rotation={[0, Math.PI / 2, 0]}>
               <boxGeometry args={[config.length, config.wallHeight, 0.3]} />
               <meshStandardMaterial color="#374151" />
             </mesh>
             {/* East Wall */}
             <mesh position={[config.length/2, config.wallHeight/2, 0]} rotation={[0, Math.PI / 2, 0]}>
               <boxGeometry args={[config.length, config.wallHeight, 0.3]} />
               <meshStandardMaterial color="#374151" />
             </mesh>

             {/* Structural Columns - Removed */}

             {/* Roof Beams - Removed */}

             {/* Structural Beams and Bracing - Removed */}

             {/* Forklift Aisle Markings - Removed */}


             {/* Central Divider Wall - Removed */}

             {/* 3-Part Structure - Removed */}
             
             {/* Warehouse Floor */}
             <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
               <planeGeometry args={[config.width, config.length]} />
               <meshStandardMaterial 
                 color="#e5e5e5" 
                 roughness={0.8}
                 metalness={0.1}
                 transparent={false}
                 opacity={1.0}
               />
             </mesh>
             
             {/* Floor Grid Pattern */}
             <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
               <planeGeometry args={[config.width, config.length]} />
               <meshStandardMaterial 
                 color="#d0d0d0" 
                 transparent={true}
                 opacity={0.3}
                 wireframe={true}
               />
             </mesh>

      {/* Warehouse Racks */}
      {layout.racks.map((rack) => (
        <Box
          key={rack.id}
          position={[rack.x, rack.y + rack.height / 2, rack.z]}
          args={[rack.length, rack.height, rack.width]}
        >
          <meshStandardMaterial color="#8b5cf6" transparent opacity={0.6} />
        </Box>
      ))}

      {/* Bins */}
      {layout.bins.map((bin) => (
        <Box
          key={bin.id}
          position={[bin.x, bin.y + bin.height / 2, bin.z]}
          args={[bin.length, bin.height, bin.width]}
          onClick={(e) => {
            e.stopPropagation()
            onBinClick(bin.id)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            onBinHover(bin.id)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            onBinHover(null)
          }}
        >
          <meshStandardMaterial 
            color={selectedBinId === bin.id ? 'yellow' : 
                   highlightedBinIds.includes(bin.id) ? 'orange' : 
                   showHeatmap ? getHeatmapColor(bin.fillPercentage) : 'lightgray'} 
            transparent 
            opacity={0.7} 
          />
        </Box>
      ))}

      {/* Dock Doors */}
      {layout.dockDoors.map((door) => (
        <Box
          key={door.id}
          position={[door.x, door.y + door.height / 2, door.z]}
          args={[door.length, door.height, door.width]}
        >
          <meshStandardMaterial color="#ef4444" />
        </Box>
      ))}

      {/* Staging Lanes */}
      {layout.stagingLanes.map((lane) => (
        <Box
          key={lane.id}
          position={[lane.x, lane.y + lane.height / 2, lane.z]}
          args={[lane.length, lane.height, lane.width]}
        >
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.5} />
        </Box>
      ))}

      {/* Safety Zones */}
      {showSafetyZones && layout.safetyZones?.map(zone => (
        <group key={zone.id}>
          {/* Simplified safety zone visualization */}
          <Box
            position={[
              zone.coords[0]?.x || 0,
              0.1,
              zone.coords[0]?.z || 0
            ]}
            args={[10, 0.2, 10]}
          >
            <meshStandardMaterial color={zone.color} transparent opacity={0.3} />
          </Box>
        </group>
      ))}

      {/* Task Paths */}
      {showPickPath && layout.taskPaths?.map(path => (
        <group key={path.id}>
          {path.points.map((point, index) => {
            if (index === 0) return null
            const prevPoint = path.points[index - 1]
            return (
              <line key={index}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    itemSize={3}
                    array={new Float32Array([
                      prevPoint.x, prevPoint.y, prevPoint.z,
                      point.x, point.y, point.z
                    ])}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={path.color} linewidth={3} />
              </line>
            )
          })}
        </group>
      ))}

      {/* Bin Labels */}
      {showLabels && layout.bins.slice(0, 50).map(bin => (
        <Html
          key={`label-${bin.id}`}
          position={[bin.x, bin.y + bin.height / 2 + 0.1, bin.z]}
          center
        >
          <div className="bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded pointer-events-none whitespace-nowrap">
            {bin.aisle}-{bin.bay}-{bin.level}
          </div>
        </Html>
      ))}

      {/* Rack Labels */}
      {showLabels && layout.racks.slice(0, 20).map(rack => (
        <Html
          key={`rack-label-${rack.id}`}
          position={[rack.x, rack.y + rack.height / 2 + 0.1, rack.z]}
          center
        >
          <div className="bg-purple-600 bg-opacity-70 text-white text-xs px-1 py-0.5 rounded pointer-events-none whitespace-nowrap">
            {rack.id}
          </div>
        </Html>
      ))}

      {/* Dock Door Labels */}
      {showLabels && layout.dockDoors.slice(0, 10).map(door => (
        <Html
          key={`door-label-${door.id}`}
          position={[door.x, door.y + door.height / 2 + 0.1, door.z]}
          center
        >
          <div className="bg-red-600 bg-opacity-70 text-white text-xs px-1 py-0.5 rounded pointer-events-none whitespace-nowrap">
            {door.id}
          </div>
        </Html>
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={1000}
      />
      
      <Environment preset="warehouse" />
    </>
  )
}
