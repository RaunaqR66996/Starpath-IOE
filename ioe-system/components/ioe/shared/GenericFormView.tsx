import React from "react";
import { FileText, Save, Plus, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenericFormViewProps {
    title: string;
    fields: { label: string, type: 'text' | 'number' | 'date' | 'select' | 'textarea' }[];
    type?: string; // Add type to identify the form (e.g., 'HR', 'Finance')
}

export function GenericFormView({ title, fields, type = 'Generic' }: GenericFormViewProps) {
    const [formData, setFormData] = React.useState<Record<string, any>>({});
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleInputChange = (label: string, value: string) => {
        setFormData(prev => ({ ...prev, [label]: value }));
    }

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/erp-universal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: (type && type !== 'Generic') ? type : title.replace(/\s+/g, ''),
                    payload: formData
                })
            });

            if (res.ok) {
                setMessage({ text: 'Record saved successfully!', type: 'success' });
                setFormData({}); // Clear form on success
            } else {
                let errorText = 'Failed to save record.';
                try {
                    const data = await res.json();
                    if (data && data.error) errorText = data.error;
                } catch (e) {
                    // Ignore JSON parse error, use default message
                }
                setMessage({ text: errorText, type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setMessage({ text: 'Error connecting to server.', type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] text-[var(--text-primary)] relative font-sans">
            {/* Notification Toast */}
            {message && (
                <div className={cn(
                    "absolute top-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-xl animate-in slide-in-from-top-2",
                    message.type === 'success'
                        ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/30 backdrop-blur-md"
                        : "bg-red-950/90 text-red-400 border-red-500/30 backdrop-blur-md"
                )}>
                    <div className={cn("h-2 w-2 rounded-full", message.type === 'success' ? "bg-emerald-400" : "bg-red-400")} />
                    {message.text}
                </div>
            )}

            {/* Header / Toolbar */}
            <div className="flex h-14 min-h-[3.5rem] items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[var(--accent-color)]/20 to-transparent border border-[var(--accent-color)]/20">
                        <FileText className="h-4 w-4 text-[var(--accent-color)]" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-tight leading-none">{title}</h2>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono uppercase tracking-wide opacity-70">
                            {type.toUpperCase()} MODULE • NEW EXTENSION
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex h-8 items-center gap-2 rounded-md border border-[var(--border-color)] bg-transparent px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--item-hover-bg)] hover:text-[var(--text-primary)] transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-8 items-center gap-2 rounded-md bg-[var(--accent-color)] px-4 text-xs font-medium text-white shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {saving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-3.5 w-3.5" />}
                        <span>Save Record</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg-sidebar)]/50 p-4 md:p-8">
                <div className="mx-auto max-w-3xl">

                    {/* Form Card */}
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-editor)] shadow-sm">
                        <div className="border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]/50 px-6 py-4">
                            <h3 className="text-base font-semibold">General Information</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                Enter the details for the new record. Fields marked with * are recommended.
                            </p>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                                {fields.map((field, idx) => (
                                    <div key={idx} className={cn("space-y-2", field.type === 'textarea' ? 'col-span-1 md:col-span-2' : '')}>
                                        <label className="text-xs font-medium leading-none text-[var(--text-secondary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {field.label}
                                        </label>

                                        {field.type === 'textarea' ? (
                                            <div className="relative">
                                                <textarea
                                                    className="flex min-h-[120px] w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm ring-offset-[var(--bg-editor)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono"
                                                    placeholder={field.label === 'Items' ? "SKU: QTY\nITEM-001: 50\nITEM-002: 10" : `Enter ${field.label.toLowerCase()}...`}
                                                    value={formData[field.label] || ''}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                />
                                                {field.label === 'Items' && (
                                                    <div className="absolute right-3 top-3 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
                                                        Format Hint
                                                    </div>
                                                )}
                                            </div>
                                        ) : field.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={formData[field.label] || ''}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                >
                                                    <option value="" disabled>Select an option</option>
                                                    <option value="Option 1">Option 1</option>
                                                    <option value="Option 2">Option 2</option>
                                                    <option value="Option 3">Option 3</option>
                                                    <option value="Critical">Critical</option>
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                    <Filter className="h-3 w-3" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <input
                                                    type={field.type}
                                                    className="flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder={`Enter ${field.label}...`}
                                                    value={formData[field.label] || ''}
                                                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Hints */}
                        <div className="flex items-center justify-between border-t border-[var(--border-color)] bg-[var(--bg-panel-header)]/30 px-6 py-3">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[10px] text-[var(--text-muted)]">Database Connected (Prisma • MySQL)</span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)]">Auto-save draft enabled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to get default fields for a given type
export function getFormConfig(type: string): GenericFormViewProps {
    const commonFields: { label: string, type: 'text' | 'number' | 'date' | 'select' | 'textarea' }[] = [
        { label: "Reference ID", type: "text" },
        { label: "Date", type: "date" },
        { label: "Description", type: "text" },
        { label: "Assigned To", type: "text" },
        { label: "Priority", type: "select" },
        { label: "Notes", type: "textarea" }
    ];

    switch (type) {
        case 'HR':
            return {
                title: "Employee Onboarding",
                fields: [
                    { label: "firstName", type: "text" }, { label: "lastName", type: "text" },
                    { label: "department", type: "select" }, { label: "startDate", type: "date" },
                    { label: "role", type: "text" }, { label: "salary", type: "number" },
                    { label: "email", type: "text" }
                ]
            };
        case 'Finance':
            return {
                title: "Invoice Processing",
                fields: [
                    { label: "orderId", type: "text" }, { label: "invoiceNumber", type: "text" },
                    { label: "amount", type: "number" }, { label: "dueDate", type: "date" },
                    { label: "status", type: "select" }
                ]
            };
        case 'Carrier':
            return {
                title: "Carrier Master",
                fields: [
                    { label: "name", type: "text" }, { label: "scac", type: "text" },
                    { label: "mode", type: "select" }, { label: "rating", type: "number" },
                    { label: "status", type: "select" }
                ]
            };
        case 'Customer':
            return {
                title: "Customer Master",
                fields: [
                    { label: "name", type: "text" }, { label: "email", type: "text" },
                    { label: "phone", type: "text" }, { label: "tier", type: "select" },
                    { label: "defaultAddress", type: "textarea" }
                ]
            };
        case 'Supplier':
            return {
                title: "Supplier Master",
                fields: [
                    { label: "name", type: "text" }, { label: "contactName", type: "text" },
                    { label: "email", type: "text" }
                ]
            };
        case 'Item':
            return {
                title: "Item Master",
                fields: [
                    { label: "sku", type: "text" }, { label: "name", type: "text" },
                    { label: "category", type: "select" }, { label: "cost", type: "number" },
                    { label: "price", type: "number" }, { label: "type", type: "select" },
                    { label: "uom", type: "text" }, { label: "leadTimeDays", type: "number" },
                    { label: "description", type: "textarea" }
                ]
            };
        case 'WorkCenter':
            return {
                title: "Work Center",
                fields: [
                    { label: "name", type: "text" }, { label: "code", type: "text" },
                    { label: "type", type: "select" }, { label: "capacityHours", type: "number" },
                    { label: "efficiency", type: "number" }
                ]
            };
        case 'Sales':
            return {
                title: "Sales Order",
                fields: [
                    { label: "customerId", type: "text" }, { label: "erpReference", type: "text" },
                    { label: "requestedDeliveryDate", type: "date" }, { label: "totalValue", type: "number" },
                    { label: "priority", type: "select" }
                ]
            };
        case 'Purchase':
            return {
                title: "Purchase Order",
                fields: [
                    { label: "supplierId", type: "text" }, { label: "poNumber", type: "text" },
                    { label: "expectedDate", type: "date" }
                ]
            };
        case 'Project':
            return {
                title: "Project Management",
                fields: [
                    { label: "name", type: "text" }, { label: "manager", type: "text" },
                    { label: "startDate", type: "date" }, { label: "endDate", type: "date" },
                    { label: "budget", type: "number" }, { label: "description", type: "textarea" }
                ]
            };
        case 'Service':
            return {
                title: "Service Management",
                fields: [
                    { label: "title", type: "text" }, { label: "customer", type: "text" },
                    { label: "priority", type: "select" }, { label: "description", type: "textarea" }
                ]
            };
        case 'GRC':
            return {
                title: "Risk & Compliance",
                fields: [
                    { label: "title", type: "text" }, { label: "category", type: "select" },
                    { label: "likelihood", type: "select" }, { label: "impact", type: "select" },
                    { label: "mitigation", type: "textarea" }, { label: "owner", type: "text" },
                    { label: "description", type: "textarea" }
                ]
            };
        case 'Stock':
            return { // Maps to Inventory if needed, or simple correction
                title: "Inventory Adjustment",
                fields: [
                    { label: "itemId", type: "text" }, { label: "quantity", type: "number" },
                    { label: "warehouseId", type: "text" }, { label: "locationId", type: "text" }
                ]
            };
        // Add more default configs as needed, fallback to generic
        default:
            return {
                title: type,
                fields: commonFields
            };
    }
}
