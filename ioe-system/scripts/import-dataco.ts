
import fs from 'fs';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CSV_PATH = 'c:\\Users\\Raunaq\\Downloads\\StarPath-06\\DataCoSupplyChainDataset.csv';

// CSV Parsing Helper
function parseCSVLine(line: string): string[] {
    const res: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') { inQuote = !inQuote; continue; } // Skip quotes in value
        if (char === ',' && !inQuote) { res.push(current.trim()); current = ''; }
        else { current += char; }
    }
    res.push(current.trim());
    return res;
}

// Mappings based on inspection
const IDX = {
    TYPE: 0,
    CATEGORY_NAME: 8,
    CUSTOMER_FNAME: 12,
    CUSTOMER_LNAME: 14,
    CUSTOMER_CITY: 9,
    CUSTOMER_COUNTRY: 10,
    CUSTOMER_EMAIL: 11,
    ORDER_ID: 29,
    ORDER_DATE: 28,
    ORDER_STATUS: 42,
    ORDER_REGION: 40,
    PRODUCT_card_id: 44,
    PRODUCT_NAME: 48,
    PRODUCT_PRICE: 49,
    PRODUCT_IMAGE: 47,
    ORDER_QTY: 36,
    SALES_PER_CUSTOMER: 2
};

async function importData() {
    console.log("🚀 STARTING DATA IMPORT FROM:", CSV_PATH);

    if (!fs.existsSync(CSV_PATH)) {
        console.error("❌ File not found!");
        return;
    }

    const fileStream = fs.createReadStream(CSV_PATH, { encoding: 'latin1' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    // Cache to minimize DB lookups
    const itemCache = new Map<string, string>(); // SKU -> ID
    const customerCache = new Map<string, string>(); // Name -> ID
    const orders = new Map<string, any>(); // OrderID -> OrderObj

    let count = 0;
    let limit = 700; // Import 700 lines for demo

    for await (const line of rl) {
        if (count === 0) { count++; continue; } // Header
        if (count > limit) break;

        const cols = parseCSVLine(line);
        if (cols.length < 50) continue; // Malformed or empty line

        // --- 1. ITEM ---
        const sku = `SKU-${cols[IDX.PRODUCT_card_id]}`;
        const name = cols[IDX.PRODUCT_NAME] || "Unknown Item";
        const price = parseFloat(cols[IDX.PRODUCT_PRICE]) || 0;
        const category = cols[IDX.CATEGORY_NAME];
        const image = cols[IDX.PRODUCT_IMAGE];

        if (!itemCache.has(sku)) {
            // Check existence first (to avoid unique constraint error on SKU)
            let item = await prisma.item.findUnique({ where: { sku } });

            if (!item) {
                item = await prisma.item.create({
                    data: {
                        sku,
                        name: name.substring(0, 100),
                        cost: price * 0.7,
                        price: price,
                        type: "BUY",
                        description: `Category: ${category}`,
                        category: category,
                        // image: image 
                        // Note: Schema doesn't have image field? Check later. 
                        // Ignoring image for now as per schema review (unless I missed it)
                    }
                });

                // Initialize Stock
                try {
                    const warehouses = ['Texas', 'Los Angeles', 'Kuehne Nagel East'];
                    for (const wh of warehouses) {
                        // Check if inventory exists
                        // Inventory unique constraint? Usually none, but let's just create.
                        await prisma.inventory.create({
                            data: {
                                itemId: item.id,
                                warehouseId: wh,
                                locationId: `BIN-${Math.floor(Math.random() * 30)}`,
                                quantity: 50 + Math.floor(Math.random() * 50),
                                status: 'AVAILABLE'
                            }
                        });
                    }
                } catch (invErr: any) {
                    // Ignore inventory creation errors (e.g. if run multiple times)
                }
            }
            itemCache.set(sku, item.id);
        }
        const itemId = itemCache.get(sku);


        // --- 2. CUSTOMER ---
        const cName = `${cols[IDX.CUSTOMER_FNAME]} ${cols[IDX.CUSTOMER_LNAME]}`;
        const cEmail = cols[IDX.CUSTOMER_EMAIL] === 'XXXXXXXXX' ? `${cName.replace(/\s/g, '.')}@example.com` : cols[IDX.CUSTOMER_EMAIL];
        const cAddr = {
            street: '123 Supply Chain Blvd',
            city: cols[IDX.CUSTOMER_CITY],
            country: cols[IDX.CUSTOMER_COUNTRY]
        };

        if (!customerCache.has(cName)) {
            // Find by Email (Manual upsert logic since email not unique in schema)
            let cust = await prisma.customer.findFirst({ where: { email: cEmail } });

            if (!cust) {
                cust = await prisma.customer.create({
                    data: {
                        name: cName,
                        email: cEmail,
                        phone: '555-0199',
                        defaultAddress: JSON.stringify(cAddr)
                    }
                });
            }
            customerCache.set(cName, cust.id);
        }
        const customerId = customerCache.get(cName);

        // --- 3. ORDER STRUCTURING ---
        const orderId = cols[IDX.ORDER_ID];
        if (!orders.has(orderId)) {
            let status = 'DRAFT';
            const rawStatus = cols[IDX.ORDER_STATUS];
            if (rawStatus === 'COMPLETE') status = 'SHIPPED';
            if (rawStatus === 'PENDING') status = 'RELEASED';
            if (rawStatus === 'CLOSED') status = 'SHIPPED';
            if (rawStatus === 'PROCESSING') status = 'PACKED';

            orders.set(orderId, {
                erpReference: `SO-${orderId}`,
                customerId,
                customerName: cName,
                status,
                lines: [],
                originId: 'Texas',
                destination: JSON.stringify(cAddr),
                requestedDeliveryDate: new Date(), // Mock today
                totalValue: 0,
                totalWeight: 0
            });
        }

        // Add Line
        const qty = parseInt(cols[IDX.ORDER_QTY]) || 1;
        orders.get(orderId).lines.push({
            itemId,
            qtyOrdered: qty,
            unitPrice: price,
            lineNumber: orders.get(orderId).lines.length + 1
        });

        orders.get(orderId).totalValue += (qty * price);

        count++;
        if (count % 100 === 0) console.log(`Processed ${count} rows...`);
    }

    console.log(`\n💾 SAVING ${orders.size} ORDERS TO DATABASE...`);

    // --- 4. ORDER DB INSERT ---
    let saved = 0;
    for (const [id, data] of orders) {
        try {
            // Check if exists
            const existing = await prisma.order.findUnique({ where: { erpReference: data.erpReference } });
            if (existing) continue;

            await prisma.order.create({
                data: {
                    erpReference: data.erpReference,
                    customerId: data.customerId,
                    customerName: data.customerName,
                    status: data.status,
                    originId: data.originId,
                    destination: data.destination,
                    requestedDeliveryDate: data.requestedDeliveryDate,
                    totalValue: data.totalValue,
                    totalWeight: data.totalWeight,
                    priority: "NORMAL", // Required enum/string
                    lines: {
                        create: data.lines.map((l: any) => ({
                            lineNumber: l.lineNumber,
                            itemId: l.itemId,
                            qtyOrdered: l.qtyOrdered,
                            qtyAllocated: 0,
                            qtyPicked: 0,
                            qtyShipped: 0,
                            unitPrice: l.unitPrice
                        }))
                    }
                }
            });
            saved++;
        } catch (e: any) {
            console.error(`❌ Invoice ${data.erpReference} failed: ${e.message}`);
        }
    }

    console.log(`\n✅ IMPORT COMPLETE!`);
    console.log(`- Scanned Rows: ${count}`);
    console.log(`- Items Cached/Created: ${itemCache.size}`);
    console.log(`- Customers Cached/Created: ${customerCache.size}`);
    console.log(`- Orders Imported: ${saved}`);
}

importData()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
