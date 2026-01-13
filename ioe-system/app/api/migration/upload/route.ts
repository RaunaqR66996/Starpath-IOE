import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // ITEM, CUSTOMER, INVENTORY

        if (!file || !type) {
            return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let success = 0;
        let errors = 0;
        const errorLog: string[] = [];

        // JOB LOG
        const job = await prisma.importJob.create({
            data: {
                filename: file.name,
                type: type,
                status: 'PROCESSING'
            }
        });

        // PROCESS LOOP
        for (const row of jsonData as any[]) {
            try {
                if (type === 'ITEM') {
                    if (!row.sku || !row.name) throw new Error('Missing SKU or Name');

                    await prisma.item.upsert({
                        where: { sku: row.sku },
                        update: {
                            name: row.name,
                            description: row.description,
                            price: Number(row.price) || 0,
                            cost: Number(row.cost) || 0,
                            category: row.category || 'General'
                        },
                        create: {
                            sku: row.sku,
                            name: row.name,
                            description: row.description || '',
                            price: Number(row.price) || 0,
                            cost: Number(row.cost) || 0,
                            category: row.category || 'General',
                            uom: row.uom || 'EA'
                        }
                    });
                }
                else if (type === 'CUSTOMER') {
                    if (!row.name) throw new Error('Missing Name');
                    // Simple create, simplistic handling of dupes (should fail if unique constraint)
                    // Assuming name is NOT unique, but email might be?
                    await prisma.customer.create({
                        data: {
                            name: row.name,
                            email: row.email,
                            phone: row.phone,
                            address: row.address || 'Unknown',
                            status: 'ACTIVE'
                        }
                    });
                }
                else if (type === 'INVENTORY') {
                    if (!row.sku || !row.qty) throw new Error('Missing SKU or Qty');

                    const item = await prisma.item.findUnique({ where: { sku: row.sku } });
                    if (!item) throw new Error(`SKU ${row.sku} not found`);

                    // Adjust Inventory (Update or Create)
                    // Naive: create a set record or increment?
                    // Let's assume OVERWRITE for migration or ADD? 
                    // Migration usually implies "Initial Balance".

                    await prisma.inventory.create({
                        data: {
                            itemId: item.id,
                            warehouseId: row.warehouse || 'WH-01',
                            quantity: Number(row.qty),
                            locationId: row.location || 'RECEIVING'
                        }
                    });
                }
                success++;
            } catch (err: any) {
                errors++;
                errorLog.push(`Row ${JSON.stringify(row)}: ${err.message}`);
            }
        }

        // UPDATE JOB
        await prisma.importJob.update({
            where: { id: job.id },
            data: {
                status: errors > 0 ? (success > 0 ? 'COMPLETED_WITH_ERRORS' : 'FAILED') : 'COMPLETED',
                successCount: success,
                errorCount: errors,
                errors: JSON.stringify(errorLog.slice(0, 50)) // Limit log size
            }
        });

        return NextResponse.json({ success: true, job });

    } catch (error) {
        console.error('Migration Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
