// A mock database of inventory
const MOCK_INVENTORY = [
  {
    id: 'inv-1',
    itemId: 'item-1',
    sku: 'SKU001',
    name: '48x40 Wooden Pallet',
    locationId: 'loc-1',
    locationCode: 'A1-B2-C3',
    warehouseId: 'wh-1',
    warehouseName: 'Laredo - South Warehouse - TX',
    quantityAvailable: 100,
    quantityReserved: 10,
    quantityAllocated: 5
  },
  {
    id: 'inv-2',
    itemId: 'item-2',
    sku: 'SKU002',
    name: 'Yellow Shipping Box',
    locationId: 'loc-2',
    locationCode: 'D4-E5-F6',
    warehouseId: 'wh-2',
    warehouseName: 'KuehneNagel - East Warehouse - NY',
    quantityAvailable: 250,
    quantityReserved: 25,
    quantityAllocated: 15
  },
  {
    id: 'inv-3',
    itemId: 'item-3',
    sku: 'SKU001',
    name: '48x40 Wooden Pallet',
    locationId: 'loc-3',
    locationCode: 'G7-H8-I9',
    warehouseId: 'wh-3',
    warehouseName: 'L-Angeles - Dual West Warehouse - LA',
    quantityAvailable: 150,
    quantityReserved: 0,
    quantityAllocated: 0
  },
  {
    id: 'inv-4',
    itemId: 'item-4',
    sku: 'SKU003',
    name: 'Wrist Watch',
    locationId: 'loc-1',
    locationCode: 'A1-B2-C4',
    warehouseId: 'wh-1',
    warehouseName: 'Laredo - South Warehouse - TX',
    quantityAvailable: 50,
    quantityReserved: 5,
    quantityAllocated: 2
  }
];

/**
 * Checks the inventory for a given SKU.
 * @param sku The SKU to check.
 * @returns A promise that resolves with the inventory information.
 */
export async function checkInventory({ sku }: { sku: string }) {
  console.log(`Checking inventory for SKU: ${sku}`);
  const inventoryItems = MOCK_INVENTORY.filter(item => item.sku === sku);
  
  if (inventoryItems.length === 0) {
    return {
      status: 'Not Found',
      message: `No inventory found for SKU ${sku}.`
    };
  }

  return {
    status: 'In Stock',
    items: inventoryItems
  };
}

/**
 * Books a truck for a given shipment.
 * @param shipmentDetails The details of the shipment.
 * @returns A promise that resolves with the booking confirmation.
 */
export async function bookTruck({ shipmentDetails }: { shipmentDetails: any }) {
  console.log('Booking truck with details:', shipmentDetails);
  // In a real application, this would call a TMS API.
  // For now, we'll just return a mock confirmation.
  return {
    success: true,
    confirmationId: `TRK-${Date.now()}`,
    message: `Truck booked successfully for shipment from ${shipmentDetails.origin} to ${shipmentDetails.destination}.`
  };
}

