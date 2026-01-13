'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';
import { resolvePlanningExceptionAction } from '@/app/actions/planning-actions';

interface PlanningException {
    id: string;
    type: string;
    severity: string;
    description: string;
    recommendation: string;
    status: 'OPEN' | 'RESOLVED';
    itemId?: string;
    item?: {
        sku: string;
        name: string;
    };
}

export function PlanningExceptionList({ exceptions }: { exceptions: PlanningException[] }) {
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const handleResolve = async (id: string) => {
        setResolvingId(id);
        try {
            const res = await resolvePlanningExceptionAction(id);
            if (res.success) {
                // In a real app, we'd trigger a parent refresh or use useOptimistic
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setResolvingId(null);
        }
    };

    if (exceptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <ShieldCheck size={32} className="mb-2 text-emerald-500" />
                <p className="text-xs italic">No exceptions detected in latest plan.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {exceptions.map((ex) => (
                <div
                    key={ex.id}
                    className={`
                        p-3 rounded border transition-all duration-300
                        ${ex.status === 'RESOLVED' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' :
                            ex.severity === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20' :
                                'bg-amber-500/5 border-amber-500/20'}
                    `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            {ex.status === 'RESOLVED' ? (
                                <ShieldCheck size={14} className="text-emerald-500" />
                            ) : (
                                <AlertTriangle size={14} className={ex.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'} />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                {ex.type.replace('_', ' ')}
                            </span>
                        </div>
                        {ex.status === 'RESOLVED' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                                Resolved
                            </span>
                        )}
                    </div>

                    <div className="mb-3">
                        <p className={`text-xs font-medium mb-1 ${ex.status === 'RESOLVED' ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                            {ex.item ? `${ex.item.sku} - ` : ''}{ex.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 italic">
                            <Info size={10} />
                            {ex.recommendation}
                        </div>
                    </div>

                    {ex.status === 'OPEN' && (
                        <button
                            onClick={() => handleResolve(ex.id)}
                            disabled={resolvingId === ex.id}
                            className={`
                                w-full py-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                ${ex.severity === 'CRITICAL' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-amber-600 text-white hover:bg-amber-500'}
                            `}
                        >
                            {resolvingId === ex.id ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <>Resolve Now <ArrowRight size={12} /></>
                            )}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
