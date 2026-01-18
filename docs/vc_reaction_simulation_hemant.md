# VC Simulation: Hemant Asher's Internal Monologue

**Context:** You have just finished your standard 5-minute pitch. You showed the 3D Twin (simulated) and the ERP Core (real).

---

## 🧐 Phase 1: The Pitch (The Skepticism)

**What He Hears:** "We are building an AI-native OS for logistics with a 3D digital twin..."
**Internal Monologue:**
> *"Here we go again. Another 'Single Pane of Glass'. I heard this at Valdero in 2004. I heard this at Infosys in 2012. Everyone builds the dashboard. Nobody builds the connector. Does this kid know that WMS data is 90% garbage? Providing 'visibility' on bad data just helps you make bad decisions faster."*

**What He Externalizes (The Test):**
> "Stop the slides. Walk me through exactly—step by step—how you get the data from a legacy SAP instance into this 3D view. Do you use an API? An EDI drop? Or is this hardcoded?"

---

## 🕵️ Phase 2: The Demo (The "Gotcha")

**Action:** You show the 3D Warehouse view with robots moving around.
**Internal Monologue:**
> *"That robot just moved through a rack. That pathing isn't real. It’s a game engine loop. If this is their core IP, they are dead. Ops managers will laugh them out of the room. It looks too perfect. Real warehouses are messy."*

**Action:** You PIVOT to the Order Management Grid (The "Boring" Stuff).
**Internal Monologue:**
> *"Okay... wait. This `Inventory Ledger` has an 'Allocated' column and a 'Blocked' column. Most startups forget 'Blocked' stock (damaged goods). They actually modeled the inventory states correctly. This isn't just a skin; there's a real database schema here."*

**What He Externalizes (The Opening):**
> "Go back to that Inventory Grid. How do you handle it when the physical count doesn't match the system count? Can I override it right here, or do I have to go back to the ERP?"

---

## 🤝 Phase 3: The Verdict (The Investment Logic)

**If you play it "Salesy" (All Flash):**
> **Verdict: PASS.** *"Nice toy. Call me when you have 10 live customers. Too much execution risk on the integration side."*

**If you play "The Brutal Truth" (The Operator's Pitch):**
> **Verdict: SECOND MEETING.** *"Okay, he knows the 3D is just for show right now. But he understands the data problem. And he's building the 'Control Layer' that sits *above* the messy WMS. If he can actually pull off the 'Action' part—allowing a user to fix a broken order from chat—that is unique. That's the 'Enquero' for physical goods."*

---

## 🚦 His "Green Light" Signals
If he asks these questions, you are winning:
1.  "What is your implementation time? Is it 6 months or 6 weeks?" (He is calculating CAC/Services margin).
2.  "Who actually logs in? The Warehouse Manager or the VP of Supply Chain?" (He is checking if you know your persona).
3.  "Let's click on 'Create Order'. I want to see it break." (He wants to see if the code is real).
