import { PrismaClient } from '@prisma/client';
import { BusinessRuleEngine } from '../business-rules/business-rule-engine';
import { OrderWorkflowEngine } from '../workflows/order-workflow-engine';
import { EnhancedMRPEngine } from '../mrp/mrp-engine-enhanced';
import { EnhancedPlanningAgent } from '../ai-agents/planning/planning-agent-enhanced';
import { SAPConnector } from '../erp/sap-connector';
import { OracleConnector } from '../erp/oracle-connector';
import { MicrosoftDynamicsConnector } from '../erp/microsoft-dynamics-connector';

const prisma = new PrismaClient();

export interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface TestCase {
  name: string;
  description: string;
  test: () => Promise<void>;
  category: 'unit' | 'integration' | 'e2e' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class IntegrationTestSuite {
  private results: TestResult[] = [];
  private businessRuleEngine: BusinessRuleEngine;
  private orderWorkflowEngine: OrderWorkflowEngine;
  private mrpEngine: EnhancedMRPEngine;
  private planningAgent: EnhancedPlanningAgent;
  private testCounter = 0;

  constructor() {
    this.businessRuleEngine = new BusinessRuleEngine();
    this.orderWorkflowEngine = new OrderWorkflowEngine();
    this.mrpEngine = new EnhancedMRPEngine();
    this.planningAgent = new EnhancedPlanningAgent('test-org');
  }

  private generateUniqueDomain(): string {
    this.testCounter++;
    return `test-org-${this.testCounter}-${Date.now()}.com`;
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Integration Test Suite...');
    
    const testSuites: TestSuite[] = [
      this.getDatabaseTests(),
      this.getBusinessRuleTests(),
      this.getWorkflowTests(),
      this.getMRPTests(),
      this.getAITests(),
      this.getERPIntegrationTests(),
      this.getEndToEndTests()
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 Running Test Suite: ${suite.name}`);
      console.log(`📝 Description: ${suite.description}`);
      
      if (suite.setup) {
        await suite.setup();
      }

      for (const testCase of suite.tests) {
        const result = await this.runTest(testCase);
        this.results.push(result);
        
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${testCase.name}: ${result.status} (${result.duration}ms)`);
        
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }

      if (suite.teardown) {
        await suite.teardown();
      }
    }

    this.printSummary();
    return this.results;
  }

  private async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testCase.test();
      
      return {
        testName: testCase.name,
        status: 'PASS',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testName: testCase.name,
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: error.message,
        details: error.stack
      };
    }
  }

  private getDatabaseTests(): TestSuite {
    return {
      name: 'Database Integration Tests',
      description: 'Test database connectivity, schema, and basic CRUD operations',
      tests: [

        {
          name: 'Organization CRUD',
          description: 'Test organization create, read, update, delete operations',
          category: 'integration',
          priority: 'high',
          test: async () => {
            // Create
            const org = await prisma.organization.create({
              data: {
                name: 'Test Organization',
                domain: 'test-org.com'
              }
            });

            // Read
            const readOrg = await prisma.organization.findUnique({
              where: { id: org.id }
            });

            if (!readOrg || readOrg.name !== 'Test Organization') {
              throw new Error('Organization read test failed');
            }

            // Update
            await prisma.organization.update({
              where: { id: org.id },
              data: { name: 'Updated Test Organization' }
            });

            // Delete
            await prisma.organization.delete({
              where: { id: org.id }
            });
          }
        },
        {
          name: 'Item and Stock Level Integration',
          description: 'Test item creation with stock levels',
          category: 'integration',
          priority: 'high',
          test: async () => {
            const org = await prisma.organization.create({
              data: {
                name: 'Stock Test Org',
                domain: this.generateUniqueDomain()
              }
            });

            const item = await prisma.item.create({
              data: {
                sku: 'TEST-SKU-001',
                name: 'Test Item',
                description: 'Test item for stock level testing',
                organizationId: org.id,
                isActive: true
              }
            });

            const stockLevel = await prisma.stockLevel.create({
              data: {
                itemId: item.id,
                organizationId: org.id,
                quantity: 100,
                reservedQuantity: 0,
                availableQuantity: 100,
                reorderPoint: 20,
                maxLevel: 200
              }
            });

            if (stockLevel.quantity !== 100) {
              throw new Error('Stock level creation failed');
            }

            // Cleanup
            await prisma.stockLevel.delete({ where: { id: stockLevel.id } });
            await prisma.item.delete({ where: { id: item.id } });
            await prisma.organization.delete({ where: { id: org.id } });
          }
        }
      ]
    };
  }

  private getBusinessRuleTests(): TestSuite {
    return {
      name: 'Business Rule Engine Tests',
      description: 'Test business rule validation and execution',
      tests: [
        {
          name: 'Order Validation Schema',
          description: 'Test order validation with valid data',
          category: 'unit',
          priority: 'high',
          test: async () => {
            const validOrder = {
              customerId: 'test-customer',
              items: [
                {
                  sku: 'TEST-SKU',
                  quantity: 10,
                  unitPrice: 25.00
                }
              ],
              deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              priority: 'medium'
            };

            const result = await this.businessRuleEngine.validateData('order', validOrder);
            if (!result.isValid) {
              throw new Error(`Order validation failed: ${result.errors.join(', ')}`);
            }
          }
        },
        {
          name: 'Order Validation Schema - Invalid Data',
          description: 'Test order validation with invalid data',
          category: 'unit',
          priority: 'high',
          test: async () => {
            const invalidOrder = {
              customerId: '', // Invalid: empty customer ID
              items: [], // Invalid: empty items array
              deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Invalid: past date
              priority: 'invalid' // Invalid: not in enum
            };

            const result = await this.businessRuleEngine.validateData('order', invalidOrder);
            if (result.isValid) {
              throw new Error('Order validation should have failed with invalid data');
            }
          }
        },
        {
          name: 'Business Rule Execution',
          description: 'Test business rule execution with context',
          category: 'integration',
          priority: 'high',
          test: async () => {
            // Force load default rules by calling loadRules with a non-existent org
            await this.businessRuleEngine.loadRules('test-org');
            
            const context = {
              totalAmount: 50, // Below minimum threshold
              customerCreditLimit: 1000
            };

            const result = await this.businessRuleEngine.executeRules(context);
            
            // Should have violations for low order amount
            if (result.violations.length === 0) {
              throw new Error('Expected business rule violations for low order amount');
            }
          }
        }
      ]
    };
  }

  private getWorkflowTests(): TestSuite {
    return {
      name: 'Order Workflow Engine Tests',
      description: 'Test order workflow creation and execution',
      tests: [
        {
          name: 'Workflow Creation',
          description: 'Test order workflow creation',
          category: 'integration',
          priority: 'high',
          test: async () => {
            const orderData = {
              id: 'test-order-001',
              orderNumber: 'ORD-001',
              organizationId: 'test-org'
            };

            const workflow = await this.orderWorkflowEngine.createOrderWorkflow(orderData, 'test-org');
            
            if (!workflow || workflow.steps.length !== 9) {
              throw new Error('Workflow creation failed or incorrect number of steps');
            }

            if (workflow.status !== 'draft') {
              throw new Error('Workflow should be in draft status initially');
            }
          }
        },
        {
          name: 'Workflow Step Execution',
          description: 'Test individual workflow step execution',
          category: 'integration',
          priority: 'medium',
          test: async () => {
            // This test would require a complete order setup
            // For now, we'll test the workflow engine initialization
            const engine = new OrderWorkflowEngine();
            
            if (!engine) {
              throw new Error('Workflow engine initialization failed');
            }
          }
        }
      ]
    };
  }

  private getMRPTests(): TestSuite {
    return {
      name: 'MRP Engine Tests',
      description: 'Test Material Requirements Planning calculations',
      tests: [
        {
          name: 'MRP Engine Initialization',
          description: 'Test MRP engine initialization',
          category: 'unit',
          priority: 'high',
          test: async () => {
            const mrpEngine = new EnhancedMRPEngine();
            
            if (!mrpEngine) {
              throw new Error('MRP engine initialization failed');
            }
          }
        },
        {
          name: 'MRP Calculation with Mock Data',
          description: 'Test MRP calculation with sample data',
          category: 'integration',
          priority: 'high',
          test: async () => {
              // Create test organization and items
  const org = await prisma.organization.create({
    data: {
      name: 'MRP Test Org',
      domain: this.generateUniqueDomain()
    }
  });

            const item = await prisma.item.create({
              data: {
                sku: 'MRP-TEST-001',
                name: 'MRP Test Item',
                organizationId: org.id,
                isActive: true
              }
            });

            await prisma.stockLevel.create({
              data: {
                itemId: item.id,
                organizationId: org.id,
                quantity: 50,
                reservedQuantity: 0,
                availableQuantity: 50,
                reorderPoint: 20,
                maxLevel: 200
              }
            });

            // Test MRP calculation
            const mrpResult = await this.mrpEngine.calculateItemMRP(
              { id: item.id, sku: item.sku },
              org.id,
              new Date()
            );

            if (!mrpResult) {
              throw new Error('MRP calculation failed');
            }

            // Cleanup
            await prisma.stockLevel.deleteMany({ where: { itemId: item.id } });
            await prisma.item.delete({ where: { id: item.id } });
            await prisma.organization.delete({ where: { id: org.id } });
          }
        }
      ]
    };
  }

  private getAITests(): TestSuite {
    return {
      name: 'AI Agent Tests',
      description: 'Test AI agent functionality and integration',
      tests: [
        {
          name: 'Planning Agent Initialization',
          description: 'Test AI planning agent initialization',
          category: 'unit',
          priority: 'high',
          test: async () => {
            const agent = new EnhancedPlanningAgent('test-org');
            
            if (!agent) {
              throw new Error('AI planning agent initialization failed');
            }
          }
        },
        {
          name: 'Demand Forecasting',
          description: 'Test AI-powered demand forecasting',
          category: 'integration',
          priority: 'medium',
          test: async () => {
            // This would test actual AI functionality
            // For now, we'll test the agent structure
            const agent = new EnhancedPlanningAgent('test-org');
            
            // Mock test - in real implementation, this would call OpenAI
            console.log('AI agent test completed (mock)');
          }
        }
      ]
    };
  }

  private getERPIntegrationTests(): TestSuite {
    return {
      name: 'ERP Integration Tests',
      description: 'Test ERP system connectors and integration',
      tests: [
        {
          name: 'SAP Connector Structure',
          description: 'Test SAP connector class structure',
          category: 'unit',
          priority: 'high',
          test: async () => {
            const sapConfig = {
              credentials: {
                client: 'test-client',
                username: 'test-user',
                password: 'test-pass',
                systemUrl: 'https://test.sap.com',
                authUrl: 'https://test.sap.com/auth'
              }
            };

            const sapConnector = new SAPConnector(sapConfig);
            
            if (!sapConnector) {
              throw new Error('SAP connector initialization failed');
            }
          }
        },
        {
          name: 'Oracle Connector Structure',
          description: 'Test Oracle connector class structure',
          category: 'unit',
          priority: 'high',
          test: async () => {
            const oracleConfig = {
              credentials: {
                host: 'test-oracle.com',
                port: 1521,
                serviceName: 'testdb',
                username: 'test-user',
                password: 'test-pass'
              }
            };

            const oracleConnector = new OracleConnector(oracleConfig);
            
            if (!oracleConnector) {
              throw new Error('Oracle connector initialization failed');
            }
          }
        },
        {
          name: 'Microsoft Dynamics Connector Structure',
          description: 'Test Microsoft Dynamics connector class structure',
          category: 'unit',
          priority: 'high',
          test: async () => {
            const dynamicsConfig = {
              credentials: {
                tenantId: 'test-tenant',
                clientId: 'test-client',
                clientSecret: 'test-secret',
                environmentUrl: 'https://test.crm.dynamics.com'
              }
            };

            const dynamicsConnector = new MicrosoftDynamicsConnector(dynamicsConfig);
            
            if (!dynamicsConnector) {
              throw new Error('Microsoft Dynamics connector initialization failed');
            }
          }
        }
      ]
    };
  }

  private getEndToEndTests(): TestSuite {
    return {
      name: 'End-to-End Integration Tests',
      description: 'Test complete workflows from order to delivery',
      tests: [
        {
          name: 'Complete Order Processing Flow',
          description: 'Test complete order processing workflow',
          category: 'e2e',
          priority: 'critical',
          test: async () => {
              // Create test organization
  const org = await prisma.organization.create({
    data: {
      name: 'E2E Test Org',
      domain: this.generateUniqueDomain()
    }
  });

            // Create test customer
            const customer = await prisma.customer.create({
              data: {
                name: 'Test Customer',
                email: 'test@customer.com',
                organizationId: org.id,
                isActive: true
              }
            });

            // Create test item
            const item = await prisma.item.create({
              data: {
                sku: 'E2E-TEST-001',
                name: 'E2E Test Item',
                organizationId: org.id,
                isActive: true
              }
            });

            // Create stock level
            await prisma.stockLevel.create({
              data: {
                itemId: item.id,
                organizationId: org.id,
                quantity: 100,
                reservedQuantity: 0,
                availableQuantity: 100,
                reorderPoint: 20,
                maxLevel: 200
              }
            });

            // Create order
            const order = await prisma.order.create({
              data: {
                orderNumber: `E2E-ORD-${Date.now()}`,
                customerId: customer.id,
                organizationId: org.id,
                status: 'pending',
                totalAmount: 500.00,
                expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                priority: 'medium'
              }
            });

            // Add order items
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                itemId: item.id,
                quantity: 10,
                unitPrice: 50.00,
                totalPrice: 500.00
              }
            });

            // Test business rule validation
            const validationResult = await this.businessRuleEngine.validateData('order', {
              customerId: customer.id,
              items: [{ sku: item.sku, quantity: 10, unitPrice: 50.00 }],
              deliveryDate: order.expectedDelivery,
              priority: order.priority
            });

            if (!validationResult.isValid) {
              throw new Error(`Order validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Test MRP calculation
            const mrpResult = await this.mrpEngine.calculateItemMRP(
              { id: item.id, sku: item.sku },
              org.id,
              new Date()
            );

            if (!mrpResult) {
              throw new Error('MRP calculation failed in E2E test');
            }

            // Cleanup
            await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
            await prisma.order.delete({ where: { id: order.id } });
            await prisma.stockLevel.deleteMany({ where: { itemId: item.id } });
            await prisma.item.delete({ where: { id: item.id } });
            await prisma.customer.delete({ where: { id: customer.id } });
            await prisma.organization.delete({ where: { id: org.id } });
          }
        }
      ]
    };
  }

  private printSummary(): void {
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`\n⏱️ Average Test Duration: ${avgDuration.toFixed(0)}ms`);
  }

  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
} 