"use client"

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

interface CameraCaptureProps {
  onCameraReady: (camera: THREE.Camera) => void
}

export function CameraCapture({ onCameraReady }: CameraCaptureProps) {
  const { camera } = useThree()
  
  useEffect(() => {
    if (camera) {
      onCameraReady(camera)
    }
  }, [camera, onCameraReady])
  
  return null
}









