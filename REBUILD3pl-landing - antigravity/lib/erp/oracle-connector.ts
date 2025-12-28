import oracledb from 'oracledb';
import { encrypt, decrypt } from '../utils/encryption';

export interface OracleCredentials {
  host: string;
  port: number;
  serviceName: string;
  username: string;
  password: string;
  schema?: string;
}

export interface OracleConnectionConfig {
  connectionId: string;
  credentials: OracleCredentials;
  timeout?: number;
  poolSize?: number;
}

export class OracleConnector {
  private config: OracleConnectionConfig;
  private pool: oracledb.Pool | null = null;
  private isConnected: boolean = false;

  constructor(config: OracleConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Create connection pool
      this.pool = await oracledb.createPool({
        user: this.config.credentials.username,
        password: this.config.credentials.password,
        connectString: `${this.config.credentials.host}:${this.config.credentials.port}/${this.config.credentials.serviceName}`,
        poolMin: 2,
        poolMax: this.config.poolSize || 10,
        poolIncrement: 1,
        poolTimeout: this.config.timeout || 60,
        queueTimeout: this.config.timeout || 60000,
      });

      // Test connection
      await this.testConnection();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Oracle connection failed:', error);
      throw new Error(`Oracle connection failed: ${error.message}`);
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    const connection = await this.pool.getConnection();
    try {
      const result = await connection.execute('SELECT 1 FROM DUAL');
      if (!result.rows || result.rows.length === 0) {
        throw new Error('No response from Oracle database');
      }
    } finally {
      await connection.close();
    }
  }

  async getMaterials(organizationId: string): Promise<any[]> {
    if (!this.pool) {
      throw new Error('Oracle not connected');
    }

    const connection = await this.pool.getConnection();
    try {
      const result = await connection.execute(`
        SELECT 
          INVENTORY_ITEM_ID,
          SEGMENT1 as ITEM_CODE,
          DESCRIPTION,
          ITEM_TYPE,
          PRIMARY_UOM_CODE,
          ITEM_CATEGORY_ID,
          ORGANIZATION_ID
        FROM MTL_SYSTEM_ITEMS_B 
        WHERE ORGANIZATION_ID = :orgId 
        AND INVENTORY_ITEM_STATUS_CODE = 'Active'
      `, { orgId: organizationId });

      return result.rows?.map((row: any) => ({
        id: row[0],
        code: row[1],
        name: row[2],
        type: row[3],
        unitOfMeasure: row[4],
        category: row[5],
        organizationId: row[6]
      })) || [];
    } finally {
      await connection.close();
    }
  }

  async getPurchaseOrders(organizationId: string, fromDate?: Date): Promise<any[]> {
    if (!this.pool) {
      throw new Error('Oracle not connected');
    }

    const connection = await this.pool.getConnection();
    try {
      const result = await connection.execute(`
        SELECT 
          PO_HEADER_ID,
          SEGMENT1 as PO_NUMBER,
          VENDOR_ID,
          PO_STATUS,
          CREATION_DATE,
          EXPECTED_DELIVERY_DATE,
          CURRENCY_CODE,
          RATE,
          TOTAL_AMOUNT
        FROM PO_HEADERS_ALL 
        WHERE ORG_ID = :orgId 
        AND CREATION_DATE >= :fromDate
        ORDER BY CREATION_DATE DESC
      `, { 
        orgId: organizationId,
        fromDate: fromDate || new Date('2020-01-01')
      });

      return result.rows?.map((row: any) => ({
        id: row[0],
        poNumber: row[1],
        supplierId: row[2],
        status: this.mapOracleStatus(row[3]),
        orderDate: row[4],
        expectedDelivery: row[5],
        currency: row[6],
        exchangeRate: row[7],
        totalAmount: row[8],
        organizationId
      })) || [];
    } finally {
      await connection.close();
    }
  }

  async getInventoryLevels(organizationId: string): Promise<any[]> {
    if (!this.pool) {
      throw new Error('Oracle not connected');
    }

    const connection = await this.pool.getConnection();
    try {
      const result = await connection.execute(`
        SELECT 
          INVENTORY_ITEM_ID,
          ORGANIZATION_ID,
          SUBINVENTORY_CODE,
          QUANTITY,
          RESERVED_QUANTITY,
          AVAILABLE_QUANTITY
        FROM MTL_ONHAND_QUANTITIES 
        WHERE ORGANIZATION_ID = :orgId
      `, { orgId: organizationId });

      return result.rows?.map((row: any) => ({
        itemId: row[0],
        locationId: row[1],
        subinventory: row[2],
        quantity: row[3],
        reserved: row[4],
        available: row[5],
        organizationId
      })) || [];
    } finally {
      await connection.close();
    }
  }

  async createPurchaseOrder(purchaseOrder: any): Promise<string> {
    if (!this.pool) {
      throw new Error('Oracle not connected');
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.execute('BEGIN', [], { autoCommit: false });

      // Create PO header
      const headerResult = await connection.execute(`
        INSERT INTO PO_HEADERS_ALL (
          SEGMENT1, VENDOR_ID, ORG_ID, CURRENCY_CODE, 
          RATE, CREATION_DATE, CREATED_BY
        ) VALUES (
          :poNumber, :vendorId, :orgId, :currency, 
          :rate, SYSDATE, :userId
        ) RETURNING PO_HEADER_ID INTO :poHeaderId
      `, {
        poNumber: purchaseOrder.poNumber,
        vendorId: purchaseOrder.supplierId,
        orgId: purchaseOrder.organizationId,
        currency: purchaseOrder.currency || 'USD',
        rate: 1,
        userId: 1,
        poHeaderId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      });

      const poHeaderId = headerResult.outBinds?.poHeaderId?.[0];

      // Create PO lines
      for (const item of purchaseOrder.items) {
        await connection.execute(`
          INSERT INTO PO_LINES_ALL (
            PO_HEADER_ID, LINE_NUM, ITEM_ID, QUANTITY, 
            UNIT_PRICE, UOM_CODE, ORG_ID
          ) VALUES (
            :poHeaderId, :lineNum, :itemId, :quantity, 
            :unitPrice, :uomCode, :orgId
          )
        `, {
          poHeaderId,
          lineNum: item.lineNumber || 1,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          uomCode: item.unitOfMeasure || 'EA',
          orgId: purchaseOrder.organizationId
        });
      }

      await connection.commit();
      return poHeaderId?.toString() || '';
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to create purchase order: ${error.message}`);
    } finally {
      await connection.close();
    }
  }

  async updateInventoryMovement(movement: any): Promise<void> {
    if (!this.pool) {
      throw new Error('Oracle not connected');
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.execute(`
        INSERT INTO MTL_MATERIAL_TRANSACTIONS (
          INVENTORY_ITEM_ID, ORGANIZATION_ID, SUBINVENTORY_CODE,
          TRANSACTION_TYPE_ID, TRANSACTION_QUANTITY, 
          TRANSACTION_DATE, CREATED_BY
        ) VALUES (
          :itemId, :orgId, :subinventory, :transType, 
          :quantity, SYSDATE, :userId
        )
      `, {
        itemId: movement.itemId,
        orgId: movement.locationId,
        subinventory: 'MAIN',
        transType: this.mapMovementType(movement.type),
        quantity: movement.quantity,
        userId: 1
      });

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed to update inventory: ${error.message}`);
    } finally {
      await connection.close();
    }
  }

  private mapOracleStatus(oracleStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'draft',
      'APPROVED': 'approved',
      'SENT': 'sent',
      'RECEIVED': 'received',
      'CLOSED': 'closed'
    };
    return statusMap[oracleStatus] || 'draft';
  }

  private mapMovementType(movementType: string): number {
    const typeMap: { [key: string]: number } = {
      'receipt': 1,
      'issue': 2,
      'transfer': 3,
      'adjustment': 4
    };
    return typeMap[movementType] || 1;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close();
      } catch (error) {
        console.error('Error disconnecting from Oracle:', error);
      }
    }
    this.isConnected = false;
  }

  isConnectedToOracle(): boolean {
    return this.isConnected;
  }
}

// Factory function for creating Oracle connections
export async function createOracleConnection(
  connectionId: string,
  encryptedCredentials: string,
  timeout?: number
): Promise<OracleConnector> {
  const credentials: OracleCredentials = JSON.parse(decrypt(encryptedCredentials));
  
  const connector = new OracleConnector({
    connectionId,
    credentials,
    timeout
  });

  await connector.connect();
  return connector;
} 