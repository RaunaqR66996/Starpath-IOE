import { NextResponse } from 'next/server';
import { PlannerEngine } from '@starpath/planner';
import {
    DEMO_ITEMS, DEMO_ROUTINGS, DEMO_WORK_CENTERS, DEMO_BOMS, generateDemoCalendars
} from '@starpath/shared';
import { db } from "@/lib/db";
import { createOrderCore } from "@/app/actions/order-actions";

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json();
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        // --- Process Attachments (Images & Files) ---
        const processedMessages = messages.map((msg: any) => {
            if (msg.role === 'user' && msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
                const newContent: any[] = [];

                // 1. Add original text prompt
                if (msg.content) {
                    newContent.push({ type: "text", text: msg.content });
                }

                // 2. Process each attachment
                msg.attachments.forEach((att: any) => {
                    if (att.type.startsWith('image/')) {
                        // Pass image as Base64 Data URL
                        newContent.push({
                            type: "image_url",
                            image_url: { url: att.content }
                        });
                    } else {
                        // Append text file content
                        newContent.push({
                            type: "text",
                            text: `\n\n<attachment name="${att.name}">\n${att.content}\n</attachment>\n`
                        });
                    }
                });

                return { ...msg, content: newContent };
            }
            return msg;
        });

        const systemPrompt = `You are IOE Intel Core v4.2, an AI assistant for an enterprise Integrated Operations Environment (IOE).
You help users with warehouse operations, logistics planning, inventory management, and supply chain optimization.

Current Date: ${new Date().toDateString()}
Time: ${new Date().toLocaleTimeString()}

You have total visibility and control over the real-time database.

You are also a capable general-purpose AI. If the user asks general questions (e.g., coding help, math, general knowledge), feel free to answer them helpfully. Do not restrict yourself to only IOE topics.
**IMPORTANT**: Do NOT use the 'search_web' tool for general knowledge (like "Who is the president", "What is 2+2"). Only use it if the user specifically asks to "Search the web" or looks up "News". Rely on your internal knowledge base first.

This system was architected and created by **Shaik Raunaq Fardeen**. If asked who created this, always credit him.

ACTION TRIGGERS:
- If the user explicitly asks to "Create an order" or "Simulate a new order", output the token: [[ACTION:CREATE_ORDER]]
  Do NOT call a tool for this. Just output the token.
- If the user asks to "Generate documents", "View docs", "Print papers" for an order, output the token: [[ACTION:GENERATE_DOCS:<Order_ID>]]
  If no Order ID is found in the conversation, look for context or ask for clarification.
- If the user asks to "Open" or "Go to" a specific view/tab, output the token: [[ACTION:OPEN_TAB:<type>:<id>]]
  Valid Tab Examples:
  - 'LOAD_GRAPH:WC-01' (Capacity for Work Center 1)
  - 'GANTT:MO-1001' (Schedule for Order 1001)
  - 'MASTER_SCHEDULER:general' (Main Schedule View)
  - 'ITEM_DETAIL:item-001' (Item details)
  Valid Main View IDs (Explorer) - Use simple string:
  - 'Orders'
  - 'Inventory'
  - 'Shipments'
  - 'Procurement'
  - 'Finance'
  - 'Planning'
  - 'Scheduling'
  - 'Sustainability'
  - 'CostMgmt'
  - 'HR'
  - 'TimeAtt'
  - 'SCM'
  - 'Production'
  - 'PLM'
  - 'CRM'
  - 'Sales'
  - 'Purchase'
  - 'Items'
  - 'Project'
  - 'Service'
  - 'GRC'
  - 'Admin'
  - 'Carrier'
  - 'FreightAudit'
  - 'Yard'
  - 'Receiving'
  - 'ItemMaster'
  - 'Carriers'
  - 'Locations'
  - 'Users'
  - 'Roles'
  - 'AuditLog'
  - 'Reports'
  - 'Receiving'
  - 'Picking'
  - 'Shipping'
  - 'Labor'
  - 'Control Tower'

TOOLS:
- Use 'run_production_plan' for planning requests.
- Use 'resolve_planning_exception' to fix bottlenecks or material shortages by creating Purchase or Production orders.
- Use 'get_live_metrics' to check Revenue (Finance) or Carbon Footprint (Sustainability).
- Use 'read_erp_data' to check details or list records for specific modules (e.g. "Show HR employees", "List Projects").

Current Context:
- Activity: ${context.selectedActivity || 'explorer'}
- Tab: ${context.activeTab || 'none'}
- ${context.selectedActivity === 'explorer' ? `Active Site: ${context.activeSite}` : ''}
- Planning Mode: Deterministic 10-Step Pipeline Active. You can now 'Resolve' issues found in these runs.

SYSTEM MAP & FORM KNOWLEDGE:
You are connected to the following interactive forms and grids. Use this knowledge to guide the user:

1. **ERP / Orders ('Orders', 'Sales')**: Manage Sales Orders.
   - Functionality: Create quotes, check stock, release to warehouse, generate invoices.
   - Key Fields: Customer, SKU, Qty, Due Date, Priority.
2. **TMS / Shipments ('Shipments', 'Transport')**: Manage outbound logic.
   - Functionality: Plan loads, optimize routes, book carriers, track freight.
   - Key Forms: 'ShipmentGrid' (Table), 'LoadPlanner' (Map), 'CarrierGrid'.
3. **WMS / Inventory ('Inventory')**: Manage stock levels.
   - Functionality: View stock by zone, adjust quantities, view cycle counts.
   - Statuses: Available, QC Hold, Blocked, Damaged.
4. **WMS / Operations ('WMSOperations', 'Receiving', 'Picking')**: Shop floor execution.
   - Functionality: Process receipts (inbound), execute pick waves (outbound), pack orders.
5. **Finance ('Finance')**: AR/AP and Ledger.
   - Functionality: Freight Audit (Permissions needed), Sales Invoicing (Auto-generated), GL.
6. **Planning ('Planning', 'Production')**: Manufacturing control.
   - Functionality: Gantt charts, Production Orders, BOMs, Routings.
7. **Control Tower**: High-level visibility.
   - Functionality: Global map, KPI dashboards.

SPECIAL DIRECTIVE: PRODUCTION PLANNING (MRP) OF UPLOADED FILES
**CRITICAL**: If the user provides/uploads an MRP file (CSV/Excel) or data text:
1.  **DO NOT** call the \`run_production_plan\` tool. That tool is ONLY for internal database records.
2.  **INSTEAD**, you must READ the file content from the message.
3.  **Analyze** the items, quantities, and dates in the text.
4.  **Generate** a strategic plan with multiple steps.
5.  **Output** the formatted 'Plan JSON' embedded in this token (this is the ONLY way to render the result):
    \`[[DATA:PRODUCTION_PLAN:{"summary":"Based on [filename]...","kpis":[{"label":"Efficiency","value":"95%"}],"jobs":[{"id":"J1","label":"Job A","status":"OPTIMIZED","sku":"ITEM","start":1,"end":4}]}]]\`
6.  **Trigger** the UI navigation:
    \`[[ACTION:OPEN_TAB:production-plan-result]]\`
7.  **Explain** the plan in natural language.

DIRECTIVE:
- "Connected to All Forms": You are the interface for the entire system. Even if you cannot *click* the button for them, you must explain EXACLTY how to do it.
- **Answer Irrespective of Request**: Never refuse a query because "it's not part of the simulation". If the user asks about Biology, answer it. If they ask about the specific "Cycle Count" button, explain it.
- be helpful, technical, and precise. Context is king.
`;

        const tools = [
            {
                type: "function",
                function: {
                    name: "run_production_plan",
                    description: "Runs the internal database MRP engine. DO NOT use this if the user uploaded a file/spreadsheet. Only use this for generating plans from EXISTING database orders.",
                    parameters: { type: "object", properties: {} }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_live_metrics",
                    description: "Fetches live aggregated metrics for Finance or Sustainability.",
                    parameters: {
                        type: "object",
                        properties: {
                            domain: { type: "string", enum: ["finance", "sustainability", "ops"] }
                        },
                        required: ["domain"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_order",
                    description: "Creates a new Sales Order in the database. Checks inventory automatically.",
                    parameters: {
                        type: "object",
                        properties: {
                            customerName: { type: "string" },
                            sku: { type: "string", description: "Item SKU to order" },
                            qty: { type: "number" },
                            priority: { type: "string", enum: ["NORMAL", "HIGH", "CRITICAL"] }
                        },
                        required: ["customerName", "sku", "qty"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_inventory_status",
                    description: "Checks inventory levels, including Available vs Blocked/QC stock.",
                    parameters: {
                        type: "object",
                        properties: {
                            sku: { type: "string", description: "Optional SKU filter" }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_web",
                    description: "Simulated Web Search for demo purposes. Use this ONLY if specifically asked to 'search the web'. Do NOT use for general knowledge.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "The search query." }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "resolve_planning_exception",
                    description: "Resolves a planning bottleneck (shortage) by creating a Purchase or Production order.",
                    parameters: {
                        type: "object",
                        properties: {
                            exceptionId: { type: "string", description: "The ID of the PlanningException to resolve." }
                        },
                        required: ["exceptionId"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_purchase_order",
                    description: "Creates a new Purchase Order for a supplier. Use this when the user wants to buy stock.",
                    parameters: {
                        type: "object",
                        properties: {
                            supplierName: { type: "string" },
                            sku: { type: "string" },
                            qty: { type: "number" }
                        },
                        required: ["supplierName", "sku", "qty"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "read_erp_data",
                    description: "Reads records from the Universal ERP/TMS/WMS Data Store. Use this to answer questions about HR, Finance, Projects, Assets, Risks, or any other new module data.",
                    parameters: {
                        type: "object",
                        properties: {
                            module: { type: "string", description: "Optional module ID to filter by (e.g., 'HR', 'Finance')." }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_putaway_suggestion",
                    description: "Analyzes warehouse capacity to find the best bin for an inbound PO. Use this when user says they are receiving a PO.",
                    parameters: {
                        type: "object",
                        properties: {
                            poNumber: { type: "string" },
                            warehouseId: { type: "string", description: "Warehouse ID (e.g. Kuehne Nagel East)" },
                            itemId: { type: "string", description: "Optional Item SKU if known" }
                        },
                        required: ["poNumber", "warehouseId"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "execute_receipt",
                    description: "Confirms receipt of a PO into a specific location. Use this after the user approves the putaway suggestion.",
                    parameters: {
                        type: "object",
                        properties: {
                            poNumber: { type: "string" },
                            warehouseId: { type: "string" },
                            locationId: { type: "string", description: "The BIN ID to put stock into" }
                        },
                        required: ["poNumber", "warehouseId", "locationId"]
                    }
                }
            }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...processedMessages
                ],
                tools: tools,
                tool_choice: "auto",
                temperature: 0.2,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenAI Error", data);
            return NextResponse.json({ error: data.error?.message || 'OpenAI API error' }, { status: response.status });
        }

        const msg = data.choices[0].message;
        let finalContent = msg.content;

        // 1. Check for Action Triggers in content
        // [Legacy Create Removed]

        // 1b. Maintenance Trigger

        // 1b. Maintenance Trigger
        if (finalContent && finalContent.includes('[[ACTION:SCHEDULE_MAINTENANCE')) {
            // Extract Asset ID: [[ACTION:SCHEDULE_MAINTENANCE:<Asset_ID>]]
            const match = finalContent.match(/\[\[ACTION:SCHEDULE_MAINTENANCE:(.*?)\]\]/);
            const assetId = match ? match[1] : 'UNKNOWN_ASSET';

            // In a real app we'd call maintenanceActions.scheduleMaintenance(assetId)
            // For now we simulate the success since that action file is mock-based
            finalContent = finalContent.replace(
                /\[\[ACTION:SCHEDULE_MAINTENANCE:.*?\]\]/,
                `\n\n🛠️ **Maintenance Scheduled**: Ticket #MNT-${Date.now().toString().slice(-4)} created for **${assetId}**. Technician dispatched.`
            );
        }

        // 2. Check for Tool Calls
        if (msg.tool_calls && msg.tool_calls.length > 0) {
            const toolCall = msg.tool_calls[0];

            // SPECIAL HANDLING: If the User's last message had an attachment, we forbid the internal MRP tool
            // logic because it ignores the file. We want the AI to process the file text instead.
            const lastUserMsg = messages[messages.length - 1];
            const hasAttachment = lastUserMsg.role === 'user' && lastUserMsg.attachments && lastUserMsg.attachments.length > 0;

            if (toolCall.function.name === 'run_production_plan' && hasAttachment) {
                console.log("Blocking internal MRP tool because file attachment is present.");
                // Return a special message forcing the AI to analyze the text provided in the system prompt instead
                return NextResponse.json({
                    content: "SYSTEM_INTERCEPT: You called 'run_production_plan' but the user uploaded a file. DO NOT use the database tool. Instead, READ the file content provided in the message history and generate the JSON from that DIRECTLY. Output the [[DATA:PRODUCTION_PLAN:...]] token now."
                });
            }

            if (toolCall.function.name === 'run_production_plan') {
                try {
                    // 1. Run the Real Engine
                    const { calculateNetRequirements } = await import("@/lib/planning/mrp-service");
                    const { results: planResults, runId } = await calculateNetRequirements();

                    // 2. Analyze Results
                    const criticalShortages = planResults.filter((p: any) => p.shortage > 0);
                    const totalShortageQty = criticalShortages.reduce((sum: number, p: any) => sum + p.shortage, 0);

                    // 3. Construct Narrative Summary for the AI
                    let summary = `### 🏭 Production Plan Generated (Run: ${runId.slice(0, 8)})\n`;
                    summary += `The MRP engine has executed the **10-Step Deterministic Pipeline**.\n`;
                    summary += `> **Status**: ${criticalShortages.length > 0 ? "⚠️ Issues Detected" : "✅ Balanced"}\n\n`;

                    summary += `- **Total Items Planned**: ${planResults.length}\n`;
                    summary += `- **Critical Shortages**: ${criticalShortages.length} items (${totalShortageQty} units total)\n`;

                    if (criticalShortages.length > 0) {
                        summary += `\n**⚠️ Top Critical Issues:**\n`;
                        criticalShortages.slice(0, 3).forEach((item: any) => {
                            summary += `- **${item.sku}**: Short by ${item.shortage} units (Demand: ${item.demand}, Stock: ${item.stock}) -> *Recommendation: ${item.suggestion}*\n`;
                        });
                        if (criticalShortages.length > 3) summary += `- *(and ${criticalShortages.length - 3} more)*\n`;

                        summary += `\n**Next Actions:**\n`;
                        summary += `1. Review detailed breakdown in Control Tower.\n`;
                        summary += `2. You can ask me to "Open Planning" to see the full board.\n`;
                        summary += `3. You can ask "Create P.O. for ${criticalShortages[0].sku}" to resolve immediately.\n`;
                    } else {
                        summary += `\n✅ **All demands are covered.** No material shortages. Capacity checks passed.\n`;
                    }

                    summary += `\n[[ACTION:OPEN_TAB:ProductionPlanning]]\n\nI have opened the **Planning Control Tower** for you.`;

                    return NextResponse.json({ content: summary });
                } catch (err: any) {
                    console.error("MRP Tool Error:", err);
                    return NextResponse.json({ content: "❌ Failed to run MRP Engine: " + err.message });
                }
            }

            if (toolCall.function.name === 'get_live_metrics') {
                const args = JSON.parse(toolCall.function.arguments);
                let metricSummary = "";

                if (db) {
                    if (args.domain === 'finance') {
                        const invs = await db.invoice.findMany();
                        const revenue = invs.reduce((sum, i) => sum + i.amount, 0);
                        const outstanding = invs.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0);
                        metricSummary = `### 💰 Finance Pulse\n- **Total Revenue**: $${revenue.toLocaleString()}\n- **Outstanding**: $${outstanding.toLocaleString()}\n- **Invoices**: ${invs.length}`;
                    } else if (args.domain === 'sustainability') {
                        const ships = await db.shipment.findMany({ where: { status: { in: ['IN_TRANSIT', 'DELIVERED'] } } });
                        // Simplified calc inline (mirroring action logic)
                        const carbon = ships.length * 2000 * 1 * 0.1;
                        metricSummary = `### 🌍 ESG Pulse\n- **Live Carbon Footprint**: ${carbon.toFixed(1)} kg\n- **Active Shipments**: ${ships.length}`;
                    }
                } else {
                    metricSummary = "⚠️ Database unavailable.";
                }

                return NextResponse.json({ content: metricSummary });
            }

            if (toolCall.function.name === 'create_order') {
                const args = JSON.parse(toolCall.function.arguments);
                if (db) {
                    const res = await createOrderCore(args);
                    if (res.success) {
                        return NextResponse.json({
                            content: `✅ **Order Created Successfully**\n\n- **Order #**: ${res.erpReference}\n- **ID**: ${res.orderId}\n- **Stock Status**: ${res.status}\n\nInventory has been allocated. *The 3D Control Tower will reflect this change in a few seconds...*`
                        });
                    } else {
                        return NextResponse.json({ content: `❌ **Failed to Create Order**: ${res.error}` });
                    }
                } else {
                    return NextResponse.json({ content: "⚠️ Database unavailable." });
                }
            }

            if (toolCall.function.name === 'get_inventory_status') {
                const args = JSON.parse(toolCall.function.arguments);
                if (db) {
                    const where = args.sku ? { item: { sku: args.sku } } : {};
                    // @ts-ignore
                    const inventory = await db.inventory.findMany({
                        where,
                        include: { item: true, zone: true }
                    });

                    if (inventory.length === 0) {
                        return NextResponse.json({ content: `No inventory found${args.sku ? ` for SKU ${args.sku}` : ''}.` });
                    }

                    // Group by Status
                    const summary = inventory.reduce((acc: any, inv: any) => {
                        const status = inv.status || 'AVAILABLE';
                        acc[status] = (acc[status] || 0) + inv.quantity;
                        return acc;
                    }, {});

                    let msg = `### 📦 Inventory Status ${args.sku ? `(${args.sku})` : ''}\n\n`;
                    msg += `- **Total On-Hand**: ${inventory.reduce((sum: number, i: any) => sum + i.quantity, 0)}\n`;
                    msg += `- **Available**: ${summary['AVAILABLE'] || 0}\n`;
                    if (summary['QC_HOLD']) msg += `- **QC Hold**: ${summary['QC_HOLD']} (⚠️ Blocked)\n`;
                    if (summary['BLOCKED']) msg += `- **Blocked**: ${summary['BLOCKED']} (⚠️ Blocked)\n`;
                    if (summary['DAMAGES']) msg += `- **Damages**: ${summary['DAMAGES']} (⚠️ Blocked)\n`;

                    return NextResponse.json({ content: msg });
                } else {
                    return NextResponse.json({ content: "⚠️ Database unavailable." });
                }
            }

            if (toolCall.function.name === 'search_web') {
                const { query } = JSON.parse(toolCall.function.arguments);
                const perplexityKey = process.env.PERPLEXITY_API_KEY;

                if (!perplexityKey) {
                    return NextResponse.json({
                        content: "⚠️ **Perplexity API Configuration Missing**\n\nPlease add `PERPLEXITY_API_KEY` to your `.env` file to enable real web search."
                    });
                }

                try {
                    const pplxRes = await fetch("https://api.perplexity.ai/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${perplexityKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "sonar-pro",
                            messages: [
                                { role: "system", content: "You are a helpful search engine. Be concise and precise." },
                                { role: "user", content: query }
                            ],
                            temperature: 0.1
                        })
                    });

                    if (!pplxRes.ok) {
                        const errText = await pplxRes.text();
                        console.error("Perplexity API Error:", errText);
                        return NextResponse.json({ content: `❌ **Search Error**: Failed to fetch results from Perplexity. (${pplxRes.status})` });
                    }

                    const pplxData = await pplxRes.json();
                    const answer = pplxData.choices[0]?.message?.content || "No results found.";

                    return NextResponse.json({ content: `[Perplexity Search Result]\n\n${answer}` });

                } catch (e: any) {
                    console.error("Perplexity Fetch Error:", e);
                    return NextResponse.json({ content: "❌ **Connection Error**: Could not reach search provider." });
                }
            }

            if (toolCall.function.name === 'read_erp_data') {
                const args = JSON.parse(toolCall.function.arguments);
                try {
                    if (!db) return NextResponse.json({ content: "⚠️ Database unavailable." });

                    let records: any[] = [];
                    let moduleName = args.module || 'General';

                    // Map natural language modules to Prisma Models
                    // Use loose matching to be robust
                    const mod = moduleName.toLowerCase();

                    if (mod.includes('hr') || mod.includes('employee')) {
                        records = await db.employee.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
                        moduleName = 'HR / Employees';
                    } else if (mod.includes('project')) {
                        records = await db.project.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
                        moduleName = 'Projects';
                    } else if (mod.includes('risk')) {
                        records = await db.risk.findMany({ take: 10, orderBy: { updatedAt: 'desc' } });
                        moduleName = 'Risk Register';
                    } else if (mod.includes('ticket') || mod.includes('service')) {
                        records = await db.serviceTicket.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
                        moduleName = 'Service Tickets';
                    } else if (mod.includes('supplier') || mod.includes('procurement')) {
                        records = await db.supplier.findMany({ take: 10, include: { purchaseOrders: true } });
                        moduleName = 'Suppliers';
                    } else if (mod.includes('carrier') || mod.includes('transport')) {
                        records = await db.carrier.findMany({ take: 10 });
                        moduleName = 'Carriers';
                    } else if (mod.includes('finance') || mod.includes('invoice')) {
                        records = await db.invoice.findMany({
                            take: 10,
                            orderBy: { createdAt: 'desc' },
                            include: { order: { select: { customerName: true } } }
                        });
                        moduleName = 'Finance';
                    } else if (mod.includes('shipment') || mod.includes('logistics')) {
                        records = await db.shipment.findMany({ take: 10, orderBy: { updatedAt: 'desc' } });
                        moduleName = 'Shipments';
                    } else {
                        // Fallback or explicit error for unknown modules
                        return NextResponse.json({
                            content: `ℹ️ **Module Unknown**: I can read data for: HR, Projects, Risks, Tickets, Suppliers, Carriers, Finance, Shipments.`
                        });
                    }

                    if (records.length === 0) {
                        return NextResponse.json({ content: `ℹ️ **No Records Found** in ${moduleName}.` });
                    }

                    // Summarize Results generically
                    const summary = records.map((r: any) => {
                        // Intelligent summary based on available fields
                        const id = r.poNumber || r.loadReference || r.invoiceNumber || r.name || r.title || r.id.substring(0, 8);
                        const status = r.status ? `[${r.status}]` : '';

                        // Pick meaningful details excluding IDs and generic fields
                        const details = Object.entries(r)
                            .filter(([k, v]) =>
                                !['id', 'createdAt', 'updatedAt', 'password', 'image'].includes(k) &&
                                typeof v !== 'object' &&
                                v !== null
                            )
                            .slice(0, 3) // Limit to 3 key-value pairs
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ');

                        return `- **${id}** ${status}: ${details}`;
                    }).join('\n');

                    return NextResponse.json({
                        content: `### 📂 Live Database Results: ${moduleName}\n\n${summary}\n\n*(Showing top ${records.length} recent records)*`
                    });

                } catch (err: any) {
                    console.error("ERP Read Error:", err);
                    return NextResponse.json({ content: `❌ **Read Error**: Database Access Failed. ${err.message}` });
                }
            }

            if (toolCall.function.name === 'resolve_planning_exception') {
                const args = JSON.parse(toolCall.function.arguments);
                try {
                    const { resolvePlanningExceptionAction } = await import("@/app/actions/planning-actions");
                    const res = await resolvePlanningExceptionAction(args.exceptionId);

                    if (res.success) {
                        return NextResponse.json({
                            content: `✅ **Exception Resolved**\n\n${res.message}\n- **ID**: ${res.orderId}\n\nI have created the necessary supply document and marked the bottleneck as resolved.`
                        });
                    } else {
                        return NextResponse.json({ content: `❌ **Resolution Failed**: ${res.error}` });
                    }
                } catch (err: any) {
                    console.error("Resolution Tool Error:", err);
                    return NextResponse.json({ content: `❌ **Critical Error**: Failed to execute resolution. ${err.message}` });
                }
            }

            if (toolCall.function.name === 'create_purchase_order') {
                const args = JSON.parse(toolCall.function.arguments);
                try {
                    const { createPurchaseOrderCore } = await import("@/app/actions/procurement-actions");
                    const res = await createPurchaseOrderCore(args);

                    if (res.success) {
                        return NextResponse.json({
                            content: `✅ **Purchase Order Created**\n\n- **PO #**: ${res.poNumber}\n- **Item**: ${args.sku} (x${args.qty})\n- **Supplier**: ${args.supplierName}\n\nStatus is **ISSUED**. You can now asking me to "Receive this PO".`
                        });
                    } else {
                        return NextResponse.json({ content: `❌ PO Creation Failed: ${res.error}` });
                    }
                } catch (e: any) {
                    return NextResponse.json({ content: `❌ Error: ${e.message}` });
                }
            }

            if (toolCall.function.name === 'get_putaway_suggestion') {
                const args = JSON.parse(toolCall.function.arguments);
                try {
                    const { suggestPutawayLocation } = await import("@/app/actions/inventory-actions");
                    const suggestion = await suggestPutawayLocation(args.warehouseId, args.itemId || null);

                    return NextResponse.json({
                        content: `### 📥 Receiving Scan: ${args.poNumber}\n\nI have analyzed **${args.warehouseId}** for optimal placement.\n\n` +
                            `> **Use Bin**: \`${suggestion.locationId}\`\n` +
                            `> **Reason**: ${suggestion.reason}\n\n` +
                            `Shall I confirm receipt into **${suggestion.locationId}**?`
                    });
                } catch (e: any) {
                    return NextResponse.json({ content: `❌ Suggestion Failed: ${e.message}` });
                }
            }

            if (toolCall.function.name === 'execute_receipt') {
                const args = JSON.parse(toolCall.function.arguments);
                try {
                    const { executeReceipt } = await import("@/app/actions/inventory-actions");
                    const res = await executeReceipt(args.poNumber, args.warehouseId, args.locationId);

                    if (res.success) {
                        return NextResponse.json({
                            content: `✅ **Receipt Confirmed**\n\nItems from **${args.poNumber}** have been put away into **${args.locationId}** at **${args.warehouseId}**.\n\nInventory updated.`
                        });
                    } else {
                        return NextResponse.json({ content: `❌ Receipt Failed: ${res.error}` });
                    }
                } catch (e: any) {
                    return NextResponse.json({ content: `❌ Transaction Error: ${e.message}` });
                }
            }
        }


        return NextResponse.json({
            content: finalContent
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
