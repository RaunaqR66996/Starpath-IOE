"use client";

import React, { useMemo } from "react";
import { NodeStatus, TopologyLink } from "@/app/actions/ops-command";
import { cn } from "@/lib/utils";
import { Warehouse, Store, Building2, Truck, Package } from "lucide-react";

interface TopologyGraphProps {
    nodes: NodeStatus[];
    links: TopologyLink[];
}

export function TopologyGraph({ nodes, links }: TopologyGraphProps) {
    // 1. Calculate Layout Positions
    const layout = useMemo(() => {
        const width = 800;
        const height = 500;
        const padding = 60;

        // Group by Type to determine Y
        const getRow = (type: string) => {
            switch (type) {
                case 'HUB': return 1;
                case 'WAREHOUSE': return 2;
                case 'STORE': case 'CUSTOMER': return 3;
                default: return 0;
            }
        }

        const typeGroups: Record<number, NodeStatus[]> = {};
        nodes.forEach(n => {
            const r = getRow(n.type);
            if (!typeGroups[r]) typeGroups[r] = [];
            typeGroups[r].push(n);
        });

        const nodePos = new Map<string, { x: number, y: number }>();

        Object.entries(typeGroups).forEach(([rowStr, rowNodes]) => {
            const row = parseInt(rowStr);
            const count = rowNodes.length;
            const y = (height / 4) * row + padding; // Distribute vertically

            rowNodes.forEach((node, i) => {
                // Distribute horizontally
                // Normalize longitude if we wanted geographic relative, but simpler to just spread evenly
                const x = (width / (count + 1)) * (i + 1);
                nodePos.set(node.id, { x, y });
            });
        });

        // Add 'Unknown' nodes for sources/targets not in node list?
        // For now, simplify and filter valid links only
        return { nodePos, width, height };
    }, [nodes]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
            <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                className="w-full h-full max-w-4xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-black to-black"
                style={{ filter: 'drop-shadow(0 0 40px rgba(52,211,153,0.1))' }}
            >
                {/* Definitions for Gr gradients/markers */}
                <defs>
                    <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#34d399" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                    </linearGradient>
                    <radialGradient id="nodeGlow">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </radialGradient>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#34d399" fillOpacity="0.8" />
                    </marker>
                    {/* Grid Pattern */}
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="0.5" strokeOpacity="0.3" />
                    </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />

                {/* 2. Render Links */}
                {links.map((link, i) => {
                    const src = layout.nodePos.get(link.source);
                    const tgt = layout.nodePos.get(link.target);

                    if (!src || !tgt) return null;

                    const isActive = link.status === 'ACTIVE';

                    return (
                        <g key={`${link.source}-${link.target}`}>
                            {/* Base Line */}
                            <path
                                d={`M ${src.x} ${src.y} C ${src.x} ${(src.y + tgt.y) / 2}, ${tgt.x} ${(src.y + tgt.y) / 2}, ${tgt.x} ${tgt.y}`}
                                fill="none"
                                stroke={isActive ? "url(#linkGradient)" : "#333"}
                                strokeWidth={isActive ? 2.5 : 1}
                                strokeDasharray={isActive ? "none" : "4 4"}
                                markerEnd={isActive ? "url(#arrowhead)" : ""}
                                className={isActive ? "animate-pulse" : ""}
                            />

                            {/* Animated Particle for Active Links */}
                            {isActive && (
                                <circle r="3" fill="#00f3ff">
                                    <animateMotion
                                        dur={`${2.5 - Math.min(2, link.value * 0.1)}s`}
                                        repeatCount="indefinite"
                                        path={`M ${src.x} ${src.y} C ${src.x} ${(src.y + tgt.y) / 2}, ${tgt.x} ${(src.y + tgt.y) / 2}, ${tgt.x} ${tgt.y}`}
                                    />
                                    <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
                                </circle>
                            )}

                            {/* Label */}
                            <text
                                x={(src.x + tgt.x) / 2}
                                y={(src.y + tgt.y) / 2}
                                fill="#a3a3a3"
                                fontSize="10"
                                textAnchor="middle"
                                dy="-8"
                                className="font-mono"
                            >
                                {isActive && (
                                    <>
                                        <tspan fill="#34d399">▲</tspan>
                                        <tspan dx="2">{link.value} SHP</tspan>
                                    </>
                                )}
                            </text>
                        </g>
                    );
                })}

                {/* 3. Render Nodes */}
                {nodes.map(node => {
                    const pos = layout.nodePos.get(node.id);
                    if (!pos) return null;

                    const Icon = node.type === 'WAREHOUSE' ? Warehouse :
                        node.type === 'HUB' ? Building2 :
                            node.type === 'CUSTOMER' ? Store : Package;

                    const color = node.status === 'CRITICAL' ? '#ef4444' :
                        node.status === 'BUSY' ? '#eab308' : '#34d399';

                    return (
                        <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                            {/* Outer Glow Ring */}
                            <circle r="35" fill="url(#nodeGlow)" opacity="0.2" className="animate-[pulse_3s_infinite]" />
                            <circle r="30" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 2" className="animate-[spin_10s_linear_infinite]" opacity="0.4" />

                            {/* Inner Glow */}
                            <circle r="25" fill={color} fillOpacity="0.15" />

                            {/* Circle Base */}
                            <circle r="18" fill="#000" stroke={color} strokeWidth="2" />

                            <foreignObject x="-10" y="-10" width="20" height="20">
                                <div className="flex items-center justify-center w-full h-full text-white">
                                    <Icon size={12} color={color} />
                                </div>
                            </foreignObject>

                            {/* Label */}
                            <text y="30" fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">
                                {node.name}
                            </text>
                            <text y="42" fill="#666" fontSize="8" textAnchor="middle">
                                {node.loadPct}% Load
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend / Overlay */}
            <div className="absolute top-4 left-4 p-3 rounded-lg border border-white/10 bg-black/80 backdrop-blur text-[10px] text-neutral-400 font-mono shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="mb-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    Network Topography
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500/20 shadow-[0_0_5px_theme(colors.emerald.500)]" /> Healthy</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-yellow-500 bg-yellow-500/20 shadow-[0_0_5px_theme(colors.yellow.500)]" /> Busy</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-red-500 bg-red-500/20 shadow-[0_0_5px_theme(colors.red.500)]" /> Critical</div>
                </div>
            </div>
        </div>
    );
}
