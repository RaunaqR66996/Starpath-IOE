import React, { useState, useEffect, useTransition } from "react";
import { CheckCircle2, XCircle, Zap, Target, DollarSign, Clock, Loader2, RefreshCw } from "lucide-react";
import { generatePlanningScenarios, executePlanningAction, type AIAction } from "@/app/actions/planning-actions";
import { toast } from "sonner";

export function AIActionQueue({ onActionComplete }: { onActionComplete?: () => void }) {
    const [actions, setActions] = useState<AIAction[]>([]);
    const [isPending, startTransition] = useTransition();
    const [executingId, setExecutingId] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        handleGenerate();
    }, []);

    const handleGenerate = () => {
        startTransition(async () => {
            const newActions = await generatePlanningScenarios();
            setActions(newActions);
        });
    };

    const handleExecute = async (id: string, type: string) => {
        setExecutingId(id);
        try {
            const result = await executePlanningAction(id, type);
            if (result.success) {
                toast.success(result.message);
                // Remove from list to show "done"
                setActions(prev => prev.filter(a => a.id !== id));
                onActionComplete?.(); // Notify parent
            }
        } catch (e) {
            toast.error("Failed to execute plan.");
        } finally {
            setExecutingId(null);
        }
    };

    return (
        <div className="flex h-full flex-col border-l border-slate-800 bg-[#08080a] w-80">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Recommendation Engine</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                        Action Queue
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full">{actions.length} Pending</span>
                    </div>
                </div>
                <Zap className="h-4 w-4 text-purple-400" />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {isPending && actions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                        <Loader2 className="animate-spin h-6 w-6" />
                        <span className="text-xs">Analyzing 10,000+ Scenarios...</span>
                    </div>
                ) : (
                    actions.map((action) => (
                        <div key={action.id} className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 hover:bg-slate-900/80 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${action.type === 'EXPEDITE' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                    action.type === 'TRANSFER' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    }`}>
                                    {action.type}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">{action.confidence}% CONFIDENCE</span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-200 mb-1">{action.title}</h4>
                            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{action.desc}</p>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-black/40 rounded p-1.5">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-0.5">
                                        <Target size={10} /> Impact
                                    </div>
                                    <div className="text-[10px] text-emerald-400 font-medium">{action.impact}</div>
                                </div>
                                <div className="bg-black/40 rounded p-1.5">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-0.5">
                                        <DollarSign size={10} /> Cost
                                    </div>
                                    <div className="text-[10px] text-slate-200 font-medium">{action.cost}</div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="flex items-start gap-1.5 text-[9px] text-slate-500 mb-3 italic">
                                <Clock size={10} className="mt-0.5 shrink-0" />
                                Reason: {action.reason}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExecute(action.id, action.type)}
                                    disabled={!!executingId}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                    {executingId === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 size={12} />}
                                    {executingId === action.id ? "Executing..." : "Approve"}
                                </button>
                                <button className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold py-1.5 rounded transition-colors">
                                    <XCircle size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/20">
                <button
                    onClick={handleGenerate}
                    disabled={isPending}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Run 'What-If' Simulation
                </button>
            </div>
        </div>
    );
}
