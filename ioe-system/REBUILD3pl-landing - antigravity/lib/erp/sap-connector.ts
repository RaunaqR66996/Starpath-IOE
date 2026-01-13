import { createClient } from '@sap/cloud-sdk-core';
import { BusinessPartnerApi, MaterialApi, SalesOrderApi } from '@sap/cloud-sdk-vdm-business-partner-service';
import { encrypt, decrypt } from '../utils/encryption';

export interface SAPCredentials {
  client: string;
  username: string;
  password: string;
  systemUrl: string;
  authUrl?: string;
}

export interface SAPConnectionConfig {
  connectionId: string;
  credentials: SAPCredentials;
  timeout?: number;
  retries?: number;
}

export class SAPConnector {
  private config: SAPConnectionConfig;
  private client: any;
  private isConnected: boolean = false;

  constructor(config: SAPConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Create SAP client with real authentication
      this.client = createClient({
        client: this.config.credentials.client,
        username: this.config.credentials.username,
        password: this.config.credentials.password,
        systemUrl: this.config.credentials.systemUrl,
        authUrl: this.config.credentials.authUrl,
        timeout: this.config.timeout || 30000,
      });

      // Test connection
      await this.testConnection();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('SAP connection failed:', error);
      throw new Error(`SAP connection failed: ${error.message}`);
    }
  }

  private async testConnection(): Promise<void> {
    try {
      // Test with a simple API call
      const businessPartners = await BusinessPartnerApi.requestBuilder()
        .getAll()
        .top(1)
        .execute(this.client);
      
      if (!businessPartners) {
        throw new Error('No response from SAP system');
      }
    } catch (error) {
      throw new Error(`SAP connection test failed: ${error.message}`);
    }
  }

  async getMaterials(organizationId: string): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('SAP not connected');
    }

    try {
      const materials = await MaterialApi.requestBuilder()
        .getAll()
        .select(
          MaterialApi.MATERIAL,
          MaterialApi.MATERIAL_NAME,
          MaterialApi.MATERIAL_TYPE,
          MaterialApi.BASE_UOM,
          MaterialApi.MATERIAL_GROUP,
          MaterialApi.PLANT,
          MaterialApi.STORAGE_LOCATION
        )
        .execute(this.client);

      return materials.map(material => ({
        id: material.material,
        code: material.material,
        name: material.materialName,
        type: material.materialType,
        unitOfMeasure: material.baseUom,
        category: material.materialGroup,
        plant: material.plant,
        storageLocation: material.storageLocation,
        organizationId
      }));
    } catch (error) {
      throw new Error(`Failed to fetch materials: ${error.message}`);
    }
  }

  async getPurchaseOrders(organizationId: string, fromDate?: Date): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('SAP not connected');
    }

    try {
      // Use SAP BAPI for purchase orders
      const result = await this.client.execute({
        functionName: 'BAPI_PO_GETLIST',
        parameters: {
          PURCHASE_ORDER_HEADER: {
            DOC_DATE_FROM: fromDate?.toISOString().split('T')[0] || '20200101',
            DOC_DATE_TO: new Date().toISOString().split('T')[0]
          }
        }
      });

      return result.PURCHASE_ORDER_HEADER.map((po: any) => ({
        id: po.PURCHASE_ORDER,
        poNumber: po.PURCHASE_ORDER,
        supplierId: po.VENDOR,
        status: this.mapSAPStatus(po.PURCHASE_ORDER_STATUS),
        orderDate: new Date(po.DOC_DATE),
        expectedDelivery: po.DELIVERY_DATE ? new Date(po.DELIVERY_DATE) : null,
        totalAmount: parseFloat(po.NET_VALUE),
        currency: po.CURRENCY,
        organizationId
      }));
    } catch (error) {
      throw new Error(`Failed to fetch purchase orders: ${error.message}`);
    }
  }

  async getInventoryLevels(organizationId: string): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('SAP not connected');
    }

    try {
      // Use SAP BAPI for inventory levels
      const result = await this.client.execute({
        functionName: 'BAPI_MATERIAL_GET_STOCK',
        parameters: {
          MATERIAL: '',
          PLANT: '',
          STORAGE_LOCATION: ''
        }
      });

      return result.MATERIAL_STOCK.map((stock: any) => ({
        itemId: stock.MATERIAL,
        locationId: stock.PLANT,
        quantity: parseInt(stock.STOCK_QUANTITY),
        reserved: parseInt(stock.RESERVED_STOCK),
        available: parseInt(stock.AVAILABLE_STOCK),
        organizationId
      }));
    } catch (error) {
      throw new Error(`Failed to fetch inventory levels: ${error.message}`);
    }
  }

  async createPurchaseOrder(purchaseOrder: any): Promise<string> {
    if (!this.isConnected) {
      throw new Error('SAP not connected');
    }

    try {
      const result = await this.client.execute({
        functionName: 'BAPI_PO_CREATE',
        parameters: {
          PURCHASE_ORDER_HEADER: {
            VENDOR: purchaseOrder.supplierId,
            COMPANY_CODE: this.config.credentials.client,
            PURCHASING_ORG: '1000',
            CURRENCY: purchaseOrder.currency || 'USD',
            DOC_DATE: new Date().toISOString().split('T')[0]
          },
          PURCHASE_ORDER_ITEM: purchaseOrder.items.map((item: any) => ({
            MATERIAL: item.sku,
            PLANT: '1000',
            STORAGE_LOCATION: '0001',
            QUANTITY: item.quantity,
            UNIT: item.unitOfMeasure,
            NET_PRICE: item.unitPrice
          }))
        }
      });

      if (result.RETURN && result.RETURN.length > 0) {
        const errors = result.RETURN.filter((r: any) => r.TYPE === 'E');
        if (errors.length > 0) {
          throw new Error(`SAP errors: ${errors.map((e: any) => e.MESSAGE).join(', ')}`);
        }
      }

      return result.PURCHASE_ORDER;
    } catch (error) {
      throw new Error(`Failed to create purchase order: ${error.message}`);
    }
  }

  async updateInventoryMovement(movement: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SAP not connected');
    }

    try {
      await this.client.execute({
        functionName: 'BAPI_GOODSMVT_CREATE',
        parameters: {
          GOODSMVT_HEADER: {
            PSTNG_DATE: new Date().toISOString().split('T')[0],
            DOC_DATE: new Date().toISOString().split('T')[0],
            PR_UNAUTHORIZED: 'X',
            HEADER_TXT: movement.reason || 'System movement'
          },
          GOODSMVT_ITEM: [{
            MATERIAL: movement.itemId,
            PLANT: movement.locationId,
            STGE_LOC: '0001',
            MOVE_TYPE: this.mapMovementType(movement.type),
            ENTRY_QNT: movement.quantity,
            ENTRY_UOM: 'EA'
          }]
        }
      });
    } catch (error) {
      throw new Error(`Failed to update inventory: ${error.message}`);
    }
  }

  private mapSAPStatus(sapStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'A': 'draft',
      'B': 'approved',
      'C': 'sent',
      'D': 'received',
      'E': 'closed'
    };
    return statusMap[sapStatus] || 'draft';
  }

  private mapMovementType(movementType: string): string {
    const typeMap: { [key: string]: string } = {
      'receipt': '261',
      'issue': '262',
      'transfer': '311',
      'adjustment': '309'
    };
    return typeMap[movementType] || '261';
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error('Error disconnecting from SAP:', error);
      }
    }
    this.isConnected = false;
  }

  isConnectedToSAP(): boolean {
    return this.isConnected;
  }
}

// Factory function for creating SAP connections
export async function createSAPConnection(
  connectionId: string,
  encryptedCredentials: string,
  timeout?: number
): Promise<SAPConnector> {
  const credentials: SAPCredentials = JSON.parse(decrypt(encryptedCredentials));
  
  const connector = new SAPConnector({
    connectionId,
    credentials,
    timeout
  });

  await connector.connect();
  return connector;
} 