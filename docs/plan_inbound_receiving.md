# Implementation Plan: Inbound Receiving (Closing the Loop)

This plan outlines the steps to implement the **Inbound Receiving** workflow, allowing Purchase Orders to be received into Inventory. This bridges the gap between the new Procurement module and the existing WMS capabilities.

## Goals
1.  **Backend Logic**: Implement server actions to process PO receipts, updating inventory and PO status transactionally.
2.  **User Interface**: Create a "Receive" interface for warehouse operators to input received quantities and target locations.
3.  **Integration**: Connect the Receiving workflow to the Purchase Order Grid.

## Steps

### Step 1: Server Actions (`app/actions/receiving-actions.ts`)
- [ ] Create `receivePurchaseOrder` function.
    - [ ] Input: `poId`, `receivedItems` (list of `{ itemId, qty, locationId }`).
    - [ ] Logic:
        - [ ] Verify PO exists.
        - [ ] Create `Receipt` and `ReceiptLine` records.
        - [ ] Update `PurchaseOrderLine.qtyReceived` and `PurchaseOrder.status`.
        - [ ] Upsert `Inventory` records (increment quantity if exists, else create) at the specified `locationId`.

### Step 2: UI Component (`components/ioe/procurement/ReceivePOModal.tsx`)
- [ ] Create a modal that displays PO lines.
- [ ] Allow users to enter "Qty Received" for each line (default to remaining qty).
- [ ] Allow users to specify a "Target Location" (default to `INBOUND-DOCK`).
- [ ] Submit button triggers `receivePurchaseOrder`.

### Step 3: Update PO Grid (`components/ioe/procurement/PurchaseOrderGrid.tsx`)
- [ ] Add a "Receive" action button to PO rows with status `ISSUED` or `PARTIAL`.
- [ ] Connect the button to open the `ReceivePOModal`.

### Step 4: Verification
- [ ] Create a new PO.
- [ ] Receive the PO via the UI.
- [ ] Check Inventory Grid to confirm stock increase.
- [ ] Check PO Grid to confirm status update to `RECEIVED` or `CLOSED`.

## Future Considerations
- **Putaway Tasks**: currently, we are receiving directly to a location. In a more advanced WMS, receiving creates a `Receipt` + `Inventory` at `RECV-STAGE`, and *then* generates a `WarehouseTask` (Putaway) to move it to `STORAGE`. We will implement this direct putaway first for MVP velocity.
