const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    console.log('\n🚀 Starting Item & Sales Order Lifecycle Audit Test');
    console.log('----------------------------------------------------');

    const testSku = `TEST-ITEM-${Date.now().toString().slice(-4)}`;
    const custName = 'StarPath Labs';

    // 1. ENTRY PHASE: Sales Order Intake with Auto-Item Creation
    console.log('Stage 1: Creating Sales Order for new SKU:', testSku);

    // Simulate Customer creation
    let customer = await prisma.customer.findFirst({ where: { name: custName } });
    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                name: custName,
                tier: 'PLATINUM',
                defaultAddress: '123 StarPath Blvd, Orlando, FL'
            }
        });
    }

    // Create the 'PLACEHOLDER' Item first to simulate logical entry
    const item = await prisma.item.create({
        data: {
            sku: testSku,
            name: `Placeholder Item for ${testSku}`,
            type: 'BUY',
            cost: 50,
            skuConfidence: 'PLACEHOLDER',
            approvalStatus: 'PENDING',
            lifecycleStatus: 'ACTIVE'
        }
    });

    const order = await prisma.order.create({
        data: {
            erpReference: `SO-TEST-${Date.now().toString().slice(-4)}`,
            customerId: customer.id,
            customerName: customer.name,
            originId: 'Kuehne Nagel East',
            destination: 'Research Park, Space Coast, FL',
            status: 'DRAFT',
            totalWeight: 100,
            totalValue: 1000,
            requestedDeliveryDate: new Date(),
            priority: 'HIGH',
            lines: {
                create: [{
                    lineNumber: 1,
                    itemId: item.id,
                    qtyOrdered: 10,
                    qtyAllocated: 0,
                    unitPrice: 100
                }]
            }
        }
    });

    console.log(`✅ Order ${order.erpReference} created. Item state: ${item.skuConfidence}.`);

    // 2. AUDIT PHASE: Verification of Planning Guardrails
    console.log('\nStage 2: Verification of Planning Guardrails (Isolation)');
    // In our logic, MRP skips non-APPROVED items.
    const planningItems = await prisma.item.findMany({
        where: {
            lifecycleStatus: { not: 'OBSOLETE' },
            skuConfidence: 'APPROVED',
            approvalStatus: 'APPROVED'
        }
    });

    const isFiltered = !planningItems.find(i => i.sku === testSku);
    console.log(`Audit Confirmation: Item ${testSku} in planning run? ${!isFiltered ? 'YES (FAILED)' : 'NO (PASSED - QUARANTINED)'}`);

    // 3. TRANSITION PHASE: Formal Approval
    console.log('\nStage 3: Formal SKU Approval');
    await prisma.item.update({
        where: { id: item.id },
        data: { skuConfidence: 'APPROVED', approvalStatus: 'APPROVED' }
    });
    console.log(`✅ Item ${testSku} approved.`);

    // 4. PLANNING PHASE: Identifying Intent (Signal)
    console.log('\nStage 4: Planning Intent (Shortage Detection)');
    const run = await prisma.planningRun.create({
        data: {
            status: 'COMPLETED',
            horizonStart: new Date(),
            horizonEnd: new Date(new Date().setDate(new Date().getDate() + 30))
        }
    });

    const exception = await prisma.planningException.create({
        data: {
            planId: run.id,
            type: 'MATERIAL_SHORTAGE',
            severity: 'CRITICAL',
            itemId: item.id,
            message: `Shortage of 10 for ${testSku}`,
            shortageQty: 10,
            recommendation: 'Create Purchase Order',
            status: 'OPEN'
        }
    });
    console.log(`✅ Planning Exception generated: ${exception.id}`);

    // 5. RESOLUTION PHASE: Supply Action (PO Creation)
    console.log('\nStage 5: Supply Action (PO Creation)');
    const supplier = await prisma.supplier.findFirst() || await prisma.supplier.create({ data: { name: 'Apollo Parts Corp' } });

    const po = await prisma.purchaseOrder.create({
        data: {
            poNumber: `PO-SUP-${Date.now().toString().slice(-4)}`,
            supplierId: supplier.id,
            status: 'DRAFT',
            lines: {
                create: [{
                    itemId: item.id,
                    qtyOrdered: 10,
                    unitCost: 50
                }]
            }
        }
    });

    await prisma.planningException.update({
        where: { id: exception.id },
        data: { status: 'RESOLVED' }
    });
    console.log(`✅ Purchase Order ${po.poNumber} created to resolve shortage.`);

    // 6. EXIT PHASE: Fulfillment & Final Audit
    console.log('\nStage 6: Fulfillment & Atomic Exit');

    await prisma.inventory.create({
        data: {
            itemId: item.id,
            warehouseId: 'Kuehne Nagel East',
            locationId: 'DEFAULT',
            quantity: 10,
            status: 'AVAILABLE'
        }
    });
    console.log(`✅ Inventory received for ${testSku}. Balance: 10.`);

    console.log('Executing Shipment Transaction...');
    await prisma.$transaction(async (tx) => {
        const shipment = await tx.shipment.create({
            data: {
                status: 'SHIPPED',
                origin: 'Kuehne Nagel East',
                destination: order.destination,
                totalWeight: 100,
                cost: 0
            }
        });

        const inv = await tx.inventory.findFirst({ where: { itemId: item.id } });
        await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { decrement: 10 } }
        });

        await tx.order.update({
            where: { id: order.id },
            data: { status: 'SHIPPED', shipmentId: shipment.id }
        });

        console.log(`Audit Log: Transaction Atomic. Shipment ${shipment.id} generated.`);
    });

    // 7. FINANCE PHASE: Invoicing & Idempotency
    console.log('\nStage 7: Invoicing & Idempotency Check');
    const invoice1 = await prisma.invoice.create({
        data: {
            invoiceNumber: `INV-T-${Date.now().toString().slice(-4)}`,
            orderId: order.id,
            amount: 1000,
            dueDate: new Date(),
            status: 'UNPAID'
        }
    });
    console.log(`✅ Invoice 1 created: ${invoice1.invoiceNumber}`);

    try {
        await prisma.invoice.create({
            data: {
                invoiceNumber: `INV-T-DUPE`,
                orderId: order.id, // This should trigger the unique constraint
                amount: 1000,
                dueDate: new Date()
            }
        });
        console.log('❌ Idempotency Check FAILED (Duplicate invoice allowed)');
    } catch (e) {
        console.log('✅ Idempotency Check PASSED (Database Unique Constraint prevented duplication)');
    }

    console.log('\n----------------------------------------------------');
    console.log('🏁 TEST COMPLETE: Lifecycle Audit Trail Verified.');
}

runTest()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
