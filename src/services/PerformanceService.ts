import type { DiagramData } from '../types/visualization';

/**
 * Performance metrics for code processing
 */
export interface PerformanceMetrics {
  /** Processing start time */
  startTime: number;
  /** Processing end time */
  endTime?: number;
  /** Total processing duration in milliseconds */
  duration?: number;
  /** Memory usage before processing */
  memoryBefore?: number;
  /** Memory usage after processing */
  memoryAfter?: number;
  /** Code complexity metrics */
  complexity: CodeComplexityMetrics;
  /** Processing stage timings */
  stageTimings: Record<string, number>;
}

/**
 * Code complexity analysis metrics
 */
export interface CodeComplexityMetrics {
  /** Number of lines of code */
  lines: number;
  /** Number of functions */
  functions: number;
  /** Number of variables */
  variables: number;
  /** Maximum nesting depth */
  nestingDepth: number;
  /** Number of imports */
  imports: number;
  /** Number of React hooks */
  reactHooks: number;
  /** Estimated processing time in milliseconds */
  estimatedProcessingTime: number;
  /** Complexity level */
  level: 'simple' | 'medium' | 'complex' | 'very-complex';
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  /** Maximum processing time in milliseconds */
  maxProcessingTime: number;
  /** Maximum code lines to process */
  maxCodeLines: number;
  /** Maximum diagram nodes to render */
  maxDiagramNodes: number;
  /** Enable performance monitoring */
  enableMonitoring: boolean;
  /** Enable progressive loading */
  enableProgressiveLoading: boolean;
}

/**
 * Default performance configuration
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  maxProcessingTime: 30000, // 30 seconds
  maxCodeLines: 2000,
  maxDiagramNodes: 100,
  enableMonitoring: true,
  enableProgressiveLoading: true,
};

/**
 * Performance service for monitoring and optimizing code visualization
 */
export class PerformanceService {
  private config: PerformanceConfig;
  private currentMetrics: PerformanceMetrics | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze code complexity before processing
   */
  analyzeCodeComplexity(code: string): CodeComplexityMetrics {
    const lines = code.split('\n').filter(line => line.trim().length > 0).length;
    
    // Count functions (including arrow functions and methods)
    const functionMatches = code.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*=>\s*{)|class\s+\w+\s*{[^}]*\w+\s*\([^)]*\)\s*{)/g) || [];
    const functions = functionMatches.length;
    
    // Count variables (let, const, var declarations)
    const variableMatches = code.match(/(?:let|const|var)\s+\w+/g) || [];
    const variables = variableMatches.length;
    
    // Count imports
    const importMatches = code.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || [];
    const imports = importMatches.length;
    
    // Count React hooks
    const hookMatches = code.match(/use[A-Z]\w*/g) || [];
    const reactHooks = hookMatches.length;
    
    // Estimate nesting depth by counting braces
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    // Calculate complexity level and estimated processing time
    let level: CodeComplexityMetrics['level'] = 'simple';
    let estimatedProcessingTime = 1000; // Base 1 second
    
    if (lines > 500 || functions > 20 || maxDepth > 6 || reactHooks > 10) {
      level = 'very-complex';
      estimatedProcessingTime = 15000; // 15 seconds
    } else if (lines > 200 || functions > 10 || maxDepth > 4 || reactHooks > 5) {
      level = 'complex';
      estimatedProcessingTime = 8000; // 8 seconds
    } else if (lines > 50 || functions > 5 || maxDepth > 2 || reactHooks > 2) {
      level = 'medium';
      estimatedProcessingTime = 3000; // 3 seconds
    }
    
    return {
      lines,
      functions,
      variables,
      nestingDepth: maxDepth,
      imports,
      reactHooks,
      estimatedProcessingTime,
      level,
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(code: string): PerformanceMetrics {
    const complexity = this.analyzeCodeComplexity(code);
    
    this.currentMetrics = {
      startTime: performance.now(),
      complexity,
      stageTimings: {},
      memoryBefore: this.getMemoryUsage(),
    };

    return this.currentMetrics;
  }

  /**
   * Record stage timing
   */
  recordStageTime(stage: string): void {
    if (this.currentMetrics) {
      this.currentMetrics.stageTimings[stage] = performance.now() - this.currentMetrics.startTime;
    }
  }

  /**
   * End performance monitoring
   */
  endMonitoring(): PerformanceMetrics | null {
    if (!this.currentMetrics) {
      return null;
    }

    const endTime = performance.now();
    this.currentMetrics.endTime = endTime;
    this.currentMetrics.duration = endTime - this.currentMetrics.startTime;
    this.currentMetrics.memoryAfter = this.getMemoryUsage();

    const metrics = this.currentMetrics;
    this.currentMetrics = null;

    return metrics;
  }

  /**
   * Check if code should be processed based on complexity
   */
  shouldProcessCode(complexity: CodeComplexityMetrics): {
    shouldProcess: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let shouldProcess = true;

    if (complexity.lines > this.config.maxCodeLines) {
      shouldProcess = false;
      warnings.push(`Code is too large (${complexity.lines} lines, max ${this.config.maxCodeLines})`);
      suggestions.push('Try breaking the code into smaller parts');
      suggestions.push('Focus on key functionality for visualization');
    }

    if (complexity.level === 'very-complex') {
      warnings.push('Very complex code detected - processing may be slow');
      suggestions.push('Consider simplifying the code structure');
      suggestions.push('Remove unnecessary nested functions or conditions');
    } else if (complexity.level === 'complex') {
      warnings.push('Complex code detected - processing may take longer');
      suggestions.push('Large code files may have simplified visualizations');
    }

    if (complexity.nestingDepth > 8) {
      warnings.push('Deeply nested code may be simplified in visualization');
      suggestions.push('Consider reducing nesting levels for better visualization');
    }

    return { shouldProcess, warnings, suggestions };
  }

  /**
   * Create timeout promise for processing
   */
  createTimeoutPromise<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs || this.config.maxProcessingTime;
    
    return new Promise((resolve, reject) => {
      this.timeoutId = setTimeout(() => {
        reject(new Error(`Processing timeout after ${timeout}ms`));
      }, timeout);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => {
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
          }
        });
    });
  }

  /**
   * Optimize diagram data for rendering performance
   */
  optimizeDiagramForRendering(diagramData: DiagramData): {
    optimizedData: DiagramData;
    optimizations: string[];
  } {
    const optimizations: string[] = [];
    let optimizedData = { ...diagramData };

    // Limit number of nodes for performance
    if (diagramData.nodes.length > this.config.maxDiagramNodes) {
      const importantNodes = diagramData.nodes
        .sort((a, b) => (b.metadata?.context?.confidence || 0) - (a.metadata?.context?.confidence || 0))
        .slice(0, this.config.maxDiagramNodes);
      
      // Keep edges that connect to remaining nodes
      const nodeIds = new Set(importantNodes.map(n => n.id));
      const relevantEdges = diagramData.edges.filter(
        edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );

      optimizedData = {
        ...diagramData,
        nodes: importantNodes,
        edges: relevantEdges,
      };

      optimizations.push(`Reduced nodes from ${diagramData.nodes.length} to ${importantNodes.length} for better performance`);
    }

    // Simplify complex node labels
    optimizedData.nodes = optimizedData.nodes.map(node => {
      if (node.label && node.label.length > 50) {
        return {
          ...node,
          label: node.label.substring(0, 47) + '...',
          originalLabel: node.label,
        };
      }
      return node;
    });

    // Group similar nodes if there are too many
    if (optimizedData.nodes.length > 50) {
      const groupedNodes = this.groupSimilarNodes(optimizedData.nodes);
      if (groupedNodes.length < optimizedData.nodes.length) {
        optimizedData.nodes = groupedNodes;
        optimizations.push('Grouped similar nodes to reduce complexity');
      }
    }

    return { optimizedData, optimizations };
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      return (window.performance as any).memory?.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Group similar nodes to reduce diagram complexity
   */
  private groupSimilarNodes(nodes: DiagramData['nodes']): DiagramData['nodes'] {
    const groups = new Map<string, DiagramData['nodes']>();
    
    // Group nodes by type and similar properties
    nodes.forEach(node => {
      const groupKey = `${node.type}-${node.icon}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(node);
    });

    const groupedNodes: DiagramData['nodes'] = [];
    
    groups.forEach((groupNodes, groupKey) => {
      if (groupNodes.length > 3) {
        // Create a group node
        const firstNode = groupNodes[0];
        const groupNode = {
          ...firstNode,
          id: `group-${groupKey}`,
          label: `${firstNode.label} (${groupNodes.length} items)`,
          metadata: {
            ...firstNode.metadata,
            isGroup: true,
            groupedNodes: groupNodes,
          },
        };
        groupedNodes.push(groupNode);
      } else {
        // Keep individual nodes if group is small
        groupedNodes.push(...groupNodes);
      }
    });

    return groupedNodes;
  }

  /**
   * Cancel current timeout
   */
  cancelTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Get performance configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update performance configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}