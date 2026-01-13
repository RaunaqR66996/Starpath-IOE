"use client"

import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box, Grid, Environment } from '@react-three/drei'
import * as THREE from 'three'

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
  status?: 'EMPTY' | 'FILLING' | 'READY' | 'DISPATCHED'
  orders?: Array<{
    orderNumber: string
    status: string
    filledPallets: number
    requiredPallets: number
  }>
}

interface Layout {
  bins: Bin[]
  racks: Rack[]
  dockDoors: DockDoor[]
  stagingLanes: StagingLane[]
}

interface Warehouse3DSceneProps {
  layout: Layout
  selectedBinId?: string
  highlightedBinIds?: string[]
  showHeatmap?: boolean
  showLabels?: boolean
  showPickPath?: boolean
  onBinClick?: (binId: string) => void
  onBinHover?: (binId: string | null) => void
  onStagingClick?: (laneId: string) => void
}

// Individual bin component
function BinComponent({ 
  bin, 
  isSelected, 
  isHighlighted, 
  showHeatmap, 
  showLabels, 
  onClick, 
  onHover 
}: {
  bin: Bin
  isSelected: boolean
  isHighlighted: boolean
  showHeatmap: boolean
  showLabels: boolean
  onClick: () => void
  onHover: (hovered: boolean) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Calculate color based on heatmap or selection state
  const getColor = () => {
    if (isSelected) return '#3b82f6' // Blue for selected
    if (isHighlighted) return '#f59e0b' // Orange for highlighted
    if (hovered) return '#10b981' // Green for hovered
    
    if (showHeatmap) {
      // Color based on fill percentage
      const fill = bin.fillPercentage
      if (fill > 80) return '#ef4444' // Red for high fill
      if (fill > 60) return '#f59e0b' // Orange for medium-high fill
      if (fill > 40) return '#eab308' // Yellow for medium fill
      if (fill > 20) return '#22c55e' // Green for low-medium fill
      return '#6b7280' // Gray for low fill
    }
    
    return '#9ca3af' // Default gray
  }

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle animation for selected/highlighted bins
      if (isSelected || isHighlighted) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
      } else {
        meshRef.current.rotation.y = 0
      }
    }
  })

  return (
    <group
      position={[bin.x, bin.y + bin.height / 2, bin.z]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        onHover(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        onHover(false)
      }}
    >
      <Box
        ref={meshRef}
        args={[bin.length, bin.height, bin.width]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={getColor()}
          transparent
          opacity={isSelected || isHighlighted ? 0.8 : 0.6}
          emissive={isSelected ? '#1e40af' : '#000000'}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </Box>
      
      {showLabels && (
        <Text
          position={[0, bin.height / 2 + 0.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${bin.zone}-${bin.aisle}-${bin.bay}-${bin.level}`}
        </Text>
      )}
    </group>
  )
}

// Rack component
function RackComponent({ rack }: { rack: Rack }) {
  return (
    <group position={[rack.x, rack.y + rack.height / 2, rack.z]}>
      <Box args={[rack.length, rack.height, rack.width]}>
        <meshStandardMaterial color="#4b5563" opacity={0.3} transparent />
      </Box>
    </group>
  )
}

// Dock door component
function DockDoorComponent({ door }: { door: DockDoor }) {
  return (
    <group position={[door.x, door.y + door.height / 2, door.z]}>
      <Box args={[door.length, door.height, door.width]}>
        <meshStandardMaterial color="#dc2626" opacity={0.7} transparent />
      </Box>
      <Text
        position={[0, door.height / 2 + 0.5, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        DOCK
      </Text>
    </group>
  )
}

// Staging lane component with dynamic status colors
function StagingLaneComponent({ lane, onClick }: { lane: StagingLane; onClick?: () => void }) {
  // Determine color based on status
  const getStatusColor = () => {
    if (!lane.status || lane.status === 'EMPTY') return '#6b7280' // Gray
    if (lane.status === 'FILLING') return '#ef4444' // Red
    if (lane.status === 'READY') return '#10b981' // Green
    if (lane.status === 'DISPATCHED') return '#6366f1' // Blue
    return '#6b7280'
  }

  const getOpacity = () => {
    if (!lane.status || lane.status === 'EMPTY') return 0.2
    return 0.7
  }

  const color = getStatusColor()
  const opacity = getOpacity()
  const hasOrders = lane.orders && lane.orders.length > 0

  return (
    <group position={[lane.x, lane.y + lane.height / 2, lane.z]}>
      {/* Main staging area box */}
      <Box 
        args={[lane.length, lane.height, lane.width]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <meshStandardMaterial color={color} opacity={opacity} transparent />
      </Box>

      {/* Multi-order visualization with dividers */}
      {hasOrders && lane.orders && lane.orders.map((order, idx) => {
        // Calculate position within lane based on order index
        const orderCount = lane.orders!.length
        const segmentLength = lane.length / orderCount
        const startOffset = idx * segmentLength - lane.length / 2
        
        return (
          <group key={idx}>
            {/* Divider between orders */}
            {idx > 0 && (
              <Box
                args={[0.1, lane.height, lane.width]}
                position={[startOffset, 0, 0]}
              >
                <meshStandardMaterial color="#000000" opacity={0.3} transparent />
              </Box>
            )}
            
            {/* Fill indicator (height shows fill percentage) */}
            {order.status === 'FILLING' && (
              <Box
                args={[segmentLength, (order.filledPallets / order.requiredPallets) * 0.3, lane.width]}
                position={[startOffset + segmentLength / 2, 0.2, 0]}
              >
                <meshStandardMaterial color="#059669" opacity={0.8} transparent />
              </Box>
            )}
          </group>
        )
      })}

      {/* Label text */}
      {hasOrders ? (
        lane.orders!.map((order, idx) => {
          const orderCount = lane.orders!.length
          const segmentLength = lane.length / orderCount
          const startOffset = idx * segmentLength - lane.length / 2
          
          return (
            <Text
              key={idx}
              position={[startOffset + segmentLength / 2, lane.height / 2 + 0.8, 0]}
              fontSize={0.25}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              strokeWidth={0.02}
              strokeColor="#000000"
              renderOrder={1000}
            >
              {order.orderNumber}
            </Text>
          )
        })
      ) : (
        <Text
          position={[0, lane.height / 2 + 0.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          STAGE
        </Text>
      )}
    </group>
  )
}

// Main 3D scene component
function WarehouseScene({
  layout,
  selectedBinId,
  highlightedBinIds = [],
  showHeatmap = false,
  showLabels = false,
  showPickPath = false,
  onBinClick,
  onBinHover,
  onStagingClick
}: Warehouse3DSceneProps) {
  const { camera } = useThree()

  const handleBinClick = (binId: string) => {
    onBinClick?.(binId)
  }

  const handleBinHover = (binId: string | null) => {
    onBinHover?.(binId)
  }

  const handleStagingClick = (laneId: string) => {
    onStagingClick?.(laneId)
  }

  // Memoize bins for performance
  const bins = useMemo(() => layout.bins, [layout.bins])
  const racks = useMemo(() => layout.racks, [layout.racks])
  const dockDoors = useMemo(() => layout.dockDoors, [layout.dockDoors])
  const stagingLanes = useMemo(() => layout.stagingLanes, [layout.stagingLanes])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      {/* Floor grid */}
      <Grid
        position={[0, 0, 0]}
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Racks */}
      {racks.map((rack) => (
        <RackComponent key={rack.id} rack={rack} />
      ))}

      {/* Bins */}
      {bins.map((bin) => (
        <BinComponent
          key={bin.id}
          bin={bin}
          isSelected={bin.id === selectedBinId}
          isHighlighted={highlightedBinIds.includes(bin.id)}
          showHeatmap={showHeatmap}
          showLabels={showLabels}
          onClick={() => handleBinClick(bin.id)}
          onHover={(hovered) => handleBinHover(hovered ? bin.id : null)}
        />
      ))}

      {/* Dock doors */}
      {dockDoors.map((door) => (
        <DockDoorComponent key={door.id} door={door} />
      ))}

      {/* Staging lanes */}
      {stagingLanes.map((lane) => (
        <StagingLaneComponent 
          key={lane.id} 
          lane={lane}
          onClick={() => handleStagingClick(lane.id)}
        />
      ))}

      {/* Environment */}
      <Environment preset="warehouse" />
    </>
  )
}

// Main component
export function Warehouse3DScene(props: Warehouse3DSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [20, 15, 20], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <WarehouseScene {...props} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}






























































