'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Text } from '@react-three/drei';
import { TrailerSpec, PlacedItem, AxleSpec } from '@/lib/types/trailer';

interface Trailer3DProps {
  trailer: TrailerSpec;
  placedItems: PlacedItem[];
  showAxleLoads?: boolean;
  showCenterOfGravity?: boolean;
  showGrid?: boolean;
  highlightedItem?: string | null;
  onItemClick?: (itemId: string) => void;
  centerOfGravity?: { x: number; y: number; z: number };
  warnings?: Array<{ type: 'error' | 'warning' | 'info'; message: string }>;
}

// WORLD COORDS (Right-hand rule):
// X: forward (trailer length),  Y: up (height),  Z: right (width)
// Ground: y = 0   |   Deck top: y = DECK_Y

/** --- Constants you can tweak --- */
const DECK_Y = 4;             // ft, deck height above ground
const WHEEL_RADIUS = 1.5;     // ft, realistic truck tire size
const WHEEL_WIDTH = 0.4;      // ft, tire width
const RIM_RADIUS = 0.8;       // ft, steel rim size
const WHEEL_CLEAR = 0.3;      // ft, clearance from trailer side
const DUAL_GAP = 0.15;        // ft, tight spacing between dual tires
const TANDEM_SPACING = 4.0;   // ft, standard tandem axle spacing

/** Cargo box INSIDE the trailer - using right-hand coordinate system */
function CargoBox({ 
  item, 
  isHovered = false, 
  isHighlighted = false, 
  onClick 
}: { 
  item: PlacedItem; 
  isHovered?: boolean; 
  isHighlighted?: boolean;
  onClick?: () => void;
}) {
  const color = item.color || '#3B82F6';
  
  // Adapter: old coordinate system → right-hand rule
  // Position: x=forward, y=up, z=right
  const position: [number, number, number] = [
    item.x + item.l / 2,           // X: forward (length)
    DECK_Y + item.z + item.h / 2,  // Y: up (height) - place on deck
    item.y + item.w / 2            // Z: right (width)
  ];
  
  // Dimensions: [length, height, width]
  const dimensions: [number, number, number] = [item.l, item.h, item.w];
  
  return (
    <group position={position} onClick={onClick}>
      <Box args={dimensions}>
        <meshStandardMaterial 
          color={isHighlighted ? '#F59E0B' : isHovered ? '#10B981' : color} 
          opacity={isHighlighted ? 0.9 : 0.8} 
          transparent 
          emissive={isHighlighted ? '#F59E0B' : '#000000'}
          emissiveIntensity={isHighlighted ? 0.2 : 0}
        />
      </Box>
      {(isHovered || isHighlighted) && (
        <Text position={[0, item.h / 2 + 0.5, 0]} fontSize={0.8} color="white" anchorX="center" anchorY="middle">
          {item.id}
        </Text>
      )}
      {isHighlighted && (
        <Box args={[item.l + 0.2, item.h + 0.2, item.w + 0.2]} position={[0, 0, 0]}>
          <meshBasicMaterial color="#F59E0B" transparent opacity={0.3} />
        </Box>
      )}
    </group>
  );
}

/** Axle with wheels using Y-up coordinate system */
function Axle({
  x,
  type,
  trailerWidth
}: {
  x: number;
  type: AxleSpec['type'];
  trailerWidth: number;
}) {
  const axleY = WHEEL_RADIUS; // wheels touch ground, center at wheel radius height
  const axleLen = trailerWidth + 2 * (WHEEL_WIDTH + WHEEL_CLEAR) + 0.6;
  
  // Wheel positions along Z-axis (left/right) - INSIDE trailer width
  const leftZ = WHEEL_CLEAR + WHEEL_WIDTH / 2;
  const rightZ = trailerWidth - WHEEL_CLEAR - WHEEL_WIDTH / 2;

  const renderSide = (side: 'left' | 'right') => {
    const baseZ = side === 'left' ? leftZ : rightZ;
    const duals = type === 'dual';

    // Realistic truck wheel with tire and rim
    const wheel = (localZOffset = 0) => (
      <group key={`${side}-${localZOffset}`} position={[x, axleY, baseZ + localZOffset]}>
        {/* Tire (black rubber) */}
        <Cylinder
          args={[WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 32]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </Cylinder>
        
        {/* Steel rim (metallic) */}
        <Cylinder
          args={[RIM_RADIUS, RIM_RADIUS, WHEEL_WIDTH * 0.8, 16]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </Cylinder>
        
        {/* Rim center hub */}
        <Cylinder
          args={[RIM_RADIUS * 0.4, RIM_RADIUS * 0.4, WHEEL_WIDTH * 0.9, 8]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#808080" metalness={0.9} roughness={0.1} />
        </Cylinder>
        
        {/* Tire sidewall details */}
        <Cylinder
          args={[WHEEL_RADIUS * 0.95, WHEEL_RADIUS * 0.95, WHEEL_WIDTH * 0.1, 24]}
          position={[0, 0, WHEEL_WIDTH * 0.35]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </Cylinder>
        <Cylinder
          args={[WHEEL_RADIUS * 0.95, WHEEL_RADIUS * 0.95, WHEEL_WIDTH * 0.1, 24]}
          position={[0, 0, -WHEEL_WIDTH * 0.35]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </Cylinder>
      </group>
    );

    return (
      <group key={side}>
        {duals ? (
          <>
            {wheel(-DUAL_GAP / 2)}
            {wheel(+DUAL_GAP / 2)}
          </>
        ) : (
          wheel(0)
        )}
      </group>
    );
  };

  return (
    <group>
      {/* Heavy-duty axle shaft */}
      <Cylinder
        args={[0.25, 0.25, rightZ - leftZ + WHEEL_WIDTH * 1.5, 16]}
        position={[x, axleY, trailerWidth / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
      </Cylinder>

      {/* Axle housing (differential) */}
      <Box
        args={[1.2, 0.8, 0.6]}
        position={[x, axleY + 0.2, trailerWidth / 2]}
      >
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </Box>

      {/* Suspension air bags - positioned between wheels inside trailer */}
      <Cylinder
        args={[0.25, 0.3, 0.5, 8]}
        position={[x, (DECK_Y + axleY) / 2, leftZ + WHEEL_WIDTH + 0.5]}
      >
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </Cylinder>
      <Cylinder
        args={[0.25, 0.3, 0.5, 8]}
        position={[x, (DECK_Y + axleY) / 2, rightZ - WHEEL_WIDTH - 0.5]}
      >
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </Cylinder>

      {/* Frame connection */}
      <Box
        args={[0.4, DECK_Y - axleY - 0.5, 0.2]}
        position={[x, DECK_Y - 0.3, trailerWidth / 2]}
      >
        <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.5} />
      </Box>

      {/* Wheel sets */}
      {renderSide('left')}
      {renderSide('right')}
    </group>
  );
}

/** Trailer chassis using Y-up coordinate system */
function TrailerChassis({ trailer }: { trailer: TrailerSpec }) {
  const L = trailer.length_ft;
  const W = trailer.width_ft; 
  const H = trailer.height_ft;

  return (
    <group>
      {/* Floor - brown deck */}
      <Box args={[L, 0.2, W]} position={[L / 2, DECK_Y, W / 2]}>
        <meshStandardMaterial color="#8B7355" />
      </Box>

      {/* Left wall (z≈0) */}
      <Box args={[L, H, 0.1]} position={[L / 2, DECK_Y + H / 2, 0.05]}>
        <meshStandardMaterial color="#E5E7EB" opacity={0.3} transparent />
      </Box>

      {/* Right wall (z≈W) */}
      <Box args={[L, H, 0.1]} position={[L / 2, DECK_Y + H / 2, W - 0.05]}>
        <meshStandardMaterial color="#E5E7EB" opacity={0.3} transparent />
      </Box>

      {/* Back doors (x≈0) */}
      <Box args={[0.1, H, W]} position={[0.05, DECK_Y + H / 2, W / 2]}>
        <meshStandardMaterial color="#F3F4F6" opacity={0.5} transparent />
      </Box>

      {/* Door split line */}
      <Box args={[0.15, H, 0.1]} position={[0.05, DECK_Y + H / 2, W / 2]}>
        <meshStandardMaterial color="#374151" />
      </Box>

      {/* Roof */}
      <Box args={[L, 0.1, W]} position={[L / 2, DECK_Y + H - 0.05, W / 2]}>
        <meshStandardMaterial color="#D1D5DB" opacity={0.2} transparent />
      </Box>
    </group>
  );
}

/** Center of Gravity Visualization */
function CenterOfGravity({ cog, trailer }: { cog: { x: number; y: number; z: number }; trailer: TrailerSpec }) {
  const position: [number, number, number] = [
    cog.x,
    DECK_Y + cog.z,
    cog.y
  ];

  return (
    <group position={position}>
      {/* Center of gravity sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#FF0000" transparent opacity={0.8} />
      </mesh>
      {/* Lines showing COG position */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              0, 0, 0,
              0, -DECK_Y, 0
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF0000" />
      </line>
      <Text position={[0, 1, 0]} fontSize={0.6} color="red" anchorX="center" anchorY="middle">
        CoG
      </Text>
    </group>
  );
}

/** Utilization Overlay */
function UtilizationOverlay({ utilization, trailer }: { utilization: number; trailer: TrailerSpec }) {
  return (
    <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-xs">
      <div className="font-bold">Load Utilization</div>
      <div className="text-lg">{utilization}%</div>
      <div className="text-xs text-gray-300">
        {trailer.length_ft}ft × {trailer.width_ft}ft × {trailer.height_ft}ft
      </div>
    </div>
  );
}

export function Trailer3D({ 
  trailer, 
  placedItems, 
  showAxleLoads = true,
  showCenterOfGravity = true,
  showGrid = true,
  highlightedItem,
  onItemClick,
  centerOfGravity,
  warnings = []
}: Trailer3DProps) {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  // Real tandem axle setup - authentic spacing
  const axles = useMemo(() => {
    const rearAxleCenter = trailer.length_ft * 0.9; // 90% toward rear
    return [
      { x: rearAxleCenter - TANDEM_SPACING / 2, type: 'dual' as AxleSpec['type'] }, // Front axle
      { x: rearAxleCenter + TANDEM_SPACING / 2, type: 'dual' as AxleSpec['type'] }  // Rear axle
    ];
  }, [trailer]);

  // Calculate utilization
  const utilization = useMemo(() => {
    const totalVolume = placedItems.reduce((sum, item) => sum + (item.l * item.w * item.h), 0);
    const trailerVolume = trailer.length_ft * trailer.width_ft * trailer.height_ft;
    return Math.round((totalVolume / trailerVolume) * 100);
  }, [placedItems, trailer]);

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden relative">
      {/* Utilization Overlay */}
      <UtilizationOverlay utilization={utilization} trailer={trailer} />
      
      {/* Warnings Overlay */}
      {warnings.length > 0 && (
        <div className="absolute top-4 right-4 space-y-1">
          {warnings.map((warning, index) => (
            <div 
              key={index} 
              className={`px-2 py-1 rounded text-xs ${
                warning.type === 'error' ? 'bg-red-500 text-white' :
                warning.type === 'warning' ? 'bg-orange-500 text-white' :
                'bg-blue-500 text-white'
              }`}
            >
              {warning.message}
            </div>
          ))}
        </div>
      )}

      <Canvas
        camera={{
          position: [trailer.length_ft * 0.8, DECK_Y + trailer.height_ft * 1.1, trailer.width_ft * 1.2],
          fov: 45
        }}
        style={{ background: '#f8fafc' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[trailer.length_ft * 1.6, DECK_Y + trailer.height_ft * 1.8, trailer.width_ft * 1.2]} 
          intensity={1.0} 
          castShadow 
        />
        <pointLight 
          position={[trailer.length_ft / 2, DECK_Y + trailer.height_ft * 1.2, trailer.width_ft / 2]} 
          intensity={0.5} 
        />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={10}
          maxDistance={200}
          target={[trailer.length_ft * 0.45, DECK_Y + trailer.height_ft * 0.35, trailer.width_ft / 2]}
        />

        {/* Ground grid at y=0 (the real ground) */}
        {showGrid && (
          <gridHelper 
            args={[Math.max(trailer.length_ft, trailer.width_ft) * 1.6, 16]} 
            position={[trailer.length_ft / 2, 0, trailer.width_ft / 2]} 
          />
        )}

        {/* Trailer chassis */}
        <TrailerChassis trailer={trailer} />

        {/* Axles + wheels */}
        {showAxleLoads && axles.map((axle, i) => (
          <Axle key={i} x={axle.x} type={axle.type} trailerWidth={trailer.width_ft} />
        ))}

        {/* Center of Gravity */}
        {showCenterOfGravity && centerOfGravity && (
          <CenterOfGravity cog={centerOfGravity} trailer={trailer} />
        )}

        {/* Cargo boxes */}
        {placedItems.map(item => (
          <CargoBox 
            key={item.id}
            item={item} 
            isHovered={hoveredItem === item.id}
            isHighlighted={highlightedItem === item.id}
            onClick={() => {
              setHoveredItem(item.id);
              onItemClick?.(item.id);
            }}
          />
        ))}
      </Canvas>
    </div>
  );
}
