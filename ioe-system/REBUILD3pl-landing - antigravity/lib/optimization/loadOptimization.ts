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

export class LoadOptimizationEngine {
  private populationSize = 30; // default
  private generations = 50; // default
  private mutationRate = 0.15;
  private crossoverRate = 0.7;
  private worker: Worker | null = null;
  private positionStep = 12;
  private totalUnits = 0;
  
  constructor(
    private trailer: TrailerSpec,
    private cargo: CargoItem[],
    private onProgress?: (progress: number) => void
  ) {
    this.totalUnits = this.cargo.reduce((sum, item) => sum + item.quantity, 0);
    
    // Dynamically tune algorithm complexity based on load size
    if (this.totalUnits > 400) {
      this.populationSize = 12;
      this.generations = 18;
      this.positionStep = 36;
    } else if (this.totalUnits > 200) {
      this.populationSize = 18;
      this.generations = 28;
      this.positionStep = 24;
    } else if (this.totalUnits > 120) {
      this.populationSize = 24;
      this.generations = 36;
      this.positionStep = 18;
    }
  }

  /**
   * Main optimization entry point using Web Worker
   */
  async optimize(): Promise<OptimizationResult> {
    // Validate inputs
    if (!this.trailer || !this.cargo || this.cargo.length === 0) {
      throw new Error('Invalid optimization parameters: trailer and cargo items are required');
    }
    
    // Try Web Worker first, but fallback to main thread if it fails
    if (typeof Worker !== 'undefined') {
      try {
        // Add timeout to prevent hanging
        const workerPromise = this.optimizeWithWorker();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Worker timeout')), 10000); // 10 second timeout
        });
        
        return await Promise.race([workerPromise, timeoutPromise]);
      } catch (error) {
        console.warn('Web Worker optimization failed, falling back to main thread:', error);
        // Fallback to main thread if worker fails or times out
        return this.optimizeMainThread();
      }
    } else {
      // Fallback to main thread optimization
      return this.optimizeMainThread();
    }
  }

  /**
   * Optimize using Web Worker for better performance
   */
  private async optimizeWithWorker(): Promise<OptimizationResult> {
    return new Promise((resolve, reject) => {
      try {
        // Create worker from blob URL for better compatibility
        const workerCode = `
          ${this.getWorkerCode()}
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        this.worker = new Worker(workerUrl);
        
        // Set timeout to prevent infinite hanging
        const timeoutId = setTimeout(() => {
          this.cleanup();
          URL.revokeObjectURL(workerUrl);
          reject(new Error('Worker timeout - optimization took too long'));
        }, 15000); // 15 second timeout for worker
        
        this.worker.onmessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'PROGRESS') {
            if (this.onProgress) {
              this.onProgress(data.progress);
            }
          } else if (type === 'RESULT') {
            clearTimeout(timeoutId);
            this.cleanup();
            URL.revokeObjectURL(workerUrl);
            resolve(data.result);
          } else if (type === 'ERROR') {
            clearTimeout(timeoutId);
            this.cleanup();
            URL.revokeObjectURL(workerUrl);
            reject(new Error(data.error));
          }
        };
        
        this.worker.onerror = (error) => {
          clearTimeout(timeoutId);
          this.cleanup();
          URL.revokeObjectURL(workerUrl);
          reject(error);
        };
        
        // Start optimization
        this.worker.postMessage({
          type: 'OPTIMIZE',
          data: {
            trailer: this.trailer,
            cargo: this.cargo
          }
        });
      } catch (error) {
        // If worker creation fails, reject immediately
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Fallback optimization on main thread (optimized)
   */
  private async optimizeMainThread(): Promise<OptimizationResult> {
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
      if (this.onProgress) {
        this.onProgress((gen + 1) / this.generations * 100);
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
      
      // Yield control every few generations to prevent blocking
      if (gen % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Calculate final metrics
    return this.calculateResult(bestIndividual.placement);
  }

  /**
   * Get worker code as string
   */
  private getWorkerCode(): string {
    return `
      // Web Worker code for load optimization
      ${this.initializePopulation.toString()}
      ${this.greedyBottomLeftBack.toString()}
      ${this.randomPlacement.toString()}
      ${this.findFirstFitPosition.toString()}
      ${this.isValidPosition.toString()}
      ${this.calculateFitness.toString()}
      ${this.calculateVolumeUtilization.toString()}
      ${this.calculateStabilityScore.toString()}
      ${this.calculateCenterOfGravity.toString()}
      ${this.tournamentSelection.toString()}
      ${this.crossover.toString()}
      ${this.mutate.toString()}
      ${this.calculateResult.toString()}
      
      // Worker optimization logic
      class WorkerLoadOptimizer {
        constructor(trailer, cargo) {
          this.trailer = trailer;
          this.cargo = cargo;
          this.populationSize = 30;
          this.generations = 50;
          this.mutationRate = 0.15;
          this.positionStep = 12;
          this.totalUnits = this.cargo.reduce((sum, item) => sum + (item.quantity || 0), 0);

          if (this.totalUnits > 400) {
            this.populationSize = 12;
            this.generations = 18;
            this.positionStep = 36;
          } else if (this.totalUnits > 200) {
            this.populationSize = 18;
            this.generations = 28;
            this.positionStep = 24;
          } else if (this.totalUnits > 120) {
            this.populationSize = 24;
            this.generations = 36;
            this.positionStep = 18;
          }
        }
        
        async optimize(onProgress) {
          let population = this.initializePopulation();
          let bestIndividual = population[0];
          
          for (let gen = 0; gen < this.generations; gen++) {
            population = population.map(ind => ({
              ...ind,
              fitness: this.calculateFitness(ind.placement)
            }));
            
            population.sort((a, b) => b.fitness - a.fitness);
            
            if (population[0].fitness > bestIndividual.fitness) {
              bestIndividual = { ...population[0] };
            }
            
            if (onProgress) {
              onProgress((gen + 1) / this.generations * 100);
            }
            
            const newPopulation = [];
            const eliteCount = Math.floor(this.populationSize * 0.1);
            newPopulation.push(...population.slice(0, eliteCount));
            
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
            
            if (gen % 5 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          }
          
          return this.calculateResult(bestIndividual.placement);
        }
      }
      
      self.onmessage = async (event) => {
        try {
          const { type, data } = event.data;
          
          if (type === 'OPTIMIZE') {
            const { trailer, cargo } = data;
            const optimizer = new WorkerLoadOptimizer(trailer, cargo);
            
            const result = await optimizer.optimize((progress) => {
              self.postMessage({
                type: 'PROGRESS',
                data: { progress }
              });
            });
            
            self.postMessage({
              type: 'RESULT',
              data: { result }
            });
          }
        } catch (error) {
          self.postMessage({
            type: 'ERROR',
            data: { error: error.message }
          });
        }
      };
    `;
  }

  /**
   * Cleanup worker resources
   */
  private cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Initialize population with greedy heuristics
   */
  private initializePopulation(): Individual[] {
    const population: Individual[] = [];
    
    population.push({
      placement: this.greedyBottomLeftBack(),
      fitness: 0
    });
    
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
   * Find first fit position
   */
  private findFirstFitPosition(placed: PlacedCargo[], item: CargoItem): Position3D | null {
    const step = this.positionStep; // adaptive inch increments
    
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
   * Validate position
   */
  private isValidPosition(pos: Position3D, item: CargoItem, placed: PlacedCargo[]): boolean {
    // Check trailer bounds
    if (pos.x + item.length > this.trailer.innerLength) return false;
    if (pos.y + item.height > this.trailer.innerHeight) return false;
    if (pos.z + item.width > this.trailer.innerWidth) return false;
    if (pos.x < 0 || pos.y < 0 || pos.z < 0) return false;
    
    // Check collisions
    for (const p of placed) {
      if (this.boxesCollide(pos, item, p)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check collision
   */
  private boxesCollide(pos: Position3D, item: CargoItem, placed: PlacedCargo): boolean {
    return !(
      pos.x + item.length <= placed.x ||
      pos.x >= placed.x + placed.length ||
      pos.y + item.height <= placed.y ||
      pos.y >= placed.y + placed.height ||
      pos.z + item.width <= placed.z ||
      pos.z >= placed.z + placed.width
    );
  }

  /**
   * Multi-objective fitness function
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
    const weightScore = (bottomHeavy / totalWeight) * 50;
    
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
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
      z: weightedZ / totalWeight
    };
  }

  /**
   * Tournament selection
   */
  private tournamentSelection(population: Individual[]): Individual {
    const tournamentSize = 5;
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






