import { generatePlanningContent, AIResponse } from '../ai/google-ai-integration';
import { MockAIService } from '../ai/mock-ai-integration';

export interface PlanningAgentResponse {
    content: string;
    agentType: 'planning';
    timestamp: Date;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    cost: number;
    model: string;
}

export class PlanningAgent {
    static async forecastDemand(data: {
        itemId: string;
        historicalSales: any[];
        seasonality: string;
        marketTrends: any;
    }, modelId: string = 'gemini-2.0-flash'): Promise<PlanningAgentResponse> {
        try {
            // Try Google AI first
            const task = 'Forecast demand for the next quarter based on historical sales and trends';
            const context = { data, taskType: 'DEMAND_FORECAST' };
            const response = await generatePlanningContent(task, context, modelId);

            return {
                content: response.content,
                agentType: 'planning',
                timestamp: new Date(),
                usage: {
                    prompt_tokens: response.tokens?.prompt || 0,
                    completion_tokens: response.tokens?.completion || 0,
                    total_tokens: response.tokens?.total || 0
                },
                cost: 0,
                model: response.model
            };
        } catch (error) {
            console.error('Google AI failed, using mock AI:', error);

            // Fallback to mock AI (assuming MockAIService has a generic fallback or we implement specific one)
            // For now, using a generic mock response if specific method doesn't exist
            return {
                content: "Mock Forecast: Demand is expected to increase by 15% due to seasonal trends.",
                agentType: 'planning',
                timestamp: new Date(),
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                cost: 0,
                model: 'mock-fallback'
            };
        }
    }

    static async optimizeInventory(data: {
        inventoryLevels: any[];
        leadTimes: any;
        storageCosts: number;
        serviceLevelTarget: number;
    }, modelId: string = 'gemini-2.0-flash'): Promise<PlanningAgentResponse> {
        try {
            const task = 'Optimize inventory levels to minimize cost while meeting service level targets';
            const context = { data, taskType: 'INVENTORY_OPTIMIZATION' };
            const response = await generatePlanningContent(task, context, modelId);

            return {
                content: response.content,
                agentType: 'planning',
                timestamp: new Date(),
                usage: {
                    prompt_tokens: response.tokens?.prompt || 0,
                    completion_tokens: response.tokens?.completion || 0,
                    total_tokens: response.tokens?.total || 0
                },
                cost: 0,
                model: response.model
            };
        } catch (error) {
            console.error('Google AI failed, using mock AI:', error);
            return {
                content: "Mock Optimization: Reorder point suggested at 500 units.",
                agentType: 'planning',
                timestamp: new Date(),
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                cost: 0,
                model: 'mock-fallback'
            };
        }
    }

    static async planCapacity(data: {
        warehouseUtilization: number;
        incomingShipments: any[];
        laborAvailability: any;
    }, modelId: string = 'gemini-2.0-flash'): Promise<PlanningAgentResponse> {
        try {
            const task = 'Plan warehouse capacity and labor allocation for upcoming shipments';
            const context = { data, taskType: 'CAPACITY_PLANNING' };
            const response = await generatePlanningContent(task, context, modelId);

            return {
                content: response.content,
                agentType: 'planning',
                timestamp: new Date(),
                usage: {
                    prompt_tokens: response.tokens?.prompt || 0,
                    completion_tokens: response.tokens?.completion || 0,
                    total_tokens: response.tokens?.total || 0
                },
                cost: 0,
                model: response.model
            };
        } catch (error) {
            console.error('Google AI failed, using mock AI:', error);
            return {
                content: "Mock Capacity Plan: Increase labor shift by 2 hours on Friday.",
                agentType: 'planning',
                timestamp: new Date(),
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                cost: 0,
                model: 'mock-fallback'
            };
        }
    }
    static planWaves(orderLines: any[], constraints: {
        maxLinesPerWave: number;
        maxWeightKgPerWave?: number;
        allowMixPriority: boolean;
    }) {
        // Simple wave planning algorithm (mock implementation for now)
        const waves = [];
        let currentWave = { id: `WAVE-${Date.now()}-1`, lines: [] as any[] };

        for (const line of orderLines) {
            if (currentWave.lines.length >= constraints.maxLinesPerWave) {
                waves.push(currentWave);
                currentWave = { id: `WAVE-${Date.now()}-${waves.length + 1}`, lines: [] };
            }
            currentWave.lines.push(line);
        }
        if (currentWave.lines.length > 0) {
            waves.push(currentWave);
        }
        return waves;
    }
}

export const planningAgent = new PlanningAgent();