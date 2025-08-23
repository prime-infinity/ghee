import type { DiagramData } from '../types/visualization';
import type { UserFriendlyError } from '../types/errors';
import { ASTParserService } from './ASTParserService';
import { PatternRecognitionEngine } from './PatternRecognitionEngine';
import { VisualizationGenerator } from './VisualizationGenerator';

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
}

/**
 * Main service for converting code into visual diagrams
 * Orchestrates parsing, pattern recognition, and visualization generation
 */
export class CodeVisualizationService {
  private astParser: ASTParserService;
  private patternEngine: PatternRecognitionEngine;
  private visualizationGenerator: VisualizationGenerator;
  private isProcessing = false;
  private shouldCancel = false;

  constructor() {
    this.astParser = new ASTParserService();
    this.patternEngine = new PatternRecognitionEngine();
    this.visualizationGenerator = new VisualizationGenerator();
  }

  /**
   * Convert code into a visual diagram
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

    try {
      // Stage 1: Parse code into AST
      progressCallback?.('parsing', 0);
      if (this.shouldCancel) return this.getCancelledResult();

      const parseResult = await this.astParser.parseCode(code);
      if (parseResult.errors.length > 0 || !parseResult.ast) {
        return {
          success: false,
          errors: parseResult.errors.map(error => ({
            code: 'PARSE_ERROR',
            message: 'Failed to parse code',
            description: error.message,
            suggestions: [
              'Check your code syntax',
              'Make sure all brackets and parentheses are closed',
              'Try with a simpler code example'
            ],
            severity: 'high' as const,
            context: {
              component: 'CodeVisualizationService',
              operation: 'parsing',
              line: error.line,
              column: error.column
            }
          }))
        };
      }

      // Stage 2: Recognize patterns
      progressCallback?.('pattern-recognition', 33);
      if (this.shouldCancel) return this.getCancelledResult();

      const patterns = await this.patternEngine.recognizePatterns(parseResult.ast, code);
      
      if (patterns.length === 0) {
        return {
          success: false,
          errors: [{
            code: 'NO_PATTERNS_FOUND',
            message: 'No recognizable patterns found',
            description: 'The code doesn\'t contain patterns we can visualize',
            suggestions: [
              'Try adding React components or functions',
              'Include some interactive elements like buttons',
              'Add API calls or data handling code'
            ],
            severity: 'low',
            context: {
              component: 'CodeVisualizationService',
              operation: 'pattern-recognition'
            }
          }]
        };
      }

      // Stage 3: Generate visualization
      progressCallback?.('visualization', 66);
      if (this.shouldCancel) return this.getCancelledResult();

      const diagramData = await this.visualizationGenerator.generateDiagram(patterns);
      
      progressCallback?.('visualization', 100);

      return {
        success: true,
        diagramData,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'UNEXPECTED_ERROR',
          message: 'Unexpected error occurred',
          description: error instanceof Error ? error.message : 'Unknown error',
          suggestions: [
            'Try refreshing the page',
            'Try with different code',
            'Check browser console for more details'
          ],
          severity: 'high',
          originalError: error instanceof Error ? error : undefined,
          context: {
            component: 'CodeVisualizationService',
            operation: 'visualizeCode'
          }
        }]
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