"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Plane, Text } from "@react-three/drei";
import * as THREE from "three";

// --- Types ---
type Crate = {
    id: string;
    position: [number, number, number];
    size: [number, number, number];
    color: string;
};

// --- Components ---

const Forklift = ({ targetPos }: { targetPos: [number, number, number] }) => {
    const ref = useRef<THREE.Group>(null);
    const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);

    useFrame((state, delta) => {
        if (!ref.current) return;

        // Simple lerp movement
        const speed = 2;
        const current = new THREE.Vector3(...position);
        const target = new THREE.Vector3(...targetPos);

        if (current.distanceTo(target) > 0.1) {
            const dir = target.clone().sub(current).normalize();
            const move = dir.multiplyScalar(speed * delta);
            const newPos = current.add(move);
            setPosition([newPos.x, newPos.y, newPos.z]);
            ref.current.position.set(newPos.x, newPos.y, newPos.z);
            ref.current.lookAt(target.x, ref.current.position.y, target.z);
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Body */}
            <Box args={[1, 1, 2]} position={[0, 0.5, 0]}>
                <meshStandardMaterial color="orange" />
            </Box>
            {/* Forks */}
            <Box args={[0.8, 0.1, 1]} position={[0, 0.1, 1.5]}>
                <meshStandardMaterial color="gray" />
            </Box>
        </group>
    );
};

const CrateItem = ({ position, size, color }: Crate) => {
    return (
        <Box args={size} position={position}>
            <meshStandardMaterial color={color} />
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
                <lineBasicMaterial color="black" />
            </lineSegments>
        </Box>
    );
};

const Floor = () => {
    return (
        <Plane args={[20, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#333" />
        </Plane>
    );
};

// --- Main Scene ---

export default function SimulationScene() {
    const [crates, setCrates] = useState<Crate[]>([]);
    const [forkliftTarget, setForkliftTarget] = useState<[number, number, number]>([0, 0, 0]);

    // Simulate "Load Optimization" logic
    const runOptimization = () => {
        const newCrates: Crate[] = [];
        const containerOrigin = [5, 0.5, -5];

        // Generate some random crates
        for (let i = 0; i < 10; i++) {
            const size: [number, number, number] = [1, 1, 1];
            // Simple stacking logic
            const x = containerOrigin[0] + (i % 2) * 1.1;
            const z = containerOrigin[2] + Math.floor(i / 2) * 1.1;
            const y = size[1] / 2;

            newCrates.push({
                id: `crate-${i}`,
                position: [x, y, z],
                size: size,
                color: `hsl(${Math.random() * 360}, 50%, 50%)`
            });
        }
        setCrates(newCrates);
        setForkliftTarget([5, 0, -2]); // Move forklift near container
    };

    return (
        <div className="w-full h-screen bg-gray-900 flex flex-col">
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center z-10">
                <h1 className="text-xl font-bold">Forklift Load Optimizer Simulation</h1>
                <button
                    onClick={runOptimization}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
                >
                    Run Optimization
                </button>
            </div>

            <div className="flex-grow relative">
                <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

                    <Floor />
                    <Forklift targetPos={forkliftTarget} />

                    {crates.map((crate) => (
                        <CrateItem key={crate.id} {...crate} />
                    ))}

                    <OrbitControls />
                    <gridHelper args={[20, 20]} />
                </Canvas>
            </div>
        </div>
    );
}
