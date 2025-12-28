/**
 * AI Processor for LiDAR-based Cycle Counting
 * Integrates with multiple AI models for inventory analysis
 */

import { CycleCountResult, DetectedItem, Discrepancy, CustomerMasterData } from './types';

export class AIProcessor {
  private openaiApiKey: string;
  private claudeApiKey: string;
  private customModelEndpoint: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.customModelEndpoint = process.env.CUSTOM_AI_ENDPOINT || '';
  }

  /**
   * Perform AI-powered cycle counting analysis
   */
  async performCycleCount(
    fusedData: any,
    customerMasterData: CustomerMasterData[],
    aiModel: string
  ): Promise<CycleCountResult> {
    console.log(`Starting AI cycle count analysis with ${aiModel}...`);
    
    const startTime = Date.now();

    try {
      let result: CycleCountResult;

      switch (aiModel) {
        case 'GPT-4V':
          result = await this.analyzeWithGPT4V(fusedData, customerMasterData);
          break;
        case 'Claude-3-Vision':
          result = await this.analyzeWithClaude3Vision(fusedData, customerMasterData);
          break;
        case 'Custom-Vision':
          result = await this.analyzeWithCustomModel(fusedData, customerMasterData);
          break;
        default:
          throw new Error(`Unsupported AI model: ${aiModel}`);
      }

      result.processingTime = Date.now() - startTime;
      result.aiModel = aiModel;

      console.log(`AI analysis completed in ${result.processingTime}ms`);
      return result;

    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze with OpenAI GPT-4V
   */
  private async analyzeWithGPT4V(
    fusedData: any,
    customerMasterData: CustomerMasterData[]
  ): Promise<CycleCountResult> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare data for GPT-4V analysis
    const analysisPrompt = this.buildAnalysisPrompt(customerMasterData);
    const imageData = this.prepareImageData(fusedData.stitchedImage);
    const pointCloudSummary = this.summarizePointCloud(fusedData.pointCloud);

    // Call OpenAI GPT-4V API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert warehouse inventory analyst. Analyze the provided warehouse scan data to identify inventory items and compare them against master data.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${analysisPrompt}\n\nPoint Cloud Summary: ${pointCloudSummary}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseGPT4VResponse(data, customerMasterData);
  }

  /**
   * Analyze with Claude-3-Vision
   */
  private async analyzeWithClaude3Vision(
    fusedData: any,
    customerMasterData: CustomerMasterData[]
  ): Promise<CycleCountResult> {
    if (!this.claudeApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const analysisPrompt = this.buildAnalysisPrompt(customerMasterData);
    const imageData = this.prepareImageData(fusedData.stitchedImage);
    const pointCloudSummary = this.summarizePointCloud(fusedData.pointCloud);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `${analysisPrompt}\n\nPoint Cloud Summary: ${pointCloudSummary}\n\nImage: data:image/jpeg;base64,${imageData}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseClaudeResponse(data, customerMasterData);
  }

  /**
   * Analyze with custom vision model
   */
  private async analyzeWithCustomModel(
    fusedData: any,
    customerMasterData: CustomerMasterData[]
  ): Promise<CycleCountResult> {
    if (!this.customModelEndpoint) {
      throw new Error('Custom AI model endpoint not configured');
    }

    const payload = {
      pointCloud: fusedData.pointCloud,
      image: fusedData.stitchedImage,
      masterData: customerMasterData,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(this.customModelEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CUSTOM_AI_API_KEY || ''}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Custom AI model error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseCustomModelResponse(data, customerMasterData);
  }

  /**
   * Build analysis prompt for AI models
   */
  private buildAnalysisPrompt(customerMasterData: CustomerMasterData[]): string {
    const masterDataSummary = customerMasterData.map(item => 
      `SKU: ${item.sku}, Expected: ${item.expectedQuantity}, Location: ${item.location}, Dimensions: ${item.dimensions.length}x${item.dimensions.width}x${item.dimensions.height}`
    ).join('\n');

    return `
Analyze this warehouse scan to perform cycle counting. 

Expected inventory (Master Data):
${masterDataSummary}

Please:
1. Identify all inventory items visible in the scan
2. Count the quantity of each item
3. Compare detected quantities with expected quantities from master data
4. Identify any discrepancies
5. Provide confidence scores for each detection
6. Suggest locations for items that couldn't be found

Return your analysis in the following JSON format:
{
  "detectedItems": [
    {
      "sku": "ITEM-001",
      "detectedQuantity": 150,
      "expectedQuantity": 150,
      "confidence": 0.95,
      "location": {"x": 10, "y": 5, "z": 2},
      "dimensions": {"length": 1, "width": 1, "height": 0.5}
    }
  ],
  "discrepancies": [
    {
      "sku": "ITEM-002",
      "expectedQuantity": 80,
      "detectedQuantity": 75,
      "variance": -5,
      "severity": "medium",
      "location": "A1-B2",
      "recommendation": "Physical count required"
    }
  ],
  "confidence": 0.92,
  "recommendations": ["Review area A1-B2 for missing items"]
}`;
  }

  /**
   * Prepare image data for AI analysis
   */
  private prepareImageData(imageBuffer: Buffer): string {
    // Convert buffer to base64 for AI model consumption
    return imageBuffer.toString('base64');
  }

  /**
   * Summarize point cloud data for AI context
   */
  private summarizePointCloud(pointCloud: any): string {
    return `
Point Cloud Summary:
- Total Points: ${pointCloud.count}
- Resolution: ${pointCloud.resolution}
- Coverage Area: ${pointCloud.metadata.scanDensity} points/m²
- Coordinate System: ${pointCloud.metadata.coordinateSystem}
- Processing: ${pointCloud.processed ? 'Filtered and segmented' : 'Raw data'}
`;
  }

  /**
   * Parse GPT-4V response
   */
  private parseGPT4VResponse(data: any, masterData: CustomerMasterData[]): CycleCountResult {
    try {
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      return {
        totalItems: parsed.detectedItems.length,
        detectedItems: parsed.detectedItems,
        discrepancies: parsed.discrepancies,
        confidence: parsed.confidence,
        processingTime: 0, // Will be set by caller
        aiModel: 'GPT-4V',
        recommendations: parsed.recommendations
      };
    } catch (error) {
      console.error('Error parsing GPT-4V response:', error);
      return this.generateFallbackResult(masterData);
    }
  }

  /**
   * Parse Claude response
   */
  private parseClaudeResponse(data: any, masterData: CustomerMasterData[]): CycleCountResult {
    try {
      const content = data.content[0].text;
      const parsed = JSON.parse(content);
      
      return {
        totalItems: parsed.detectedItems.length,
        detectedItems: parsed.detectedItems,
        discrepancies: parsed.discrepancies,
        confidence: parsed.confidence,
        processingTime: 0,
        aiModel: 'Claude-3-Vision',
        recommendations: parsed.recommendations
      };
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return this.generateFallbackResult(masterData);
    }
  }

  /**
   * Parse custom model response
   */
  private parseCustomModelResponse(data: any, masterData: CustomerMasterData[]): CycleCountResult {
    // Custom model should return data in expected format
    return {
      totalItems: data.totalItems || 0,
      detectedItems: data.detectedItems || [],
      discrepancies: data.discrepancies || [],
      confidence: data.confidence || 0.8,
      processingTime: 0,
      aiModel: 'Custom-Vision',
      recommendations: data.recommendations || []
    };
  }

  /**
   * Generate fallback result when AI analysis fails
   */
  private generateFallbackResult(masterData: CustomerMasterData[]): CycleCountResult {
    console.warn('AI analysis failed, generating fallback result');
    
    const detectedItems: DetectedItem[] = masterData.map(item => ({
      sku: item.sku,
      detectedQuantity: item.expectedQuantity,
      expectedQuantity: item.expectedQuantity,
      confidence: 0.5, // Low confidence due to fallback
      location: { x: 0, y: 0, z: 0 },
      dimensions: item.dimensions
    }));

    return {
      totalItems: detectedItems.length,
      detectedItems,
      discrepancies: [],
      confidence: 0.5,
      processingTime: 0,
      aiModel: 'Fallback',
      recommendations: ['Manual verification required due to AI analysis failure']
    };
  }

  /**
   * Validate AI model configuration
   */
  validateModelConfiguration(aiModel: string): boolean {
    switch (aiModel) {
      case 'GPT-4V':
        return !!this.openaiApiKey;
      case 'Claude-3-Vision':
        return !!this.claudeApiKey;
      case 'Custom-Vision':
        return !!this.customModelEndpoint;
      default:
        return false;
    }
  }

  /**
   * Get available AI models
   */
  getAvailableModels(): string[] {
    const models: string[] = [];
    
    if (this.openaiApiKey) models.push('GPT-4V');
    if (this.claudeApiKey) models.push('Claude-3-Vision');
    if (this.customModelEndpoint) models.push('Custom-Vision');
    
    return models;
  }
}


















