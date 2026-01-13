"use client";

import React, { useState } from "react";
import { PurchaseOrderList, PurchaseOrder } from "./ops/PurchaseOrderList";
import { PDFViewer } from "./ops/PDFViewer";
import { SalesOrderEditor } from "./ops/SalesOrderEditor";

export function OpsEditor() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [convertedData, setConvertedData] = useState<any | null>(null);

    const handleUpload = (file: File) => {
        setUploadFile(file);
        // Reset previous conversion
        setConvertedData(null);

        // Add to Inbound Queue
        const newPo: PurchaseOrder = {
            id: file.name.replace(".pdf", ""),
            vendor: "Analyzing...",
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "Pending",
            items: 0,
            total: "---"
        };

        setOrders(prev => [newPo, ...prev]);
        setSelectedPo(newPo);
    };

    const handleConvert = async () => {
        if (!uploadFile) return;

        setIsConverting(true);
        try {
            const formData = new FormData();
            formData.append("file", uploadFile);

            const response = await fetch("/api/ioe/convert-po", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                const extracted = data.extractedData;
                setConvertedData(extracted);

                // Update Order in Queue
                if (selectedPo) {
                    setOrders(prev => prev.map(o => o.id === selectedPo.id ? {
                        ...o,
                        vendor: extracted.vendor || "Unknown Vendor",
                        items: extracted.items?.length || 0,
                        status: "Converted",
                        // total: extracted.total || "---" // If AI extracts total
                    } : o));
                }

            } else {
                alert("Conversion failed: " + data.error);
            }
        } catch (error) {
            console.error("Conversion error", error);
            alert("An error occurred during conversion.");
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-[var(--bg-editor)]">
            {/* Left Pane: Queue */}
            <PurchaseOrderList
                orders={orders}
                selectedId={selectedPo?.id || null}
                onSelect={setSelectedPo}
            />

            {/* Center Pane: PDF Viewer */}
            <div className="flex-1 relative border-r border-[var(--border-color)]">
                <PDFViewer file={uploadFile} onUpload={handleUpload} />
            </div>

            {/* Right Pane: Editor */}
            <SalesOrderEditor
                poData={convertedData || selectedPo}
                onConvert={handleConvert}
            />
        </div>
    );
}
