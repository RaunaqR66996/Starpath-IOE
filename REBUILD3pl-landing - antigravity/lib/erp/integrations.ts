import { generateContent, AIResponse } from '../ai/google-ai-integration';

export interface ERPConnection {
  id: string;
  name: string;
  type: 'infor_syteline' | 'oracle' | 'sap' | 'other';
  host: string;
  port: number;
  database: string;
  username: string;
  encryptedPassword: string;
  connectionString?: string;
  apiEndpoint?: string;
  apiKey?: string;
  isActive: boolean;
  lastSync: Date;
  syncInterval: number; // minutes
}

export interface ERPSyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  syncTime: Date;
  duration: number; // milliseconds
}

export interface ERPDataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  defaultValue?: any;
}

export interface ERPSyncConfig {
  entityType: 'orders' | 'inventory' | 'customers' | 'suppliers' | 'production' | 'quality';
  direction: 'import' | 'export' | 'bidirectional';
  mapping: ERPDataMapping[];
  schedule: 'realtime' | 'hourly' | 'daily' | 'manual';
  lastSync?: Date;
  nextSync?: Date;
}

// Infor SyteLine Integration
export class InforSyteLineIntegration {
  private connection: ERPConnection;

  constructor(connection: ERPConnection) {
    this.connection = connection;
  }

  async connect(): Promise<boolean> {
    try {
      // SyteLine connection logic
      console.log(`Connecting to Infor SyteLine at ${this.connection.host}:${this.connection.port}`);
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('SyteLine connection failed:', error);
      return false;
    }
  }

  async getOrders(lastSyncDate?: Date): Promise<any[]> {
    try {
      // SyteLine order query
      const query = `
        SELECT 
          o.OrderNum,
          o.OrderDate,
          o.CustomerNum,
          c.Name as CustomerName,
          o.OrderComment,
          o.Status
        FROM OrderHed o
        JOIN Customer c ON o.CustomerNum = c.CustomerNum
        WHERE o.OrderDate >= '${lastSyncDate?.toISOString() || '2024-01-01'}'
        ORDER BY o.OrderDate DESC
      `;
      
      // Simulate data retrieval
      return [
        {
          OrderNum: 'SO-2024-001',
          OrderDate: '2024-01-15',
          CustomerNum: 'CUST001',
          CustomerName: 'Aerospace Industries',
          OrderComment: 'Critical aerospace components',
          Status: 'Open'
        }
      ];
    } catch (error) {
      console.error('Error fetching SyteLine orders:', error);
      return [];
    }
  }

  async getInventory(): Promise<any[]> {
    try {
      // SyteLine inventory query
      const query = `
        SELECT 
          p.PartNum,
          p.PartDescription,
          p.IUM,
          p.PUM,
          p.TypeCode,
          i.OnHandQty,
          i.AllocatedQty,
          i.AvailableQty
        FROM Part p
        JOIN PartBin i ON p.PartNum = i.PartNum
        WHERE p.TypeCode IN ('M', 'P')
        ORDER BY p.PartNum
      `;
      
      return [
        {
          PartNum: 'TI-G5-001',
          PartDescription: 'Titanium Grade 5 Sheet',
          IUM: 'LB',
          PUM: 'LB',
          TypeCode: 'M',
          OnHandQty: 2500,
          AllocatedQty: 500,
          AvailableQty: 2000
        }
      ];
    } catch (error) {
      console.error('Error fetching SyteLine inventory:', error);
      return [];
    }
  }

  async getCustomers(): Promise<any[]> {
    try {
      // SyteLine customer query
      const query = `
        SELECT 
          CustomerNum,
          Name,
          Address1,
          City,
          State,
          Zip,
          PhoneNum,
          EmailAddress,
          CreditLimit,
          Status
        FROM Customer
        WHERE Status = 'A'
        ORDER BY Name
      `;
      
      return [
        {
          CustomerNum: 'CUST001',
          Name: 'Aerospace Industries Inc.',
          Address1: '123 Aviation Blvd',
          City: 'Seattle',
          State: 'WA',
          Zip: '98101',
          PhoneNum: '555-123-4567',
          EmailAddress: 'orders@aerospace.com',
          CreditLimit: 1000000,
          Status: 'A'
        }
      ];
    } catch (error) {
      console.error('Error fetching SyteLine customers:', error);
      return [];
    }
  }

  async createOrder(orderData: any): Promise<boolean> {
    try {
      // SyteLine order creation logic
      console.log('Creating order in SyteLine:', orderData);
      
      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Error creating SyteLine order:', error);
      return false;
    }
  }

  async updateInventory(partNum: string, quantity: number): Promise<boolean> {
    try {
      // SyteLine inventory update
      const query = `
        UPDATE PartBin 
        SET OnHandQty = OnHandQty + ${quantity}
        WHERE PartNum = '${partNum}'
      `;
      
      console.log('Updating SyteLine inventory:', { partNum, quantity });
      
      return true;
    } catch (error) {
      console.error('Error updating SyteLine inventory:', error);
      return false;
    }
  }
}

// Oracle ERP Integration
export class OracleERPIntegration {
  private connection: ERPConnection;

  constructor(connection: ERPConnection) {
    this.connection = connection;
  }

  async connect(): Promise<boolean> {
    try {
      console.log(`Connecting to Oracle ERP at ${this.connection.host}:${this.connection.port}`);
      
      // Oracle connection logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Oracle connection failed:', error);
      return false;
    }
  }

  async getOrders(lastSyncDate?: Date): Promise<any[]> {
    try {
      // Oracle order query
      const query = `
        SELECT 
          o.order_number,
          o.order_date,
          o.customer_id,
          c.customer_name,
          o.order_status,
          o.total_amount
        FROM oe_order_headers_all o
        JOIN oe_customers c ON o.customer_id = c.customer_id
        WHERE o.order_date >= TO_DATE('${lastSyncDate?.toISOString() || '2024-01-01'}', 'YYYY-MM-DD')
        ORDER BY o.order_date DESC
      `;
      
      return [
        {
          order_number: 'OR-2024-001',
          order_date: '2024-01-15',
          customer_id: 'CUST001',
          customer_name: 'Global Manufacturing',
          order_status: 'OPEN',
          total_amount: 50000.00
        }
      ];
    } catch (error) {
      console.error('Error fetching Oracle orders:', error);
      return [];
    }
  }

  async getInventory(): Promise<any[]> {
    try {
      // Oracle inventory query
      const query = `
        SELECT 
          i.item_code,
          i.description,
          i.uom_code,
          i.item_type,
          q.quantity_on_hand,
          q.quantity_reserved,
          q.quantity_available
        FROM mtl_system_items_b i
        JOIN mtl_onhand_quantities q ON i.inventory_item_id = q.inventory_item_id
        WHERE i.item_type IN ('M', 'P')
        ORDER BY i.item_code
      `;
      
      return [
        {
          item_code: 'AL-7075-001',
          description: 'Aluminum 7075-T6',
          uom_code: 'LB',
          item_type: 'M',
          quantity_on_hand: 1800,
          quantity_reserved: 200,
          quantity_available: 1600
        }
      ];
    } catch (error) {
      console.error('Error fetching Oracle inventory:', error);
      return [];
    }
  }

  async createOrder(orderData: any): Promise<boolean> {
    try {
      // Oracle order creation using PL/SQL or API
      console.log('Creating order in Oracle ERP:', orderData);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Error creating Oracle order:', error);
      return false;
    }
  }
}

// SAP ERP Integration
export class SAPERPIntegration {
  private connection: ERPConnection;

  constructor(connection: ERPConnection) {
    this.connection = connection;
  }

  async connect(): Promise<boolean> {
    try {
      console.log(`Connecting to SAP ERP at ${this.connection.host}:${this.connection.port}`);
      
      // SAP connection logic (RFC, BAPI, or OData)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('SAP connection failed:', error);
      return false;
    }
  }

  async getOrders(lastSyncDate?: Date): Promise<any[]> {
    try {
      // SAP order query using RFC or BAPI
      const query = `
        SELECT 
          VBELN as order_number,
          ERDAT as order_date,
          KUNNR as customer_number,
          KUNNR_NAME as customer_name,
          NETWR as total_amount,
          STATUS as order_status
        FROM VBAK
        WHERE ERDAT >= '${lastSyncDate?.toISOString() || '20240101'}'
        ORDER BY ERDAT DESC
      `;
      
      return [
        {
          order_number: 'SO-2024-001',
          order_date: '2024-01-15',
          customer_number: 'CUST001',
          customer_name: 'SAP Customer',
          total_amount: 75000.00,
          order_status: 'OPEN'
        }
      ];
    } catch (error) {
      console.error('Error fetching SAP orders:', error);
      return [];
    }
  }

  async getInventory(): Promise<any[]> {
    try {
      // SAP inventory query
      const query = `
        SELECT 
          MATNR as material_number,
          MAKTX as description,
          MEINS as uom,
          MTART as material_type,
          LABST as stock_quantity,
          ERSDA as creation_date
        FROM MARD
        JOIN MAKT ON MARD.MATNR = MAKT.MATNR
        WHERE MTART IN ('FERT', 'HALB', 'ROH')
        ORDER BY MATNR
      `;
      
      return [
        {
          material_number: 'MAT-001',
          description: 'SAP Material',
          uom: 'PC',
          material_type: 'FERT',
          stock_quantity: 1000,
          creation_date: '2024-01-01'
        }
      ];
    } catch (error) {
      console.error('Error fetching SAP inventory:', error);
      return [];
    }
  }

  async createOrder(orderData: any): Promise<boolean> {
    try {
      // SAP order creation using BAPI_SALESORDER_CREATE
      console.log('Creating order in SAP ERP:', orderData);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Error creating SAP order:', error);
      return false;
    }
  }
}

// ERP Integration Manager
export class ERPIntegrationManager {
  private connections: Map<string, ERPConnection> = new Map();
  private integrations: Map<string, any> = new Map();

  async addConnection(connection: ERPConnection): Promise<boolean> {
    try {
      this.connections.set(connection.id, connection);
      
      // Initialize integration based on type
      let integration;
      switch (connection.type) {
        case 'infor_syteline':
          integration = new InforSyteLineIntegration(connection);
          break;
        case 'oracle':
          integration = new OracleERPIntegration(connection);
          break;
        case 'sap':
          integration = new SAPERPIntegration(connection);
          break;
        default:
          throw new Error(`Unsupported ERP type: ${connection.type}`);
      }
      
      this.integrations.set(connection.id, integration);
      
      // Test connection
      const isConnected = await integration.connect();
      if (!isConnected) {
        throw new Error(`Failed to connect to ${connection.name}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding ERP connection:', error);
      return false;
    }
  }

  async syncData(connectionId: string, entityType: string, direction: 'import' | 'export'): Promise<ERPSyncResult> {
    try {
      const connection = this.connections.get(connectionId);
      const integration = this.integrations.get(connectionId);
      
      if (!connection || !integration) {
        throw new Error(`Connection ${connectionId} not found`);
      }

      const startTime = Date.now();
      let recordsProcessed = 0;
      let recordsCreated = 0;
      let recordsUpdated = 0;
      let recordsFailed = 0;
      const errors: string[] = [];

      console.log(`Starting ${direction} sync for ${entityType} from ${connection.name}`);

      try {
        switch (entityType) {
          case 'orders':
            if (direction === 'import') {
              const orders = await integration.getOrders();
              recordsProcessed = orders.length;
              // Process imported orders
              for (const order of orders) {
                try {
                  // Transform and save order data
                  recordsCreated++;
                } catch (error) {
                  recordsFailed++;
                  errors.push(`Order ${order.OrderNum || order.order_number}: ${error}`);
                }
              }
            }
            break;
            
          case 'inventory':
            if (direction === 'import') {
              const inventory = await integration.getInventory();
              recordsProcessed = inventory.length;
              // Process imported inventory
              for (const item of inventory) {
                try {
                  // Transform and save inventory data
                  recordsCreated++;
                } catch (error) {
                  recordsFailed++;
                  errors.push(`Inventory ${item.PartNum || item.item_code}: ${error}`);
                }
              }
            }
            break;
            
          case 'customers':
            if (direction === 'import') {
              const customers = await integration.getCustomers();
              recordsProcessed = customers.length;
              // Process imported customers
              for (const customer of customers) {
                try {
                  // Transform and save customer data
                  recordsCreated++;
                } catch (error) {
                  recordsFailed++;
                  errors.push(`Customer ${customer.CustomerNum}: ${error}`);
                }
              }
            }
            break;
            
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }
      } catch (error) {
        errors.push(`Sync error: ${error}`);
      }

      const duration = Date.now() - startTime;
      
      // Update last sync time
      connection.lastSync = new Date();
      this.connections.set(connectionId, connection);

      return {
        success: recordsFailed === 0,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors,
        syncTime: new Date(),
        duration
      };
    } catch (error) {
      console.error('Error syncing ERP data:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 1,
        errors: [error.toString()],
        syncTime: new Date(),
        duration: 0
      };
    }
  }

  async getConnections(): Promise<ERPConnection[]> {
    return Array.from(this.connections.values());
  }

  async getConnection(connectionId: string): Promise<ERPConnection | null> {
    return this.connections.get(connectionId) || null;
  }

  async testConnection(connectionId: string): Promise<boolean> {
    try {
      const integration = this.integrations.get(connectionId);
      if (!integration) {
        return false;
      }
      
      return await integration.connect();
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async transformData(sourceData: any, mapping: ERPDataMapping[]): Promise<any> {
    try {
      const transformedData: any = {};
      
      for (const map of mapping) {
        let value = sourceData[map.sourceField];
        
        if (value === undefined || value === null) {
          if (map.required) {
            throw new Error(`Required field ${map.sourceField} is missing`);
          }
          value = map.defaultValue;
        }
        
        if (map.transformation) {
          // Apply transformation logic
          value = this.applyTransformation(value, map.transformation);
        }
        
        transformedData[map.targetField] = value;
      }
      
      return transformedData;
    } catch (error) {
      console.error('Error transforming data:', error);
      throw error;
    }
  }

  private applyTransformation(value: any, transformation: string): any {
    switch (transformation) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'parse_int':
        return parseInt(value) || 0;
      case 'parse_float':
        return parseFloat(value) || 0;
      case 'format_date':
        return new Date(value).toISOString();
      default:
        return value;
    }
  }
}

// AI-powered ERP data analysis
export class ERPDataAnalyzer {
  static async analyzeSyncResults(syncResults: ERPSyncResult[], modelId: string = 'gemini-2.0-flash'): Promise<AIResponse> {
    try {
      const task = 'Analyze ERP synchronization results and provide insights';
      const context = {
        syncResults,
        analysisType: 'ERP_SYNC_ANALYSIS'
      };

      const response = await generateContent(`
You are an AI ERP integration specialist. Analyze the following ERP synchronization results:

Sync Results: ${JSON.stringify(syncResults, null, 2)}

Please provide:
1. Overall sync performance analysis
2. Identification of common error patterns
3. Recommendations for improving sync reliability
4. Data quality assessment
5. Suggestions for optimizing sync schedules
6. Performance improvement recommendations

Focus on B2B manufacturing context and legacy ERP systems.
      `, modelId);

      return response;
    } catch (error) {
      console.error('Error analyzing ERP sync results:', error);
      throw error;
    }
  }

  static async generateDataMapping(sourceSchema: any, targetSchema: any, modelId: string = 'gemini-2.0-flash'): Promise<AIResponse> {
    try {
      const task = 'Generate optimal data mapping between ERP systems';
      const context = {
        sourceSchema,
        targetSchema,
        mappingType: 'ERP_DATA_MAPPING'
      };

      const response = await generateContent(`
You are an AI ERP integration specialist. Generate optimal data mapping between these ERP schemas:

Source Schema: ${JSON.stringify(sourceSchema, null, 2)}
Target Schema: ${JSON.stringify(targetSchema, null, 2)}

Please provide:
1. Field-to-field mapping recommendations
2. Data transformation rules
3. Validation rules for data quality
4. Error handling strategies
5. Performance optimization suggestions
6. Compliance considerations for B2B manufacturing

Focus on accuracy and data integrity for manufacturing operations.
      `, modelId);

      return response;
    } catch (error) {
      console.error('Error generating data mapping:', error);
      throw error;
    }
  }
}

export const erpIntegrationManager = new ERPIntegrationManager(); 