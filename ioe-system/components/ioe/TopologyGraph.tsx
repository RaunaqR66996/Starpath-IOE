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
                className="w-full h-full max-w-4xl"
                style={{ filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.1))' }}
            >
                {/* Definitions for Gr gradients/markers */}
                <defs>
                    <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                    </linearGradient>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" fillOpacity="0.5" />
                    </marker>
                </defs>

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
                                strokeWidth={isActive ? 2 : 1}
                                strokeDasharray={isActive ? "none" : "4 4"}
                                markerEnd={isActive ? "url(#arrowhead)" : ""}
                            />

                            {/* Animated Particle for Active Links */}
                            {isActive && (
                                <circle r="3" fill="#60a5fa">
                                    <animateMotion
                                        dur={`${3 - Math.min(2, link.value * 0.1)}s`}
                                        repeatCount="indefinite"
                                        path={`M ${src.x} ${src.y} C ${src.x} ${(src.y + tgt.y) / 2}, ${tgt.x} ${(src.y + tgt.y) / 2}, ${tgt.x} ${tgt.y}`}
                                    />
                                </circle>
                            )}

                            {/* Label */}
                            <text
                                x={(src.x + tgt.x) / 2}
                                y={(src.y + tgt.y) / 2}
                                fill="#666"
                                fontSize="8"
                                textAnchor="middle"
                                dy="-5"
                            >
                                {link.value} SHP
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
                        node.status === 'BUSY' ? '#eab308' : '#10b981';

                    return (
                        <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                            {/* Glow */}
                            <circle r="25" fill={color} fillOpacity="0.1" className="animate-pulse" />

                            {/* Circle Base */}
                            <circle r="18" fill="#000" stroke={color} strokeWidth="2" />

                            {/* Icon - centered via ForeignObject to use Lucide, or standard SVG Text? 
                                Lucide components can't be directly inside SVG unless wrapped in foreignObject.
                                Let's use simple SVG shapes or foreignObject.
                            */}
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
            <div className="absolute top-4 left-4 p-3 rounded-lg border border-white/10 bg-black/50 backdrop-blur text-[10px] text-neutral-400 font-mono">
                <div className="mb-1 font-bold text-white uppercase tracking-wider">Network Topography</div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500/20" /> Healthy</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-yellow-500 bg-yellow-500/20" /> Busy</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-red-500 bg-red-500/20" /> Critical</div>
                </div>
            </div>
        </div>
    );
}
