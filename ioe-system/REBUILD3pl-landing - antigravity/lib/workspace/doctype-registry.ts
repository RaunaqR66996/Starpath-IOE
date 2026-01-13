/**
 * DocType Registry
 * Maps DocType names to React components and API endpoints
 */

export interface DocTypeConfig {
  component: string
  listComponent?: string
  formComponent?: string
  apiEndpoint: string
  listEndpoint: string
  createEndpoint?: string
  updateEndpoint?: string
  deleteEndpoint?: string
}

const doctypeRegistry: Record<string, DocTypeConfig> = {
  // TMS DocTypes
  'Shipment': {
    component: 'ShipmentForm',
    listComponent: 'ShipmentList',
    apiEndpoint: '/api/tms/shipments',
    listEndpoint: '/api/tms/shipments',
    createEndpoint: '/api/tms/shipments',
    updateEndpoint: '/api/tms/shipments',
  },
  'Order': {
    component: 'OrderForm',
    listComponent: 'OrderList',
    apiEndpoint: '/api/orders',
    listEndpoint: '/api/orders',
    createEndpoint: '/api/orders',
    updateEndpoint: '/api/orders',
  },
  'Carrier': {
    component: 'CarrierForm',
    listComponent: 'CarrierList',
    apiEndpoint: '/api/tms/carriers',
    listEndpoint: '/api/tms/carriers',
    createEndpoint: '/api/tms/carriers',
    updateEndpoint: '/api/tms/carriers',
  },
  'Load Plan': {
    component: 'LoadPlanForm',
    apiEndpoint: '/api/tms/load-plan',
    listEndpoint: '/api/tms/load-plan',
    createEndpoint: '/api/tms/load-plan',
  },
  'Rate Quote': {
    component: 'RateQuoteForm',
    apiEndpoint: '/api/tms/rate',
    listEndpoint: '/api/tms/rates',
    createEndpoint: '/api/tms/rate',
  },
  'Tracking Event': {
    component: 'TrackingEventForm',
    apiEndpoint: '/api/tms/tracking',
    listEndpoint: '/api/tms/tracking',
    createEndpoint: '/api/tms/tracking',
  },
  
  // WMS DocTypes
  'Warehouse': {
    component: 'WarehouseForm',
    listComponent: 'WarehouseList',
    apiEndpoint: '/api/warehouse',
    listEndpoint: '/api/warehouse',
    createEndpoint: '/api/warehouse',
    updateEndpoint: '/api/warehouse',
  },
  'ASN': {
    component: 'ASNForm',
    listComponent: 'ASNList',
    apiEndpoint: '/api/wms/receiving',
    listEndpoint: '/api/wms/receiving',
    createEndpoint: '/api/wms/receiving',
  },
  'Receiving': {
    component: 'ReceivingForm',
    listComponent: 'ReceivingList',
    apiEndpoint: '/api/wms/receiving',
    listEndpoint: '/api/wms/receiving',
    createEndpoint: '/api/wms/receiving',
    updateEndpoint: '/api/wms/receiving',
  },
  'QC': {
    component: 'QCForm',
    listComponent: 'QCList',
    apiEndpoint: '/api/wms/qc',
    listEndpoint: '/api/wms/qc',
    createEndpoint: '/api/wms/qc',
    updateEndpoint: '/api/wms/qc',
  },
  'Putaway': {
    component: 'PutawayForm',
    listComponent: 'PutawayList',
    apiEndpoint: '/api/wms/putaway',
    listEndpoint: '/api/wms/putaway',
    createEndpoint: '/api/wms/putaway',
    updateEndpoint: '/api/wms/putaway',
  },
  'Inventory': {
    component: 'InventoryForm',
    listComponent: 'InventoryList',
    apiEndpoint: '/api/wms/inventory',
    listEndpoint: '/api/wms/inventory',
    createEndpoint: '/api/wms/inventory',
    updateEndpoint: '/api/wms/inventory',
  },
  'Wave': {
    component: 'WaveForm',
    listComponent: 'WaveList',
    apiEndpoint: '/api/wms/waves',
    listEndpoint: '/api/wms/waves',
    createEndpoint: '/api/wms/waves',
    updateEndpoint: '/api/wms/waves',
  },
  'Picking': {
    component: 'PickingForm',
    listComponent: 'PickingList',
    apiEndpoint: '/api/wms/picking',
    listEndpoint: '/api/wms/picking',
    createEndpoint: '/api/wms/picking',
    updateEndpoint: '/api/wms/picking',
  },
  'Packing': {
    component: 'PackingForm',
    listComponent: 'PackingList',
    apiEndpoint: '/api/wms/packing',
    listEndpoint: '/api/wms/packing',
    createEndpoint: '/api/wms/packing',
    updateEndpoint: '/api/wms/packing',
  },
  'Shipping': {
    component: 'ShippingForm',
    listComponent: 'ShippingList',
    apiEndpoint: '/api/wms/shipping',
    listEndpoint: '/api/wms/shipping',
    createEndpoint: '/api/wms/shipping',
    updateEndpoint: '/api/wms/shipping',
  },
}

/**
 * Get DocType configuration
 */
export function getDocTypeConfig(doctypeName: string): DocTypeConfig | null {
  return doctypeRegistry[doctypeName] || null
}

/**
 * Register a new DocType configuration
 */
export function registerDocType(name: string, config: DocTypeConfig): void {
  doctypeRegistry[name] = config
}

/**
 * Get all registered DocTypes
 */
export function getAllDocTypes(): Record<string, DocTypeConfig> {
  return { ...doctypeRegistry }
}

/**
 * Check if a DocType is registered
 */
export function isDocTypeRegistered(name: string): boolean {
  return name in doctypeRegistry
}

