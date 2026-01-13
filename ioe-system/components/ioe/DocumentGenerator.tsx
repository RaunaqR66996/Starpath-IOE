"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Printer, CheckCircle, Package, X } from 'lucide-react';
import { Order, Shipment } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DocumentGeneratorProps {
    type: 'PICK_SLIP' | 'PACKING_SLIP' | 'BOL' | 'COC' | 'INVOICE' | 'SHIPPING_LABEL' | 'SUSTAINABILITY_REPORT';
    data: Order | Shipment | any;
    label?: string;
}

export function DocumentGenerator({ type, data, label }: DocumentGeneratorProps) {
    const [open, setOpen] = useState(false);

    const handlePrint = () => {
        const printContent = document.getElementById('printable-document');
        if (printContent) {
            const windowUrl = 'about:blank';
            const uniqueName = new Date().getTime();
            const windowName = 'Print' + uniqueName;
            const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Document</title>
                            <base href="${window.location.origin}/" />
                            <link rel="icon" href="/logo.png" />
                            <style>
                                body { font-family: monospace; padding: 20px; color: black; }
                                .header { text-align: center; border-bottom: 2px solid black; margin-bottom: 20px; padding-bottom: 10px; }
                                .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                                .section { margin-top: 20px; border: 1px solid #ccc; padding: 10px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                                th, td { border: 1px solid black; padding: 5px; text-align: left; }
                                .footer { margin-top: 40px; font-size: 10px; text-align: center; }
                                @page { size: auto; margin: 5mm; }
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            </style>
                        </head>
                        <body>
                            ${printContent.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            }
        }
    };

    const renderPickSlip = (order: Order) => (
        <div id="printable-document" className="bg-white text-black font-mono text-xs leading-none p-8 h-full">
            <div style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <img src="/logo.png" alt="StarPath Logo" style={{ height: '40px' }} />
                    <h1 className="text-xl font-bold">PICK SLIP</h1>
                </div>
                <div className="flex justify-between">
                    <div>
                        <strong>StarPath Logistics</strong><br />
                        123 Warehouse Dr.<br />
                        Laredo, TX 78045
                    </div>
                    <div className="text-right">
                        <strong>Pick Slip No:</strong> PS-{order.id.slice(0, 8)}<br />
                        <strong>Order No:</strong> {order.erpReference}<br />
                        <strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}<br />
                        <strong>Pick Date:</strong> {new Date().toLocaleDateString()}<br />
                        <strong>Priority:</strong> {order.priority}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>Ship To:</strong><br />
                {order.customerName}<br />
                {order.destination.street}<br />
                {order.destination.city}, {order.destination.state} {order.destination.zip}
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 className="font-bold border-b border-black mb-2">Item Details</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid black' }}>
                            <th className="text-left p-1">Line</th>
                            <th className="text-left p-1">SKU</th>
                            <th className="text-left p-1">Description</th>
                            <th className="text-left p-1">Location</th>
                            <th className="text-left p-1">Lot / Serial</th>
                            <th className="text-right p-1">Qty Ordered</th>
                            <th className="text-right p-1">Qty Picked</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.lines.map((line, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                                <td className="p-1">{line.lineNumber}</td>
                                <td className="p-1 font-bold">{line.itemId}</td>
                                <td className="p-1">Standard Item Desc</td>
                                <td className="p-1">A-01-0{i + 1}</td>
                                <td className="p-1">_ _ _ _ _ _</td>
                                <td className="p-1 text-right">{line.qtyOrdered}</td>
                                <td className="p-1 text-right">_________</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-end border-t border-black pt-4 mt-8">
                <div>
                    <strong>Picker Name:</strong> ____________________<br /><br />
                    <strong>Pick Start Time:</strong> ___________<br /><br />
                    <strong>Pick End Time:</strong> ___________
                </div>
                <div>
                    <strong>Quality Check:</strong> [ ] Yes  [ ] No<br /><br />
                    <strong>Remarks:</strong> ____________________________
                </div>
            </div>
            <div className="text-[10px] text-center mt-10">Internal Use Only - StarPath WMS</div>
        </div>
    );

    const renderPackingSlip = (order: Order) => (
        <div id="printable-document" className="bg-white text-black font-sans text-xs p-8 h-full">
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div>
                    <img src="/logo.png" alt="StarPath Logo" style={{ height: '40px', marginBottom: '10px' }} />
                    <h1 className="text-2xl font-bold text-neutral-800">PACKING SLIP</h1>
                    <div className="mt-2 text-neutral-500">StarPath Logistics</div>
                </div>
                <div className="text-right">
                    <strong>Packing Slip No:</strong> PK-{order.id.slice(0, 8)}<br />
                    <strong>Order No:</strong> {order.erpReference}<br />
                    <strong>Shipment No:</strong> SH-{order.shipmentId ? order.shipmentId.slice(0, 8) : 'PENDING'}<br />
                    <strong>Ship Date:</strong> {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="flex justify-between mb-8">
                <div className="w-1/2 pr-4 border-r border-neutral-200">
                    <strong className="block mb-1 text-neutral-500 uppercase tracking-wide">Sold To</strong>
                    <div>{order.customerName}</div>
                </div>
                <div className="w-1/2 pl-4">
                    <strong className="block mb-1 text-neutral-500 uppercase tracking-wide">Ship To</strong>
                    <div>
                        {order.destination.street}<br />
                        {order.destination.city}, {order.destination.state} {order.destination.zip}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold border-b border-black mb-2 uppercase tracking-wide">Packed Items</h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="p-2">Box No</th>
                            <th className="p-2">SKU</th>
                            <th className="p-2">Description</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Net Wgt</th>
                            <th className="p-2 text-right">Gross Wgt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.lines.map((line, i) => (
                            <tr key={i} className="border-b border-neutral-200">
                                <td className="p-2">1</td>
                                <td className="p-2">{line.itemId}</td>
                                <td className="p-2">Item Description</td>
                                <td className="p-2 text-right">{line.qtyShipped}</td>
                                <td className="p-2 text-right">{(line.qtyShipped * 0.5).toFixed(1)} kg</td>
                                <td className="p-2 text-right">{(line.qtyShipped * 0.6).toFixed(1)} kg</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t border-black">
                <div>
                    <strong>Total Boxes:</strong> 1<br />
                    <strong>Total Quantity:</strong> {order.lines.reduce((acc, l) => acc + l.qtyShipped, 0)}
                </div>
                <div>
                    <strong>Packed By:</strong> __________________<br /><br />
                    <strong>Checked By:</strong> __________________
                </div>
            </div>
            <div className="text-[10px] text-center mt-10">Thank you for your business!</div>
        </div>
    );

    const renderBOL = (shipment: Shipment) => (
        <div id="printable-document" className="bg-white text-black font-mono text-[10px] p-8 h-full">
            <div className="border border-black p-2 mb-4 flex justify-between">
                <div>
                    <img src="/logo.png" alt="StarPath Logo" style={{ height: '30px', marginBottom: '5px' }} />
                    <h1 className="text-lg font-bold">BILL OF LADING</h1>
                </div>
                <div className="text-right">
                    <strong>BOL No:</strong> BOL-{shipment.id.slice(0, 8)}<br />
                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="flex mb-4">
                <div className="w-1/2 border border-black p-2 mr-2">
                    <strong className="block border-b border-black mb-2">Shipper</strong>
                    StarPath Fulfillment Center<br />
                    123 Warehouse Dr.<br />
                    Laredo, TX 78045<br />
                    (555) 123-4567
                </div>
                <div className="w-1/2 border border-black p-2">
                    <strong className="block border-b border-black mb-2">Consignee</strong>
                    {shipment.destination.street}<br />
                    {shipment.destination.city}, {shipment.destination.state} {shipment.destination.zip}<br />
                    (555) 987-6543
                </div>
            </div>

            <div className="border border-black p-2 mb-4">
                <strong className="block border-b border-black mb-2">Carrier Details</strong>
                <div className="flex justify-between">
                    <span><strong>Name:</strong> {shipment.carrierId}</span>
                    <span><strong>SCAC:</strong> ESTES</span>
                    <span><strong>Trailer:</strong> {shipment.truckId || '_______'}</span>
                </div>
            </div>

            <div className="border border-black p-2 mb-4">
                <strong className="block border-b border-black mb-2">Shipment Details</strong>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left border-r border-black">Qty</th>
                            <th className="text-left border-r border-black pl-2">Type</th>
                            <th className="text-left border-r border-black pl-2">Description</th>
                            <th className="text-right border-r border-black pr-2">Weight</th>
                            <th className="text-center border-r border-black">Class</th>
                            <th className="text-center">NMFC</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border-r border-black">{shipment.totalWeight ? Math.ceil(shipment.totalWeight / 500) : 1}</td>
                            <td className="border-r border-black pl-2">PLT</td>
                            <td className="border-r border-black pl-2">General Freight</td>
                            <td className="border-r border-black text-right pr-2">{shipment.totalWeight} kg</td>
                            <td className="border-r border-black text-center">60</td>
                            <td className="text-center">123450</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between mb-8 font-bold">
                <div>Freight Terms: [X] Prepaid  [ ] Collect  [ ] 3rd Party</div>
                <div>Total Weight: {shipment.totalWeight} kg</div>
            </div>

            <div className="border border-black p-2 mb-4">
                <strong>Special Instructions:</strong><br />
                No double stacking. Call 24h before delivery.
            </div>

            <div className="flex justify-between mt-12 pt-4">
                <div style={{ borderTop: '1px solid black', width: '40%' }}>
                    <div className="mb-8">Shipper Signature</div>
                    Date: _____________
                </div>
                <div style={{ borderTop: '1px solid black', width: '40%' }}>
                    <div className="mb-8">Carrier Signature</div>
                    Date: _____________
                </div>
            </div>
            <div className="text-[8px] text-center mt-4">
                RECEIVED, subject to individually determined rates or contracts that have been agreed upon in writing between the carrier and shipper, if applicable, otherwise to the rates, classifications and rules that have been established by the carrier and are available to the shipper, on request.
            </div>
        </div>
    );

    const renderCOC = (order: Order) => (
        <div id="printable-document" className="bg-white text-black font-serif p-8 h-full">
            <div className="text-center mb-12">
                <img src="/logo.png" alt="StarPath Logo" style={{ height: '60px', margin: '0 auto 10px auto', display: 'block' }} />
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">Certificate of Compliance</h1>
                <p className="text-neutral-500">StarPath Logistics</p>
                <p className="text-neutral-500">123 Logistics Way, Laredo, TX</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div>
                    <div className="flex justify-between border-b border-neutral-300 py-1">
                        <strong>Certificate No:</strong> <span>COC-{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-300 py-1">
                        <strong>Order No:</strong> <span>{order.erpReference}</span>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between border-b border-neutral-300 py-1">
                        <strong>Shipment Date:</strong> <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-300 py-1">
                        <strong>Invoice No:</strong> <span>INV-{order.id.slice(0, 6)}</span>
                    </div>
                </div>
            </div>

            <div className="mb-8 text-sm leading-7">
                <p>This certifies that the following products <strong>meet all applicable specifications, drawings, standards, and regulatory requirements</strong>.</p>
            </div>

            <div className="mb-8">
                <h3 className="font-bold border-b-2 border-black mb-2 uppercase text-xs">Product Details</h3>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-2">SKU</th>
                            <th className="py-2">Description</th>
                            <th className="py-2">Lot / Batch</th>
                            <th className="py-2 text-right">Qty</th>
                            <th className="py-2">Standard / Spec</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.lines.map((line, i) => (
                            <tr key={i} className="border-b border-neutral-200">
                                <td className="py-2">{line.itemId}</td>
                                <td className="py-2">--</td>
                                <td className="py-2">LOT-{Math.floor(Math.random() * 99999)}</td>
                                <td className="py-2 text-right">{line.qtyShipped}</td>
                                <td className="py-2">ISO 9001:2015</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mb-12 border p-4 bg-neutral-50 text-sm">
                <strong>Compliance Standards:</strong><br />
                ASTM D3951, ISO 9001, Customer Spec Rev. C
            </div>

            <div className="mt-16 flex justify-between items-end">
                <div>
                    <p className="mb-6 font-bold">Statement:</p>
                    <p className="text-sm italic w-3/4">We hereby certify that the above items comply with all contractual and regulatory requirements.</p>
                </div>
                <div className="text-center">
                    <div style={{ fontFamily: 'cursive', fontSize: '20px', marginBottom: '10px' }}>
                        Raunaq S.
                    </div>
                    <div style={{ borderTop: '1px solid black', width: '200px', paddingTop: '5px' }}>
                        <strong>Authorized Signature</strong><br />
                        <span className="text-xs">Quality Assurance Manager</span><br />
                        <span className="text-xs">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInvoice = (invoice: any) => {
        const order = invoice.order || data; // Handle both direct order or nested invoice
        const invoiceData = invoice.invoiceNumber ? invoice : {
            invoiceNumber: `INV-${order.id.slice(0, 6)}`,
            amount: order.lines.reduce((acc: number, l: any) => acc + (l.qtyOrdered * (l.unitPrice || 0)), 0),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };

        return (
            <div id="printable-document" className="bg-white text-black font-sans p-8 h-full flex flex-col">
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <img src="/logo.png" alt="StarPath Logo" style={{ height: '60px', marginBottom: '15px' }} />
                        <h1 className="text-4xl font-black text-blue-600 mb-2 italic">STARPATH</h1>
                        <p className="text-sm font-bold text-neutral-800">Advanced Logistics & Fulfillment</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-neutral-400 mb-4">INVOICE</h2>
                        <div className="text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <span className="text-neutral-500 font-bold">Number:</span>
                                <span className="text-neutral-900">{invoiceData.invoiceNumber}</span>
                                <span className="text-neutral-500 font-bold">Date:</span>
                                <span className="text-neutral-900">{new Date().toLocaleDateString()}</span>
                                <span className="text-neutral-500 font-bold">Due Date:</span>
                                <span className="text-neutral-900">{invoiceData.dueDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Billed To</h3>
                        <div className="text-sm space-y-1">
                            <p className="font-bold text-lg">{order.customerName}</p>
                            <p className="text-neutral-600">{order.destination.street}</p>
                            <p className="text-neutral-600">{order.destination.city}, {order.destination.state} {order.destination.zip}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Payment Terms</h3>
                        <p className="text-sm text-neutral-600">Net 30. Please include invoice number on all payments.</p>
                        <p className="text-sm text-neutral-600 font-bold mt-2">Ach/Wire Instructions:</p>
                        <p className="text-xs text-neutral-400 font-mono">ABA: 123456789 | ACCT: 987654321</p>
                    </div>
                </div>

                <table className="w-full text-sm mb-12">
                    <thead>
                        <tr className="border-b-2 border-black text-left">
                            <th className="py-2">Description</th>
                            <th className="py-2 text-right">Qty</th>
                            <th className="py-2 text-right">Unit Price</th>
                            <th className="py-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {order.lines.map((line: any, i: number) => (
                            <tr key={i}>
                                <td className="py-4">
                                    <div className="font-bold">{line.item?.sku || line.itemId}</div>
                                    <div className="text-xs text-neutral-500">{line.item?.name || 'Standard Product'}</div>
                                </td>
                                <td className="py-4 text-right font-mono">{line.qtyOrdered}</td>
                                <td className="py-4 text-right font-mono">${(line.unitPrice || 0).toLocaleString()}</td>
                                <td className="py-4 text-right font-mono font-bold">${(line.qtyOrdered * (line.unitPrice || 0)).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-auto border-t-2 border-neutral-100 pt-8 flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-neutral-500">
                            <span>Subtotal</span>
                            <span className="font-mono">${invoiceData.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500">
                            <span>Tax (0%)</span>
                            <span className="font-mono">$0.00</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-blue-600 pt-3 border-t">
                            <span>Total Due</span>
                            <span className="font-mono">${invoiceData.amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 p-4 bg-neutral-50 rounded text-[10px] text-neutral-400 leading-relaxed">
                    All prices are in USD. Payment is due within 30 days. Late payments may be subject to a 1.5% monthly finance charge.
                    StarPath Logistics is any identity of StarPath IOE, LLC.
                </div>
            </div>
        );
    };

    const renderShippingLabel = (shipment: Shipment) => (
        <div id="printable-document" className="bg-white text-black p-4 h-full flex flex-col font-sans border-2 border-dashed border-neutral-300">
            {/* Top Section */}
            <div className="flex border-b-4 border-black pb-4 mb-4">
                <div className="w-1/2">
                    <div className="text-[10px] font-bold">SHIP FROM:</div>
                    <div className="text-xs">
                        StarPath Logistics<br />
                        123 Warehouse Dr.<br />
                        Laredo, TX 78045
                    </div>
                </div>
                <div className="w-1/2 text-right">
                    <img src="/logo.png" alt="StarPath Logo" style={{ height: '30px', float: 'right', marginBottom: '5px' }} />
                    <div style={{ clear: 'both' }}></div>
                    <h1 className="text-4xl font-black italic tracking-tighter">
                        {shipment.carrierId === 'UPS' ? 'UPS' : shipment.carrierId === 'FEDEX' ? 'FedEx' : 'EXPRESS'}
                    </h1>
                    <div className="text-[10px] font-bold uppercase mt-1">Ground Service</div>
                </div>
            </div>

            {/* Ship To Section */}
            <div className="flex-1 border-b-4 border-black mb-4">
                <div className="text-[10px] font-bold">SHIP TO:</div>
                <div className="text-2xl font-black mt-2">
                    {shipment.destination.street.toUpperCase()}<br />
                    {shipment.destination.city.toUpperCase()}, {shipment.destination.state} {shipment.destination.zip}
                </div>
            </div>

            {/* Barcode Section */}
            <div className="flex flex-col items-center justify-center p-4 border-b-4 border-black mb-4 gap-2">
                <div className="h-20 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px)]" />
                <div className="text-lg font-mono font-bold tracking-[10px]">
                    (00) 1 2345678 901234567 8
                </div>
            </div>

            {/* Footer / Tracking Section */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="text-[10px] font-bold">TRACKING #:</div>
                    <div className="text-lg font-mono font-black italic">
                        1Z {shipment.id.slice(0, 15).toUpperCase()}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold">WEIGHT:</div>
                    <div className="text-lg font-black">{shipment.totalWeight} LBS</div>
                </div>
            </div>

            {/* Micro QR Code placeholder */}
            <div className="mt-4 flex justify-between items-center opacity-50">
                <div className="h-10 w-10 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=StarPath')] bg-contain" />
                <div className="text-[8px] max-w-[200px] italic">
                    Certified StarPath Logistics Smart Label.
                    Tamper evident. Real-time sensor active.
                </div>
            </div>
        </div>
    );

    const renderSustainabilityReport = (data: any) => (
        <div id="printable-document" className="bg-white text-black font-sans p-12 h-full flex flex-col">
            <div className="flex justify-between items-start border-b-8 border-emerald-500 pb-8 mb-12">
                <div>
                    <img src="/logo.png" alt="StarPath Logo" style={{ height: '50px', marginBottom: '15px' }} />
                    <h1 className="text-4xl font-black text-emerald-600 mb-2 uppercase">ESG COMPLIANCE</h1>
                    <p className="text-sm font-bold text-neutral-500">QUARTERLY SUSTAINABILITY AUDIT</p>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black text-emerald-500">A+</div>
                    <div className="text-[10px] uppercase font-bold text-neutral-400 mt-2 tracking-[5px]">NETWORK RATING</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="space-y-4">
                    <h2 className="text-lg font-black border-b border-black pb-2">Operational Impact</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm py-2 border-b border-neutral-100">
                            <span>CO2 Emissions Offset</span>
                            <span className="font-bold text-emerald-600">540.2 Tons (100%)</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-neutral-100">
                            <span>Renewable Energy Utilization</span>
                            <span className="font-bold">68.4%</span>
                        </div>
                        <div className="flex justify-between text-sm py-2">
                            <span>Waste Diversion Rate</span>
                            <span className="font-bold">92.1%</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-emerald-50 rounded-2xl">
                    <h3 className="text-xs font-black uppercase text-emerald-800 mb-2">Verified Offsets</h3>
                    <p className="text-[10px] text-emerald-700 leading-relaxed italic">
                        This report confirms that 100% of the scope 1 and scope 2 emissions generated by the StarPath IOE network have been offset via verified reforestation and carbon capture projects (GS-1294).
                    </p>
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-sm font-black uppercase mb-4 tracking-widest">Site Performance Index</h3>
                <div className="space-y-6">
                    {[
                        { name: "LA Facility", rating: "A", co2: "45g/kg", status: "Solar Active" },
                        { name: "Laredo Hub", rating: "A-", co2: "12g/kg", status: "Zero Emission Hub" },
                        { name: "East Coast Node", rating: "B+", co2: "142g/kg", status: "Hydro Powered" }
                    ].map((site, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="text-xl font-black text-emerald-500">{site.rating}</div>
                                <div>
                                    <div className="text-sm font-bold">{site.name}</div>
                                    <div className="text-[10px] text-neutral-400 uppercase font-mono">{site.status}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-mono font-bold text-neutral-800">{site.co2}</div>
                                <div className="text-[8px] text-neutral-400 uppercase">Per KG Shipped</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12 flex justify-between items-end border-t border-neutral-200 pt-8">
                <div className="text-[8px] text-neutral-400 max-w-[400px]">
                    This ESG report is generated by StarPath Intel Core v4.2. Data is aggregated from IoT sensors,
                    utility bills, and telematic integrations across the logistics network. Certified by ESG-Global Standard ISO 14064.
                </div>
                <div className="h-16 w-16 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ESG-VERIFIED')] bg-contain" />
            </div>
        </div>
    );

    const getDocument = () => {
        if (type === 'PICK_SLIP') return renderPickSlip(data as Order);
        if (type === 'PACKING_SLIP') return renderPackingSlip(data as Order);
        if (type === 'BOL') return renderBOL(data as Shipment);
        if (type === 'COC') return renderCOC(data as Order);
        if (type === 'INVOICE') return renderInvoice(data);
        if (type === 'SHIPPING_LABEL') return renderShippingLabel(data as Shipment);
        if (type === 'SUSTAINABILITY_REPORT') return renderSustainabilityReport(data);
        return <div>Invalid Document Type</div>;
    }

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 text-xs">
                {type === 'COC' ? <CheckCircle className="h-3 w-3" /> :
                    type === 'BOL' ? <Printer className="h-3 w-3" /> :
                        type === 'PACKING_SLIP' ? <Package className="h-3 w-3" /> :
                            <FileText className="h-3 w-3" />
                }
                {label || type.replace('_', ' ')}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[800px] h-[90vh] flex flex-col p-0 gap-0 bg-neutral-900 border-neutral-800 text-white">
                    <DialogHeader className="p-4 border-b border-neutral-800 bg-black">
                        <DialogTitle className="flex items-center justify-between">
                            <span>Document Preview: {type}</span>
                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={handlePrint} className="bg-white text-black hover:bg-neutral-200">
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print / Save PDF
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white hover:bg-neutral-800">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-neutral-800 p-8 flex justify-center">
                        <div className="w-[210mm] min-h-[297mm] shadow-2xl origin-top transform scale-90 bg-white">
                            {getDocument()}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
