"use client";

import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function MigrationCenter() {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('ITEM');
    const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'DONE' | 'ERROR'>('IDLE');
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;

        setStatus('UPLOADING');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            const res = await fetch('/api/migration/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                setResult(data.job);
                setStatus('DONE');
            } else {
                setStatus('ERROR');
            }
        } catch (e) {
            setStatus('ERROR');
        }
    };

    const handleDownloadTemplate = () => {
        let headers = '';
        if (type === 'ITEM') headers = 'sku,name,description,price,cost,category,uom';
        if (type === 'CUSTOMER') headers = 'name,email,phone,address,tier';
        if (type === 'INVENTORY') headers = 'sku,qty,warehouse,location';

        const blob = new Blob([headers], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template_${type.toLowerCase()}.csv`;
        a.click();
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white p-8">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <UploadCloud className="text-blue-500" />
                Data Migration Center
            </h1>
            <p className="text-slate-400 mb-8 max-w-2xl flex items-center justify-between">
                <span>Onboard your legacy data (Items, Customers, Inventory).</span>
                <button onClick={handleDownloadTemplate} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4">
                    Download {type} Template
                </button>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Zone */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data Type</label>
                        <select
                            value={type} onChange={e => setType(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm"
                        >
                            <option value="ITEM">Items (SKU, Name, Price)</option>
                            <option value="CUSTOMER">Customers (Name, Email)</option>
                            <option value="INVENTORY">Inventory (SKU, Qty, Warehouse)</option>
                        </select>
                    </div>

                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 transition-colors bg-slate-950/50">
                        <div className="p-4 bg-slate-900 rounded-full">
                            <FileSpreadsheet size={32} className="text-slate-500" />
                        </div>
                        <div className="text-center">
                            {file ? (
                                <div className="text-blue-400 font-medium">{file.name}</div>
                            ) : (
                                <>
                                    <div className="text-sm font-medium">Drag file or click to browse</div>
                                    <div className="text-xs text-slate-500 mt-1">Supports .xlsx, .csv</div>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || status === 'UPLOADING'}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {status === 'UPLOADING' ? <Loader2 className="animate-spin" /> : 'Start Migration'}
                    </button>
                </div>

                {/* Status / Output */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Migration Status</h3>

                    {status === 'IDLE' && (
                        <div className="text-slate-500 text-sm italic">
                            Waiting for upload...
                        </div>
                    )}

                    {status === 'DONE' && result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3 text-emerald-400 bg-emerald-950/30 p-4 rounded-lg border border-emerald-900">
                                <CheckCircle size={24} />
                                <div>
                                    <div className="font-bold">Migration Complete</div>
                                    <div className="text-sm opacity-80">Imported {result.successCount} records successfully.</div>
                                </div>
                            </div>

                            {result.errorCount > 0 && (
                                <div className="bg-red-950/30 border border-red-900 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                                        <AlertCircle size={16} />
                                        {result.errorCount} Errors Found
                                    </div>
                                    <div className="text-xs text-red-300 font-mono bg-red-950/50 p-2 rounded overflow-y-auto max-h-40">
                                        {result.errors}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
