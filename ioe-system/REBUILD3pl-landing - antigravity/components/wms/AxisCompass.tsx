"use client"

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Internal Compass Scene
 */
function CompassScene({ mainCamera }: { mainCamera?: THREE.Camera }) {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null)
  
  useFrame(() => {
    if (groupRef.current && mainCamera) {
      // Sync rotation with main viewport camera
      groupRef.current.quaternion.copy(mainCamera.quaternion)
    }
  })

  const handleAxisClick = (axis: string) => {
    if (mainCamera) {
      // Reset camera to face the selected axis
      switch (axis) {
        case 'X':
          mainCamera.position.set(10, 0, 0)
          mainCamera.lookAt(0, 0, 0)
          break
        case 'Y':
          mainCamera.position.set(0, 10, 0)
          mainCamera.lookAt(0, 0, 0)
          break
        case 'Z':
          mainCamera.position.set(0, 0, 10)
          mainCamera.lookAt(0, 0, 0)
          break
      }
    }
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* X Axis - Red Arrow */}
      <group 
        onClick={() => handleAxisClick('X')}
        onPointerOver={() => setHoveredAxis('X')}
        onPointerOut={() => setHoveredAxis(null)}
      >
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.2, 8]} />
          <meshBasicMaterial 
            color={hoveredAxis === 'X' ? "#dc2626" : "#ef4444"} 
            emissive={hoveredAxis === 'X' ? "#7f1d1d" : "#000000"}
          />
        </mesh>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <meshBasicMaterial 
            color={hoveredAxis === 'X' ? "#dc2626" : "#ef4444"}
            emissive={hoveredAxis === 'X' ? "#7f1d1d" : "#000000"}
          />
        </mesh>
      </group>

      {/* Y Axis - Green Arrow */}
      <group 
        onClick={() => handleAxisClick('Y')}
        onPointerOver={() => setHoveredAxis('Y')}
        onPointerOut={() => setHoveredAxis(null)}
      >
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.08, 0.2, 8]} />
          <meshBasicMaterial 
            color={hoveredAxis === 'Y' ? "#16a34a" : "#22c55e"}
            emissive={hoveredAxis === 'Y' ? "#14532d" : "#000000"}
          />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <meshBasicMaterial 
            color={hoveredAxis === 'Y' ? "#16a34a" : "#22c55e"}
            emissive={hoveredAxis === 'Y' ? "#14532d" : "#000000"}
          />
        </mesh>
      </group>

      {/* Z Axis - Blue Arrow */}
      <group 
        onClick={() => handleAxisClick('Z')}
        onPointerOver={() => setHoveredAxis('Z')}
        onPointerOut={() => setHoveredAxis(null)}
      >
        <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.2, 8]} />
          <meshBasicMaterial 
            color={hoveredAxis === 'Z' ? "#2563eb" : "#3b82f6"}
            emissive={hoveredAxis === 'Z' ? "#1e3a8a" : "#000000"}
          />
        </mesh>
        <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <meshBasicMaterial 
            color={hoveredAxis === 'Z' ? "#2563eb" : "#3b82f6"}
            emissive={hoveredAxis === 'Z' ? "#1e3a8a" : "#000000"}
          />
        </mesh>
      </group>

      {/* Center sphere */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>
    </group>
  )
}

/**
 * Axis Compass Overlay
 * Small 3D compass in top-left corner showing X, Y, Z axes
 */
interface AxisCompassProps {
  camera?: THREE.Camera | null
  onAxisClick?: (axis: string) => void
}

export function AxisCompass({ camera, onAxisClick }: AxisCompassProps) {
  const compassRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  return (
    <div 
      ref={compassRef}
      className="absolute top-4 left-4 z-10 w-20 h-20 pointer-events-auto"
    >
      <div className="w-full h-full bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <Canvas
          camera={{ position: [2, 2, 2], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={0.8} />
          <CompassScene mainCamera={camera} />
        </Canvas>
        
        {/* Axis Labels */}
        <div className="absolute bottom-1 left-1 right-1 flex justify-between text-[8px] font-bold">
          <span className="text-red-600">X</span>
          <span className="text-green-600">Y</span>
          <span className="text-blue-600">Z</span>
        </div>
        
        {/* Toggle visibility button */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="absolute top-1 right-1 w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-[8px] font-bold"
        >
          {isVisible ? '−' : '+'}
        </button>
      </div>
    </div>
  )
}
