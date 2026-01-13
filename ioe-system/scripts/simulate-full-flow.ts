
import { createPurchaseOrderCore } from '@/app/actions/procurement-actions';
import { suggestPutawayLocation, executeReceipt } from '@/app/actions/inventory-actions';

async function simulateFullFlow() {
    console.log("🤖 AGENT: Starting Autonomous Dock-to-Stock Sequence...");

    // 1. Create PO
    console.log("\n1️⃣ Creating Purchase Order for SpaceX Heat Tiles...");
    const poRes = await createPurchaseOrderCore({
        supplierName: "SpaceX",
        sku: "STARSHIP-HEAT-TILE",
        qty: 1000
    });

    if (!poRes.success) {
        console.error("❌ PO Creation Failed:", poRes.error);
        return;
    }
    console.log(`✅ PO Created: ${poRes.poNumber} (ID: ${poRes.poId})`);

    // 2. Suggest Putaway (Receive)
    const warehouseId = "Los Angeles";
    console.log(`\n2️⃣ Analyzing Capacity in ${warehouseId}...`);

    // Check if PO exists first (safety)
    const suggestion = await suggestPutawayLocation(warehouseId, "STARSHIP-HEAT-TILE");
    console.log(`💡 Suggestion: Put away in [${suggestion.locationId}] because ${suggestion.reason}`);

    // 3. Execute Receipt
    console.log(`\n3️⃣ Executing Receipt...`);
    const receiptRes = await executeReceipt(poRes.poNumber, warehouseId, suggestion.locationId);

    if (receiptRes.success) {
        console.log(`✨ SUCCESS: 1000x Heat Tiles received into ${warehouseId} at ${suggestion.locationId}.`);
        console.log(`✅ PO ${poRes.poNumber} is CLOSED.`);
    } else {
        console.error("❌ Receipt Failed:", receiptRes.error);
    }
}

simulateFullFlow();
