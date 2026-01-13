"use client"

import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box, Grid, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { Bin, Rack, DockDoor, StagingLane, Layout, Wall, Column } from '@/lib/warehouse-mock'
import { AMRUnit } from '@/app/actions/wcs-actions'

interface Warehouse3DSceneProps {
    layout: Layout
    selectedBinId?: string
    highlightedBinIds?: string[]
    showHeatmap?: boolean
    showLabels?: boolean
    showPickPath?: boolean
    fleet?: AMRUnit[]
    onBinClick?: (binId: string) => void
    onBinHover?: (binId: string | null) => void
    onStagingClick?: (laneId: string) => void
}

function AMRComponent({ robot }: { robot: AMRUnit }) {
    const meshRef = useRef<THREE.Group>(null)
    const [pos, setPos] = useState<[number, number, number]>(robot.currentPosition)

    // Simple interpolation for movement if target exists
    useFrame((state) => {
        if (!meshRef.current || !robot.targetPosition || robot.status !== 'MOVING') return;

        const target = new THREE.Vector3(...robot.targetPosition);
        const current = meshRef.current.position;

        if (current.distanceTo(target) > 0.1) {
            const dir = target.clone().sub(current).normalize();
            current.addScaledVector(dir, 0.1); // Move 0.1 units per frame

            // Look at target
            meshRef.current.lookAt(target);
        }
    });

    return (
        <group ref={meshRef} position={pos}>
            {/* Robot Body */}
            <Box args={[0.8, 0.4, 1.2]}>
                <meshStandardMaterial color={robot.status === 'ERROR' ? '#ef4444' : '#1e293b'} />
            </Box>
            {/* LiDAR Hub */}
            <mesh position={[0, 0.3, 0.2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
                <meshStandardMaterial color="#000" />
            </mesh>
            {/* Status Light */}
            <mesh position={[0, 0.4, 0.2]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial
                    color={robot.status === 'MOVING' ? '#3b82f6' : robot.status === 'CHARGING' ? '#f59e0b' : '#10b981'}
                    emissive={robot.status === 'MOVING' ? '#3b82f6' : '#000'}
                    emissiveIntensity={2}
                />
            </mesh>
            {/* ID Text */}
            <Text
                position={[0, 0.8, 0]}
                fontSize={0.2}
                color="white"
                anchorX="center"
            >
                {robot.id}
            </Text>
        </group>
    );
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
        <group position={[rack.x, rack.y + (rack.height || 8) / 2, rack.z]}>
            <Box args={[rack.length, rack.height || 8, rack.width]}>
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

function ZoneComponent({ zone }: { zone: any }) {
    return (
        <mesh position={[zone.x, 0.01, zone.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[zone.width, zone.depth]} />
            <meshStandardMaterial color={zone.color || "#171717"} transparent opacity={0.2} />
        </mesh>
    )
}

function AreaComponent({ area, color }: { area: any, color?: string }) {
    return (
        <group position={[area.x, 0.02, area.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[area.width, area.depth]} />
                <meshStandardMaterial color={color || area.color || "#262626"} transparent opacity={0.3} />
            </mesh>
            <Text
                position={[0, 0.1, 0]}
                fontSize={0.8}
                color="white"
                anchorX="center"
                anchorY="middle"
                rotation={[-Math.PI / 2, 0, 0]}
            >
                {area.label}
            </Text>
        </group>
    )
}

function WallComponent({ wall }: { wall: Wall }) {
    return (
        <group position={[wall.x, wall.height / 2, wall.z]} rotation={[0, wall.rotationY || 0, 0]}>
            <Box args={[wall.length, wall.height, wall.width]}>
                <meshStandardMaterial color={wall.color || "#57534e"} />
            </Box>
        </group>
    )
}

function ColumnComponent({ column }: { column: Column }) {
    return (
        <group position={[column.x, column.height / 2, column.z]}>
            <mesh>
                <cylinderGeometry args={[column.radius, column.radius, column.height, 16]} />
                <meshStandardMaterial color={column.color || "#78716c"} />
            </mesh>
        </group>
    )
}

function WarehouseScene({
    layout,
    selectedBinId,
    highlightedBinIds = [],
    showHeatmap = false,
    showLabels = false,
    showPickPath = false,
    onBinClick,
    onBinHover,
    onStagingClick,
    fleet = []
}: Warehouse3DSceneProps) {
    const siteWidth = layout.site?.width || 200;
    const siteDepth = layout.site?.depth || 200;
    const centerX = siteWidth / 2;
    const centerZ = siteDepth / 2;
    const gridSize = Math.max(siteWidth, siteDepth, 200);

    return (
        <group>
            <ambientLight intensity={2.0} />
            <directionalLight position={[100, 200, 100]} intensity={3.0} castShadow />
            <hemisphereLight args={["#ffffff", "#404040", 2.0]} />

            <Grid
                position={[centerX, 0, centerZ]}
                args={[gridSize, gridSize]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#262626"
                sectionSize={10}
                sectionThickness={1}
                sectionColor="#404040"
                fadeDistance={gridSize}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid={true}
            />

            {/* Render Site Elements */}
            {layout.zones?.map((zone) => (
                <ZoneComponent key={zone.id} zone={zone} />
            ))}
            {layout.offices?.map((office) => (
                <AreaComponent key={office.id} area={office} color="#525252" />
            ))}
            {layout.corridors?.map((corridor) => (
                <ZoneComponent key={corridor.id} zone={corridor} />
            ))}
            {layout.docks?.map((dock) => (
                <AreaComponent key={dock.id} area={dock} color="#eab308" />
            ))}

            {layout.walls?.map((wall) => (
                <WallComponent key={wall.id} wall={wall} />
            ))}

            {layout.columns?.map((col) => (
                <ColumnComponent key={col.id} column={col} />
            ))}

            {layout.racks.map((rack) => (
                <RackComponent key={rack.id} rack={rack} />
            ))}

            {(layout.bins || []).map((bin) => (
                <BinComponent
                    key={bin.id}
                    bin={bin}
                    isSelected={bin.id === selectedBinId}
                    isHighlighted={highlightedBinIds.includes(bin.id)}
                    showHeatmap={showHeatmap || false}
                    showLabels={showLabels}
                    onClick={() => onBinClick?.(bin.id)}
                    onHover={(hovered) => onBinHover?.(hovered ? bin.id : null)}
                />
            ))}

            {(layout.dockDoors || []).map((door) => (
                <DockDoorComponent key={door.id} door={door} />
            ))}


            {(layout.stagingLanes || []).map((lane) => (
                <StagingLaneComponent
                    key={lane.id}
                    lane={lane}
                    onClick={() => onStagingClick?.(lane.id)}
                />
            ))}

            {fleet.map((robot) => (
                <AMRComponent key={robot.id} robot={robot} />
            ))}

            {/* Environment */}
            <Environment preset="warehouse" />
        </group>
    )
}

export function Warehouse3DScene(props: Warehouse3DSceneProps) {
    const { layout } = props;

    // Calculate site center and dimensions for camera/grid
    const siteWidth = layout.site?.width || 200;
    const siteDepth = layout.site?.depth || 200;
    const centerX = siteWidth / 2;
    const centerZ = siteDepth / 2;

    // Optimal camera distance based on site size (rough heuristic)
    const viewDist = Math.max(siteWidth, siteDepth) * 1.2;

    return (
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-neutral-800 bg-[#000000]">
            <Canvas
                camera={{
                    position: [centerX + viewDist / 2, viewDist / 1.5, centerZ + viewDist / 2],
                    fov: 40,
                    far: 50000
                }}
                shadows
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    alpha: false,
                    preserveDrawingBuffer: true
                }}
            >
                <color attach="background" args={["#000000"]} />
                <WarehouseScene {...props} />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={5}
                    maxDistance={viewDist * 4}
                    maxPolarAngle={Math.PI / 2.1}
                    target={[centerX, 0, centerZ]}
                />
            </Canvas>
        </div>
    )
}

