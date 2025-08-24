import type { 
  UserFriendlyError, 
  ErrorHandler, 
  ParseError, 
  PatternError, 
  VisualizationError,
  FallbackVisualization,
  SimplifiedDiagram,
  ErrorContext
} from '../types/errors';
import type { DiagramData, VisualNode, VisualEdge } from '../types/visualization';
import type { RecognizedPattern } from '../types/patterns';

/**
 * Comprehensive error handling service for the code visualization application
 * Implements user-friendly error messages, graceful degradation, and fallback visualizations
 */
export class ErrorHandlerService implements ErrorHandler {
  private readonly maxRetryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Handle parsing errors with user-friendly messages and suggestions
   */
  handleParseError(error: ParseError): UserFriendlyError {
    const suggestions = this.getParseErrorSuggestions(error);
    const severity = this.getParseErrorSeverity(error);
    
    return {
      code: `PARSE_ERROR_${error.type.toUpperCase()}`,
      message: this.getParseErrorMessage(error),
      description: this.getParseErrorDescription(error),
      suggestions,
      severity,
      context: {
        component: 'ASTParserService',
        operation: 'parseCode',
        line: error.line,
        column: error.column
      }
    };
  }

  /**
   * Handle pattern recognition errors with fallback visualizations
   */
  handlePatternError(error: PatternError): FallbackVisualization {
    console.warn(`Pattern recognition error for ${error.patternType}:`, error.message);
    
    // Attempt to create a basic fallback visualization
    const fallbackDiagram = this.createBasicFallbackDiagram(error);
    
    return {
      success: fallbackDiagram !== null,
      diagram: fallbackDiagram || undefined,
      warning: `Could not fully recognize ${error.patternType} pattern. Showing simplified view.`,
      recognizedPatterns: [],
      failedPatterns: [error.patternType]
    };
  }

  /**
   * Handle visualization generation errors with simplified diagrams
   */
  handleVisualizationError(error: VisualizationError): SimplifiedDiagram {
    console.warn(`Visualization error at ${error.stage}:`, error.message);
    
    // Create a simplified diagram based on available data
    const simplifiedDiagram = this.createSimplifiedDiagram(error);
    
    return {
      success: simplifiedDiagram !== null,
      diagram: simplifiedDiagram || undefined,
      warning: `Visualization partially failed at ${error.stage}. Showing simplified diagram.`,
      removedFeatures: this.getRemovedFeatures(error.stage)
    };
  }

  /**
   * Handle general application errors
   */
  handleApplicationError(error: Error, context: ErrorContext): UserFriendlyError {
    const errorCode = this.getApplicationErrorCode(error, context);
    const severity = this.getApplicationErrorSeverity(error, context);
    
    return {
      code: errorCode,
      message: this.getApplicationErrorMessage(error, context),
      description: this.getApplicationErrorDescription(error, context),
      suggestions: this.getApplicationErrorSuggestions(error, context),
      severity,
      originalError: error,
      context
    };
  }

  /**
   * Create fallback visualization for unsupported code patterns
   */
  createFallbackVisualization(
    code: string, 
    failedPatterns: string[] = []
  ): FallbackVisualization {
    // Analyze code for basic elements we can still visualize
    const basicElements = this.extractBasicCodeElements(code);
    
    if (basicElements.length === 0) {
      return {
        success: false,
        warning: 'No recognizable code elements found. Try adding functions, variables, or control structures.',
        recognizedPatterns: [],
        failedPatterns
      };
    }

    // Create a basic diagram from extracted elements
    const fallbackDiagram = this.createBasicDiagram(basicElements);
    
    return {
      success: true,
      diagram: fallbackDiagram,
      warning: 'Showing basic code structure. Some advanced patterns may not be visualized.',
      recognizedPatterns: basicElements.map(el => el.type),
      failedPatterns
    };
  }

  /**
   * Implement retry mechanism for failed operations
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxAttempts: number = this.maxRetryAttempts
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}):`, error);
        
        // Don't retry on certain types of errors
        if (this.shouldNotRetry(error as Error, context)) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxAttempts) {
          await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }
    
    // All retries failed, throw the last error
    throw lastError!;
  }

  /**
   * Get user-friendly error message for parse errors
   */
  private getParseErrorMessage(error: ParseError): string {
    switch (error.type) {
      case 'syntax':
        return 'Code has syntax errors';
      case 'semantic':
        return 'Code structure issue detected';
      case 'warning':
        return 'Code quality warning';
      default:
        return 'Code parsing issue';
    }
  }

  /**
   * Get detailed description for parse errors
   */
  private getParseErrorDescription(error: ParseError): string {
    const baseDescription = error.message;
    const location = `at line ${error.line}, column ${error.column}`;
    
    return `${baseDescription} ${location}`;
  }

  /**
   * Get suggestions for fixing parse errors
   */
  private getParseErrorSuggestions(error: ParseError): string[] {
    const suggestions: string[] = [];
    
    // Add error-specific suggestions
    if (error.suggestion) {
      suggestions.push(error.suggestion);
    }
    
    // Add general suggestions based on error type
    if (error.message.toLowerCase().includes('unexpected')) {
      suggestions.push('Check for missing or extra punctuation marks');
      suggestions.push('Verify that all brackets and parentheses are properly closed');
    }
    
    if (error.message.toLowerCase().includes('unterminated')) {
      suggestions.push('Check for unclosed strings or comments');
      suggestions.push('Make sure all quotes are properly paired');
    }
    
    if (error.message.toLowerCase().includes('expected')) {
      suggestions.push('Check the syntax around the error location');
      suggestions.push('Try using a code formatter to identify structural issues');
    }
    
    // Always add general suggestions
    suggestions.push('Try simplifying the code to isolate the issue');
    suggestions.push('Use a code editor with syntax highlighting to spot errors');
    
    return suggestions;
  }

  /**
   * Get severity level for parse errors
   */
  private getParseErrorSeverity(error: ParseError): UserFriendlyError['severity'] {
    switch (error.type) {
      case 'syntax':
        return 'high';
      case 'semantic':
        return 'medium';
      case 'warning':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Create a basic fallback diagram for pattern errors
   */
  private createBasicFallbackDiagram(error: PatternError): DiagramData | null {
    try {
      // Create a simple error visualization
      const nodes: VisualNode[] = [
        {
          id: 'error-node',
          type: 'error',
          position: { x: 100, y: 100 },
          data: {
            label: `${error.patternType} Pattern`,
            icon: 'AlertTriangle',
            explanation: `Could not fully analyze ${error.patternType} pattern`,
            properties: {
              error: true,
              patternType: error.patternType
            }
          }
        }
      ];

      const edges: VisualEdge[] = [];

      return {
        nodes,
        edges,
        layout: {
          direction: 'horizontal',
          spacing: { x: 150, y: 100 }
        }
      };
    } catch (fallbackError) {
      console.error('Failed to create fallback diagram:', fallbackError);
      return null;
    }
  }

  /**
   * Create a simplified diagram for visualization errors
   */
  private createSimplifiedDiagram(error: VisualizationError): DiagramData | null {
    try {
      // Extract any usable data from the error
      const inputData = error.inputData as RecognizedPattern[] | undefined;
      
      if (!inputData || !Array.isArray(inputData)) {
        return this.createMinimalDiagram();
      }

      // Create simplified nodes from patterns
      const nodes: VisualNode[] = inputData.map((pattern, index) => ({
        id: `simplified-${pattern.id || index}`,
        type: this.getSimplifiedNodeType(pattern.type),
        position: { x: index * 200 + 100, y: 100 },
        data: {
          label: this.getSimplifiedLabel(pattern.type),
          icon: this.getSimplifiedIcon(pattern.type),
          explanation: `Simplified ${pattern.type} pattern`,
          properties: {
            simplified: true,
            originalType: pattern.type
          }
        }
      }));

      // Create basic connections
      const edges: VisualEdge[] = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `simplified-edge-${i}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: 'default',
          data: {
            label: 'flows to',
            animated: false
          }
        });
      }

      return {
        nodes,
        edges,
        layout: {
          direction: 'horizontal',
          spacing: { x: 200, y: 100 }
        }
      };
    } catch (simplificationError) {
      console.error('Failed to create simplified diagram:', simplificationError);
      return this.createMinimalDiagram();
    }
  }

  /**
   * Create a minimal diagram as last resort
   */
  private createMinimalDiagram(): DiagramData {
    return {
      nodes: [
        {
          id: 'minimal-node',
          type: 'component',
          position: { x: 100, y: 100 },
          data: {
            label: 'Code Structure',
            icon: 'Code',
            explanation: 'Basic code visualization',
            properties: {
              minimal: true
            }
          }
        }
      ],
      edges: [],
      layout: {
        direction: 'horizontal',
        spacing: { x: 150, y: 100 }
      }
    };
  }

  /**
   * Get features that were removed during simplification
   */
  private getRemovedFeatures(stage: VisualizationError['stage']): string[] {
    const features: string[] = [];
    
    switch (stage) {
      case 'node-generation':
        features.push('Advanced node types', 'Custom node styling', 'Node metadata');
        break;
      case 'edge-generation':
        features.push('Complex connections', 'Edge animations', 'Connection metadata');
        break;
      case 'layout':
        features.push('Advanced positioning', 'Automatic layout', 'Node clustering');
        break;
      case 'rendering':
        features.push('Interactive features', 'Animations', 'Advanced styling');
        break;
    }
    
    return features;
  }

  /**
   * Extract basic code elements for fallback visualization
   */
  private extractBasicCodeElements(code: string): Array<{type: string, name: string}> {
    const elements: Array<{type: string, name: string}> = [];
    
    // Simple regex-based extraction for fallback
    const functionMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const name = match.match(/(\w+)/)?.[1] || 'function';
        elements.push({ type: 'function', name });
      });
    }
    
    const variableMatches = code.match(/(?:let|const|var)\s+(\w+)/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        const name = match.match(/(\w+)$/)?.[1] || 'variable';
        elements.push({ type: 'variable', name });
      });
    }
    
    return elements;
  }

  /**
   * Create basic diagram from extracted elements
   */
  private createBasicDiagram(elements: Array<{type: string, name: string}>): DiagramData {
    const nodes: VisualNode[] = elements.map((element, index) => ({
      id: `basic-${index}`,
      type: element.type === 'function' ? 'function' : 'variable',
      position: { x: index * 150 + 100, y: 100 },
      data: {
        label: element.name,
        icon: element.type === 'function' ? 'Zap' : 'Box',
        explanation: `${element.type}: ${element.name}`,
        properties: {
          basic: true,
          elementType: element.type
        }
      }
    }));

    const edges: VisualEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `basic-edge-${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: 'default',
        data: {
          label: 'relates to',
          animated: false
        }
      });
    }

    return {
      nodes,
      edges,
      layout: {
        direction: 'horizontal',
        spacing: { x: 150, y: 100 }
      }
    };
  }

  /**
   * Get application error code
   */
  private getApplicationErrorCode(error: Error, context: ErrorContext): string {
    const component = context.component.toUpperCase().replace(/[^A-Z]/g, '_');
    const operation = context.operation.toUpperCase().replace(/[^A-Z]/g, '_');
    
    if (error.name === 'TypeError') {
      return `${component}_TYPE_ERROR`;
    }
    if (error.name === 'ReferenceError') {
      return `${component}_REFERENCE_ERROR`;
    }
    if (error.message.includes('timeout')) {
      return `${component}_TIMEOUT_ERROR`;
    }
    if (error.message.includes('memory')) {
      return `${component}_MEMORY_ERROR`;
    }
    
    return `${component}_${operation}_ERROR`;
  }

  /**
   * Get application error message
   */
  private getApplicationErrorMessage(error: Error, context: ErrorContext): string {
    if (error.message.includes('timeout')) {
      return 'Operation timed out';
    }
    if (error.message.includes('memory')) {
      return 'Not enough memory to complete operation';
    }
    if (error.name === 'TypeError') {
      return 'Data type error occurred';
    }
    if (error.name === 'ReferenceError') {
      return 'Reference error in code';
    }
    
    return `Error in ${context.component}`;
  }

  /**
   * Get application error description
   */
  private getApplicationErrorDescription(error: Error, context: ErrorContext): string {
    const baseDescription = error.message;
    const contextInfo = `while performing ${context.operation} in ${context.component}`;
    
    return `${baseDescription} ${contextInfo}`;
  }

  /**
   * Get application error suggestions
   */
  private getApplicationErrorSuggestions(error: Error, context: ErrorContext): string[] {
    const suggestions: string[] = [];
    
    if (error.message.includes('timeout')) {
      suggestions.push('Try with smaller or simpler code');
      suggestions.push('Check your internet connection');
      suggestions.push('Refresh the page and try again');
    } else if (error.message.includes('memory')) {
      suggestions.push('Try with smaller code samples');
      suggestions.push('Close other browser tabs to free memory');
      suggestions.push('Refresh the page to clear memory');
    } else if (error.name === 'TypeError') {
      suggestions.push('Check your code for type-related issues');
      suggestions.push('Try with different code structure');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Try with different code');
      suggestions.push('Check browser console for more details');
    }
    
    return suggestions;
  }

  /**
   * Get application error severity
   */
  private getApplicationErrorSeverity(error: Error, context: ErrorContext): UserFriendlyError['severity'] {
    if (error.message.includes('memory') || error.message.includes('crash')) {
      return 'critical';
    }
    if (error.message.includes('timeout') || error.name === 'TypeError') {
      return 'high';
    }
    if (error.name === 'ReferenceError') {
      return 'medium';
    }
    
    return 'medium';
  }

  /**
   * Check if operation should not be retried
   */
  private shouldNotRetry(error: Error, context: ErrorContext): boolean {
    // Don't retry syntax errors
    if (context.operation === 'parseCode' && error.message.includes('Syntax')) {
      return true;
    }
    
    // Don't retry memory errors
    if (error.message.includes('memory')) {
      return true;
    }
    
    // Don't retry type errors (usually code issues)
    if (error.name === 'TypeError' && context.component === 'ASTParserService') {
      return true;
    }
    
    return false;
  }

  /**
   * Delay utility for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get simplified node type for error recovery
   */
  private getSimplifiedNodeType(patternType: string): VisualNode['type'] {
    switch (patternType) {
      case 'api-call':
        return 'api';
      case 'counter':
        return 'button';
      case 'database':
        return 'database';
      case 'error-handling':
        return 'error';
      case 'react-component':
        return 'component';
      default:
        return 'component';
    }
  }

  /**
   * Get simplified label for error recovery
   */
  private getSimplifiedLabel(patternType: string): string {
    switch (patternType) {
      case 'api-call':
        return 'API Call';
      case 'counter':
        return 'Counter';
      case 'database':
        return 'Database';
      case 'error-handling':
        return 'Error Handler';
      case 'react-component':
        return 'Component';
      default:
        return 'Code Element';
    }
  }

  /**
   * Get simplified icon for error recovery
   */
  private getSimplifiedIcon(patternType: string): string {
    switch (patternType) {
      case 'api-call':
        return 'Globe';
      case 'counter':
        return 'Plus';
      case 'database':
        return 'Database';
      case 'error-handling':
        return 'AlertTriangle';
      case 'react-component':
        return 'Component';
      default:
        return 'Box';
    }
  }
}