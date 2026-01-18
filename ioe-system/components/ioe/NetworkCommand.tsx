"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NetworkNode, NetworkLink, NodeType } from "@/lib/network-types";
import { Maximize2, RefreshCw, AlertTriangle, Activity } from "lucide-react";

// --- Mock Data Generator (To be replaced by Real Graph API) ---
const generateMockGraph = (): { nodes: NetworkNode[], links: NetworkLink[] } => {
    const nodes: NetworkNode[] = [
        // Information Node (The Brain)
        { id: 'sat-1', label: 'SatCom Net A', type: 'INFORMATION', status: 'OPTIMAL', lat: 0, lng: 0 },

        // Infrastructure (Our Warehouses)
        { id: 'wh-1', label: 'Kuehne Nagel East', type: 'INFRASTRUCTURE', status: 'OPTIMAL', lat: 40, lng: -74 },
        { id: 'wh-2', label: 'Austin Hub', type: 'INFRASTRUCTURE', status: 'WARNING', lat: 30, lng: -97 },

        // Economic (Suppliers/Customers)
        { id: 'supp-1', label: 'Resin Supplier', type: 'ECONOMIC', status: 'OPTIMAL' },
        { id: 'cust-1', label: 'Macy\'s Retail', type: 'ECONOMIC', status: 'OPTIMAL' },

        // Social / Political
        { id: 'port-union', label: 'East Coast Port Union', type: 'SOCIAL', status: 'CRITICAL' }, // Strike risk!
        { id: 'reg-body', label: 'FDA Compliance', type: 'POLITICAL', status: 'OPTIMAL' },
    ];

    const links: NetworkLink[] = [
        { source: 'supp-1', target: 'wh-1', type: 'PHYSICAL', throughput: 100, isActive: true },
        { source: 'wh-1', target: 'cust-1', type: 'PHYSICAL', throughput: 100, isActive: true },
        { source: 'sat-1', target: 'wh-1', type: 'INFORMATION', throughput: 90, isActive: true },
        { source: 'port-union', target: 'supp-1', type: 'DEPENDENCY', throughput: 20, isActive: true }, // Strike affecting supply!
        { source: 'reg-body', target: 'wh-2', type: 'DEPENDENCY', throughput: 100, isActive: true },
    ];

    return { nodes, links };
};

export function NetworkCommand() {
    const [graph, setGraph] = useState(generateMockGraph());
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

    // --- Force Directed Layout Simulation ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let t = 0;

        const render = () => {
            t += 0.01;

            // Auto-resize
            canvas.width = canvas.parentElement?.clientWidth || 800;
            canvas.height = canvas.parentElement?.clientHeight || 600;
            const w = canvas.width;
            const h = canvas.height;

            // Clear
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, w, h);

            // Draw Grid
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            for (let i = 0; i < w; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
            for (let i = 0; i < h; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

            // Draw Links
            graph.links.forEach(link => {
                const src = graph.nodes.find(n => n.id === link.source);
                const tgt = graph.nodes.find(n => n.id === link.target);
                if (!src || !tgt) return;

                // Simple mock positions (in real app, use d3-force)
                // We'll just map IDs to fixed random-ish positions for the prototype
                const getPos = (id: string) => {
                    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
                    return {
                        x: (seed * 123) % (w - 100) + 50,
                        y: (seed * 321) % (h - 100) + 50
                    };
                };

                const p1 = getPos(src.id);
                const p2 = getPos(tgt.id);

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                // Color by Link Type
                ctx.strokeStyle = link.type === 'DEPENDENCY' ? '#ef4444' :
                    link.type === 'INFORMATION' ? '#0ea5e9' : '#10b981';

                ctx.lineWidth = link.source === 'port-union' ? 3 : 1; // Highlight the risk
                if (link.throughput < 50) {
                    ctx.setLineDash([5, 5]); // Broken link
                } else {
                    ctx.setLineDash([]);
                }
                ctx.stroke();
            });

            // Draw Nodes
            graph.nodes.forEach(node => {
                const getPos = (id: string) => {
                    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
                    return {
                        x: (seed * 123) % (w - 100) + 50,
                        y: (seed * 321) % (h - 100) + 50
                    };
                };
                const p = getPos(node.id);

                // Halo
                if (node.status === 'CRITICAL') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 15 + Math.sin(t * 5) * 5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
                    ctx.fill();
                }

                // Node Body
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = getNodeColor(node.type);
                ctx.fill();

                // Label
                ctx.fillStyle = '#aaa';
                ctx.font = '10px monospace';
                ctx.fillText(node.label, p.x + 12, p.y + 4);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [graph]);

    return (
        <div className="flex flex-col h-full bg-black text-white relative">
            {/* Header */}
            <div className="h-12 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-900/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold tracking-widest text-sm">NETWORK COMMAND</span>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-neutral-800 rounded bg-neutral-900 border border-neutral-800 text-xs">
                        Force View
                    </button>
                    <button className="p-2 hover:bg-neutral-800 rounded bg-neutral-900 border border-neutral-800 text-xs text-red-400 border-red-900/30">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Show Risks
                    </button>
                </div>
            </div>

            {/* Main Graph Canvas */}
            <div className="flex-1 relative overflow-hidden">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {/* Floating HUD */}
                <div className="absolute top-4 left-4 p-4 bg-black/80 border border-neutral-800 rounded w-64 backdrop-blur">
                    <h3 className="text-xs font-bold text-neutral-400 mb-2 uppercase">Operational Environment</h3>
                    <div className="flex flex-col gap-2 shadow-inner">
                        <div className="flex justify-between text-xs">
                            <span>Nodes Online</span>
                            <span className="text-emerald-400">7/7</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span>Link Stability</span>
                            <span className="text-amber-400">82%</span>
                        </div>
                        <div className="mt-2 text-[10px] text-red-400 border-l-2 border-red-500 pl-2">
                            ALERT: Social Disturbance detected at 'East Coast Port Union'. Dependent supply lines degraded by 80%.
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function getNodeColor(type: NodeType): string {
    switch (type) {
        case 'INFRASTRUCTURE': return '#10b981'; // Emerald
        case 'ECONOMIC': return '#f59e0b'; // Amber
        case 'INFORMATION': return '#3b82f6'; // Blue
        case 'SOCIAL': return '#ec4899'; // Pink
        case 'POLITICAL': return '#8b5cf6'; // Violet
        case 'MILITARY': return '#ef4444'; // Red
        default: return '#ccc';
    }
}
