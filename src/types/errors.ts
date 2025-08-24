import type { DiagramData } from './visualization';

/**
 * User-friendly error with helpful messaging
 */
export interface UserFriendlyError {
  /** Unique error code */
  code: string;
  /** User-friendly error message */
  message: string;
  /** Detailed description of the error */
  description: string;
  /** Suggested actions to fix the error */
  suggestions: string[];
  /** Severity level of the error */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Original technical error (for debugging) */
  originalError?: Error;
  /** Context where the error occurred */
  context?: ErrorContext;
}

/**
 * Context information about where an error occurred
 */
export interface ErrorContext {
  /** Component or service where error occurred */
  component: string;
  /** Operation being performed when error occurred */
  operation: string;
  /** Input data that caused the error */
  input?: any;
  /** Line number where error occurred (for parse errors) */
  line?: number;
  /** Column number where error occurred (for parse errors) */
  column?: number;
  /** Additional context properties */
  metadata?: Record<string, any>;
}

/**
 * Error handler interface for managing different types of errors
 */
export interface ErrorHandler {
  /** Handle parsing errors */
  handleParseError(error: ParseError): UserFriendlyError;
  /** Handle pattern recognition errors */
  handlePatternError(error: PatternError): FallbackVisualization;
  /** Handle visualization generation errors */
  handleVisualizationError(error: VisualizationError): SimplifiedDiagram;
  /** Handle general application errors */
  handleApplicationError(error: Error, context: ErrorContext): UserFriendlyError;
}

/**
 * Error that occurs during pattern recognition
 */
export interface PatternError {
  /** Error message */
  message: string;
  /** Type of pattern that failed */
  patternType: string;
  /** Code location where error occurred */
  codeLocation?: {
    start: number;
    end: number;
  };
  /** Original error that caused this */
  cause?: Error;
}

/**
 * Error that occurs during visualization generation
 */
export interface VisualizationError {
  /** Error message */
  message: string;
  /** Stage of visualization where error occurred */
  stage: 'node-generation' | 'edge-generation' | 'layout' | 'rendering';
  /** Data that caused the error */
  inputData?: any;
  /** Original error that caused this */
  cause?: Error;
}

/**
 * Fallback visualization when pattern recognition fails
 */
export interface FallbackVisualization {
  /** Whether fallback was successful */
  success: boolean;
  /** Simplified diagram data */
  diagram?: DiagramData;
  /** Warning message about the fallback */
  warning: string;
  /** What patterns were successfully recognized */
  recognizedPatterns: string[];
  /** What patterns failed to be recognized */
  failedPatterns: string[];
}

/**
 * Simplified diagram when full visualization fails
 */
export interface SimplifiedDiagram {
  /** Whether simplification was successful */
  success: boolean;
  /** Basic diagram with minimal features */
  diagram?: DiagramData;
  /** Warning message about the simplification */
  warning: string;
  /** Features that were removed in simplification */
  removedFeatures: string[];
}

/**
 * Parse error from AST parsing (re-exported for convenience)
 */
export interface ParseError {
  /** Error message */
  message: string;
  /** Line number where error occurred */
  line: number;
  /** Column number where error occurred */
  column: number;
  /** Start position in the source code */
  start: number;
  /** End position in the source code */
  end: number;
  /** Type of error */
  type: 'syntax' | 'semantic' | 'warning';
  /** Suggested fix for the error */
  suggestion?: string;
}