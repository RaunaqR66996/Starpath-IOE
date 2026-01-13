"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

export async function importProductionPlan(formData: FormData) {
    const file = formData.get("file") as File;

    if (!file) {
        return { success: false, message: "No file provided" };
    }

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        // Assume first sheet contains the plan
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Expected Columns: OrderNumber, Item, Qty, WorkCenter, StartDate, EndDate
        let importedCount = 0;

        for (const row of jsonData as any[]) {
            if (!row.OrderNumber || !row.Item) continue;

            // 1. Ensure Item Exists (Demo: Create if missing)
            let item = await db.item.findUnique({ where: { sku: row.Item } });
            if (!item) {
                item = await db.item.create({
                    data: {
                        sku: row.Item,
                        name: row.Description || `Imported ${row.Item}`,
                        type: 'MAKE',
                        cost: 0,
                    }
                });
            }

            // 2. Upsert Production Order
            const existingOrder = await db.productionOrder.findUnique({
                where: { orderNumber: String(row.OrderNumber) }
            });

            if (existingOrder) {
                // Update
                await db.productionOrder.update({
                    where: { id: existingOrder.id },
                    data: {
                        status: row.Status || 'PLANNED',
                        startDate: new Date(row.StartDate || new Date()),
                        endDate: new Date(row.EndDate || new Date()),
                        quantity: Number(row.Qty) || 0
                    }
                });
            } else {
                // Create
                await db.productionOrder.create({
                    data: {
                        orderNumber: String(row.OrderNumber),
                        itemId: item.id,
                        quantity: Number(row.Qty) || 0,
                        status: row.Status || 'PLANNED',
                        startDate: new Date(row.StartDate || new Date()),
                        endDate: new Date(row.EndDate || new Date())
                    }
                });
            }
            importedCount++;
        }

        revalidatePath("/planning");
        return { success: true, message: `Successfully imported ${importedCount} orders from ${file.name}` };

    } catch (error) {
        console.error("Excel Import Error:", error);
        return { success: false, message: "Failed to process Excel file. Check format." };
    }
}
