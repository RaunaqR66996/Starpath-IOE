"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Navigation, 
  Route,
  Truck,
  Search,
  Settings,
  Eye,
  RefreshCw
} from "lucide-react"

interface MapControlsProps {
  onTrackShipment?: (trackingNumber: string) => void
  onClearSelection?: () => void
  onFitAll?: () => void
  onStyleChange?: (style: string) => void
  onViewModeChange?: (mode: '2d' | '3d') => void
  onWeatherChange?: (weather: string) => void
}

export function MapControls({ 
  onTrackShipment, 
  onClearSelection, 
  onFitAll, 
  onStyleChange, 
  onViewModeChange,
  onWeatherChange 
}: MapControlsProps) {
  const [trackingInput, setTrackingInput] = useState('')
  const [isTracking, setIsTracking] = useState(false)

  const handleTrack = () => {
    if (trackingInput.trim() && onTrackShipment) {
      setIsTracking(true)
      onTrackShipment(trackingInput.trim())
      setTimeout(() => setIsTracking(false), 1000)
    }
  }

  return (
    <div className="space-y-2">
      {/* Quick Stats */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs h-6">
          <Truck className="h-3 w-3 mr-1" />
          Real-time Tracking
        </Badge>
        <Badge variant="outline" className="text-xs h-6">
          <Route className="h-3 w-3 mr-1" />
          Route Planning
        </Badge>
        
        {/* Weather Dropdown */}
        <Select onValueChange={onWeatherChange}>
          <SelectTrigger className="w-24 h-6 text-xs">
            <SelectValue placeholder="Weather" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="precipitation">Rain</SelectItem>
            <SelectItem value="temperature">Temperature</SelectItem>
            <SelectItem value="clouds">Clouds</SelectItem>
            <SelectItem value="wind">Wind</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Controls Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Tracking Input */}
        <div className="col-span-2">
          <div className="flex gap-1">
            <Input
              placeholder="Track shipment..."
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="h-7 text-xs"
              onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
            />
            <Button
              size="sm"
              onClick={handleTrack}
              disabled={isTracking || !trackingInput.trim()}
              className="h-7 px-2"
            >
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewModeChange?.('2d')}
            className="h-7 px-2 text-xs"
          >
            2D
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewModeChange?.('3d')}
            className="h-7 px-2 text-xs"
          >
            3D
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onClearSelection}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onFitAll}
            className="h-6 px-2 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Fit All
          </Button>
        </div>

        {/* Map Style Selector */}
        <Select onValueChange={onStyleChange}>
          <SelectTrigger className="w-20 h-6 text-xs">
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mapbox://styles/mapbox/dark-v11">Dark</SelectItem>
            <SelectItem value="mapbox://styles/mapbox/satellite-streets-v12">Satellite</SelectItem>
            <SelectItem value="mapbox://styles/mapbox/standard-v11">Standard</SelectItem>
            <SelectItem value="mapbox://styles/mapbox/light-v10">Light</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}
