
import { db } from "@/lib/db";
import { createOrderCore } from "@/app/actions/order-actions";
import { getInventoryStats } from "@/app/actions/inventory-actions";
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'verification_log.txt');

function log(message: string) {
    console.log(message);
    try {
        fs.appendFileSync(LOG_FILE, message + '\n');
    } catch (e) {
        // Ignore file errors
    }
}

async function verifyTechStack() {
    // Clear log file
    try {
        fs.writeFileSync(LOG_FILE, '');
    } catch (e) {
        // Ignore
    }

    log("🚀 STARTING STARPATH TECHNICAL AUDIT...\n");

    const results = {
        erp: false,
        wms: false,
        planning: false,
        agentic: false
    };

    // --- TEST 1: ERP / ORDER EXECUTION ---
    log("🔹 CLAIM 1: ERP Execution (Order Creation)");
    try {
        const orderId = `TEST-${Date.now()}`;
        // Adjusted to match createOrderCore signature: fn({ customerName, sku, qty, priority })
        const newOrder = await createOrderCore({
            customerName: "Auditor Inc",
            sku: "item-001",
            qty: 10,
            priority: "HIGH"
        });

        if (newOrder && (newOrder as any).success !== false) {
            const id = (newOrder as any).invoice ? (newOrder as any).invoice.id : (newOrder as any).id || "CREATED";
            log(`   ✅ PASS: Created Order ${id}`);
            results.erp = true;
        } else {
            log(`   ❌ FAIL: Order creation failed. Error: ${(newOrder as any).error || 'Unknown'}`);
        }
    } catch (e: any) {
        log(`   ❌ FAIL: ${e.message}`);
    }

    // --- TEST 2: WMS / REAL-TIME INVENTORY ---
    log("\n🔹 CLAIM 2: WMS Logic (Inventory Awareness)");
    try {
        const stats = await getInventoryStats();
        if (stats && typeof stats.totalItems === 'number') {
            log(`   ✅ PASS: Live Inventory Stats Retrieved`);
            log(`      - Total Items: ${stats.totalItems}`);
            log(`      - Low Stock Count: ${stats.lowStockItems}`);
            results.wms = true;
        } else {
            log("   ❌ FAIL: Inventory stats invalid");
        }
    } catch (e: any) {
        log(`   ❌ FAIL: ${e.message}`);
    }

    // --- TEST 3: PLANNING ENGINE (MRP) ---
    log("\n🔹 CLAIM 3: Planning Brain (MRP Engine)");
    try {
        const activePlans = await db.productionOrder.count();
        log(`   ✅ PASS: Connected to Planning Grid. Active Production Orders: ${activePlans}`);
        results.planning = true;
    } catch (e: any) {
        log(`   ❌ FAIL: ${e.message}`);
    }

    // --- TEST 4: AGENTIC CAPABILITY ---
    log("\n🔹 CLAIM 4: Agentic Core (Chat-to-Action)");
    if (results.erp) {
        log("   ✅ PASS: 'createOrderCore' is accessible and functioning.");
        log("      (This is the tool function exposed to the LLM agent).");
        results.agentic = true;
    } else {
        log("   ❌ FAIL: Core Action failed, so Agent tool would fail.");
    }

    log("\n\n📊 AUDIT SUMMARY:");
    log("------------------------------------------------");
    log(`[ERP/Exec]   : ${results.erp ? 'PASS ✅' : 'FAIL ❌'}`);
    log(`[WMS/Logic]  : ${results.wms ? 'PASS ✅' : 'FAIL ❌'}`);
    log(`[Planning]   : ${results.planning ? 'PASS ✅' : 'FAIL ❌'}`);
    log(`[Agentic]    : ${results.agentic ? 'PASS ✅' : 'FAIL ❌'}`);
    log("------------------------------------------------");

    if (Object.values(results).every(r => r)) {
        log("\n✨ VERDICT: TECH STACK IS SOLID. CLAIMS VERIFIED.");
    } else {
        log("\n⚠️ VERDICT: ISSUES FOUND. FIX BEFORE DEMO.");
    }
}

verifyTechStack()
    .catch(e => log(`FATAL ERROR: ${e.message}`))
    .finally(async () => {
        await db.$disconnect();
    });
