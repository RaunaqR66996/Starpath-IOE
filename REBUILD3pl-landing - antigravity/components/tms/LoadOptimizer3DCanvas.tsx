'use client';

import React, { Suspense, useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { PlacedCargo, TrailerSpec } from '@/lib/stores/loadOptimizerStore';
import * as THREE from 'three';

interface Trailer3DProps {
  spec: TrailerSpec;
  showGrid: boolean;
}

function Trailer3D({ spec, showGrid }: Trailer3DProps) {
  // Convert inches to meters for better Three.js scaling (1 inch = 0.0254 meters)
  const scale = 0.02;
  const length = spec.innerLength * scale;
  const width = spec.innerWidth * scale;
  const height = spec.innerHeight * scale;
  
  // Wheel configuration based on axle type
  const wheelRadius = 0.4;
  const wheelWidth = 0.3;
  const wheelPositions = getWheelPositions(spec.axleConfig, length, width, wheelRadius);
  const trailerLiftHeight = wheelRadius * 2; // Lift trailer to sit on top of wheels
  
  return (
    <group position={[0, 0, 0]}>
      {/* Walls (wireframe) - lifted above wheels */}
      <group position={[length / 2, trailerLiftHeight + height / 2, width / 2]}>
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(length, height, width)]} />
          <lineBasicMaterial attach="material" color="#6B7280" linewidth={2} />
        </lineSegments>
      </group>
      
      {/* Grid on floor at trailer bed level */}
      {showGrid && (
        <Grid
          position={[length / 2, trailerLiftHeight + 0.01, width / 2]}
          args={[length, width]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#9CA3AF"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#6B7280"
          fadeDistance={50}
          fadeStrength={1}
          infiniteGrid={false}
        />
      )}
      
      {/* Wheels */}
      {wheelPositions.map((pos, idx) => (
        <group key={idx} position={[pos.x, pos.y, pos.z]}>
          {/* Tire */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 16]} />
            <meshStandardMaterial color="#1F2937" roughness={0.8} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth * 1.1, 16]} />
            <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
      
      {/* Trailer label */}
      <Html position={[length / 2, trailerLiftHeight + height + 0.5, width / 2]}>
        <div className="bg-white/90 px-3 py-1 rounded-lg shadow-lg text-xs font-semibold">
          {spec.name}
        </div>
      </Html>
    </group>
  );
}

// Helper function to calculate wheel positions based on axle configuration
function getWheelPositions(
  axleConfig: 'tandem' | 'tridem' | 'spread',
  trailerLength: number,
  trailerWidth: number,
  wheelRadius: number
) {
  const positions: Array<{ x: number; y: number; z: number }> = [];
  const wheelHeight = wheelRadius; // Position wheels at ground level (radius above y=0)
  const leftWheelZ = trailerWidth * 0.2; // Left wheels inside trailer
  const rightWheelZ = trailerWidth * 0.8; // Right wheels inside trailer
  
  // Rear axle positions (trailer length is measured from front)
  const rearAxlePos = trailerLength * 0.85; // 85% back from front
  const midAxlePos = trailerLength * 0.75;
  const frontAxlePos = trailerLength * 0.65;
  
  if (axleConfig === 'tandem') {
    // 2 axles, 4 wheels per axle (8 wheels total)
    [rearAxlePos, rearAxlePos - 1.2].forEach(axleX => {
      // Left side - front and rear dual wheels
      positions.push({ x: axleX, y: wheelHeight, z: leftWheelZ });
      positions.push({ x: axleX - 0.3, y: wheelHeight, z: leftWheelZ });
      // Right side - front and rear dual wheels
      positions.push({ x: axleX, y: wheelHeight, z: rightWheelZ });
      positions.push({ x: axleX - 0.3, y: wheelHeight, z: rightWheelZ });
    });
  } else if (axleConfig === 'tridem') {
    // 3 axles, 4 wheels per axle (12 wheels total)
    [rearAxlePos, midAxlePos, frontAxlePos].forEach(axleX => {
      // Left side dual wheels
      positions.push({ x: axleX, y: wheelHeight, z: leftWheelZ });
      positions.push({ x: axleX - 0.3, y: wheelHeight, z: leftWheelZ });
      // Right side dual wheels
      positions.push({ x: axleX, y: wheelHeight, z: rightWheelZ });
      positions.push({ x: axleX - 0.3, y: wheelHeight, z: rightWheelZ });
    });
  } else { // spread
    // 2 axles spread wider, 4 wheels per axle (8 wheels total)
    [rearAxlePos, rearAxlePos - 2.5].forEach(axleX => {
      // Left side dual wheels
      positions.push({ x: axleX, y: wheelHeight, z: leftWheelZ });
      positions.push({ x: axleX - 0.3, y: wheelHeight, z: leftWheelZ });
      // Right side dual wheels
      positions.push({ x: axleX, y: wheelHeight, z: rightWheelZ });
      positions.push({ x: axleX - 0.3, y: wheelHeight, z: rightWheelZ });
    });
  }
  
  return positions;
}

interface CargoBox3DProps {
  item: PlacedCargo;
  isHighlighted: boolean;
  onClick: () => void;
  trailerLiftOffset?: number;
}

// Optimized Cargo Box Component with instanced rendering
function CargoBox3D({ item, isHighlighted, onClick, trailerLiftOffset = 0 }: CargoBox3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = 0.02;
  
  // Convert inches to meters
  const length = item.length * scale;
  const width = item.width * scale;
  const height = item.height * scale;
  const x = item.x * scale;
  const y = item.y * scale + trailerLiftOffset;
  const z = item.z * scale;
  
  // Optimized animation - only animate highlighted items
  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      meshRef.current.scale.setScalar(pulse);
    }
  });
  
  // Memoize geometry to prevent recreation
  const geometry = useMemo(() => new THREE.BoxGeometry(length, height, width), [length, height, width]);
  
  return (
    <mesh
      ref={meshRef}
      position={[x + length / 2, y + height / 2, z + width / 2]}
      onClick={useCallback((e: any) => {
        e.stopPropagation();
        onClick();
      }, [onClick])}
      onPointerOver={useCallback(() => document.body.style.cursor = 'pointer', [])}
      onPointerOut={useCallback(() => document.body.style.cursor = 'default', [])}
      geometry={geometry}
    >
      <meshStandardMaterial 
        color={item.color || '#3B82F6'}
        opacity={isHighlighted ? 0.8 : 0.7}
        transparent
        emissive={isHighlighted ? item.color || '#3B82F6' : '#000000'}
        emissiveIntensity={isHighlighted ? 0.5 : 0}
      />
      {/* Only show label for highlighted items to improve performance */}
      {isHighlighted && (
        <Html center>
          <div className="bg-white/90 px-2 py-1 rounded shadow text-xs font-medium ring-2 ring-blue-500">
            {item.sku}
          </div>
        </Html>
      )}
    </mesh>
  );
}

// Instanced Cargo Renderer for better performance with many items
function InstancedCargoRenderer({ 
  placedCargo, 
  highlightedItem, 
  onItemClick, 
  trailerLiftOffset 
}: {
  placedCargo: PlacedCargo[];
  highlightedItem: string | null;
  onItemClick?: (itemId: string) => void;
  trailerLiftOffset: number;
}) {
  const scale = 0.02;
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Memoize instanced mesh data
  const { positions, scales, colors } = useMemo(() => {
    const positions = new Float32Array(placedCargo.length * 3);
    const scales = new Float32Array(placedCargo.length * 3);
    const colors = new Float32Array(placedCargo.length * 3);
    
    placedCargo.forEach((item, index) => {
      const i = index * 3;
      
      // Position
      positions[i] = (item.x + item.length / 2) * scale;
      positions[i + 1] = (item.y + item.height / 2) * scale + trailerLiftOffset;
      positions[i + 2] = (item.z + item.width / 2) * scale;
      
      // Scale
      scales[i] = item.length * scale;
      scales[i + 1] = item.height * scale;
      scales[i + 2] = item.width * scale;
      
      // Color
      const color = new THREE.Color(item.color || '#3B82F6');
      if (item.instanceId === highlightedItem || item.id === highlightedItem) {
        color.multiplyScalar(1.2); // Brighten highlighted items
      }
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    });
    
    return { positions, scales, colors };
  }, [placedCargo, highlightedItem, trailerLiftOffset]);
  
  // Update instance matrices + colors only when data changes
  useEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;
    
    placedCargo.forEach((item, index) => {
      const posIndex = index * 3;
      
      tempPosition.set(positions[posIndex], positions[posIndex + 1], positions[posIndex + 2]);
      tempScale.set(scales[posIndex], scales[posIndex + 1], scales[posIndex + 2]);
      tempQuaternion.identity();
      
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      mesh.setMatrixAt(index, tempMatrix);
      
      tempColor.setRGB(colors[posIndex], colors[posIndex + 1], colors[posIndex + 2]);
      mesh.setColorAt(index, tempColor);
    });
    
    mesh.count = placedCargo.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [placedCargo, positions, scales, colors, tempColor, tempMatrix, tempPosition, tempQuaternion, tempScale]);
  
  // Handle clicks on instanced mesh
  const handleClick = useCallback((event: any) => {
    if (!onItemClick) return;
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId !== undefined && placedCargo[instanceId]) {
      onItemClick(placedCargo[instanceId].id);
    }
  }, [onItemClick, placedCargo]);
  
  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer';
  }, []);
  
  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'default';
  }, []);
  
  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, placedCargo.length]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry />
      <meshStandardMaterial 
        opacity={0.7}
        transparent
        vertexColors
      />
    </instancedMesh>
  );
}

interface CenterOfGravityProps {
  x: number;
  y: number;
  z: number;
  show: boolean;
  trailerLiftOffset?: number;
}

function CenterOfGravity({ x, y, z, show, trailerLiftOffset = 0 }: CenterOfGravityProps) {
  const scale = 0.02;
  
  if (!show) return null;
  
  return (
    <group position={[x * scale, y * scale + trailerLiftOffset, z * scale]}>
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.5} />
      </mesh>
      
      <Html center>
        <div className="bg-red-500 text-white px-2 py-1 rounded shadow-lg text-xs font-bold">
          CoG
        </div>
      </Html>
    </group>
  );
}

export interface LoadOptimizer3DCanvasProps {
  trailer: TrailerSpec;
  placedCargo: PlacedCargo[];
  centerOfGravity?: { x: number; y: number; z: number };
  showGrid?: boolean;
  showCenterOfGravity?: boolean;
  highlightedItem?: string | null;
  onItemClick?: (itemId: string) => void;
}

export function LoadOptimizer3DCanvas({
  trailer,
  placedCargo,
  centerOfGravity,
  showGrid = true,
  showCenterOfGravity = true,
  highlightedItem = null,
  onItemClick
}: LoadOptimizer3DCanvasProps) {
  const wheelRadius = 0.4;
  const trailerLiftOffset = wheelRadius * 2;
  
  // Performance optimization: use instanced rendering for large cargo counts
  const useInstancedRendering = placedCargo.length > 50;
  
  // Memoize canvas settings for better performance
  const canvasSettings = useMemo(() => ({
    shadows: true,
    camera: { position: [15, 10, 15] as [number, number, number], fov: 50 },
    gl: { 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance" as const,
      stencil: false,
      depth: true
    }
  }), []);
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-300 via-gray-200 to-gray-100">
      <Canvas {...canvasSettings}>
        <color attach="background" args={['#E5E7EB']} />
        
        {/* Optimized Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.0} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <hemisphereLight args={['#ffffff', '#606060', 0.4]} />
        
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#94a3b8" wireframe />
          </mesh>
        }>
          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#F3F4F6" />
          </mesh>
          
          {/* Trailer */}
          <Trailer3D spec={trailer} showGrid={showGrid} />
          
          {/* Optimized Cargo Rendering */}
          {useInstancedRendering ? (
            <InstancedCargoRenderer
              placedCargo={placedCargo}
              highlightedItem={highlightedItem}
              onItemClick={onItemClick}
              trailerLiftOffset={trailerLiftOffset}
            />
          ) : (
            placedCargo.map((item) => (
              <CargoBox3D
                key={item.instanceId}
                item={item}
                isHighlighted={item.instanceId === highlightedItem || item.id === highlightedItem}
                onClick={() => onItemClick?.(item.id)}
                trailerLiftOffset={trailerLiftOffset}
              />
            ))
          )}
          
          {/* Center of Gravity */}
          {centerOfGravity && (
            <CenterOfGravity
              x={centerOfGravity.x}
              y={centerOfGravity.y}
              z={centerOfGravity.z}
              show={showCenterOfGravity}
              trailerLiftOffset={trailerLiftOffset}
            />
          )}
          
          {/* Optimized Camera Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.4}
            zoomSpeed={0.6}
            panSpeed={0.8}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
            enablePan={true}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}






