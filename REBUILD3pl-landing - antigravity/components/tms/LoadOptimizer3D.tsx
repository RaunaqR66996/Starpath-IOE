'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Eye,
  Grid3x3,
  Truck
} from 'lucide-react';

interface Vehicle {
  length: number;
  width: number;
  height: number;
}

interface PlacedItem {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  color?: string;
  fragile?: boolean;
  stackable?: boolean;
}

interface LoadOptimizer3DProps {
  vehicle: Vehicle;
  placedItems: PlacedItem[];
}

export function LoadOptimizer3D({ vehicle, placedItems }: LoadOptimizer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 20, y: 30 });
  const [zoom, setZoom] = useState(0.8);
  const [viewMode, setViewMode] = useState<'perspective' | 'top' | 'side' | 'front'>('perspective');
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw scene
    drawScene(ctx, canvas.offsetWidth, canvas.offsetHeight);
  }, [vehicle, placedItems, rotation, zoom, viewMode, showGrid, hoveredItem]);

  const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / (Math.max(vehicle.length, vehicle.width, vehicle.height) * 2.2) * zoom;

    // Apply rotation for perspective view
    const rx = (rotation.x * Math.PI) / 180;
    const ry = (rotation.y * Math.PI) / 180;

    // Helper function to project 3D to 2D
    const project = (x: number, y: number, z: number) => {
      let px = x;
      let py = y;
      let pz = z;

      if (viewMode === 'perspective') {
        // Rotation around Y axis
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);
        const tempX = px * cosY - pz * sinY;
        pz = px * sinY + pz * cosY;
        px = tempX;

        // Rotation around X axis
        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        const tempY = py * cosX - pz * sinX;
        pz = py * sinX + pz * cosX;
        py = tempY;
      } else if (viewMode === 'top') {
        // Top view (looking down)
        py = -z;
      } else if (viewMode === 'side') {
        // Side view
        px = z;
      } else if (viewMode === 'front') {
        // Front view
        pz = 0;
      }

      return {
        x: centerX + px * scale,
        y: centerY - py * scale,
        z: pz
      };
    };

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      
      const gridSize = Math.max(vehicle.length, vehicle.width) / 10;
      for (let i = -vehicle.length; i <= vehicle.length; i += gridSize) {
        const p1 = project(i, 0, -vehicle.width / 2);
        const p2 = project(i, 0, vehicle.width / 2);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      
      for (let i = -vehicle.width; i <= vehicle.width; i += gridSize) {
        const p1 = project(-vehicle.length / 2, 0, i);
        const p2 = project(vehicle.length / 2, 0, i);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Draw vehicle container floor (filled)
    const floorCorners = [
      [0, 0, 0],
      [vehicle.length, 0, 0],
      [vehicle.length, vehicle.width, 0],
      [0, vehicle.width, 0]
    ];
    
    const projectedFloor = floorCorners.map(([x, y, z]) => project(x, z, y));
    
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.moveTo(projectedFloor[0].x, projectedFloor[0].y);
    projectedFloor.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    
    // Draw vehicle container (wireframe with thicker lines)
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    
    const corners = [
      [0, 0, 0],
      [vehicle.length, 0, 0],
      [vehicle.length, vehicle.width, 0],
      [0, vehicle.width, 0],
      [0, 0, vehicle.height],
      [vehicle.length, 0, vehicle.height],
      [vehicle.length, vehicle.width, vehicle.height],
      [0, vehicle.width, vehicle.height]
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom
      [4, 5], [5, 6], [6, 7], [7, 4], // Top
      [0, 4], [1, 5], [2, 6], [3, 7]  // Vertical
    ];

    edges.forEach(([i, j]) => {
      const p1 = project(corners[i][0], corners[i][2], corners[i][1]);
      const p2 = project(corners[j][0], corners[j][2], corners[j][1]);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    
    // Draw semi-transparent walls for better depth perception
    ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
    
    // Back wall
    const backWall = [
      project(0, 0, vehicle.width),
      project(vehicle.length, 0, vehicle.width),
      project(vehicle.length, vehicle.height, vehicle.width),
      project(0, vehicle.height, vehicle.width)
    ];
    ctx.beginPath();
    ctx.moveTo(backWall[0].x, backWall[0].y);
    backWall.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Right wall
    const rightWall = [
      project(vehicle.length, 0, 0),
      project(vehicle.length, 0, vehicle.width),
      project(vehicle.length, vehicle.height, vehicle.width),
      project(vehicle.length, vehicle.height, 0)
    ];
    ctx.beginPath();
    ctx.moveTo(rightWall[0].x, rightWall[0].y);
    rightWall.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw placed items
    const itemsWithDepth = placedItems.map(item => {
      const centerZ = item.y + item.width / 2;
      return { ...item, centerZ };
    });

    // Sort items by depth for proper rendering
    itemsWithDepth.sort((a, b) => a.centerZ - b.centerZ);

    itemsWithDepth.forEach(item => {
      const isHovered = hoveredItem === item.id;
      
      // Draw box
      const boxCorners = [
        [item.x, item.y, item.z],
        [item.x + item.length, item.y, item.z],
        [item.x + item.length, item.y + item.width, item.z],
        [item.x, item.y + item.width, item.z],
        [item.x, item.y, item.z + item.height],
        [item.x + item.length, item.y, item.z + item.height],
        [item.x + item.length, item.y + item.width, item.z + item.height],
        [item.x, item.y + item.width, item.z + item.height]
      ];

      const projectedCorners = boxCorners.map(([x, y, z]) => project(x, z, y));

      // Draw faces with shading
      const faces = [
        [0, 1, 2, 3], // Bottom
        [4, 5, 6, 7], // Top
        [0, 1, 5, 4], // Front
        [2, 3, 7, 6], // Back
        [0, 3, 7, 4], // Left
        [1, 2, 6, 5]  // Right
      ];

      const faceColors = [
        0.6, // Bottom - darker
        1.0, // Top - brightest
        0.8, // Front
        0.7, // Back
        0.75, // Left
        0.85  // Right
      ];

      faces.forEach((face, faceIndex) => {
        ctx.fillStyle = adjustBrightness(item.color || '#3b82f6', faceColors[faceIndex]);
        ctx.strokeStyle = isHovered ? '#000000' : '#ffffff';
        ctx.lineWidth = isHovered ? 2 : 1;
        
        ctx.beginPath();
        ctx.moveTo(projectedCorners[face[0]].x, projectedCorners[face[0]].y);
        face.forEach(i => {
          ctx.lineTo(projectedCorners[i].x, projectedCorners[i].y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // Draw label if hovered
      if (isHovered) {
        const labelPos = project(
          item.x + item.length / 2,
          item.z + item.height,
          item.y + item.width / 2
        );
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '12px sans-serif';
        const textWidth = ctx.measureText(item.name).width;
        ctx.fillRect(labelPos.x - textWidth / 2 - 4, labelPos.y - 20, textWidth + 8, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, labelPos.x, labelPos.y - 6);
      }

      // Draw fragile icon if item is fragile
      if (item.fragile) {
        const iconPos = project(
          item.x + item.length / 2,
          item.z + item.height + 0.1,
          item.y + item.width / 2
        );
        
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', iconPos.x, iconPos.y);
      }
    });

    // Draw dimensions
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    
    // Title at top
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Container/Trailer View', width / 2, 30);
    
    // Dimensions
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    
    const dimX = project(vehicle.length / 2, 0, -0.5);
    ctx.fillText(`Length: ${vehicle.length.toFixed(2)}m`, dimX.x, dimX.y);
    
    const dimY = project(-0.5, 0, vehicle.width / 2);
    ctx.fillText(`Width: ${vehicle.width.toFixed(2)}m`, dimY.x, dimY.y);
    
    const dimZ = project(-0.5, vehicle.height / 2, -0.5);
    ctx.fillText(`Height: ${vehicle.height.toFixed(2)}m`, dimZ.x, dimZ.y);
  };

  const adjustBrightness = (color: string, factor: number) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * factor));
    const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * factor));
    const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * factor));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleRotate = () => {
    setRotation(prev => ({ x: prev.x, y: prev.y + 15 }));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetView = () => {
    setRotation({ x: 30, y: 45 });
    setZoom(1);
    setViewMode('perspective');
  };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 backdrop-blur"
          onClick={handleRotate}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 backdrop-blur"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 backdrop-blur"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 backdrop-blur"
          onClick={() => setShowGrid(!showGrid)}
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white/90 backdrop-blur"
          onClick={resetView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
          </div>

      {/* View Mode Selector */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {(['perspective', 'top', 'side', 'front'] as const).map(mode => (
          <Button
            key={mode}
            size="sm"
            variant={viewMode === mode ? 'default' : 'secondary'}
            className={viewMode === mode ? '' : 'bg-white/90 backdrop-blur'}
            onClick={() => setViewMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
              ))}
            </div>

      {/* Stats Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur rounded-lg p-4 text-sm border-2 border-blue-500 shadow-lg">
        <div className="font-bold mb-2 text-blue-900 flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Container/Trailer
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Items Loaded:</span>
            <span className="font-semibold">{placedItems.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Size:</span>
            <span className="font-semibold">{vehicle.length}m × {vehicle.width}m × {vehicle.height}m</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Volume:</span>
            <span className="font-semibold">{(vehicle.length * vehicle.width * vehicle.height).toFixed(2)} m³</span>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-900/90 backdrop-blur rounded-lg px-4 py-2 text-white text-sm">
        🚛 Interactive 3D View - Use controls to rotate and zoom
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg cursor-move"
        onMouseMove={(e) => {
          // Simple hover detection (can be improved)
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Check if hovering over any item (simplified)
          // In production, you'd want more accurate hit detection
        }}
      />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {placedItems.slice(0, 10).map(item => (
          <div
            key={item.id}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{item.name}</span>
            {item.fragile && <span className="text-xs">⚠️</span>}
            </div>
        ))}
            </div>
          </div>
  );
}

