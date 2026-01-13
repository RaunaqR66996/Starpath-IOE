"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Settings,
  Search,
  Map,
  Zap,
  Target,
  BarChart3,
  Thermometer,
} from "lucide-react"
import { LidarConfig } from "@/components/Scene/LidarSimulator"
import { PointCloudManager, exportToPLY, downloadPLY } from "@/lib/pointcloud"
import { SKULocation } from "@/components/Scene/WarehouseScene"

interface ControlsPanelProps {
  lidarConfig: LidarConfig
  onLidarConfigChange: (config: LidarConfig) => void
  isScanning: boolean
  onToggleScanning: () => void
  onReset: () => void
  pointCloudManager: PointCloudManager
  pointCloudVisible: boolean
  onTogglePointCloud: () => void
  warehouseVisible: boolean
  onToggleWarehouse: () => void
  highlightedSKU: string | null
  onSKUSearch: (sku: string) => void
  skuLocations: SKULocation[]
  // Heat map props
  showHeatMap: boolean
  onToggleHeatMap: () => void
  heatMapMode: 'temperature' | 'activity' | 'density' | 'custom'
  onHeatMapModeChange: (mode: 'temperature' | 'activity' | 'density' | 'custom') => void
  heatMapIntensity: number
  onHeatMapIntensityChange: (intensity: number) => void
}

export function ControlsPanel({
  lidarConfig,
  onLidarConfigChange,
  isScanning,
  onToggleScanning,
  onReset,
  pointCloudManager,
  pointCloudVisible,
  onTogglePointCloud,
  warehouseVisible,
  onToggleWarehouse,
  highlightedSKU,
  onSKUSearch,
  skuLocations,
  // Heat map props
  showHeatMap,
  onToggleHeatMap,
  heatMapMode,
  onHeatMapModeChange,
  heatMapIntensity,
  onHeatMapIntensityChange
}: ControlsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [pointCount, setPointCount] = useState(0)
  const [colorMode, setColorMode] = useState<'distance' | 'intensity' | 'constant'>('distance')
  const [pointSize, setPointSize] = useState(0.05)
  const [opacity, setOpacity] = useState(0.8)
  const [decayTime, setDecayTime] = useState(10)
  const [showMinimap, setShowMinimap] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null!)

  // Update point count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPointCount(pointCloudManager.getPointCount())
    }, 100)
    return () => clearInterval(interval)
  }, [pointCloudManager])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        onToggleScanning()
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        onReset()
      } else if (e.code === 'KeyE') {
        e.preventDefault()
        handleExport()
      } else if (e.code === 'Slash') {
        e.preventDefault()
        document.getElementById('sku-search')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onToggleScanning, onReset])

  const handleExport = () => {
    const points = pointCloudManager.getPoints()
    if (points.length === 0) {
      alert('No points to export')
      return
    }

    const plyData = exportToPLY(points)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    downloadPLY(`lidar-scan-${timestamp}.ply`, plyData)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      // Basic PLY parser (simplified)
      console.log('Importing PLY file:', file.name)
      // TODO: Implement PLY import logic
    }
    reader.readAsText(file)
  }

  const filteredSKUs = skuLocations.filter(sku =>
    sku.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sku.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="absolute top-4 left-4 w-80 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Main Controls */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-green-400" />
            LiDAR Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge className={isScanning ? "bg-green-500" : "bg-gray-500"}>
              {isScanning ? "Scanning" : "Idle"}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onToggleScanning}
              className={isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              size="sm"
            >
              {isScanning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button onClick={onReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Point Count */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Point Cloud</span>
              <span>{pointCount.toLocaleString()} points</span>
            </div>
            <Progress value={(pointCount / 100000) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* LiDAR Configuration */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-blue-400" />
            LiDAR Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* RPM */}
          <div className="space-y-2">
            <label className="text-sm font-medium">RPM</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={lidarConfig.rpm}
              onChange={(e) => onLidarConfigChange({ ...lidarConfig, rpm: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{lidarConfig.rpm} RPM</div>
          </div>

          {/* Rays per Revolution */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rays per Revolution</label>
            <input
              type="range"
              min="180"
              max="1440"
              step="180"
              value={lidarConfig.raysPerRevolution}
              onChange={(e) => onLidarConfigChange({ ...lidarConfig, raysPerRevolution: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{lidarConfig.raysPerRevolution} rays</div>
          </div>

          {/* Max Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Range</label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={lidarConfig.maxRange}
              onChange={(e) => onLidarConfigChange({ ...lidarConfig, maxRange: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{lidarConfig.maxRange}m</div>
          </div>

          {/* Noise Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Noise Level</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={lidarConfig.noiseLevel}
              onChange={(e) => onLidarConfigChange({ ...lidarConfig, noiseLevel: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{(lidarConfig.noiseLevel * 100).toFixed(0)}%</div>
          </div>

          {/* Show Beam */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Show Beam</span>
            <Button
              onClick={() => onLidarConfigChange({ ...lidarConfig, showBeam: !lidarConfig.showBeam })}
              variant={lidarConfig.showBeam ? "default" : "outline"}
              size="sm"
            >
              {lidarConfig.showBeam ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Point Cloud Settings */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            Point Cloud
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visibility */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Show Point Cloud</span>
            <Button
              onClick={onTogglePointCloud}
              variant={pointCloudVisible ? "default" : "outline"}
              size="sm"
            >
              {pointCloudVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>

          {/* Point Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Point Size</label>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={pointSize}
              onChange={(e) => setPointSize(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{pointSize.toFixed(2)}</div>
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Opacity</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{(opacity * 100).toFixed(0)}%</div>
          </div>

          {/* Color Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Color Mode</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as 'distance' | 'intensity' | 'constant')}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              <option value="distance">Distance</option>
              <option value="intensity">Intensity</option>
              <option value="constant">Constant</option>
            </select>
          </div>

          {/* Decay Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Decay Time</label>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={decayTime}
              onChange={(e) => setDecayTime(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{decayTime}s</div>
          </div>
        </CardContent>
      </Card>

      {/* Heat Map Controls */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5 text-orange-400" />
            Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visibility */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Show Heat Map</span>
            <Button
              onClick={onToggleHeatMap}
              variant={showHeatMap ? "default" : "outline"}
              size="sm"
            >
              {showHeatMap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Heat Map Mode</label>
            <select
              value={heatMapMode}
              onChange={(e) => onHeatMapModeChange(e.target.value as 'temperature' | 'activity' | 'density' | 'custom')}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              <option value="temperature">Temperature</option>
              <option value="activity">Activity Level</option>
              <option value="density">Point Density</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Intensity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Heat Intensity</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={heatMapIntensity}
              onChange={(e) => onHeatMapIntensityChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{heatMapIntensity.toFixed(1)}x</div>
          </div>

          {/* Color Legend */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Color Scale</span>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-2 bg-blue-500 rounded"></div>
              <span className="text-gray-400">Cold</span>
              <div className="w-4 h-2 bg-green-500 rounded"></div>
              <span className="text-gray-400">Warm</span>
              <div className="w-4 h-2 bg-yellow-500 rounded"></div>
              <span className="text-gray-400">Hot</span>
              <div className="w-4 h-2 bg-red-500 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SKU Search */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-yellow-400" />
            SKU Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <input
              id="sku-search"
              type="text"
              placeholder="Search SKU or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm"
            />
            <Search className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
          </div>

          {searchQuery && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filteredSKUs.map((sku) => (
                <div
                  key={sku.id}
                  className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                    highlightedSKU === sku.sku
                      ? "bg-yellow-600/20 border border-yellow-500"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                  onClick={() => onSKUSearch(sku.sku)}
                >
                  <div className="font-medium">{sku.sku}</div>
                  <div className="text-gray-400">{sku.description}</div>
                  <div className="text-gray-500">Rack {sku.rack}, Bay {sku.bay}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="text-xs text-gray-400 space-y-1">
            <div><kbd className="bg-gray-800 px-1 rounded">Space</kbd> Toggle scanning</div>
            <div><kbd className="bg-gray-800 px-1 rounded">R</kbd> Reset</div>
            <div><kbd className="bg-gray-800 px-1 rounded">E</kbd> Export</div>
            <div><kbd className="bg-gray-800 px-1 rounded">/</kbd> Focus search</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
