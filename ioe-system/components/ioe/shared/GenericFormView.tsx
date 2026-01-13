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
                    type: title.replace(/\s+/g, ''), // Simple normalization for type key if not provided
                    payload: formData
                })
            });

            if (res.ok) {
                setMessage({ text: 'Record saved successfully!', type: 'success' });
                setFormData({}); // Clear form on success
            } else {
                setMessage({ text: 'Failed to save record.', type: 'error' });
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
                    { label: "First Name", type: "text" }, { label: "Last Name", type: "text" },
                    { label: "Department", type: "select" }, { label: "Start Date", type: "date" },
                    { label: "Role", type: "text" }, { label: "Salary", type: "number" },
                    ...commonFields.slice(5)
                ]
            };
        case 'Finance':
            return {
                title: "Invoice Processing",
                fields: [
                    { label: "Vendor", type: "text" }, { label: "Invoice Number", type: "text" },
                    { label: "Amount", type: "number" }, { label: "Due Date", type: "date" },
                    { label: "GL Account", type: "select" }, { label: "Approval Status", type: "select" },
                    ...commonFields.slice(5)
                ]
            };
        case 'Carrier':
            return {
                title: "Carrier Contract",
                fields: [
                    { label: "Carrier Name", type: "text" }, { label: "MC Number", type: "text" },
                    { label: "Service Type", type: "select" }, { label: "Contract Rate", type: "number" },
                    { label: "Insurance Expiry", type: "date" }, { label: "Lane Preference", type: "text" },
                    ...commonFields.slice(5)
                ]
            };
        case 'CostMgmt':
            return {
                title: "Cost Management",
                fields: [
                    { label: "Cost Center", type: "text" }, { label: "Allocation Method", type: "select" },
                    { label: "Amount", type: "number" }, { label: "Period", type: "date" },
                    { label: "Variance Type", type: "select" }, { label: "Comments", type: "textarea" },
                    ...commonFields.slice(5)
                ]
            };
        case 'TimeAtt':
            return {
                title: "Time & Attendance",
                fields: [
                    { label: "Employee ID", type: "text" }, { label: "Shift Date", type: "date" },
                    { label: "Clock In", type: "text" }, { label: "Clock Out", type: "text" },
                    { label: "Total Hours", type: "number" }, { label: "Overtime Reason", type: "textarea" }
                ]
            };
        case 'PLM':
            return {
                title: "Product Lifecycle",
                fields: [
                    { label: "Product ID", type: "text" }, { label: "Revision", type: "text" },
                    { label: "Change Request ID", type: "text" }, { label: "Change Type", type: "select" },
                    { label: "Approver", type: "text" }, { label: "Impact Analysis", type: "textarea" }
                ]
            };
        case 'Sales':
            return {
                title: "Sales Order",
                fields: [
                    { label: "Customer Name", type: "text" }, { label: "Quote ID", type: "text" },
                    { label: "Items", type: "textarea" }, { label: "Discount %", type: "number" },
                    { label: "Total Value", type: "number" }, { label: "Delivery Date", type: "date" }
                ]
            };
        case 'Purchase':
            return {
                title: "Purchase Order",
                fields: [
                    { label: "Vendor Name", type: "text" }, { label: "Requisition ID", type: "text" },
                    { label: "Items", type: "textarea" }, { label: "Currency", type: "select" },
                    { label: "Total Cost", type: "number" }, { label: "Expected Delivery", type: "date" },
                    { label: "Payment Terms", type: "text" }, { label: "Approver", type: "text" }
                ]
            };
        case 'Items':
            return {
                title: "Item Master",
                fields: [
                    { label: "SKU", type: "text" }, { label: "Item Name", type: "text" },
                    { label: "Category", type: "select" }, { label: "Unit Cost", type: "number" },
                    { label: "Selling Price", type: "number" }, { label: "Supplier", type: "text" },
                    { label: "Stock Level", type: "number" }, { label: "Reorder Point", type: "number" },
                    { label: "Description", type: "textarea" }
                ]
            };
        case 'Project':
            return {
                title: "Project Management",
                fields: [
                    { label: "Project Name", type: "text" }, { label: "Project Manager", type: "text" },
                    { label: "Start Date", type: "date" }, { label: "End Date", type: "date" },
                    { label: "Budget", type: "number" }, { label: "Key Milestones", type: "textarea" }
                ]
            };
        case 'Service':
            return {
                title: "Service Management",
                fields: [
                    { label: "Ticket ID", type: "text" }, { label: "Customer", type: "text" },
                    { label: "Issue Type", type: "select" }, { label: "Priority", type: "select" },
                    { label: "Assigned Tech", type: "text" }, { label: "Resolution Notes", type: "textarea" }
                ]
            };
        case 'GRC':
            return {
                title: "Risk & Compliance",
                fields: [
                    { label: "Risk ID", type: "text" }, { label: "Category", type: "select" },
                    { label: "Likelihood", type: "select" }, { label: "Impact Level", type: "select" },
                    { label: "Mitigation Strategy", type: "textarea" }, { label: "Owner", type: "text" }
                ]
            };
        case 'Admin':
            return {
                title: "System Administration",
                fields: [
                    { label: "User ID", type: "text" }, { label: "Role", type: "select" },
                    { label: "Access Level", type: "select" }, { label: "Department", type: "text" },
                    { label: "Last Audit", type: "date" }, { label: "Permissions", type: "textarea" }
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
