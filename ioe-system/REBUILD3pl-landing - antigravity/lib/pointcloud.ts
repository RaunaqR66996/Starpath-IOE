export interface PointData {
  x: number
  y: number
  z: number
  r: number
  g: number
  b: number
  intensity: number
  distance: number
  timestamp: number
}

export interface PointCloudConfig {
  maxPoints: number
  decayTime: number
  chunkSize: number
}

export class PointCloudManager {
  private points: PointData[] = []
  private maxPoints: number
  private decayTime: number
  private chunkSize: number
  private nextIndex = 0

  constructor(config: PointCloudConfig) {
    this.maxPoints = config.maxPoints
    this.decayTime = config.decayTime
    this.chunkSize = config.chunkSize
  }

  addPoint(point: Omit<PointData, 'timestamp'>): void {
    const timestamp = Date.now()
    
    if (this.points.length < this.maxPoints) {
      this.points.push({ ...point, timestamp })
    } else {
      // Ring buffer: overwrite oldest points
      const index = this.nextIndex % this.maxPoints
      this.points[index] = { ...point, timestamp }
      this.nextIndex++
    }
  }

  update(deltaTime: number): void {
    const currentTime = Date.now()
    
    // Remove expired points
    this.points = this.points.filter(point => {
      const age = (currentTime - point.timestamp) / 1000
      return age < this.decayTime
    })
  }

  getPoints(): PointData[] {
    return [...this.points]
  }

  getPointCount(): number {
    return this.points.length
  }

  clear(): void {
    this.points = []
    this.nextIndex = 0
  }

  getBufferData(): {
    positions: Float32Array
    colors: Float32Array
    count: number
  } {
    const count = this.points.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const point = this.points[i]
      const index = i * 3
      
      positions[index] = point.x
      positions[index + 1] = point.y
      positions[index + 2] = point.z
      
      colors[index] = point.r
      colors[index + 1] = point.g
      colors[index + 2] = point.b
    }

    return { positions, colors, count }
  }
}

// Color mapping utilities
export function distanceToColor(distance: number, maxDistance: number): { r: number; g: number; b: number } {
  const normalized = Math.min(distance / maxDistance, 1)
  
  // HSL to RGB conversion for smooth color transitions
  const hue = (1 - normalized) * 240 // Blue (0) to Red (240)
  const saturation = 0.8
  const lightness = 0.5
  
  return hslToRgb(hue, saturation, lightness)
}

export function intensityToColor(intensity: number): { r: number; g: number; b: number } {
  // Grayscale based on intensity
  const gray = Math.max(0, Math.min(1, intensity))
  return { r: gray, g: gray, b: gray }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  const a = s * Math.min(l, 1 - l)
  
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  
  return {
    r: f(0),
    g: f(8),
    b: f(4)
  }
}

// Export utilities
export function exportToPLY(points: PointData[]): string {
  let ply = `ply
format ascii 1.0
element vertex ${points.length}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
`

  for (const point of points) {
    const r = Math.round(point.r * 255)
    const g = Math.round(point.g * 255)
    const b = Math.round(point.b * 255)
    ply += `${point.x.toFixed(6)} ${point.y.toFixed(6)} ${point.z.toFixed(6)} ${r} ${g} ${b}\n`
  }

  return ply
}

export function downloadPLY(filename: string, plyData: string): void {
  const blob = new Blob([plyData], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
