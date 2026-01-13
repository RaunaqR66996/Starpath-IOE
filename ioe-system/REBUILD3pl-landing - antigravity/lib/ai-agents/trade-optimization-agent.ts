import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Trade optimization agent configuration
interface TradeOptimizationConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  openaiApiKey: string;
}

// Trade analysis request interface
interface TradeAnalysisRequest {
  htsCode: string;
  originCountry: string;
  destinationCountry: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  incoterm: string;
  supplierInfo: string;
}

// Trade optimization result interface
interface TradeOptimizationResult {
  htsValidation: {
    isValid: boolean;
    suggestedHts: string;
    confidence: number;
    description: string;
  };
  tariffAnalysis: {
    baseRate: number;
    effectiveRate: number;
    specialPrograms: string[];
    exclusions: string[];
  };
  mitigationStrategies: {
    strategy: string;
    savingsPercentage: number;
    requirements: string[];
    complexity: 'low' | 'medium' | 'high';
    estimatedSavings: number;
  }[];
  riskAssessment: {
    geopoliticalRisk: 'low' | 'medium' | 'high';
    regulatoryRisk: 'low' | 'medium' | 'high';
    supplyChainRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  complianceRequirements: {
    documents: string[];
    certifications: string[];
    inspections: string[];
    deadlines: string[];
  };
  optimizationRecommendations: {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    impact: string;
    implementation: string;
  }[];
}

export class TradeOptimizationAgent {
  private model: ChatOpenAI;
  private config: TradeOptimizationConfig;

  constructor(config: TradeOptimizationConfig) {
    this.config = config;
    this.model = new ChatOpenAI({
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      openAIApiKey: config.openaiApiKey,
    });
  }

  // HTS Code validation and optimization
  async validateAndOptimizeHTS(request: TradeAnalysisRequest): Promise<TradeOptimizationResult> {
    const htsValidationPrompt = PromptTemplate.fromTemplate(`
You are an expert trade compliance specialist and customs broker with 20+ years of experience in HTS classification and tariff optimization.

Analyze the following product information and provide comprehensive trade optimization recommendations:

PRODUCT INFORMATION:
- HTS Code: {htsCode}
- Product Description: {productDescription}
- Origin Country: {originCountry}
- Destination Country: {destinationCountry}
- Quantity: {quantity}
- Unit Price: ${request.unitPrice}
- Incoterm: {incoterm}
- Supplier: {supplierInfo}

Please provide a detailed analysis in the following JSON format:

{{
  "htsValidation": {{
    "isValid": boolean,
    "suggestedHts": "string",
    "confidence": number (0-1),
    "description": "string"
  }},
  "tariffAnalysis": {{
    "baseRate": number,
    "effectiveRate": number,
    "specialPrograms": ["string"],
    "exclusions": ["string"]
  }},
  "mitigationStrategies": [
    {{
      "strategy": "string",
      "savingsPercentage": number,
      "requirements": ["string"],
      "complexity": "low|medium|high",
      "estimatedSavings": number
    }}
  ],
  "riskAssessment": {{
    "geopoliticalRisk": "low|medium|high",
    "regulatoryRisk": "low|medium|high",
    "supplyChainRisk": "low|medium|high",
    "recommendations": ["string"]
  }},
  "complianceRequirements": {{
    "documents": ["string"],
    "certifications": ["string"],
    "inspections": ["string"],
    "deadlines": ["string"]
  }},
  "optimizationRecommendations": [
    {{
      "priority": "high|medium|low",
      "recommendation": "string",
      "impact": "string",
      "implementation": "string"
    }}
  ]
}}

Focus on:
1. Accurate HTS classification with confidence scoring
2. Tariff mitigation strategies (First Sale Rule, FTZ, Duty Drawback, GSP)
3. Risk assessment for the specific origin-destination pair
4. Compliance requirements and documentation needs
5. Practical optimization recommendations with implementation steps

Ensure all recommendations are legally compliant and based on current trade regulations.
`);

    const chain = RunnableSequence.from([
      htsValidationPrompt,
      this.model,
      new StringOutputParser(),
    ]);

    try {
      const result = await chain.invoke({
        htsCode: request.htsCode,
        productDescription: request.productDescription,
        originCountry: request.originCountry,
        destinationCountry: request.destinationCountry,
        quantity: request.quantity,
        unitPrice: request.unitPrice,
        incoterm: request.incoterm,
        supplierInfo: request.supplierInfo,
      });

      // Parse the JSON response
      const parsedResult = JSON.parse(result);
      return parsedResult as TradeOptimizationResult;
    } catch (error) {
      console.error('Trade optimization agent error:', error);
      throw new Error('Failed to analyze trade optimization options');
    }
  }

  // Lane optimization with AI insights
  async optimizeLaneSelection(
    origin: string,
    destination: string,
    cargoType: string,
    priority: 'cost' | 'speed' | 'reliability'
  ): Promise<any> {
    const laneOptimizationPrompt = PromptTemplate.fromTemplate(`
You are a logistics optimization expert specializing in international shipping lane analysis and carrier selection.

Analyze the following shipping requirements and provide AI-powered lane optimization recommendations:

SHIPPING REQUIREMENTS:
- Origin: {origin}
- Destination: {destination}
- Cargo Type: {cargoType}
- Priority: {priority}

Please provide recommendations in the following JSON format:

{{
  "laneAnalysis": {{
    "recommendedCarriers": [
      {{
        "carrier": "string",
        "service": "string",
        "transitTime": number,
        "cost": number,
        "reliability": number (0-1),
        "riskScore": number (0-1),
        "congestionLevel": "low|medium|high",
        "carbonFootprint": number,
        "recommendationReason": "string"
      }}
    ],
    "riskFactors": [
      {{
        "factor": "string",
        "impact": "low|medium|high",
        "mitigation": "string"
      }}
    ],
    "costOptimization": {{
      "baseCost": number,
      "optimizationOpportunities": ["string"],
      "estimatedSavings": number
    }},
    "complianceConsiderations": [
      {{
        "requirement": "string",
        "impact": "string",
        "action": "string"
      }}
    ]
  }}
}}

Consider:
1. Current market conditions and capacity
2. Geopolitical risks and trade tensions
3. Port congestion and infrastructure
4. Environmental impact and sustainability
5. Regulatory compliance requirements
6. Cost vs. service level optimization
`);

    const chain = RunnableSequence.from([
      laneOptimizationPrompt,
      this.model,
      new StringOutputParser(),
    ]);

    try {
      const result = await chain.invoke({
        origin,
        destination,
        cargoType,
        priority,
      });

      return JSON.parse(result);
    } catch (error) {
      console.error('Lane optimization error:', error);
      throw new Error('Failed to optimize lane selection');
    }
  }

  // Compliance automation and document generation
  async generateComplianceRecommendations(
    htsCode: string,
    originCountry: string,
    destinationCountry: string,
    cargoValue: number
  ): Promise<any> {
    const compliancePrompt = PromptTemplate.fromTemplate(`
You are a customs compliance expert specializing in automated document generation and regulatory requirements.

Analyze the following shipment and provide comprehensive compliance recommendations:

SHIPMENT DETAILS:
- HTS Code: {htsCode}
- Origin Country: {originCountry}
- Destination Country: {destinationCountry}
- Cargo Value: ${cargoValue}

Provide compliance recommendations in the following JSON format:

{{
  "requiredDocuments": [
    {{
      "document": "string",
      "purpose": "string",
      "requiredBy": "string",
      "deadline": "string",
      "template": "string"
    }}
  ],
  "certifications": [
    {{
      "certification": "string",
      "issuingAuthority": "string",
      "validity": "string",
      "requirements": ["string"]
    }}
  ],
  "inspections": [
    {{
      "inspection": "string",
      "agency": "string",
      "timing": "string",
      "cost": number
    }}
  ],
  "filingRequirements": {{
    "entryType": "string",
    "filingDeadline": "string",
    "penalties": ["string"],
    "exemptions": ["string"]
  }},
  "automationOpportunities": [
    {{
      "process": "string",
      "automationLevel": "low|medium|high",
      "savings": "string",
      "implementation": "string"
    }}
  ]
}}

Focus on:
1. Required customs documentation
2. Certifications and permits
3. Inspection and testing requirements
4. Filing deadlines and penalties
5. Automation opportunities
6. Cost optimization strategies
`);

    const chain = RunnableSequence.from([
      compliancePrompt,
      this.model,
      new StringOutputParser(),
    ]);

    try {
      const result = await chain.invoke({
        htsCode,
        originCountry,
        destinationCountry,
        cargoValue,
      });

      return JSON.parse(result);
    } catch (error) {
      console.error('Compliance recommendations error:', error);
      throw new Error('Failed to generate compliance recommendations');
    }
  }

  // Risk assessment and mitigation
  async assessTradeRisks(
    originCountry: string,
    destinationCountry: string,
    htsCode: string,
    cargoValue: number
  ): Promise<any> {
    const riskAssessmentPrompt = PromptTemplate.fromTemplate(`
You are a trade risk management expert specializing in geopolitical, regulatory, and supply chain risk assessment.

Analyze the following trade scenario and provide comprehensive risk assessment:

TRADE SCENARIO:
- Origin Country: {originCountry}
- Destination Country: {destinationCountry}
- HTS Code: {htsCode}
- Cargo Value: ${cargoValue}

Provide risk assessment in the following JSON format:

{{
  "geopoliticalRisks": [
    {{
      "risk": "string",
      "probability": "low|medium|high",
      "impact": "low|medium|high",
      "mitigation": "string",
      "monitoring": "string"
    }}
  ],
  "regulatoryRisks": [
    {{
      "regulation": "string",
      "compliance": "string",
      "penalties": "string",
      "deadlines": "string"
    }}
  ],
  "supplyChainRisks": [
    {{
      "risk": "string",
      "probability": "low|medium|high",
      "impact": "low|medium|high",
      "contingency": "string"
    }}
  ],
  "financialRisks": [
    {{
      "risk": "string",
      "exposure": number,
      "hedging": "string",
      "insurance": "string"
    }}
  ],
  "overallRiskScore": {{
    "score": number (1-10),
    "level": "low|medium|high",
    "recommendations": ["string"]
  }}
}}

Consider:
1. Current geopolitical tensions and trade disputes
2. Regulatory changes and compliance requirements
3. Supply chain disruptions and capacity constraints
4. Currency fluctuations and financial risks
5. Infrastructure and logistics challenges
6. Environmental and sustainability factors
`);

    const chain = RunnableSequence.from([
      riskAssessmentPrompt,
      this.model,
      new StringOutputParser(),
    ]);

    try {
      const result = await chain.invoke({
        originCountry,
        destinationCountry,
        htsCode,
        cargoValue,
      });

      return JSON.parse(result);
    } catch (error) {
      console.error('Risk assessment error:', error);
      throw new Error('Failed to assess trade risks');
    }
  }

  // Get agent status and health
  async getStatus(): Promise<{ status: string; model: string; capabilities: string[] }> {
    return {
      status: 'active',
      model: this.config.modelName,
      capabilities: [
        'HTS Code Validation & Optimization',
        'Tariff Mitigation Strategy Analysis',
        'Lane Selection Optimization',
        'Compliance Automation',
        'Risk Assessment & Mitigation',
        'Document Generation',
      ],
    };
  }
} 