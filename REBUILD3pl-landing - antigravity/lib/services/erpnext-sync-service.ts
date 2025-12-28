/**
 * ERPNext Sync Service
 * Handles synchronization between BlueShip Sync and ERPNext
 */

import { ERPNextConnector, ERPNextConfig } from '@/lib/integrations/erp/erpnext-connector'
import { logger } from '@/lib/monitoring/logger'

class ERPNextSyncService {
  private connectors: Map<string, ERPNextConnector> = new Map()

  /**
   * Initialize ERPNext connector for an organization
   */
  initializeConnector(orgId: string, config: ERPNextConfig): ERPNextConnector {
    const connector = new ERPNextConnector(config)
    this.connectors.set(orgId, connector)
    return connector
  }

  /**
   * Get connector for an organization
   */
  getConnector(orgId: string): ERPNextConnector | null {
    return this.connectors.get(orgId) || null
  }

  /**
   * Push shipment status update to ERPNext
   */
  async pushShipmentStatus(
    orgId: string,
    orderId: string,
    shipmentId: string,
    status: string,
    trackingNumber?: string,
    carrier?: string
  ): Promise<boolean> {
    try {
      const connector = this.getConnector(orgId)
      if (!connector) {
        logger.warn('erpnext_connector_not_found', { orgId })
        return false
      }

      const success = await connector.pushOrderStatus(orderId, status, {
        shipmentId,
        trackingNumber,
        carrier
      })

      if (success) {
        logger.info('erpnext_shipment_status_pushed', {
          orgId,
          orderId,
          shipmentId,
          status
        })
      }

      return success
    } catch (error) {
      logger.error('erpnext_push_shipment_status_failed', error as Error, {
        orgId,
        orderId,
        shipmentId
      })
      return false
    }
  }

  /**
   * Sync orders from ERPNext
   */
  async syncOrders(orgId: string, lastSync?: Date) {
    try {
      const connector = this.getConnector(orgId)
      if (!connector) {
        throw new Error(`ERPNext connector not found for organization ${orgId}`)
      }

      const result = await connector.syncOrders(lastSync)
      logger.info('erpnext_orders_synced', {
        orgId,
        recordsSynced: result.recordsSynced,
        duration: result.syncDuration
      })

      return result
    } catch (error) {
      logger.error('erpnext_sync_orders_failed', error as Error, { orgId })
      throw error
    }
  }

  /**
   * Sync customers from ERPNext
   */
  async syncCustomers(orgId: string, lastSync?: Date) {
    try {
      const connector = this.getConnector(orgId)
      if (!connector) {
        throw new Error(`ERPNext connector not found for organization ${orgId}`)
      }

      const result = await connector.syncCustomers(lastSync)
      logger.info('erpnext_customers_synced', {
        orgId,
        recordsSynced: result.recordsSynced
      })

      return result
    } catch (error) {
      logger.error('erpnext_sync_customers_failed', error as Error, { orgId })
      throw error
    }
  }

  /**
   * Sync items from ERPNext
   */
  async syncItems(orgId: string, lastSync?: Date) {
    try {
      const connector = this.getConnector(orgId)
      if (!connector) {
        throw new Error(`ERPNext connector not found for organization ${orgId}`)
      }

      const result = await connector.syncItems(lastSync)
      logger.info('erpnext_items_synced', {
        orgId,
        recordsSynced: result.recordsSynced
      })

      return result
    } catch (error) {
      logger.error('erpnext_sync_items_failed', error as Error, { orgId })
      throw error
    }
  }

  /**
   * Sync warehouses from ERPNext
   */
  async syncWarehouses(orgId: string, lastSync?: Date) {
    try {
      const connector = this.getConnector(orgId)
      if (!connector) {
        throw new Error(`ERPNext connector not found for organization ${orgId}`)
      }

      const result = await connector.syncWarehouses(lastSync)
      logger.info('erpnext_warehouses_synced', {
        orgId,
        recordsSynced: result.recordsSynced
      })

      return result
    } catch (error) {
      logger.error('erpnext_sync_warehouses_failed', error as Error, { orgId })
      throw error
    }
  }

  /**
   * Sync inventory from ERPNext
   */
  async syncInventory(orgId: string, warehouse?: string, lastSync?: Date) {
    try {
      const connector = this.getConnector(orgId)
      if (!connector) {
        throw new Error(`ERPNext connector not found for organization ${orgId}`)
      }

      const result = await connector.syncInventory(warehouse, lastSync)
      logger.info('erpnext_inventory_synced', {
        orgId,
        warehouse,
        recordsSynced: result.recordsSynced
      })

      return result
    } catch (error) {
      logger.error('erpnext_sync_inventory_failed', error as Error, { orgId, warehouse })
      throw error
    }
  }

  /**
   * Push inventory update to ERPNext
   */
  async pushInventoryUpdate(
    orgId: string,
    itemCode: string,
    warehouse: string,
    qty: number,
    availableQty: number
  ): Promise<boolean> {
    try {
      const connector = this.getConnector(orgId)
      if (!connector) {
        logger.warn('erpnext_connector_not_found', { orgId })
        return false
      }

      const success = await connector.pushInventoryUpdate(itemCode, warehouse, qty, availableQty)

      if (success) {
        logger.info('erpnext_inventory_pushed', {
          orgId,
          itemCode,
          warehouse,
          qty
        })
      }

      return success
    } catch (error) {
      logger.error('erpnext_push_inventory_failed', error as Error, {
        orgId,
        itemCode,
        warehouse
      })
      return false
    }
  }
}

export const erpnextSyncService = new ERPNextSyncService()

