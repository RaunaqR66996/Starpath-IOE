import axios from 'axios';
import { encrypt, decrypt } from '../utils/encryption';

export interface MicrosoftDynamicsConfig {
  credentials: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    environmentUrl: string;
  };
  timeout?: number;
  retryAttempts?: number;
}

export interface MicrosoftDynamicsConnectionConfig {
  config: MicrosoftDynamicsConfig;
  isConnected: boolean;
  lastSync?: Date;
}

export class MicrosoftDynamicsConnector {
  private config: MicrosoftDynamicsConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private isConnected: boolean = false;

  constructor(config: MicrosoftDynamicsConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Get OAuth token
      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${this.config.credentials.tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: this.config.credentials.clientId,
          client_secret: this.config.credentials.clientSecret,
          scope: `${this.config.credentials.environmentUrl}/.default`,
          grant_type: 'client_credentials'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: this.config.timeout || 30000
        }
      );

      this.accessToken = tokenResponse.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokenResponse.data.expires_in * 1000));
      this.isConnected = true;

      // Test connection
      await this.testConnection();
      return true;
    } catch (error) {
      console.error('Microsoft Dynamics connection failed:', error);
      throw new Error(`Microsoft Dynamics connection failed: ${error.message}`);
    }
  }

  private async testConnection(): Promise<void> {
    try {
      const response = await this.makeRequest('GET', '/api/data/v9.2/WhoAmI');
      if (!response.data.UserId) {
        throw new Error('Invalid response from Dynamics API');
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.accessToken || (this.tokenExpiry && this.tokenExpiry <= new Date())) {
      await this.connect();
    }

    const url = `${this.config.credentials.environmentUrl}${endpoint}`;
    
    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        },
        timeout: this.config.timeout || 30000
      });

      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, reconnect
        await this.connect();
        return this.makeRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  async getMaterials(organizationId: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/api/data/v9.2/products?$filter=_organizationid_value eq ${organizationId}&$select=productid,name,productnumber,description,standardcost,listprice,quantityonhand`
      );

      return response.data.value.map((item: any) => ({
        id: item.productid,
        sku: item.productnumber,
        name: item.name,
        description: item.description,
        standardCost: item.standardcost,
        listPrice: item.listprice,
        quantityOnHand: item.quantityonhand,
        source: 'microsoft_dynamics'
      }));
    } catch (error) {
      console.error('Error fetching materials from Microsoft Dynamics:', error);
      throw new Error(`Failed to fetch materials: ${error.message}`);
    }
  }

  async getPurchaseOrders(organizationId: string, status?: string): Promise<any[]> {
    try {
      let filter = `_organizationid_value eq ${organizationId}`;
      if (status) {
        filter += ` and statuscode eq ${this.mapStatusToDynamics(status)}`;
      }

      const response = await this.makeRequest(
        'GET',
        `/api/data/v9.2/purchaseorders?$filter=${filter}&$select=purchaseorderid,ordernumber,totalamount,statuscode,createdon&$expand=supplier($select=name)`
      );

      return response.data.value.map((po: any) => ({
        id: po.purchaseorderid,
        orderNumber: po.ordernumber,
        totalAmount: po.totalamount,
        status: this.mapDynamicsStatusToInternal(po.statuscode),
        createdAt: po.createdon,
        supplier: po.supplier?.name,
        source: 'microsoft_dynamics'
      }));
    } catch (error) {
      console.error('Error fetching purchase orders from Microsoft Dynamics:', error);
      throw new Error(`Failed to fetch purchase orders: ${error.message}`);
    }
  }

  async getInventoryLevels(organizationId: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/api/data/v9.2/productinventories?$filter=_organizationid_value eq ${organizationId}&$select=productinventoryid,quantityonhand,quantityonorder,quantityreserved&$expand=product($select=productid,name,productnumber)`
      );

      return response.data.value.map((inventory: any) => ({
        itemId: inventory.product.productid,
        sku: inventory.product.productnumber,
        name: inventory.product.name,
        quantityOnHand: inventory.quantityonhand,
        quantityOnOrder: inventory.quantityonorder,
        quantityReserved: inventory.quantityreserved,
        availableQuantity: inventory.quantityonhand - inventory.quantityreserved,
        source: 'microsoft_dynamics'
      }));
    } catch (error) {
      console.error('Error fetching inventory levels from Microsoft Dynamics:', error);
      throw new Error(`Failed to fetch inventory levels: ${error.message}`);
    }
  }

  async createPurchaseOrder(poData: any): Promise<any> {
    try {
      const dynamicsPO = {
        ordernumber: poData.orderNumber,
        totalamount: poData.totalAmount,
        statuscode: 1, // Draft status
        supplierid: poData.supplierId,
        description: poData.description
      };

      const response = await this.makeRequest('POST', '/api/data/v9.2/purchaseorders', dynamicsPO);
      
      // Create purchase order items
      if (poData.items && poData.items.length > 0) {
        for (const item of poData.items) {
          const poItem = {
            'purchaseorderid@odata.bind': `purchaseorders(${response.data.purchaseorderid})`,
            productid: item.productId,
            quantity: item.quantity,
            priceperunit: item.unitPrice,
            extendedamount: item.quantity * item.unitPrice
          };
          
          await this.makeRequest('POST', '/api/data/v9.2/purchaseorderdetails', poItem);
        }
      }

      return {
        id: response.data.purchaseorderid,
        orderNumber: poData.orderNumber,
        status: 'DRAFT',
        source: 'microsoft_dynamics'
      };
    } catch (error) {
      console.error('Error creating purchase order in Microsoft Dynamics:', error);
      throw new Error(`Failed to create purchase order: ${error.message}`);
    }
  }

  async updateInventoryMovement(movementData: any): Promise<any> {
    try {
      const inventoryAdjustment = {
        productid: movementData.productId,
        quantity: movementData.quantity,
        adjustmenttype: movementData.type === 'IN' ? 1 : 2, // 1 = Receipt, 2 = Issue
        description: movementData.description,
        adjustmentdate: new Date().toISOString()
      };

      const response = await this.makeRequest('POST', '/api/data/v9.2/inventoryadjustments', inventoryAdjustment);
      
      return {
        id: response.data.inventoryadjustmentid,
        status: 'COMPLETED',
        source: 'microsoft_dynamics'
      };
    } catch (error) {
      console.error('Error updating inventory movement in Microsoft Dynamics:', error);
      throw new Error(`Failed to update inventory movement: ${error.message}`);
    }
  }

  private mapStatusToDynamics(status: string): number {
    const statusMap: { [key: string]: number } = {
      'DRAFT': 1,
      'SUBMITTED': 2,
      'APPROVED': 3,
      'RECEIVED': 4,
      'CANCELLED': 5
    };
    return statusMap[status] || 1;
  }

  private mapDynamicsStatusToInternal(statusCode: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'DRAFT',
      2: 'SUBMITTED',
      3: 'APPROVED',
      4: 'RECEIVED',
      5: 'CANCELLED'
    };
    return statusMap[statusCode] || 'DRAFT';
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.isConnected = false;
  }

  getConnectionStatus(): { isConnected: boolean; lastSync?: Date } {
    return {
      isConnected: this.isConnected,
      lastSync: this.lastSync
    };
  }
} 