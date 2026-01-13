"use client"

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Maximize2, 
  Minimize2, 
  X, 
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react'
import * as THREE from 'three'

interface Layout {
  bins: Array<{
    id: string
    x: number
    z: number
    width: number
    length: number
    fillPercentage: number
  }>
  racks: Array<{
    id: string
    x: number
    z: number
    length: number
    width: number
  }>
  dockDoors: Array<{
    id: string
    x: number
    z: number
  }>
  config?: {
    length: number
    width: number
  }
}

interface ImprovedMiniMapProps {
  layout: Layout
  onTeleport: (position: THREE.Vector3, target: THREE.Vector3) => void
  cameraPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
  selectedBinId?: string
  highlightedBinIds?: string[]
}

export function ImprovedMiniMap({ 
  layout, 
  onTeleport, 
  cameraPosition, 
  cameraTarget,
  selectedBinId,
  highlightedBinIds = []
}: ImprovedMiniMapProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [showBins, setShowBins] = useState(true)
  const [showRacks, setShowRacks] = useState(true)
  const [showDocks, setShowDocks] = useState(true)

  const handleMiniMapClick = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const z = (event.clientY - rect.top) / rect.height

    const config = layout.config || { length: 208.7, width: 208.7 }
    const worldX = (x - 0.5) * config.width
    const worldZ = (z - 0.5) * config.length

    const newPosition = new THREE.Vector3(worldX, 30, worldZ)
    const newTarget = new THREE.Vector3(worldX, 0, worldZ)

    onTeleport(newPosition, newTarget)
  }, [onTeleport, layout.config])

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="absolute top-4 right-4 z-10"
        size="sm"
        variant="outline"
      >
        <MapPin className="h-4 w-4" />
      </Button>
    )
  }

  const mapSize = isExpanded ? 'w-96 h-96' : 'w-64 h-64'

  return (
    <Card className={`absolute top-4 right-4 z-20 ${mapSize} transition-all duration-300 shadow-2xl`}>
      <CardHeader className="p-3 pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Warehouse Map
          </CardTitle>
          <div className="flex gap-1">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Legend */}
        <div className="px-3 py-2 bg-gray-50 border-b">
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Racks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Bins</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Camera</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Docks</span>
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div 
          className="w-full cursor-crosshair relative bg-gray-100 overflow-hidden"
          style={{ height: isExpanded ? '300px' : '180px' }}
          onClick={handleMiniMapClick}
        >
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#grid)" />
            
            {/* Warehouse boundary */}
            <rect 
              x="10" 
              y="10" 
              width="180" 
              height="180" 
              fill="none" 
              stroke="#6b7280" 
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Racks */}
            {showRacks && layout.racks.map((rack) => {
              const scale = 180 / (layout.config?.width || 208.7)
              const x = (rack.x * scale) + 100
              const z = (rack.z * scale) + 100
              const w = rack.length * scale
              const h = rack.width * scale
              
              return (
                <rect
                  key={rack.id}
                  x={x - w/2}
                  y={z - h/2}
                  width={w}
                  height={h}
                  fill="#8b5cf6"
                  opacity={0.7}
                  stroke="#7c3aed"
                  strokeWidth="0.5"
                />
              )
            })}
            
            {/* Bins */}
            {showBins && layout.bins.slice(0, 200).map((bin) => {
              const scale = 180 / (layout.config?.width || 208.7)
              const x = (bin.x * scale) + 100
              const z = (bin.z * scale) + 100
              const w = bin.width * scale
              const h = bin.length * scale
              
              const isSelected = bin.id === selectedBinId
              const isHighlighted = highlightedBinIds.includes(bin.id)
              
              return (
                <rect
                  key={bin.id}
                  x={x - w/2}
                  y={z - h/2}
                  width={w}
                  height={h}
                  fill={isSelected ? "#fbbf24" : isHighlighted ? "#fb923c" : "#10b981"}
                  opacity={isSelected ? 1 : isHighlighted ? 0.8 : 0.5}
                  stroke={isSelected ? "#f59e0b" : "#059669"}
                  strokeWidth={isSelected ? "1" : "0.3"}
                />
              )
            })}

            {/* Dock Doors */}
            {showDocks && layout.dockDoors.map((door) => {
              const scale = 180 / (layout.config?.width || 208.7)
              const x = (door.x * scale) + 100
              const z = (door.z * scale) + 100
              
              return (
                <rect
                  key={door.id}
                  x={x - 2}
                  y={z - 2}
                  width="4"
                  height="4"
                  fill="#eab308"
                  stroke="#ca8a04"
                  strokeWidth="0.5"
                />
              )
            })}
            
            {/* Camera position and view direction */}
            <g>
              {/* View cone */}
              <line
                x1={cameraPosition.x * (180 / (layout.config?.width || 208.7)) + 100}
                y1={cameraPosition.z * (180 / (layout.config?.width || 208.7)) + 100}
                x2={cameraTarget.x * (180 / (layout.config?.width || 208.7)) + 100}
                y2={cameraTarget.z * (180 / (layout.config?.width || 208.7)) + 100}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              
              {/* Camera position */}
              <circle
                cx={cameraPosition.x * (180 / (layout.config?.width || 208.7)) + 100}
                cy={cameraPosition.z * (180 / (layout.config?.width || 208.7)) + 100}
                r="4"
                fill="#ef4444"
                stroke="white"
                strokeWidth="1"
              />
            </g>
          </svg>

          {/* Stats overlay */}
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
            <div className="flex justify-between">
              <span className="font-medium">Bins: {layout.bins.length}</span>
              <span className="font-medium">Racks: {layout.racks.length}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex gap-1">
            <Button
              onClick={() => setShowBins(!showBins)}
              size="sm"
              variant={showBins ? "default" : "outline"}
              className="h-6 text-xs px-2"
            >
              Bins
            </Button>
            <Button
              onClick={() => setShowRacks(!showRacks)}
              size="sm"
              variant={showRacks ? "default" : "outline"}
              className="h-6 text-xs px-2"
            >
              Racks
            </Button>
            <Button
              onClick={() => setShowDocks(!showDocks)}
              size="sm"
              variant={showDocks ? "default" : "outline"}
              className="h-6 text-xs px-2"
            >
              Docks
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            <Navigation className="h-3 w-3 mr-1" />
            Click to teleport
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}










