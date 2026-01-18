import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        let records = [];

        // Map frontend "type" to Prisma Model queries
        switch (type) {
            case 'HR':
                records = await prisma.employee.findMany();
                break;
            case 'Project':
                records = await prisma.project.findMany();
                break;
            case 'GRC':
                records = await prisma.risk.findMany();
                break;
            case 'Service':
                records = await prisma.serviceTicket.findMany();
                break;
            case 'CostMgmt':
                records = await prisma.costCenter.findMany();
                break;
            case 'Purchase':
                records = await prisma.purchaseOrder.findMany({ include: { supplier: true } });
                break;
            case 'Sales':
                records = await prisma.order.findMany({ include: { customer: true } });
                break;
            // Default fallthrough for unsupported types or "All" (which is tricky with strict SQL tables)
            default:
                // For "Universal" view, we might need a specific strategy. 
                // For now, return empty or implement specific aggregation if needed.
                return NextResponse.json({ records: [] });
        }

        return NextResponse.json({ records: records.map(r => ({ ...r, type })) }); // Inject type back for frontend consistency
    } catch (e: any) {
        console.error('Prisma Fetch Error:', e);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, payload } = body;

        let result;

        switch (type) {
            case 'HR':
                result = await prisma.employee.create({
                    data: {
                        firstName: payload['First Name']?.split(' ')[0] || 'Unknown',
                        lastName: payload['Last Name'] || payload['First Name']?.split(' ')[1] || '',
                        role: payload['Role'] || 'Staff',
                        department: payload['Department']?.toString() || 'General',
                        salary: Number(payload['Salary']) || 0,
                        startDate: payload['Start Date'] ? new Date(payload['Start Date']) : new Date(),
                    }
                });
                break;

            case 'Project':
                result = await prisma.project.create({
                    data: {
                        name: payload['Project Name'] || 'New Project',
                        manager: payload['Project Manager'] || 'Unassigned',
                        budget: Number(payload['Budget']) || 0,
                        startDate: payload['Start Date'] ? new Date(payload['Start Date']) : new Date(),
                        endDate: payload['End Date'] ? new Date(payload['End Date']) : undefined,
                        description: payload['Key Milestones'],
                    }
                });
                break;

            case 'GRC':
                result = await prisma.risk.create({
                    data: {
                        title: payload['Risk ID'] || 'New Risk',
                        category: payload['Category']?.toString() || 'General',
                        likelihood: payload['Likelihood']?.toString() || 'Low',
                        impact: payload['Impact Level']?.toString() || 'Low',
                        owner: payload['Owner'] || 'Unassigned',
                        mitigation: payload['Mitigation Strategy']
                    }
                });
                break;

            case 'Service':
                result = await prisma.serviceTicket.create({
                    data: {
                        title: payload['Ticket ID'] || 'New Ticket',
                        customer: payload['Customer'] || 'Internal',
                        priority: payload['Priority']?.toString() || 'Normal',
                        description: payload['Resolution Notes'],
                        assignedTo: payload['Assigned Tech']
                    }
                });
                break;

            case 'Items':
                // Create or Update Item Master
                result = await prisma.item.upsert({
                    where: { sku: payload['SKU'] || 'UNKNOWN' },
                    update: {
                        name: payload['Item Name'] || payload['SKU'],
                        cost: Number(payload['Unit Cost']) || 0,
                    },
                    create: {
                        sku: payload['SKU'] || `ITM-${Date.now()}`,
                        name: payload['Item Name'] || payload['SKU'] || 'New Item',
                        type: 'BUY', // Default
                        cost: Number(payload['Unit Cost']) || 0,
                    }
                });
                break;

            case 'Purchase':
                // 1. Find/Create Supplier
                const vendorName = payload['Vendor Name'] || 'Unknown Vendor';
                let supplier = await prisma.supplier.findFirst({ where: { name: vendorName } });
                if (!supplier) {
                    supplier = await prisma.supplier.create({ data: { name: vendorName } });
                }

                // 2. Create PO
                result = await prisma.purchaseOrder.create({
                    data: {
                        poNumber: payload['Requisition ID'] || `PO-${Date.now()}`,
                        supplierId: supplier.id,
                        status: 'ISSUED',
                        expectedDate: payload['Expected Delivery'] ? new Date(payload['Expected Delivery']) : null,
                    }
                });

                // 3. Process Items & Update Inventory
                const poItemsStr = payload['Items'] || '';
                const poLines = parseItemLines(poItemsStr);

                for (const line of poLines) {
                    // Find/Create Item
                    let item = await prisma.item.findUnique({ where: { sku: line.sku } });
                    if (!item) {
                        item = await prisma.item.create({
                            data: { sku: line.sku, name: line.sku, type: 'BUY', cost: 0 }
                        });
                    }

                    // Update Inventory (Upsert) - Default to 'MAIN' warehouse
                    const whId = 'MAIN';
                    const existingInv = await prisma.inventory.findFirst({ where: { itemId: item.id, warehouseId: whId } });

                    if (existingInv) {
                        await prisma.inventory.update({
                            where: { id: existingInv.id },
                            data: { quantity: existingInv.quantity + line.qty }
                        });
                    } else {
                        await prisma.inventory.create({
                            data: {
                                itemId: item.id,
                                warehouseId: whId,
                                quantity: line.qty
                            }
                        });
                    }
                }
                break;

            case 'Sales':
                // 1. Find/Create Customer
                const custName = payload['Customer Name'] || 'Walk-in';
                let customer = await prisma.customer.findFirst({ where: { name: custName } });
                if (!customer) {
                    customer = await prisma.customer.create({
                        data: { name: custName, defaultAddress: 'TBD' }
                    });
                }

                // 2. Create Order
                result = await prisma.order.create({
                    data: {
                        erpReference: payload['Quote ID'] || `SO-${Date.now()}`,
                        customerId: customer.id,
                        customerName: customer.name,
                        status: 'DRAFT',
                        priority: 'NORMAL',
                        destination: 'TBD',
                        requestedDeliveryDate: payload['Delivery Date'] ? new Date(payload['Delivery Date']) : new Date(),
                        totalValue: Number(payload['Total Value']) || 0,
                        totalWeight: 0,
                        originId: 'MAIN'
                    }
                });

                // 3. Deduct Inventory
                const soItemsStr = payload['Items'] || '';
                const soLines = parseItemLines(soItemsStr);

                for (const line of soLines) {
                    // Find Item
                    const item = await prisma.item.findUnique({ where: { sku: line.sku } });
                    if (item) {
                        const whId = 'MAIN';
                        const existingInv = await prisma.inventory.findFirst({ where: { itemId: item.id, warehouseId: whId } });
                        if (existingInv && existingInv.quantity >= line.qty) {
                            await prisma.inventory.update({
                                where: { id: existingInv.id },
                                data: { quantity: existingInv.quantity - line.qty }
                            });
                        }
                        // Else: Backorder logic (omitted for simplicity, just allow negative or ignore?)
                        // For now, let's just ignore if not enough stock to avoid breaking the "Happy Path" demo.
                    }
                }
                break;

            default:
                return NextResponse.json({ error: `StartPath Database: Module '${type}' not yet mapped to SQL.` }, { status: 400 });
        }

        return NextResponse.json({ success: true, record: result });
    } catch (error: any) {
        console.error('Prisma Write Error:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            const target = error.meta?.target ? `(${error.meta.target})` : '';
            return NextResponse.json({ error: `Duplicate record exists ${target}. Please use a unique ID.` }, { status: 400 });
        }

        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }
}

function parseItemLines(input: string): { sku: string; qty: number }[] {
    if (!input) return [];

    // Split by commas or newlines
    const parts = input.split(/[,;\n]+/);
    const lines: { sku: string; qty: number }[] = [];

    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        // Try "SKU: QTY" format e.g. "ITEM-123: 5"
        const matchColon = trimmed.match(/^([^:]+):\s*(\d+)$/);
        if (matchColon) {
            lines.push({ sku: matchColon[1].trim(), qty: parseInt(matchColon[2], 10) });
            continue;
        }

        // Try "QTYx SKU" format e.g. "5x ITEM-123"
        const matchX = trimmed.match(/^(\d+)x\s*(.+)$/i);
        if (matchX) {
            lines.push({ sku: matchX[2].trim(), qty: parseInt(matchX[1], 10) });
            continue;
        }

        // Default: Assume just "SKU" implies Qty 1
        lines.push({ sku: trimmed, qty: 1 });
    }
    return lines;
}
