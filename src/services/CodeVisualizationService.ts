import type { DiagramData } from '../types/visualization';
import type { UserFriendlyError, VisualizationError } from '../types/errors';
import type { RecognizedPattern } from '../types/patterns';
import { ASTParserService } from './ASTParserService';
import { PatternRecognitionEngine } from './PatternRecognitionEngine';
import { VisualizationGenerator } from './VisualizationGenerator';
import { ErrorHandlerService } from './ErrorHandlerService';
import { PerformanceService, type PerformanceMetrics, type CodeComplexityMetrics } from './PerformanceService';

/**
 * Processing stages for user feedback
 */
export type ProcessingStage = 'parsing' | 'pattern-recognition' | 'visualization' | 'optimization';

/**
 * Progress callback for processing updates
 */
export type ProgressCallback = (stage: ProcessingStage, progress: number) => void;

/**
 * Result of code visualization
 */
export interface VisualizationResult {
  success: boolean;
  diagramData?: DiagramData;
  errors: UserFriendlyError[];
  warnings?: string[];
  fallbackUsed?: boolean;
  performanceMetrics?: PerformanceMetrics;
  optimizations?: string[];
}

/**
 * Main service for converting code into visual diagrams
 * Orchestrates parsing, pattern recognition, and visualization generation
 */
export class CodeVisualizationService {
  private astParser: ASTParserService;
  private patternEngine: PatternRecognitionEngine;
  private visualizationGenerator: VisualizationGenerator;
  private errorHandler: ErrorHandlerService;
  private performanceService: PerformanceService;
  private isProcessing = false;
  private shouldCancel = false;

  constructor() {
    this.astParser = new ASTParserService();
    this.patternEngine = new PatternRecognitionEngine();
    this.visualizationGenerator = new VisualizationGenerator();
    this.errorHandler = new ErrorHandlerService();
    this.performanceService = new PerformanceService();
  }

  /**
   * Convert code into a visual diagram with comprehensive error handling and performance optimization
   */
  async visualizeCode(
    code: string,
    progressCallback?: ProgressCallback
  ): Promise<VisualizationResult> {
    if (this.isProcessing) {
      return {
        success: false,
        errors: [{
          code: 'ALREADY_PROCESSING',
          message: 'Already processing code',
          description: 'Please wait for the current operation to complete',
          suggestions: ['Wait for current processing to finish', 'Cancel current operation first'],
          severity: 'medium',
          context: {
            component: 'CodeVisualizationService',
            operation: 'visualizeCode'
          }
        }]
      };
    }

    this.isProcessing = true;
    this.shouldCancel = false;
    const warnings: string[] = [];
    const optimizations: string[] = [];
    let fallbackUsed = false;

    // Start performance monitoring
    const performanceMetrics = this.performanceService.startMonitoring(code);
    
    // Check if code should be processed based on complexity
    const complexityCheck = this.performanceService.shouldProcessCode(performanceMetrics.complexity);
    if (!complexityCheck.shouldProcess) {
      this.isProcessing = false;
      return {
        success: false,
        errors: [{
          code: 'CODE_TOO_COMPLEX',
          message: 'Code is too complex to process',
          description: complexityCheck.warnings.join('. '),
          suggestions: complexityCheck.suggestions,
          severity: 'high',
          context: {
            component: 'CodeVisualizationService',
            operation: 'complexity-check'
          }
        }],
        performanceMetrics: this.performanceService.endMonitoring() || undefined
      };
    }
    
    // Add complexity warnings
    warnings.push(...complexityCheck.warnings);

    try {
      // Stage 1: Parse code into AST with retry mechanism and timeout
      progressCallback?.('parsing', 0);
      if (this.shouldCancel) return this.getCancelledResult();

      this.performanceService.recordStageTime('parsing-start');
      const parseResult = await this.performanceService.createTimeoutPromise(
        this.errorHandler.retryOperation(
          () => this.astParser.parseCode(code),
          { component: 'ASTParserService', operation: 'parseCode' }
        ),
        Math.min(performanceMetrics.complexity.estimatedProcessingTime * 0.3, 10000) // 30% of estimated time or 10s max
      );
      this.performanceService.recordStageTime('parsing-end');

      if (parseResult.errors.length > 0 || !parseResult.ast) {
        // Handle parse errors with user-friendly messages
        const userFriendlyErrors = parseResult.errors.map(error => 
          this.errorHandler.handleParseError(error)
        );
        
        return {
          success: false,
          errors: userFriendlyErrors,
          performanceMetrics: this.performanceService.endMonitoring() || undefined
        };
      }

      // Stage 2: Recognize patterns with error handling and timeout
      progressCallback?.('pattern-recognition', 33);
      if (this.shouldCancel) return this.getCancelledResult();

      this.performanceService.recordStageTime('pattern-recognition-start');
      let patterns: RecognizedPattern[];
      try {
        patterns = await this.performanceService.createTimeoutPromise(
          this.errorHandler.retryOperation(
            () => Promise.resolve(this.patternEngine.recognizePatterns(parseResult.ast, code)),
            { component: 'PatternRecognitionEngine', operation: 'recognizePatterns' }
          ),
          Math.min(performanceMetrics.complexity.estimatedProcessingTime * 0.4, 15000) // 40% of estimated time or 15s max
        ) as RecognizedPattern[];
        this.performanceService.recordStageTime('pattern-recognition-end');
      } catch (patternError) {
        // Try fallback visualization for pattern recognition failures
        const fallback = this.errorHandler.createFallbackVisualization(code, ['pattern-recognition']);
        
        if (fallback.success && fallback.diagram) {
          warnings.push(fallback.warning);
          fallbackUsed = true;
          
          return {
            success: true,
            diagramData: fallback.diagram,
            errors: [],
            warnings,
            fallbackUsed,
            performanceMetrics: this.performanceService.endMonitoring() || undefined
          };
        }
        
        // Fallback failed, return error
        const error = this.errorHandler.handleApplicationError(
          patternError as Error,
          { component: 'PatternRecognitionEngine', operation: 'recognizePatterns' }
        );
        
        return {
          success: false,
          errors: [error]
        };
      }
      
      if (patterns.length === 0) {
        // No patterns found, try fallback visualization
        const fallback = this.errorHandler.createFallbackVisualization(code, []);
        
        if (fallback.success && fallback.diagram) {
          warnings.push(fallback.warning);
          fallbackUsed = true;
          
          return {
            success: true,
            diagramData: fallback.diagram,
            errors: [],
            warnings,
            fallbackUsed,
            performanceMetrics: this.performanceService.endMonitoring() || undefined
          };
        }
        
        return {
          success: false,
          errors: [{
            code: 'NO_PATTERNS_FOUND',
            message: 'No recognizable patterns found',
            description: 'The code doesn\'t contain patterns we can visualize',
            suggestions: [
              'Try adding React components or functions',
              'Include some interactive elements like buttons',
              'Add API calls or data handling code',
              'Check our examples for supported code patterns'
            ],
            severity: 'low',
            context: {
              component: 'CodeVisualizationService',
              operation: 'pattern-recognition'
            }
          }]
        };
      }

      // Stage 3: Generate visualization with error handling and timeout
      progressCallback?.('visualization', 66);
      if (this.shouldCancel) return this.getCancelledResult();

      this.performanceService.recordStageTime('visualization-start');
      let diagramData: DiagramData;
      try {
        diagramData = await this.performanceService.createTimeoutPromise(
          this.errorHandler.retryOperation(
            () => Promise.resolve(this.visualizationGenerator.generateDiagram(patterns)),
            { component: 'VisualizationGenerator', operation: 'generateDiagram' }
          ),
          Math.min(performanceMetrics.complexity.estimatedProcessingTime * 0.3, 10000) // 30% of estimated time or 10s max
        ) as DiagramData;
        this.performanceService.recordStageTime('visualization-end');
      } catch (visualizationError) {
        // Try simplified diagram for visualization failures
        const vizError: VisualizationError = {
          message: visualizationError instanceof Error ? visualizationError.message : 'Visualization failed',
          stage: 'rendering',
          inputData: patterns,
          cause: visualizationError instanceof Error ? visualizationError : undefined
        };
        
        const simplified = this.errorHandler.handleVisualizationError(vizError);
        
        if (simplified.success && simplified.diagram) {
          warnings.push(simplified.warning);
          fallbackUsed = true;
          
          return {
            success: true,
            diagramData: simplified.diagram,
            errors: [],
            warnings,
            fallbackUsed,
            performanceMetrics: this.performanceService.endMonitoring() || undefined
          };
        }
        
        // Simplified diagram failed, return error
        const error = this.errorHandler.handleApplicationError(
          visualizationError as Error,
          { component: 'VisualizationGenerator', operation: 'generateDiagram' }
        );
        
        return {
          success: false,
          errors: [error]
        };
      }
      
      // Stage 4: Optimize diagram for performance
      progressCallback?.('optimization', 90);
      if (this.shouldCancel) return this.getCancelledResult();

      this.performanceService.recordStageTime('optimization-start');
      const optimizationResult = this.performanceService.optimizeDiagramForRendering(diagramData);
      diagramData = optimizationResult.optimizedData;
      optimizations.push(...optimizationResult.optimizations);
      this.performanceService.recordStageTime('optimization-end');

      progressCallback?.('optimization', 100);

      return {
        success: true,
        diagramData,
        errors: [],
        warnings: warnings.length > 0 ? warnings : undefined,
        fallbackUsed,
        performanceMetrics: this.performanceService.endMonitoring() || undefined,
        optimizations: optimizations.length > 0 ? optimizations : undefined
      };

    } catch (error) {
      // Handle unexpected errors
      const userFriendlyError = this.errorHandler.handleApplicationError(
        error as Error,
        { component: 'CodeVisualizationService', operation: 'visualizeCode' }
      );
      
      return {
        success: false,
        errors: [userFriendlyError],
        performanceMetrics: this.performanceService.endMonitoring() || undefined
      };
    } finally {
      this.isProcessing = false;
      this.shouldCancel = false;
      this.performanceService.cancelTimeout();
    }
  }

  /**
   * Cancel current processing operation
   */
  cancelProcessing(): void {
    this.shouldCancel = true;
    this.performanceService.cancelTimeout();
  }

  /**
   * Check if currently processing
   */
  get processing(): boolean {
    return this.isProcessing;
  }

  /**
   * Analyze code complexity before processing (delegated to PerformanceService)
   */
  analyzeCodeComplexity(code: string): CodeComplexityMetrics {
    return this.performanceService.analyzeCodeComplexity(code);
  }

  /**
   * Validate code before processing
   */
  async validateCodeForVisualization(code: string): Promise<{
    isValid: boolean;
    errors: UserFriendlyError[];
    warnings: string[];
    suggestions: string[];
  }> {
    const errors: UserFriendlyError[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!code || code.trim().length === 0) {
      errors.push({
        code: 'EMPTY_CODE',
        message: 'No code provided',
        description: 'Please enter some JavaScript or TypeScript code to visualize',
        suggestions: [
          'Try pasting a React component',
          'Add some functions or variables',
          'Include interactive elements like buttons or API calls'
        ],
        severity: 'high',
        context: {
          component: 'CodeVisualizationService',
          operation: 'validation'
        }
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    // Check code complexity
    const complexity = this.analyzeCodeComplexity(code);
    const complexityCheck = this.performanceService.shouldProcessCode(complexity);
    warnings.push(...complexityCheck.warnings);
    suggestions.push(...complexityCheck.suggestions);

    // Syntax validation
    try {
      const validationResult = this.astParser.validateSyntax(code);
      if (!validationResult.isValid) {
        const syntaxErrors = validationResult.errors.map(error => 
          this.errorHandler.handleParseError(error)
        );
        errors.push(...syntaxErrors);
      }
      
      // Add warnings from syntax validation
      if (validationResult.warnings.length > 0) {
        warnings.push(...validationResult.warnings.map(w => w.message));
      }
    } catch (validationError) {
      const error = this.errorHandler.handleApplicationError(
        validationError as Error,
        { component: 'CodeVisualizationService', operation: 'validation' }
      );
      errors.push(error);
    }

    // Check for supported patterns
    const hasReactPatterns = /import.*react|useState|useEffect|function.*\(\s*\)|const.*=.*\(/i.test(code);
    const hasApiPatterns = /fetch\s*\(|axios\.|\.get\(|\.post\(/i.test(code);
    const hasInteractivePatterns = /onClick|addEventListener|button/i.test(code);

    if (!hasReactPatterns && !hasApiPatterns && !hasInteractivePatterns) {
      suggestions.push('Try adding React components, API calls, or interactive elements');
      suggestions.push('Include functions, variables, or control structures');
      warnings.push('Code may have limited visualization options');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private getCancelledResult(): VisualizationResult {
    return {
      success: false,
      errors: [{
        code: 'CANCELLED',
        message: 'Processing was cancelled',
        description: 'The visualization process was cancelled by the user',
        suggestions: ['Try again when ready'],
        severity: 'low',
        context: {
          component: 'CodeVisualizationService',
          operation: 'cancelled'
        }
      }],
      performanceMetrics: this.performanceService.endMonitoring() || undefined
    };
  }

  /**
   * Get performance service instance for advanced configuration
   */
  getPerformanceService(): PerformanceService {
    return this.performanceService;
  }
}