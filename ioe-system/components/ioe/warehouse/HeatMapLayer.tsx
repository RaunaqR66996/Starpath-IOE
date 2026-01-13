'use client'

import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ZoneMetricData } from '@/app/actions/analytics-actions'

interface HeatMapLayerProps {
    data: ZoneMetricData[]
    metric: 'density' | 'occupancy'
    opacity: number
    visible: boolean
}

// Color scale mapping (from user specification)
const COLOR_SCALE = [
    { val: 0.0, color: new THREE.Color('#00008b') }, // Deep Blue (0-20%)
    { val: 0.2, color: new THREE.Color('#00ffff') }, // Cyan (20-40%)
    { val: 0.4, color: new THREE.Color('#00ff00') }, // Green (40-60%)
    { val: 0.6, color: new THREE.Color('#ffff00') }, // Yellow (60-80%)
    { val: 0.8, color: new THREE.Color('#ff0000') }, // Red (80-100%)
]

function getColorForValue(value: number) {
    for (let i = 0; i < COLOR_SCALE.length - 1; i++) {
        const start = COLOR_SCALE[i]
        const end = COLOR_SCALE[i + 1]
        if (value >= start.val && value <= end.val) {
            const alpha = (value - start.val) / (end.val - start.val)
            return start.color.clone().lerp(end.color, alpha)
        }
    }
    return COLOR_SCALE[COLOR_SCALE.length - 1].color.clone()
}

export function HeatMapLayer({ data, metric, opacity, visible }: HeatMapLayerProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null!)

    // Grid settings should match Warehouse3DScene
    const VOXEL_SIZE = 4

    const transformsAndColors = useMemo(() => {
        if (!data || data.length === 0) return null

        const dummy = new THREE.Object3D()
        const colors = new Float32Array(data.length * 3)

        data.forEach((item, i) => {
            // Parse zoneId "x-z"
            const [xStr, zStr] = item.zoneId.split('-')
            const x = parseFloat(xStr)
            const z = parseFloat(zStr)
            const value = item[metric]

            // Position (center each voxel)
            // Using the same coordinate system as rack bins but aggregated
            dummy.position.set(x * VOXEL_SIZE - 80, 2, z * VOXEL_SIZE - 80)
            dummy.scale.set(VOXEL_SIZE * 0.9, 4, VOXEL_SIZE * 0.9) // Fixed height block
            dummy.updateMatrix()

            if (meshRef.current) {
                meshRef.current.setMatrixAt(i, dummy.matrix)
            }

            const color = getColorForValue(value)
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        })

        return colors
    }, [data, metric])

    useFrame((state) => {
        if (!meshRef.current) return
        // Optional: Pulse opacity based on time for "breathing" effect
        if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
            meshRef.current.material.opacity = opacity * (0.8 + Math.sin(state.clock.elapsedTime) * 0.1)
        }
    })

    if (!visible || !data || data.length === 0) return null

    return (
        <instancedMesh
            ref={meshRef}
            args={[null!, null!, data.length]}
            position={[0, 0, 0]}
        >
            <boxGeometry args={[1, 1, 1]}>
                <instancedBufferAttribute
                    attach="attributes-color"
                    args={[transformsAndColors!, 3]}
                />
            </boxGeometry>
            <meshStandardMaterial
                vertexColors
                transparent
                opacity={opacity}
                emissive="#ffffff"
                emissiveIntensity={0.2}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    )
}
