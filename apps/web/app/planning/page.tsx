'use client';

import { useState } from 'react';
import { PlanLine } from '@starpath/shared';

// Mock Data for UI before API integration
const MOCK_LINES: PlanLine[] = [
    {
        id: '1', org_id: '1', plan_id: '1', item_id: '1', work_center_id: 'WC1',
        start_time: '2024-01-01T08:00:00Z', end_time: '2024-01-01T12:00:00Z', qty: 100,
        reason_json: { decision: "SCHEDULED", msg: "On time" }
    }
];

export default function PlanningPage() {
    const [planLines, setPlanLines] = useState<PlanLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [explainNode, setExplainNode] = useState<PlanLine | null>(null);

    const runPlan = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/plan/run', { method: 'POST' });
            const data = await res.json();
            setPlanLines(data.lines || MOCK_LINES); // Fallback to mock if API returns nothing in dev
        } catch (e) {
            console.error(e);
            setPlanLines(MOCK_LINES);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50 text-gray-900">
            <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Planning Control Tower</h1>
                <button
                    onClick={runPlan}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Running Engine...' : 'Run Plan (Heuristic)'}
                </button>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Main GANTT / Grid Area */}
                <div className="flex-1 p-6 overflow-auto">
                    <div className="bg-white border rounded shadow p-4">
                        <h2 className="font-semibold mb-4">Production Schedule (14 Day)</h2>
                        <div className="space-y-2">
                            {/* Header */}
                            <div className="grid grid-cols-6 gap-4 font-medium text-sm text-gray-500 border-b pb-2">
                                <div>Item</div>
                                <div>Work Center</div>
                                <div>Start</div>
                                <div>End</div>
                                <div>Qty</div>
                                <div>Explanation</div>
                            </div>

                            {planLines.map(line => (
                                <div
                                    key={line.id}
                                    className="grid grid-cols-6 gap-4 text-sm py-2 hover:bg-blue-50 cursor-pointer border-b"
                                    onClick={() => setExplainNode(line)}
                                >
                                    <div>{line.item_id}</div>
                                    <div>{line.work_center_id}</div>
                                    <div>{new Date(line.start_time).toLocaleString()}</div>
                                    <div>{new Date(line.end_time).toLocaleString()}</div>
                                    <div>{line.qty}</div>
                                    <div className="text-gray-400 text-xs truncate">{JSON.stringify(line.reason_json)}</div>
                                </div>
                            ))}

                            {planLines.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    No plan loaded. Click "Run Plan" to execute the engine.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Explainability & Chat */}
                <div className="w-96 border-l bg-white flex flex-col">
                    <div className="p-4 border-b flex-1 overflow-auto">
                        <h3 className="font-bold mb-2">Explainability</h3>
                        {explainNode ? (
                            <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm">
                                <p className="font-semibold">Why this slot?</p>
                                <p className="mt-1">{explainNode.reason_json?.msg || 'No detailed trace available.'}</p>
                                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {JSON.stringify(explainNode.reason_json, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Select a schedule line to see the planner's decision logic.</p>
                        )}
                    </div>

                    <div className="p-4 border-t h-1/3 bg-gray-50">
                        <h3 className="font-bold mb-2">Planner Chat</h3>
                        <textarea
                            className="w-full h-20 border rounded p-2 text-sm"
                            placeholder="Ask: 'Why is order #102 late?'"
                        ></textarea>
                        <div className="flex justify-between mt-2">
                            <button className="text-xs text-blue-600 hover:underline">Scenario: + Capacity</button>
                            <button className="text-xs text-blue-600 hover:underline">Scenario: Rush Order</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
