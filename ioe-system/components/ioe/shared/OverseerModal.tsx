"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverseerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string) => void;
    title?: string;
    description?: string;
    originalValue?: string;
    newValue?: string;
}

export function OverseerModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Overseer Override",
    description = "You are about to force a change to the system state. This action will be logged.",
    originalValue,
    newValue
}: OverseerModalProps) {
    const [comment, setComment] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[450px] overflow-hidden rounded-lg border border-red-900/50 bg-black shadow-2xl shadow-red-900/20">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-red-900/30 bg-red-950/20 px-4 py-3">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <h2 className="font-mono text-sm font-bold text-red-500 tracking-wider uppercase">
                        {title}
                    </h2>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    <div className="flex gap-3 rounded bg-red-950/10 p-3 border border-red-900/20">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-200/80 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {(originalValue || newValue) && (
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            <div className="space-y-1">
                                <span className="text-neutral-500 uppercase">Original</span>
                                <div className="rounded bg-neutral-900 border border-neutral-800 px-2 py-1.5 text-neutral-400">
                                    {originalValue || "N/A"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-red-500 uppercase">Override</span>
                                <div className="rounded bg-red-950/30 border border-red-900/50 px-2 py-1.5 text-white">
                                    {newValue || "N/A"}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-neutral-400">
                            Reason for Override <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Describe the problem or reason for this forced change..."
                            className="w-full h-24 rounded bg-neutral-900 border border-neutral-800 p-3 text-sm text-white placeholder:text-neutral-600 focus:border-red-500 focus:outline-none resize-none"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-neutral-800 bg-neutral-900/50 px-4 py-3">
                    <button
                        onClick={onClose}
                        className="rounded px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (comment.trim()) {
                                onConfirm(comment);
                                setComment("");
                            }
                        }}
                        disabled={!comment.trim()}
                        className="flex items-center gap-2 rounded bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-900/20"
                    >
                        CONFIRM OVERRIDE
                    </button>
                </div>
            </div>
        </div>
    );
}
