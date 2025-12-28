// Exception handling and automation service for load optimization
import { OptimizeResult, PlacedItem, TrailerSpec } from '@/lib/types/trailer';

export interface OptimizationException {
  id: string;
  type: 'overload' | 'unplaced' | 'stability' | 'constraint' | 'efficiency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  itemIds?: string[];
  suggestion: string;
  autoFixable: boolean;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: (result: OptimizeResult, trailer: TrailerSpec) => boolean;
  action: (result: OptimizeResult, trailer: TrailerSpec) => OptimizationException[];
  priority: number;
  enabled: boolean;
}

export class ExceptionHandler {
  private static rules: AutomationRule[] = [
    {
      id: 'axle-overload',
      name: 'Axle Overload Detection',
      condition: (result) => result.axle_loads.some(axle => axle.percentage > 100),
      action: (result) => {
        const overloadedAxles = result.axle_loads.filter(axle => axle.percentage > 100);
        return overloadedAxles.map((axle, index) => ({
          id: `overload-${index}`,
          type: 'overload' as const,
          severity: 'critical' as const,
          message: `Axle ${index + 1} is overloaded at ${axle.percentage.toFixed(1)}%`,
          suggestion: 'Consider redistributing weight or using a larger trailer',
          autoFixable: false,
          timestamp: new Date().toISOString()
        }));
      },
      priority: 1,
      enabled: true
    },
    {
      id: 'unplaced-items',
      name: 'Unplaced Items Detection',
      condition: (result) => result.unplaced.length > 0,
      action: (result) => {
        return [{
          id: 'unplaced-items',
          type: 'unplaced' as const,
          severity: result.unplaced.length > 3 ? 'high' as const : 'medium' as const,
          message: `${result.unplaced.length} items could not be placed`,
          itemIds: result.unplaced,
          suggestion: 'Try different algorithm or split into multiple loads',
          autoFixable: true,
          timestamp: new Date().toISOString()
        }];
      },
      priority: 2,
      enabled: true
    },
    {
      id: 'low-utilization',
      name: 'Low Utilization Warning',
      condition: (result) => result.utilization_pct < 60,
      action: (result) => {
        return [{
          id: 'low-utilization',
          type: 'efficiency' as const,
          severity: 'low' as const,
          message: `Low volume utilization at ${result.utilization_pct.toFixed(1)}%`,
          suggestion: 'Consider adding more items or using a smaller trailer',
          autoFixable: false,
          timestamp: new Date().toISOString()
        }];
      },
      priority: 3,
      enabled: true
    },
    {
      id: 'center-of-gravity',
      name: 'Center of Gravity Analysis',
      condition: (result, trailer) => {
        const cogX = result.cog[0];
        const trailerCenter = trailer.length_ft / 2;
        const deviation = Math.abs(cogX - trailerCenter) / trailerCenter;
        return deviation > 0.3; // More than 30% deviation from center
      },
      action: (result, trailer) => {
        const cogX = result.cog[0];
        const trailerCenter = trailer.length_ft / 2;
        const deviation = Math.abs(cogX - trailerCenter) / trailerCenter;
        
        return [{
          id: 'cog-warning',
          type: 'stability' as const,
          severity: deviation > 0.5 ? 'high' as const : 'medium' as const,
          message: `Center of gravity is ${cogX.toFixed(1)}ft (${((deviation * 100)).toFixed(0)}% from center)`,
          suggestion: 'Reposition items to balance the load',
          autoFixable: true,
          timestamp: new Date().toISOString()
        }];
      },
      priority: 4,
      enabled: true
    },
    {
      id: 'axle-warning',
      name: 'Axle Load Warning',
      condition: (result) => result.axle_loads.some(axle => axle.percentage > 80 && axle.percentage <= 100),
      action: (result) => {
        const warningAxles = result.axle_loads.filter(axle => axle.percentage > 80 && axle.percentage <= 100);
        return warningAxles.map((axle, index) => ({
          id: `warning-${index}`,
          type: 'overload' as const,
          severity: 'medium' as const,
          message: `Axle ${index + 1} is at ${axle.percentage.toFixed(1)}% capacity`,
          suggestion: 'Monitor closely or redistribute weight',
          autoFixable: false,
          timestamp: new Date().toISOString()
        }));
      },
      priority: 5,
      enabled: true
    }
  ];

  /**
   * Analyze optimization result and generate exceptions
   */
  static analyzeResult(result: OptimizeResult, trailer: TrailerSpec): OptimizationException[] {
    const exceptions: OptimizationException[] = [];
    
    // Run all enabled rules
    this.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority)
      .forEach(rule => {
        try {
          if (rule.condition(result, trailer)) {
            const ruleExceptions = rule.action(result, trailer);
            exceptions.push(...ruleExceptions);
          }
        } catch (error) {
          console.error(`Error in rule ${rule.name}:`, error);
        }
      });
    
    return exceptions;
  }

  /**
   * Get suggestions for improving optimization
   */
  static getSuggestions(exceptions: OptimizationException[]): string[] {
    const suggestions = new Set<string>();
    
    exceptions.forEach(exception => {
      suggestions.add(exception.suggestion);
    });
    
    // Add general suggestions based on exception types
    const hasOverload = exceptions.some(e => e.type === 'overload');
    const hasUnplaced = exceptions.some(e => e.type === 'unplaced');
    const hasStability = exceptions.some(e => e.type === 'stability');
    
    if (hasOverload && hasUnplaced) {
      suggestions.add('Consider splitting the load across multiple trailers');
    }
    
    if (hasStability && hasOverload) {
      suggestions.add('Try a different algorithm that considers weight distribution');
    }
    
    if (exceptions.length === 0) {
      suggestions.add('Load optimization looks good! Consider running with different constraints for comparison');
    }
    
    return Array.from(suggestions);
  }

  /**
   * Get alternative trailer suggestions
   */
  static getAlternativeTrailers(
    currentTrailer: TrailerSpec, 
    exceptions: OptimizationException[]
  ): Array<{ type: string; reason: string; capacity: number }> {
    const alternatives = [];
    
    const hasOverload = exceptions.some(e => e.type === 'overload');
    const hasUnplaced = exceptions.some(e => e.type === 'unplaced');
    const hasLowUtilization = exceptions.some(e => e.type === 'efficiency');
    
    if (hasOverload || hasUnplaced) {
      alternatives.push({
        type: '53ft Reefer',
        reason: 'Higher weight capacity and better insulation',
        capacity: 80000
      });
      alternatives.push({
        type: '48ft Flatbed',
        reason: 'No height restrictions, better for oversized items',
        capacity: 80000
      });
    }
    
    if (hasLowUtilization) {
      alternatives.push({
        type: '40ft Container',
        reason: 'Smaller size for better utilization',
        capacity: 67200
      });
      alternatives.push({
        type: '26ft Box Truck',
        reason: 'Perfect for smaller loads',
        capacity: 26000
      });
    }
    
    return alternatives;
  }

  /**
   * Auto-fix suggestions for fixable exceptions
   */
  static getAutoFixSuggestions(exceptions: OptimizationException[]): Array<{
    action: string;
    description: string;
    exceptions: string[];
  }> {
    const fixableExceptions = exceptions.filter(e => e.autoFixable);
    const suggestions = [];
    
    if (fixableExceptions.some(e => e.type === 'unplaced')) {
      suggestions.push({
        action: 'retry-optimization',
        description: 'Retry with different algorithm',
        exceptions: fixableExceptions.filter(e => e.type === 'unplaced').map(e => e.id)
      });
    }
    
    if (fixableExceptions.some(e => e.type === 'stability')) {
      suggestions.push({
        action: 'rebalance-load',
        description: 'Automatically rebalance center of gravity',
        exceptions: fixableExceptions.filter(e => e.type === 'stability').map(e => e.id)
      });
    }
    
    return suggestions;
  }

  /**
   * Enable or disable a rule
   */
  static toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get all available rules
   */
  static getRules(): AutomationRule[] {
    return [...this.rules];
  }

  /**
   * Add a custom rule
   */
  static addRule(rule: AutomationRule): void {
    this.rules.push(rule);
  }
}




