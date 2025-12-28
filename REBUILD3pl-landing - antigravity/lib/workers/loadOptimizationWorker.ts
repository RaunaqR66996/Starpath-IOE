// Web Worker for Load Optimization Algorithm
// This runs the genetic algorithm in a separate thread to prevent UI blocking

import { CargoItem, PlacedCargo, TrailerSpec, OptimizationResult } from '../stores/loadOptimizerStore';

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface Individual {
  placement: PlacedCargo[];
  fitness: number;
}

interface WorkerMessage {
  type: 'OPTIMIZE' | 'PROGRESS';
  data: {
    trailer: TrailerSpec;
    cargo: CargoItem[];
    progress?: number;
  };
}

interface WorkerResponse {
  type: 'PROGRESS' | 'RESULT' | 'ERROR';
  data: {
    progress?: number;
    result?: OptimizationResult;
    error?: string;
  };
}

class LoadOptimizationWorker {
  private populationSize = 30; // Reduced for better performance
  private generations = 50; // Reduced for faster results
  private mutationRate = 0.15;
  private crossoverRate = 0.7;
  private trailer!: TrailerSpec;
  private cargo!: CargoItem[];

  /**
   * Main optimization entry point using Genetic Algorithm
   */
  async optimize(trailer: TrailerSpec, cargo: CargoItem[], onProgress?: (progress: number) => void): Promise<OptimizationResult> {
    this.trailer = trailer;
    this.cargo = cargo;
    
    let population = this.initializePopulation();
    let bestIndividual = population[0];
    
    for (let gen = 0; gen < this.generations; gen++) {
      // Evaluate fitness for all individuals
      population = population.map(ind => ({
        ...ind,
        fitness: this.calculateFitness(ind.placement)
      }));
      
      // Sort by fitness (descending)
      population.sort((a, b) => b.fitness - a.fitness);
      
      // Update best
      if (population[0].fitness > bestIndividual.fitness) {
        bestIndividual = { ...population[0] };
      }
      
      // Report progress
      const progress = (gen + 1) / this.generations * 100;
      if (onProgress) {
        onProgress(progress);
      }
      
      // Create next generation
      const newPopulation: Individual[] = [];
      
      // Elitism: keep top 10%
      const eliteCount = Math.floor(this.populationSize * 0.1);
      newPopulation.push(...population.slice(0, eliteCount));
      
      // Generate offspring
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);
        
        let offspring = this.crossover(parent1, parent2);
        
        if (Math.random() < this.mutationRate) {
          offspring = this.mutate(offspring);
        }
        
        newPopulation.push(offspring);
      }
      
      population = newPopulation;
      
      // Yield control to prevent blocking
      if (gen % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Calculate final metrics
    return this.calculateResult(bestIndividual.placement);
  }

  /**
   * Initialize population with greedy heuristics
   */
  private initializePopulation(): Individual[] {
    const population: Individual[] = [];
    
    // Add greedy solution
    population.push({
      placement: this.greedyBottomLeftBack(),
      fitness: 0
    });
    
    // Add random solutions
    for (let i = 1; i < this.populationSize; i++) {
      population.push({
        placement: this.randomPlacement(),
        fitness: 0
      });
    }
    
    return population;
  }

  /**
   * Bottom-left-back greedy heuristic
   */
  private greedyBottomLeftBack(): PlacedCargo[] {
    const placed: PlacedCargo[] = [];
    const sortedCargo = [...this.cargo].sort((a, b) => 
      (b.length * b.width * b.height) - (a.length * a.width * a.height)
    );
    
    for (const item of sortedCargo) {
      for (let q = 0; q < item.quantity; q++) {
        const position = this.findFirstFitPosition(placed, item);
        if (position) {
          placed.push({
            ...item,
            ...position,
            instanceId: `${item.id}-${q}`,
            rotationY: 0
          });
        }
      }
    }
    
    return placed;
  }

  /**
   * Random placement with constraints
   */
  private randomPlacement(): PlacedCargo[] {
    const placed: PlacedCargo[] = [];
    const shuffled = [...this.cargo].sort(() => Math.random() - 0.5);
    
    for (const item of shuffled) {
      for (let q = 0; q < item.quantity; q++) {
        const position = this.findFirstFitPosition(placed, item);
        if (position) {
          placed.push({
            ...item,
            ...position,
            instanceId: `${item.id}-${q}`,
            rotationY: 0
          });
        }
      }
    }
    
    return placed;
  }

  /**
   * Find first fit position with optimized search
   */
  private findFirstFitPosition(placed: PlacedCargo[], item: CargoItem): Position3D | null {
    const step = 24; // Larger steps for better performance
    
    // Try bottom-up placement first
    for (let y = 0; y < this.trailer.innerHeight; y += step) {
      for (let x = 0; x < this.trailer.innerLength; x += step) {
        for (let z = 0; z < this.trailer.innerWidth; z += step) {
          const pos = { x, y, z };
          if (this.isValidPosition(pos, item, placed)) {
            return pos;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Validate position with optimized collision detection
   */
  private isValidPosition(pos: Position3D, item: CargoItem, placed: PlacedCargo[]): boolean {
    // Check trailer bounds
    if (pos.x + item.length > this.trailer.innerLength) return false;
    if (pos.y + item.height > this.trailer.innerHeight) return false;
    if (pos.z + item.width > this.trailer.innerWidth) return false;
    if (pos.x < 0 || pos.y < 0 || pos.z < 0) return false;
    
    // Optimized collision detection
    for (const p of placed) {
      if (!(pos.x + item.length <= p.x ||
            pos.x >= p.x + p.length ||
            pos.y + item.height <= p.y ||
            pos.y >= p.y + p.height ||
            pos.z + item.width <= p.z ||
            pos.z >= p.z + p.width)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Optimized fitness function
   */
  private calculateFitness(placement: PlacedCargo[]): number {
    if (placement.length === 0) return 0;
    
    const volumeScore = this.calculateVolumeUtilization(placement) * 0.6;
    const stabilityScore = this.calculateStabilityScore(placement) * 0.4;
    
    return volumeScore + stabilityScore;
  }

  /**
   * Calculate volume utilization
   */
  private calculateVolumeUtilization(placement: PlacedCargo[]): number {
    const totalVolume = this.trailer.innerLength * this.trailer.innerWidth * this.trailer.innerHeight;
    const usedVolume = placement.reduce((sum, p) => 
      sum + (p.length * p.width * p.height), 0
    );
    return (usedVolume / totalVolume) * 100;
  }

  /**
   * Calculate stability score
   */
  private calculateStabilityScore(placement: PlacedCargo[]): number {
    if (placement.length === 0) return 0;
    
    const avgHeight = placement.reduce((sum, p) => sum + (p.y + p.height / 2), 0) / placement.length;
    const heightScore = (1 - avgHeight / this.trailer.innerHeight) * 50;
    
    const bottomHeavy = placement.filter(p => p.y < this.trailer.innerHeight / 3)
      .reduce((sum, p) => sum + p.weight, 0);
    const totalWeight = placement.reduce((sum, p) => sum + p.weight, 0);
    const weightScore = totalWeight > 0 ? (bottomHeavy / totalWeight) * 50 : 0;
    
    return heightScore + weightScore;
  }

  /**
   * Calculate center of gravity
   */
  private calculateCenterOfGravity(placement: PlacedCargo[]): Position3D {
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightedZ = 0;
    
    for (const p of placement) {
      const centerX = p.x + p.length / 2;
      const centerY = p.y + p.height / 2;
      const centerZ = p.z + p.width / 2;
      
      weightedX += centerX * p.weight;
      weightedY += centerY * p.weight;
      weightedZ += centerZ * p.weight;
      totalWeight += p.weight;
    }
    
    return {
      x: totalWeight > 0 ? weightedX / totalWeight : 0,
      y: totalWeight > 0 ? weightedY / totalWeight : 0,
      z: totalWeight > 0 ? weightedZ / totalWeight : 0
    };
  }

  /**
   * Tournament selection
   */
  private tournamentSelection(population: Individual[]): Individual {
    const tournamentSize = 3; // Reduced for better performance
    let best = population[Math.floor(Math.random() * population.length)];
    
    for (let i = 1; i < tournamentSize; i++) {
      const competitor = population[Math.floor(Math.random() * population.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }
    
    return best;
  }

  /**
   * Crossover operation
   */
  private crossover(parent1: Individual, parent2: Individual): Individual {
    const splitPoint = Math.floor(parent1.placement.length / 2);
    return {
      placement: [
        ...parent1.placement.slice(0, splitPoint),
        ...parent2.placement.slice(splitPoint)
      ],
      fitness: 0
    };
  }

  /**
   * Mutation operation
   */
  private mutate(individual: Individual): Individual {
    const mutated = [...individual.placement];
    
    if (mutated.length > 0) {
      const idx = Math.floor(Math.random() * mutated.length);
      mutated[idx] = {
        ...mutated[idx],
        x: Math.max(0, Math.random() * (this.trailer.innerLength - mutated[idx].length))
      };
    }
    
    return {
      placement: mutated,
      fitness: 0
    };
  }

  /**
   * Calculate final result
   */
  private calculateResult(placement: PlacedCargo[]): OptimizationResult {
    const totalWeight = placement.reduce((sum, p) => sum + p.weight, 0);
    const cog = this.calculateCenterOfGravity(placement);
    
    return {
      placedItems: placement,
      volumeUtilization: this.calculateVolumeUtilization(placement),
      weightUtilization: (totalWeight / (this.trailer.maxGrossWeight - this.trailer.tareWeight)) * 100,
      centerOfGravityX: cog.x,
      centerOfGravityY: cog.y,
      centerOfGravityZ: cog.z,
      stabilityScore: this.calculateStabilityScore(placement),
      axleLoadFront: totalWeight * 0.4,
      axleLoadRear: totalWeight * 0.6,
      complianceScore: totalWeight + this.trailer.tareWeight <= this.trailer.maxGrossWeight ? 100 : 0,
      loadingTime: Math.ceil(placement.length * 2.5),
      carbonFootprint: (1 - this.calculateVolumeUtilization(placement) / 100) * 50,
      cost: totalWeight * 0.05
    };
  }
}

// Web Worker message handling
const worker = new LoadOptimizationWorker();

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  try {
    const { type, data } = event.data;
    
    if (type === 'OPTIMIZE') {
      const { trailer, cargo } = data;
      
      const result = await worker.optimize(trailer, cargo, (progress) => {
        // Send progress updates
        const response: WorkerResponse = {
          type: 'PROGRESS',
          data: { progress }
        };
        self.postMessage(response);
      });
      
      // Send final result
      const response: WorkerResponse = {
        type: 'RESULT',
        data: { result }
      };
      self.postMessage(response);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'ERROR',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
    self.postMessage(response);
  }
};


















