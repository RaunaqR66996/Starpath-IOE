/**
 * ERPNext Connector
 * Integrates BlueShip Sync with ERPNext ERP system
 * Uses Frappe Framework REST API
 */

import { BaseERPConnector, ERPConfig, ERPSyncResult, OrderRecord } from './base-connector'

export interface ERPNextConfig extends ERPConfig {
  type: 'ERPNext'
  apiKey: string
  apiSecret: string
}

export class ERPNextConnector extends BaseERPConnector {
  private apiKey: string
  private apiSecret: string

  constructor(config: ERPNextConfig) {
    super({ ...config, type: 'Custom' })
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
  }

  /**
   * Test connection to ERPNext
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const authResult = await this.authenticate()
      return {
        success: authResult.success,
        message: authResult.success 
          ? 'ERPNext connection successful' 
          : (authResult.error || 'Connection failed')
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Authenticate with ERPNext using API Key/Secret
   */
  async authenticate(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const result = await this.handleApiCall(async () => {
        // ERPNext uses token authentication: api_key:api_secret
        const response = await fetch(`${this.config.endpoint}/api/method/frappe.auth.get_logged_user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`
          }
        })

        if (!response.ok) {
          throw new Error(`ERPNext auth failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return 'authenticated'
      }, 'authenticate')

      return { success: true, token: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * Sync customers from ERPNext
   */
  async syncCustomers(lastSync?: Date): Promise<ERPSyncResult> {
    const startTime = Date.now()
    
    try {
      const customers = await this.handleApiCall(async () => {
        let url = `${this.config.endpoint}/api/resource/Customer?fields=["name","customer_name","customer_type","territory","customer_group","default_currency","tax_id","email_id","mobile_no","phone_no","is_internal_customer","represents_company","image"]&limit_page_length=1000`
        
        if (lastSync) {
          url += `&filters=[["modified",">","${lastSync.toISOString()}"]]`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data.data || []
      }, 'syncCustomers')

      // Transform ERPNext customers to internal format
      const transformed = customers.map((cust: any) => this.transformData(cust, 'customer'))

      return {
        success: true,
        recordsSynced: transformed.length,
        recordsFailed: 0,
        errors: [],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    }
  }

  /**
   * Sync suppliers from ERPNext
   */
  async syncSuppliers(lastSync?: Date): Promise<ERPSyncResult> {
    const startTime = Date.now()
    
    try {
      const suppliers = await this.handleApiCall(async () => {
        let url = `${this.config.endpoint}/api/resource/Supplier?fields=["name","supplier_name","supplier_type","supplier_group","default_currency","tax_id","email_id","mobile_no","phone_no"]&limit_page_length=1000`
        
        if (lastSync) {
          url += `&filters=[["modified",">","${lastSync.toISOString()}"]]`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch suppliers: ${response.status}`)
        }

        const data = await response.json()
        return data.data || []
      }, 'syncSuppliers')

      const transformed = suppliers.map((supp: any) => this.transformData(supp, 'supplier'))

      return {
        success: true,
        recordsSynced: transformed.length,
        recordsFailed: 0,
        errors: [],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    }
  }

  /**
   * Sync items/products from ERPNext
   */
  async syncItems(lastSync?: Date): Promise<ERPSyncResult> {
    const startTime = Date.now()
    
    try {
      const items = await this.handleApiCall(async () => {
        let url = `${this.config.endpoint}/api/resource/Item?fields=["name","item_name","item_code","item_group","stock_uom","standard_rate","description","is_stock_item","has_serial_no","has_batch_no","image"]&limit_page_length=1000`
        
        if (lastSync) {
          url += `&filters=[["modified",">","${lastSync.toISOString()}"]]`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch items: ${response.status}`)
        }

        const data = await response.json()
        return data.data || []
      }, 'syncItems')

      const transformed = items.map((item: any) => this.transformData(item, 'item'))

      return {
        success: true,
        recordsSynced: transformed.length,
        recordsFailed: 0,
        errors: [],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    }
  }

  /**
   * Sync orders from ERPNext
   */
  async syncOrders(lastSync?: Date): Promise<ERPSyncResult> {
    const startTime = Date.now()
    
    try {
      const orders = await this.handleApiCall(async () => {
        let url = `${this.config.endpoint}/api/resource/Sales Order?fields=["name","customer","transaction_date","delivery_date","status","grand_total","currency","items"]&limit_page_length=1000`
        
        if (lastSync) {
          url += `&filters=[["modified",">","${lastSync.toISOString()}"]]`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`)
        }

        const data = await response.json()
        return data.data || []
      }, 'syncOrders')

      const transformed = orders.map((order: any) => this.transformData(order, 'order'))

      return {
        success: true,
        recordsSynced: transformed.length,
        recordsFailed: 0,
        errors: [],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    }
  }

  /**
   * Push order status back to ERPNext
   */
  async pushOrderStatus(orderId: string, status: string, data: any): Promise<boolean> {
    try {
      await this.handleApiCall(async () => {
        // Map BlueShip status to ERPNext status
        const erpnextStatus = this.mapStatusToERPNext(status)
        
        const updateData: any = {
          custom_blueship_status: status,
          custom_blueship_shipment_id: data.shipmentId || null,
          custom_blueship_tracking_number: data.trackingNumber || null
        }

        // Update status if it's a valid ERPNext status
        if (erpnextStatus) {
          updateData.status = erpnextStatus
        }
        
        const response = await fetch(
          `${this.config.endpoint}/api/resource/Sales Order/${orderId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to update order status: ${response.status} - ${errorText}`)
        }

        return await response.json()
      }, 'pushOrderStatus')

      return true
    } catch (error) {
      console.error('Failed to push order status to ERPNext:', error)
      return false
    }
  }

  /**
   * Push shipment confirmation to ERPNext
   */
  async pushShipmentConfirmation(shipmentId: string, data: any): Promise<boolean> {
    try {
      await this.handleApiCall(async () => {
        // Create Delivery Note in ERPNext from shipment
        const response = await fetch(
          `${this.config.endpoint}/api/method/erpnext.selling.doctype.sales_order.sales_order.make_delivery_note`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              source_name: data.orderId,
              target_doc: {
                tracking_number: data.trackingNumber,
                carrier: data.carrier,
                shipped_date: data.shippedDate
              }
            })
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to create delivery note: ${response.status} - ${errorText}`)
        }

        return await response.json()
      }, 'pushShipmentConfirmation')

      return true
    } catch (error) {
      console.error('Failed to push shipment confirmation to ERPNext:', error)
      return false
    }
  }

  /**
   * Transform ERPNext data to internal format
   */
  protected transformData(erpData: any, dataType: string): any {
    switch (dataType) {
      case 'customer':
        return {
          externalId: erpData.name,
          name: erpData.customer_name,
          code: erpData.name,
          type: erpData.customer_type || 'Company',
          email: erpData.email_id,
          phone: erpData.mobile_no || erpData.phone_no,
          currency: erpData.default_currency,
          metadata: {
            territory: erpData.territory,
            customerGroup: erpData.customer_group,
            taxId: erpData.tax_id,
            isInternal: erpData.is_internal_customer
          }
        }
      
      case 'supplier':
        return {
          externalId: erpData.name,
          name: erpData.supplier_name,
          code: erpData.name,
          type: erpData.supplier_type || 'Company',
          email: erpData.email_id,
          phone: erpData.mobile_no || erpData.phone_no,
          currency: erpData.default_currency,
          metadata: {
            supplierGroup: erpData.supplier_group,
            taxId: erpData.tax_id
          }
        }
      
      case 'item':
        return {
          externalId: erpData.name,
          itemCode: erpData.item_code,
          name: erpData.item_name,
          group: erpData.item_group,
          unit: erpData.stock_uom,
          standardRate: erpData.standard_rate,
          description: erpData.description,
          isStockItem: erpData.is_stock_item === 1,
          hasSerialNo: erpData.has_serial_no === 1,
          hasBatchNo: erpData.has_batch_no === 1
        }
      
      case 'order':
        return {
          externalOrderId: erpData.name,
          orderNumber: erpData.name,
          customerCode: erpData.customer,
          orderDate: new Date(erpData.transaction_date),
          requiredDate: erpData.delivery_date ? new Date(erpData.delivery_date) : undefined,
          status: erpData.status,
          totalAmount: parseFloat(erpData.grand_total || 0),
          currency: erpData.currency,
          lines: (erpData.items || []).map((item: any, index: number) => ({
            lineNumber: index + 1,
            itemCode: item.item_code,
            quantity: parseFloat(item.qty || 0),
            unitPrice: parseFloat(item.rate || 0),
            totalPrice: parseFloat(item.amount || 0)
          }))
        }
      
      case 'warehouse':
        return {
          externalId: erpData.name,
          warehouseCode: erpData.name,
          warehouseName: erpData.warehouse_name || erpData.name,
          warehouseType: erpData.warehouse_type || 'Warehouse',
          addressLine1: erpData.address_line || '',
          city: erpData.city || '',
          state: erpData.state || '',
          zipCode: erpData.pincode || '',
          country: erpData.country || 'USA',
          metadata: {
            company: erpData.company,
            isGroup: erpData.is_group === 1,
            parentWarehouse: erpData.parent_warehouse
          }
        }
      
      case 'inventory':
        return {
          itemCode: erpData.item_code,
          warehouseCode: erpData.warehouse,
          quantityOnHand: parseFloat(erpData.actual_qty || 0),
          quantityReserved: parseFloat(erpData.reserved_qty || 0),
          quantityAvailable: parseFloat(erpData.projected_qty || erpData.actual_qty || 0) - parseFloat(erpData.reserved_qty || 0)
        }
      
      default:
        return erpData
    }
  }

  /**
   * Sync warehouses from ERPNext
   */
  async syncWarehouses(lastSync?: Date): Promise<ERPSyncResult> {
    const startTime = Date.now()
    
    try {
      const warehouses = await this.handleApiCall(async () => {
        let url = `${this.config.endpoint}/api/resource/Warehouse?fields=["name","warehouse_name","warehouse_type","company","is_group","parent_warehouse","account","address_line","city","state","country","warehouse_type"]&limit_page_length=1000`
        
        if (lastSync) {
          url += `&filters=[["modified",">","${lastSync.toISOString()}"]]`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch warehouses: ${response.status}`)
        }

        const data = await response.json()
        return data.data || []
      }, 'syncWarehouses')

      const transformed = warehouses.map((wh: any) => this.transformData(wh, 'warehouse'))

      return {
        success: true,
        recordsSynced: transformed.length,
        recordsFailed: 0,
        errors: [],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    }
  }

  /**
   * Sync inventory/stock levels from ERPNext
   */
  async syncInventory(warehouse?: string, lastSync?: Date): Promise<ERPSyncResult> {
    const startTime = Date.now()
    
    try {
      const bins = await this.handleApiCall(async () => {
        let url = `${this.config.endpoint}/api/resource/Bin?fields=["name","item_code","warehouse","actual_qty","reserved_qty","ordered_qty","projected_qty"]&limit_page_length=1000`
        
        const filters: any[] = []
        if (warehouse) {
          filters.push(['warehouse', '=', warehouse])
        }
        if (lastSync) {
          filters.push(['modified', '>', lastSync.toISOString()])
        }
        
        if (filters.length > 0) {
          url += `&filters=[${filters.map(f => JSON.stringify(f)).join(',')}]`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch inventory: ${response.status}`)
        }

        const data = await response.json()
        return data.data || []
      }, 'syncInventory')

      const transformed = bins.map((bin: any) => this.transformData(bin, 'inventory'))

      return {
        success: true,
        recordsSynced: transformed.length,
        recordsFailed: 0,
        errors: [],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        syncDuration: Date.now() - startTime,
        lastSyncTimestamp: new Date()
      }
    }
  }

  /**
   * Push inventory update to ERPNext
   */
  async pushInventoryUpdate(itemCode: string, warehouse: string, qty: number, availableQty: number): Promise<boolean> {
    try {
      await this.handleApiCall(async () => {
        // Update Bin in ERPNext
        const binName = await this.getBinName(itemCode, warehouse)
        
        if (binName) {
          // Update existing bin
          const response = await fetch(
            `${this.config.endpoint}/api/resource/Bin/${binName}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                actual_qty: qty,
                reserved_qty: qty - availableQty
              })
            }
          )

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to update inventory: ${response.status} - ${errorText}`)
          }
        } else {
          // Create new bin (this might require a different approach in ERPNext)
          // For now, log that bin doesn't exist
          console.warn(`Bin not found for item ${itemCode} in warehouse ${warehouse}`)
        }

        return true
      }, 'pushInventoryUpdate')

      return true
    } catch (error) {
      console.error('Failed to push inventory update to ERPNext:', error)
      return false
    }
  }

  /**
   * Get Bin name for item and warehouse
   */
  private async getBinName(itemCode: string, warehouse: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.config.endpoint}/api/resource/Bin?filters=[["item_code","=","${itemCode}"],["warehouse","=","${warehouse}"]]&fields=["name"]&limit_page_length=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.data && data.data.length > 0 ? data.data[0].name : null
    } catch (error) {
      console.error('Failed to get bin name:', error)
      return null
    }
  }

  /**
   * Map BlueShip status to ERPNext status
   */
  private mapStatusToERPNext(status: string): string | null {
    const statusMap: Record<string, string> = {
      'PENDING': 'Draft',
      'CONFIRMED': 'To Deliver',
      'ALLOCATED': 'To Deliver',
      'PICKED': 'To Deliver',
      'PACKED': 'To Deliver',
      'SHIPPED': 'Completed',
      'DELIVERED': 'Completed',
      'CANCELLED': 'Cancelled'
    }
    return statusMap[status] || null
  }

}

