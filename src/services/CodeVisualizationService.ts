import type { DiagramData } from '../types/visualization';
import type { UserFriendlyError, PatternError, VisualizationError } from '../types/errors';
import { ASTParserService } from './ASTParserService';
import { PatternRecognitionEngine } from './PatternRecognitionEngine';
import { VisualizationGenerator } from './VisualizationGenerator';
import { ErrorHandlerService } from './ErrorHandlerService';

/**
 * Processing stages for user feedback
 */
export type ProcessingStage = 'parsing' | 'pattern-recognition' | 'visualization';

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
  private isProcessing = false;
  private shouldCancel = false;

  constructor() {
    this.astParser = new ASTParserService();
    this.patternEngine = new PatternRecognitionEngine();
    this.visualizationGenerator = new VisualizationGenerator();
    this.errorHandler = new ErrorHandlerService();
  }

  /**
   * Convert code into a visual diagram with comprehensive error handling
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
    let fallbackUsed = false;

    try {
      // Stage 1: Parse code into AST with retry mechanism
      progressCallback?.('parsing', 0);
      if (this.shouldCancel) return this.getCancelledResult();

      const parseResult = await this.errorHandler.retryOperation(
        () => this.astParser.parseCode(code),
        { component: 'ASTParserService', operation: 'parseCode' }
      );

      if (parseResult.errors.length > 0 || !parseResult.ast) {
        // Handle parse errors with user-friendly messages
        const userFriendlyErrors = parseResult.errors.map(error => 
          this.errorHandler.handleParseError(error)
        );
        
        return {
          success: false,
          errors: userFriendlyErrors
        };
      }

      // Stage 2: Recognize patterns with error handling
      progressCallback?.('pattern-recognition', 33);
      if (this.shouldCancel) return this.getCancelledResult();

      let patterns;
      try {
        patterns = await this.errorHandler.retryOperation(
          () => this.patternEngine.recognizePatterns(parseResult.ast, code),
          { component: 'PatternRecognitionEngine', operation: 'recognizePatterns' }
        );
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
            fallbackUsed
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
            fallbackUsed
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

      // Stage 3: Generate visualization with error handling
      progressCallback?.('visualization', 66);
      if (this.shouldCancel) return this.getCancelledResult();

      let diagramData;
      try {
        diagramData = await this.errorHandler.retryOperation(
          () => this.visualizationGenerator.generateDiagram(patterns),
          { component: 'VisualizationGenerator', operation: 'generateDiagram' }
        );
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
            fallbackUsed
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
      
      progressCallback?.('visualization', 100);

      return {
        success: true,
        diagramData,
        errors: [],
        warnings: warnings.length > 0 ? warnings : undefined,
        fallbackUsed
      };

    } catch (error) {
      // Handle unexpected errors
      const userFriendlyError = this.errorHandler.handleApplicationError(
        error as Error,
        { component: 'CodeVisualizationService', operation: 'visualizeCode' }
      );
      
      return {
        success: false,
        errors: [userFriendlyError]
      };
    } finally {
      this.isProcessing = false;
      this.shouldCancel = false;
    }
  }

  /**
   * Cancel current processing operation
   */
  cancelProcessing(): void {
    this.shouldCancel = true;
  }

  /**
   * Check if currently processing
   */
  get processing(): boolean {
    return this.isProcessing;
  }

  /**
   * Analyze code complexity before processing
   */
  analyzeCodeComplexity(code: string): {
    complexity: 'simple' | 'medium' | 'complex';
    metrics: {
      lines: number;
      functions: number;
      variables: number;
      nestingDepth: number;
    };
    warnings: string[];
  } {
    const lines = code.split('\n').length;
    const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const variables = (code.match(/(?:let|const|var)\s+\w+/g) || []).length;
    
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

    const metrics = {
      lines,
      functions,
      variables,
      nestingDepth: maxDepth
    };

    const warnings: string[] = [];
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';

    // Determine complexity and warnings
    if (lines > 500) {
      complexity = 'complex';
      warnings.push('Large code file may take longer to process');
    } else if (lines > 100) {
      complexity = 'medium';
      warnings.push('Medium-sized code file');
    }

    if (maxDepth > 5) {
      complexity = 'complex';
      warnings.push('Deeply nested code may be simplified in visualization');
    }

    if (functions > 20) {
      complexity = 'complex';
      warnings.push('Many functions detected - some may be grouped in visualization');
    }

    return { complexity, metrics, warnings };
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
    warnings.push(...complexity.warnings);

    if (complexity.complexity === 'complex') {
      suggestions.push('Consider breaking down complex code into smaller parts');
      suggestions.push('Focus on key functionality for better visualization');
    }

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
      }]
    };
  }
}