import React from "react";
import { ChevronRight, ChevronDown, FileText, FolderOpen, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
    type?: "folder" | "file" | "sheet";
}

interface PlanningNavigatorProps {
    selectedNode: string | null;
    onSelectNode: (nodeId: string) => void;
}

const PLANNING_TREE: TreeNode[] = [
    {
        id: "inventory",
        label: "Inventory Planning",
        children: [
            { id: "inventory-replenishment", label: "Replenishment", type: "file" },
            { id: "inventory-safety-stock", label: "Safety Stock", type: "file" }
        ]
    },
    {
        id: "warehouse-planning",
        label: "Warehouse Planning",
        children: [
            { id: "warehouse-wave-planning", label: "Wave Planning", type: "file" },
            { id: "warehouse-slotting", label: "Slotting", type: "file" }
        ]
    },
    {
        id: "load-planning",
        label: "Load Planning",
        children: [
            { id: "load-builder", label: "Load Builder", type: "file" },
            { id: "load-optimizer", label: "Live Load Optimizer", type: "file" }
        ]
    },
    {
        id: "mrp",
        label: "Supply Planning",
        children: [
            { id: "mrp-run", label: "MRP Run (Net Req)", type: "file" }
        ]
    }
];

function TreeItem({
    node,
    level = 0,
    selectedNode,
    onSelectNode,
    expandedNodes,
    toggleExpanded
}: {
    node: TreeNode;
    level?: number;
    selectedNode: string | null;
    onSelectNode: (id: string) => void;
    expandedNodes: Set<string>;
    toggleExpanded: (id: string) => void;
}) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;

    const handleClick = () => {
        if (hasChildren) {
            toggleExpanded(node.id);
        } else {
            onSelectNode(node.id);
        }
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={cn(
                    "flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer hover:bg-neutral-800/50",
                    isSelected && "bg-neutral-800 text-white"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {hasChildren ? (
                    isExpanded ? (
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    )
                ) : (
                    <span className="w-3" />
                )}
                {node.type === "file" && <FileText className="h-3 w-3 flex-shrink-0 text-neutral-500" />}
                {node.type === "folder" && <Folder className="h-3 w-3 flex-shrink-0 text-neutral-500" />}
                {!node.type && hasChildren && (
                    isExpanded ?
                        <FolderOpen className="h-3 w-3 flex-shrink-0 text-neutral-500" /> :
                        <Folder className="h-3 w-3 flex-shrink-0 text-neutral-500" />
                )}
                <span className="truncate">{node.label}</span>
            </div>
            {hasChildren && isExpanded && node.children?.map(child => (
                <TreeItem
                    key={child.id}
                    node={child}
                    level={level + 1}
                    selectedNode={selectedNode}
                    onSelectNode={onSelectNode}
                    expandedNodes={expandedNodes}
                    toggleExpanded={toggleExpanded}
                />
            ))}
        </>
    );
}

export function PlanningNavigator({ selectedNode, onSelectNode }: PlanningNavigatorProps) {
    const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());

    const toggleExpanded = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    return (
        <div className="flex h-full flex-col bg-neutral-950/50 border-r border-neutral-800 w-64">
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Planning</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
                {PLANNING_TREE.map(node => (
                    <TreeItem
                        key={node.id}
                        node={node}
                        selectedNode={selectedNode}
                        onSelectNode={onSelectNode}
                        expandedNodes={expandedNodes}
                        toggleExpanded={toggleExpanded}
                    />
                ))}
            </div>
        </div>
    );
}
