import React from "react";
import { FileText, ZoomIn, ZoomOut, Download, Printer, Upload } from "lucide-react";

interface PDFViewerProps {
    file: File | null;
    onUpload: (file: File) => void;
}

export function PDFViewer({ file, onUpload }: PDFViewerProps) {
    if (!file) {
        return (
            <label className="flex h-full w-full flex-col items-center justify-center bg-slate-900/50 text-slate-600 cursor-pointer hover:bg-slate-900/80 transition-colors border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-none">
                <Upload className="mb-4 h-12 w-12 opacity-50" />
                <span className="text-sm font-medium text-slate-400">Upload Purchase Order (PDF)</span>
                <span className="text-xs text-slate-600 mt-2">Click to browse or drag and drop</span>
                <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            onUpload(e.target.files[0]);
                        }
                    }}
                />
            </label>
        );
    }

    return (
        <div className="flex h-full flex-col bg-slate-900">
            {/* Toolbar */}
            <div className="flex h-10 items-center justify-between border-b border-slate-700 bg-slate-800/50 px-4">
                <span className="text-xs font-mono text-slate-400">{file.name}</span>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-sm transition-colors">
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-slate-500 w-12 text-center">100%</span>
                    <button className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-sm transition-colors">
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <div className="mx-2 h-4 w-[1px] bg-slate-700" />
                    <button className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-sm transition-colors">
                        <Printer className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-sm transition-colors">
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Document Preview Area */}
            <div className="flex-1 bg-slate-950 relative">
                {file && (
                    <iframe
                        src={URL.createObjectURL(file)}
                        className="w-full h-full border-none"
                        title="PDF Preview"
                    />
                )}
            </div>
        </div>
    );
}
