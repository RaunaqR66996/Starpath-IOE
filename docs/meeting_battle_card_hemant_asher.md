# Meeting Battle Card: Hemant Asher (Saama Capital)

**Objective:** Secure follow-up diligence meeting or pilot introduction.
**Theme:** "The Operator's Truth" (No marketing fluff).

---

## 1. The Opening Hook (3 Minutes)
**Goal:** Establish immediate peer-level respect.

*   **Don't Say:** "We are the Uber for Logistics."
*   **Do Say:** "Hemant, I looked at your time at **Valdero** and **Enquero**. You spent years solving the 'Visibility Gap' and the 'Data Silo' problem. We built StarPath because we realized that 10 years later, ERPs are still just 'Systems of Record' and not 'Systems of Action'. We are building the Operational Control layer you tried to build at Valdero."

## 2. The Strategy: "Show the Plumbing"
Hemant is technical. He knows "pretty dashboards" are easy. Show him the hard stuff.

*   **Step 1: The ERP Core (The Truth)**
    *   Show the **Order Management** screen.
    *   Show the **Inventory Ledger**.
    *   *Why:* Prove we handle the "boring" transactional data correctly. "We didn't just build a wrapper; we built a ledger."

*   **Step 2: The Simulation (The Cavet)**
    *   Show the **3D Digital Twin**.
    *   **CRITICAL PIVOT:** Before he asks, say: "Right now, this visualizer is running on a simulation engine because our pilot hardware isn't live. But the *pipeline* is ready. We built this to be the 'cockpit' for the warehouse manager, replacing the 15 browser tabs they use today."

*   **Step 3: The AI (The Context)**
    *   Show the **Chat / Agent**.
    *   Ask a complex question: "How does the backlog in Zone B affect our shipping deadline?"
    *   *Why:* This hits his **Enquero** sweet spot (Data Analytics -> Insight).

## 3. Anticipated Objections (Prepare Answers)

**Q: "How do you handle dirty data from legacy WMS?"**
*   *Bad Answer:* "AI cleans it."
*   *Good Answer:* "We assume the WMS is always 15 minutes late. That's why we don't trust the WMS blindly; we use a 'Confidence Score' for inventory. If the WMS says 10 units but the camera feed sees empty rack space, we flag a 'Ghost Inventory' alert."

**Q: "Who is the buyer? CIO or Ops VP?"**
*   *Answer:* "It's the Ops VP. The CIO hates us because we disrupt their SAP roadmap. The Ops VP loves us because SAP takes 2 years to implement, and we go live in 6 weeks as an 'overlay' system."

**Q: "How do you scale implementation services? (The Enquero Question)"**
*   *Answer:* "We know that service revenue kills SaaS margins. That's why we are building 'Self-Healing' data pipelines. We want to avoid the 'Army of Consultants' model you solved at Enquero."

## 4. The "Ask"
*   "We aren't just looking for capital. We need a board member who knows how to survive the 'Valley of Death' between a $1M startup and a $100M enterprise. Your path from **Valdero (early)** to **Enquero (scale)** is exactly the journey we are on. We want that playbook."

---

## 5. Pre-Meeting Checklist
- [ ] **Clean Data:** Ensure the `Order` table has realistic dates (no "1970" timestamps).
- [ ] **Stable Demo:** Run `npm run dev` and click through *every* tab. No 404s allowed.
- [ ] **The "Fail" Guide:** Have the "Why ERP Projects Fail" doc open in a tab. If the meeting drags, show him: "We essentially built our product roadmap to solve these 10 failure points."
