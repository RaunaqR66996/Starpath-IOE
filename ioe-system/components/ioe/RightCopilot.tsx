"use client";

import React, { useState } from "react";
import {
    Plus, Clock, MoreHorizontal, Infinity as InfinityIcon, List,
    MessageSquare, AtSign, Globe, Image as ImageIcon, Mic, ChevronDown, X, Paperclip, FileText, File as FileIcon
} from "lucide-react";
import { DocumentGenerator } from "./DocumentGenerator";
import { Order } from "@/lib/types";

import { createOrder, checkCredit, executePick, executePack, executeShip } from "@/app/actions/order-actions";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PlanningAI } from "./planning/PlanningAI";
import { MrpAnalyticsWidget } from "./planning/MrpAnalyticsWidget";
import {
    CreditCard, PackageCheck, Truck, ArrowRight, XCircle, CheckCircle2,
    ArrowUp, Zap
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";

const DocumentAction = ({ orderId }: { orderId: string }) => {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetch(`/api/orders/${orderId}`)
            .then(async res => {
                const contentType = res.headers.get("content-type");
                if (!res.ok) {
                    throw new Error(`Order fetch failed: ${res.status} ${res.statusText}`);
                }
                if (!contentType || !contentType.includes("application/json")) {
                    const text = await res.text();
                    console.error("Received non-JSON response:", text.slice(0, 100)); // Log first 100 chars
                    throw new Error("Received non-JSON response from server");
                }
                return res.json();
            })
            .then(data => setOrder(data))
            .catch(err => {
                console.error("DocumentAction fetch error:", err);
                setLoading(false);
            })
            .finally(() => setLoading(false));
    }, [orderId]);

    if (loading) return <div className="text-[10px] text-slate-500 animate-pulse">Fetching order data...</div>;
    if (!order) return <div className="text-[10px] text-red-400">Order {orderId} not found.</div>;

    return (
        <div className="flex flex-col gap-2 mt-2 bg-slate-900/50 p-3 rounded border border-slate-700/50">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-2">
                <List size={12} />
                Generate Documents for Order {order.id.slice(0, 8)}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <DocumentGenerator type="PICK_SLIP" data={order} label="Pick Slip" />
                <DocumentGenerator type="PACKING_SLIP" data={order} label="Pack Slip" />
                <DocumentGenerator type="COC" data={order} label="COC" />
                {order.shipmentId && <DocumentGenerator type="BOL" data={{ id: 'SHIP-123', carrierId: 'ESTES', truckId: 'TRK-99', serviceLevel: 'STD', origin: { city: 'Laredo', state: 'TX' }, destination: order.destination, totalWeight: order.totalWeight }} label="BOL" />}
            </div>
        </div>
    );
};

const CreateOrderAction = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    // STAGES: DRAFT -> CREDIT -> RELEASED -> PICKED -> PACKED -> SHIPPED
    const [stage, setStage] = useState<'DRAFT' | 'CREDIT' | 'RELEASED' | 'PICKED' | 'PACKED' | 'SHIPPED'>('DRAFT');
    const [statusMsg, setStatusMsg] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setStatusMsg("Checking Inventory Availability...");
        const formData = new FormData(e.currentTarget);
        const res = await createOrder(formData);

        setLoading(false);
        if (res.success && res.orderId) {
            setResult(res.orderId);
            setStage('CREDIT'); // Move to next stage
            setStatusMsg(res.status === 'IN_STOCK' ? "Inventory Allocated." : "Backorder Created (In-Transit).");
        } else {
            setStatusMsg(res.error || "Failed to create order.");
        }
    }

    async function runCredit() {
        if (!result) return false;
        setLoading(true);
        setStatusMsg("Running Credit Check...");
        const res = await checkCredit(result);
        setLoading(false);
        if (res.success) {
            setStage('RELEASED');
            setStatusMsg("Credit Approved. Order Released.");
            return true;
        } else {
            setStatusMsg(res.message);
            return false;
        }
    }

    async function runPick() {
        if (!result) return false;
        setLoading(true);
        setStatusMsg("Generating Pick Tasks...");
        await executePick(result);
        setLoading(false);
        setStage('PICKED');
        setStatusMsg("Picking Completed.");
        return true;
    }

    async function runPack() {
        if (!result) return false;
        setLoading(true);
        setStatusMsg("Packing Order...");
        await executePack(result);
        setLoading(false);
        setStage('PACKED');
        setStatusMsg("Order Packed.");
        return true;
    }

    async function runShip() {
        if (!result) return false;
        setLoading(true);
        setStatusMsg("Booking Freight...");
        await executeShip(result);
        setLoading(false);
        setStage('SHIPPED');
        setStatusMsg("Order Shipped!");
        return true;
    }

    async function runAutoPilot() {
        if (!result) return;

        // 1. Credit
        const creditOk = await runCredit();
        if (!creditOk) return;
        await new Promise(r => setTimeout(r, 600)); // Visual delay

        // 2. Pick
        const pickOk = await runPick();
        if (!pickOk) return;
        await new Promise(r => setTimeout(r, 600));

        // 3. Pack
        const packOk = await runPack();
        if (!packOk) return;
        await new Promise(r => setTimeout(r, 600));

        // 4. Ship
        await runShip();
    }

    if (result) {
        return (
            <div className="bg-slate-900/50 border border-slate-700 p-3 rounded mt-2 relative group animate-in fade-in slide-in-from-bottom-2">
                <button
                    onClick={() => setResult(null)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Close"
                >
                    <X size={12} />
                </button>

                <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                    <div className={`h-2 w-2 rounded-full ${stage === 'SHIPPED' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
                    <span className="text-xs font-bold text-slate-200">Order {result.slice(0, 8)}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{stage}</span>
                </div>

                {/* Workflow Progress */}
                <div className="flex justify-between mb-4 px-1">
                    {['DRAFT', 'CREDIT', 'RELEASED', 'PICKED', 'PACKED', 'SHIPPED'].map((s, i) => {
                        const isDone = ['DRAFT', 'CREDIT', 'RELEASED', 'PICKED', 'PACKED', 'SHIPPED'].indexOf(stage) >= i;
                        const isCurrent = stage === s;
                        return (
                            <div key={s} className="flex flex-col items-center gap-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-slate-700'} ${isCurrent ? 'ring-2 ring-emerald-500/50' : ''}`} />
                            </div>
                        )
                    })}
                </div>

                <div className="text-[11px] text-emerald-400 mb-3 font-mono bg-emerald-900/10 p-1.5 rounded border border-emerald-900/30">
                    {statusMsg}
                </div>

                {stage === 'CREDIT' && (
                    <div className="flex gap-2">
                        <button onClick={runCredit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 text-xs font-medium flex items-center justify-center gap-2">
                            {loading ? 'Checking...' : <><CreditCard size={12} /> Run Credit</>}
                        </button>
                        <button onClick={runAutoPilot} disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded py-1.5 text-xs font-medium flex items-center justify-center gap-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12" />
                            {loading ? 'Auto-Pilot...' : <><Zap size={12} fill="currentColor" /> Auto-Process</>}
                        </button>
                    </div>
                )}

                {stage === 'RELEASED' && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <DocumentGenerator type="PICK_SLIP" data={{ id: result, erpReference: 'PO-NEW', lines: [], destination: { street: '123', city: 'NY' }, createdAt: new Date() }} label="Pick Slip" />
                        </div>
                        <button onClick={runPick} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded py-1.5 text-xs font-medium flex items-center justify-center gap-2">
                            {loading ? 'Picking...' : <><PackageCheck size={12} /> Execute Pick</>}
                        </button>
                    </div>
                )}

                {stage === 'PICKED' && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <DocumentGenerator type="PACKING_SLIP" data={{ id: result, erpReference: 'PO-NEW', lines: [], destination: { street: '123', city: 'NY' }, createdAt: new Date() }} label="Pack Slip" />
                        </div>
                        <button onClick={runPack} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded py-1.5 text-xs font-medium flex items-center justify-center gap-2">
                            {loading ? 'Packing...' : <><PackageCheck size={12} /> Execute Pack</>}
                        </button>
                    </div>
                )}

                {stage === 'PACKED' && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <DocumentGenerator type="BOL" data={{ id: 'SHIP-NEW', carrierId: 'UPS', destination: { street: '123 Main', city: 'NY', state: 'NY' } }} label="BOL" />
                            <DocumentGenerator type="SHIPPING_LABEL" data={{ id: 'SHIP-NEW', carrierId: 'UPS', destination: { street: '123 Main', city: 'NY', state: 'NY' }, totalWeight: 100 }} label="Label" />
                        </div>
                        <button onClick={runShip} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded py-1.5 text-xs font-medium flex items-center justify-center gap-2">
                            {loading ? 'Booking...' : <><Truck size={12} /> Book Carrier & Ship</>}
                        </button>
                    </div>
                )}

                {stage === 'SHIPPED' && (
                    <div className="mt-2 text-center p-2 bg-slate-800 rounded">
                        <CheckCircle2 className="mx-auto text-emerald-500 mb-1" size={20} />
                        <div className="text-xs text-slate-300">Order Fulfilled Complete</div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2 bg-slate-900/50 p-3 rounded border border-slate-700/50">
            <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Plus size={12} /> New Sales Order
            </div>
            <input name="customerName" placeholder="Customer Name" required className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500" />
            <div className="flex gap-2">
                <input name="itemId" placeholder="SKU" required className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500" />
                <input name="qty" type="number" placeholder="Qty" required className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500" />
            </div>
            <select name="priority" className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-slate-500">
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
            </select>
            <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white rounded py-2 text-xs font-medium mt-1 transition-colors disabled:opacity-50">
                {loading ? 'Checking Inventory...' : 'Initialize Order'}
            </button>
        </form>
    );
};

const MODES = [
    { id: 'agent', label: 'Agent', icon: InfinityIcon, shortcut: 'Ctrl+I' },
    { id: 'plan', label: 'Plan', icon: List },
    { id: 'ask', label: 'Ask', icon: MessageSquare },
];

interface Attachment {
    name: string;
    type: string;
    content: string; // base64 or text
    preview?: string; // for images
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
}

interface RightCopilotProps {
    activeSite: string;
    activeTab: string;
    selectedActivity: string;
    layoutSummary?: any;
    onOpenTab?: (tabId: string) => void;
}

export function RightCopilot({ activeSite, activeTab, selectedActivity, layoutSummary, onOpenTab }: RightCopilotProps) {
    const [selectedMode, setSelectedMode] = useState(MODES[0]);
    const [isModeOpen, setIsModeOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    React.useEffect(() => {
        // SYSTEM INJECTION: Notify user of new capability
        const hasSeen = sessionStorage.getItem('seen_dock_stock_intro');
        if (!hasSeen) {
            setTimeout(() => {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: "✅ **SYSTEM UPDATE**: Dock-to-Stock Protocol Activated.\n\nI am ready to receive POs into any warehouse. Try: *'Receive PO-TEST-101 into Texas'*."
                    }
                ]);
                sessionStorage.setItem('seen_dock_stock_intro', 'true');
            }, 1000);
        }
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newAttachments: Attachment[] = [];
            for (const file of Array.from(e.target.files)) {
                try {
                    const content = await readFile(file);
                    newAttachments.push({
                        name: file.name,
                        type: file.type,
                        content: content,
                        preview: file.type.startsWith('image/') ? content : undefined
                    });
                } catch (err) {
                    console.error("Failed to read file:", file.name, err);
                }
            }
            setAttachments(prev => [...prev, ...newAttachments]);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    };

    const removeAttachment = (idx: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputValue,
            attachments: attachments.length > 0 ? [...attachments] : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setAttachments([]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    context: {
                        selectedActivity,
                        activeSite,
                        activeTab,
                        layoutSummary
                    }
                }),
            });

            const data = await response.json();
            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI service." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const { openTab } = useWorkspaceStore();

    // Effect to handle navigation actions from the AI
    React.useEffect(() => {
        if (!messages.length) return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'assistant' && lastMsg.content.includes('[[ACTION:OPEN_TAB:')) {
            const match = lastMsg.content.match(/\[\[ACTION:OPEN_TAB:(.*?)\]\]/);
            if (match && match[1]) {
                const actionString = match[1]; // e.g., "LOAD_GRAPH:WC-01" or just "Scheduling"
                console.log("AI Navigation Trigger:", actionString);

                const parts = actionString.split(':');
                const type = parts[0];
                const id = parts.length > 1 ? parts[1] : 'general';

                // List of Top-Level Views that should switch the main EditorTabs
                const MAIN_VIEWS = ["Orders", "Inventory", "Shipments", "Procurement", "Finance", "Planning", "Scheduling", "Sustainability"];

                if (MAIN_VIEWS.includes(type)) {
                    // Call the parent handler to switch top-level tabs
                    if (onOpenTab) {
                        onOpenTab(type);
                    }
                } else {
                    // Otherwise, open it as a sub-tab in the Planning Workspace
                    openTab({
                        id: `${type}-${id}`,
                        type: type as any,
                        title: `${type} ${id}`,
                        data: { id }
                    });
                }
            }
        }
    }, [messages, openTab, onOpenTab]);

    return (
        <div className="flex h-full w-[340px] flex-col border-l border-[var(--border-color)] bg-[var(--bg-sidebar)] font-sans">
            {/* Header */}
            <div className="flex h-11 items-center justify-between border-b border-[var(--border-color)] px-3 pr-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-300">
                        {selectedMode.id === 'plan' ? 'Planning Intelligence' : 'New Chat'}
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    <button onClick={() => setMessages([])} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="Clear Chat">
                        <Plus size={14} className="rotate-45" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                        <Clock size={14} />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-3 overflow-hidden">

                <div className="flex-1 flex flex-col mb-4 overflow-hidden">
                    {/* Embedded Planning Widget when in Plan Mode */}
                    {selectedMode.id === 'plan' && (
                        <div className="shrink-0 max-h-[50%] border-b border-[var(--border-color)] overflow-y-auto mb-2 shadow-sm transition-all animate-in slide-in-from-top-2">
                            <PlanningAI activeTab={activeTab} className="h-auto min-h-min pb-2" />
                        </div>
                    )}

                    {/* Chat Stream (Always Visible) */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                        {messages.length === 0 && selectedMode.id !== 'plan' && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center px-4">
                                <InfinityIcon size={32} className="mb-2 opacity-20" />
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">IOE</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[var(--item-active-bg)] text-[var(--text-primary)]'
                                    : 'bg-[var(--bg-editor)] text-[var(--text-secondary)] border border-[var(--border-color)] shadow-sm'
                                    }`}>
                                    {/* Render Attachments in History */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {msg.attachments.map((att, idx) => (
                                                <div key={idx} className="flex items-center gap-1 bg-black/20 rounded px-2 py-1 border border-white/10">
                                                    {att.type.startsWith('image/') ? <ImageIcon size={10} /> : <FileText size={10} />}
                                                    <span className="text-[10px] opacity-80 truncate max-w-[100px]">{att.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {msg.content.startsWith('[[ACTION:GENERATE_DOCS:') ? (
                                        <DocumentAction orderId={msg.content.split(':')[2].replace(']]', '')} />
                                    ) : msg.content === '[[ACTION:CREATE_ORDER]]' ? (
                                        <CreateOrderAction />
                                    ) : msg.content.startsWith('[[ACTION:OPEN_TAB:') ? (
                                        <div className="flex items-center gap-2 p-2 bg-emerald-900/20 text-emerald-400 rounded text-[10px] font-medium border border-emerald-800/30">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span>Navigating to requested tab...</span>
                                        </div>
                                    ) : msg.content.startsWith('[[WIDGET:MRP_CHART:') ? (
                                        // PARSE AND RENDER CHART WIDGET
                                        (() => {
                                            try {
                                                const jsonStr = msg.content.match(/\[\[WIDGET:MRP_CHART:(.*?)\]\]/)?.[1] || '[]';
                                                const data = JSON.parse(jsonStr);
                                                return <MrpAnalyticsWidget data={data} />;
                                            } catch (e) {
                                                return <div className="text-red-500 text-xs">Failed to load chart widget.</div>;
                                            }
                                        })()
                                    ) : (
                                        <div className="prose prose-invert prose-xs max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 italic ml-1">
                                <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" />
                                <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area Overlay Container */}
                <div className="relative mt-auto">
                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex gap-2 mb-2 px-1 overflow-x-auto">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="relative flex items-center gap-2 bg-[var(--bg-panel-header)] border border-[var(--border-color)] rounded-md pl-2 pr-7 py-1.5 shadow-lg animate-in slide-in-from-bottom-1">
                                    {file.preview ? (
                                        <div className="h-6 w-6 rounded overflow-hidden bg-black">
                                            <img src={file.preview} alt="" className="h-full w-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center">
                                            <FileText size={12} className="text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium text-slate-200 truncate max-w-[80px]">{file.name}</span>
                                        <span className="text-[9px] text-slate-500 uppercase">{file.name.split('.').pop()}</span>
                                    </div>
                                    <button
                                        onClick={() => removeAttachment(idx)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-full transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mode Selector Dropdown */}
                    {isModeOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--bg-panel-header)] border border-[var(--border-color)] rounded-lg shadow-2xl p-1 z-20">
                            {MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => {
                                        setSelectedMode(mode);
                                        setIsModeOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-slate-800 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <mode.icon size={14} className="text-slate-400 group-hover:text-slate-200" />
                                        <span className="text-xs text-slate-300">{mode.label}</span>
                                    </div>
                                    {mode.shortcut && <span className="text-[10px] text-slate-600">{mode.shortcut}</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Sophisticated Input Box */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] backdrop-blur-md p-3 transition-all focus-within:border-[var(--accent-color)] focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none min-h-[50px]"
                            rows={2}
                        />

                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsModeOpen(!isModeOpen)}
                                    className="flex items-center gap-1.5 rounded-md bg-slate-800/40 px-2 py-1 text-slate-300 hover:bg-slate-700/60 transition-colors border border-slate-700/30"
                                >
                                    <selectedMode.icon size={13} className="text-slate-400" />
                                    <span className="text-[11px] font-medium">{selectedMode.label}</span>
                                    <ChevronDown size={10} className="text-slate-500" />
                                </button>

                                <button className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors">
                                    Auto <ChevronDown size={10} className="inline ml-1 opacity-50" />
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors tooltip"
                                    title="Attach File"
                                >
                                    <Paperclip size={14} />
                                </button>
                                <button className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                                    <Globe size={14} />
                                </button>
                                {/* Voice Input Button */}
                                <button
                                    onClick={() => {
                                        if (isRecording) {
                                            // Stop logic handled by recognition.stop() or state toggle
                                            setIsRecording(false);
                                            // window.speechRecognitionInstance?.stop(); // If we had ref
                                        } else {
                                            setIsRecording(true);
                                            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                            if (SpeechRecognition) {
                                                const recognition = new SpeechRecognition();
                                                recognition.continuous = false; // Stop after one sentence for chat
                                                recognition.interimResults = false;
                                                recognition.lang = 'en-US';

                                                recognition.onstart = () => setIsRecording(true);
                                                recognition.onend = () => setIsRecording(false);
                                                recognition.onresult = (event: any) => {
                                                    const transcript = event.results[0][0].transcript;
                                                    setInputValue((prev) => prev ? prev + ' ' + transcript : transcript);
                                                    // Optional: Auto-send? No, let user confirm.
                                                };
                                                recognition.start();
                                            } else {
                                                alert("Voice input not supported in this browser.");
                                                setIsRecording(false);
                                            }
                                        }
                                    }}
                                    className={`p-1.5 transition-colors ${isRecording ? 'text-red-500 hover:text-red-400 animate-pulse' : 'text-slate-500 hover:text-slate-300'}`}
                                    title="Voice Input"
                                >
                                    <Mic size={14} />
                                </button>
                                <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
                                    className={`rounded-full p-1.5 shadow-inner transition-colors ${(inputValue.trim() || attachments.length > 0) && !isLoading
                                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                                        : 'bg-slate-800 text-slate-500'
                                        }`}
                                >
                                    <ArrowUp size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
