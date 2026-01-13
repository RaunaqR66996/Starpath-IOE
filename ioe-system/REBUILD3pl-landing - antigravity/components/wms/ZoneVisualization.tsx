"use client"

import React, { useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { StagingZone, ZoneState, ZONE_COLORS, ZONE_OPACITY } from '@/types/warehouse-zones'
import { motion, AnimatePresence } from 'framer-motion'

interface ZoneVisualizationProps {
  zones: StagingZone[]
  selectedZoneId?: string
  onZoneClick: (zoneId: string) => void
  onZoneHover: (zoneId: string | null) => void
  showLabels?: boolean
  showConnections?: boolean
}

// Individual Zone Component
function ZoneComponent({ 
  zone, 
  isSelected, 
  isHovered, 
  onClick, 
  onHover,
  showLabel,
  showConnection 
}: {
  zone: StagingZone
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onHover: (hovered: boolean) => void
  showLabel: boolean
  showConnection: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate zone color and opacity based on state
  const zoneColor = ZONE_COLORS[zone.state]
  const baseOpacity = zone.state === 'idle' ? ZONE_OPACITY.idle : ZONE_OPACITY.assigned
  const opacity = isSelected ? ZONE_OPACITY.selected : baseOpacity

  // Animation for state changes
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulse for active zones
      if (zone.state === 'active' && !isAnimating) {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
        meshRef.current.scale.setScalar(pulse)
      }
      
      // Glow effect for over-capacity
      if (zone.state === 'over-capacity') {
        const glow = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 0.8
        meshRef.current.material.opacity = opacity * glow
      }
    }
  })

  const handleClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)
    onClick()
  }

  return (
    <group>
      {/* Zone Base */}
      <mesh
        ref={meshRef}
        position={[zone.x, zone.y, zone.z]}
        onClick={handleClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[zone.length, zone.height, zone.width]} />
        <meshStandardMaterial
          color={zoneColor}
          transparent
          opacity={opacity}
          emissive={zone.state === 'over-capacity' ? '#FF0000' : '#000000'}
          emissiveIntensity={zone.state === 'over-capacity' ? 0.1 : 0}
        />
      </mesh>

      {/* Zone Outline */}
      <mesh position={[zone.x, zone.y, zone.z]}>
        <boxGeometry args={[zone.length + 0.1, zone.height + 0.1, zone.width + 0.1]} />
        <meshBasicMaterial
          color={zoneColor}
          transparent
          opacity={isHovered ? 0.6 : 0.3}
          wireframe
        />
      </mesh>

      {/* Zone Label */}
      {showLabel && (
        <Html
          position={[zone.x, zone.y + zone.height + 1, zone.z]}
          center
          distanceFactor={10}
          occlude
        >
          <ZoneLabel 
            zone={zone} 
            isSelected={isSelected}
            isHovered={isHovered}
          />
        </Html>
      )}

      {/* Connection Line to Zone Center */}
      {showConnection && isSelected && (
        <mesh position={[zone.x, zone.y + zone.height + 2, zone.z]}>
          <cylinderGeometry args={[0.02, 0.02, 2]} />
          <meshBasicMaterial color={zoneColor} />
        </mesh>
      )}
    </group>
  )
}

// Zone Label Component
function ZoneLabel({ 
  zone, 
  isSelected, 
  isHovered 
}: { 
  zone: StagingZone
  isSelected: boolean
  isHovered: boolean
}) {
  const totalOrders = zone.orders.length
  const totalPallets = zone.orders.reduce((sum, order) => sum + order.palletCount, 0)
  const utilizationPercent = Math.round(zone.utilizationPercentage)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.1 : 1,
        y: isHovered ? -5 : 0
      }}
      transition={{ duration: 0.2 }}
      className={`
        bg-white rounded-lg shadow-lg border-2 p-3 min-w-[200px] cursor-pointer
        ${isSelected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200'}
        ${isHovered ? 'shadow-xl' : ''}
      `}
    >
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: ZONE_COLORS[zone.state] }}
          />
          <span className="font-medium text-sm">{zone.name}</span>
        </div>
        {totalOrders > 1 && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            +{totalOrders - 1} orders
          </span>
        )}
      </div>

      {/* Order Reference */}
      {totalOrders > 0 && (
        <div className="text-sm font-medium text-gray-900 mb-1">
          {zone.orders[0]?.orderRef || 'Order Ref'}
        </div>
      )}

      {/* Pallet Count / Progress */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
        <span>{totalPallets} / {zone.maxCapacity} pallets</span>
        <span>{utilizationPercent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <motion.div
          className="h-2 rounded-full"
          style={{ backgroundColor: ZONE_COLORS[zone.state] }}
          initial={{ width: 0 }}
          animate={{ width: `${utilizationPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status Chip */}
      {totalOrders > 0 && (
        <div className="flex items-center gap-2">
          <span className={`
            text-xs px-2 py-1 rounded-full font-medium
            ${zone.orders[0]?.status === 'loading' ? 'bg-blue-100 text-blue-800' : ''}
            ${zone.orders[0]?.status === 'loaded' ? 'bg-green-100 text-green-800' : ''}
            ${zone.orders[0]?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${zone.orders[0]?.status === 'shipped' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {zone.orders[0]?.status || 'Active'}
          </span>
          {zone.orders[0]?.eta && (
            <span className="text-xs text-gray-500">
              ETA {zone.orders[0].eta}
            </span>
          )}
        </div>
      )}

      {/* Empty State */}
      {totalOrders === 0 && (
        <div className="text-xs text-gray-500 text-center py-2">
          No orders assigned
        </div>
      )}
    </motion.div>
  )
}

// Main Zone Visualization Component
export function ZoneVisualization({
  zones,
  selectedZoneId,
  onZoneClick,
  onZoneHover,
  showLabels = true,
  showConnections = true
}: ZoneVisualizationProps) {
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)

  const handleZoneHover = (zoneId: string | null) => {
    setHoveredZoneId(zoneId)
    onZoneHover(zoneId)
  }

  return (
    <group>
      {zones.map((zone) => (
        <ZoneComponent
          key={zone.id}
          zone={zone}
          isSelected={zone.id === selectedZoneId}
          isHovered={zone.id === hoveredZoneId}
          onClick={() => onZoneClick(zone.id)}
          onHover={(hovered) => handleZoneHover(hovered ? zone.id : null)}
          showLabel={showLabels}
          showConnection={showConnections}
        />
      ))}
    </group>
  )
}

// Zone Legend Component
export function ZoneLegend() {
  const zoneStates: Array<{ state: ZoneState; label: string; description: string }> = [
    { state: 'idle', label: 'Idle', description: 'Available for assignment' },
    { state: 'reserved', label: 'Reserved', description: 'Order assigned, pending' },
    { state: 'active', label: 'Active', description: 'Currently loading' },
    { state: 'released', label: 'Released', description: 'Ready for pickup' },
    { state: 'over-capacity', label: 'Over Capacity', description: 'Exceeds safe limits' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border">
      <h3 className="font-medium text-sm mb-3">Zone States</h3>
      <div className="space-y-2">
        {zoneStates.map(({ state, label, description }) => (
          <div key={state} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: ZONE_COLORS[state] }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-gray-500">{description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}






