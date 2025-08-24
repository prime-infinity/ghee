import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandlerService } from '../../services/ErrorHandlerService';
import type { ParseError, PatternError, VisualizationError, ErrorContext } from '../../types/errors';

describe('ErrorHandlerService', () => {
  let errorHandler: ErrorHandlerService;

  beforeEach(() => {
    errorHandler = new ErrorHandlerService();
  });

  describe('handleParseError', () => {
    it('should handle syntax errors with appropriate severity', () => {
      const parseError: ParseError = {
        message: 'Unexpected token',
        line: 5,
        column: 10,
        start: 50,
        end: 51,
        type: 'syntax',
        suggestion: 'Check for missing semicolon'
      };

      const result = errorHandler.handleParseError(parseError);

      expect(result.code).toBe('PARSE_ERROR_SYNTAX');
      expect(result.message).toBe('Code has syntax errors');
      expect(result.severity).toBe('high');
      expect(result.suggestions).toContain('Check for missing semicolon');
      expect(result.context?.line).toBe(5);
      expect(result.context?.column).toBe(10);
    });

    it('should handle semantic errors with medium severity', () => {
      const parseError: ParseError = {
        message: 'Invalid assignment',
        line: 3,
        column: 5,
        start: 25,
        end: 30,
        type: 'semantic'
      };

      const result = errorHandler.handleParseError(parseError);

      expect(result.severity).toBe('medium');
      expect(result.code).toBe('PARSE_ERROR_SEMANTIC');
    });

    it('should handle warnings with low severity', () => {
      const parseError: ParseError = {
        message: 'Unused variable',
        line: 1,
        column: 1,
        start: 0,
        end: 5,
        type: 'warning'
      };

      const result = errorHandler.handleParseError(parseError);

      expect(result.severity).toBe('low');
      expect(result.code).toBe('PARSE_ERROR_WARNING');
    });

    it('should provide helpful suggestions for common errors', () => {
      const unexpectedTokenError: ParseError = {
        message: 'Unexpected token {',
        line: 1,
        column: 1,
        start: 0,
        end: 1,
        type: 'syntax'
      };

      const result = errorHandler.handleParseError(unexpectedTokenError);

      expect(result.suggestions).toContain('Check for missing or extra punctuation marks');
      expect(result.suggestions).toContain('Verify that all brackets and parentheses are properly closed');
    });
  });

  describe('handlePatternError', () => {
    it('should create fallback visualization for pattern errors', () => {
      const patternError: PatternError = {
        message: 'Failed to recognize counter pattern',
        patternType: 'counter',
        codeLocation: { start: 0, end: 100 }
      };

      const result = errorHandler.handlePatternError(patternError);

      expect(result.success).toBe(true);
      expect(result.diagram).toBeDefined();
      expect(result.warning).toContain('counter pattern');
      expect(result.failedPatterns).toContain('counter');
    });

    it('should handle pattern errors gracefully when fallback fails', () => {
      const patternError: PatternError = {
        message: 'Critical pattern error',
        patternType: 'invalid-pattern',
        cause: new Error('Critical failure')
      };

      const result = errorHandler.handlePatternError(patternError);

      // The service still creates a basic fallback even for invalid patterns
      expect(result.success).toBe(true);
      expect(result.warning).toContain('invalid-pattern pattern');
    });
  });

  describe('handleVisualizationError', () => {
    it('should create simplified diagram for visualization errors', () => {
      const vizError: VisualizationError = {
        message: 'Node generation failed',
        stage: 'node-generation',
        inputData: [
          {
            id: 'test-pattern',
            type: 'counter',
            nodes: [],
            connections: [],
            metadata: { confidence: 0.8, codeLocation: { start: 0, end: 10 }, variables: [], functions: [], complexity: 'simple' }
          }
        ]
      };

      const result = errorHandler.handleVisualizationError(vizError);

      expect(result.success).toBe(true);
      expect(result.diagram).toBeDefined();
      expect(result.warning).toContain('node-generation');
      expect(result.removedFeatures).toContain('Advanced node types');
    });

    it('should handle different visualization stages', () => {
      const stages: VisualizationError['stage'][] = ['node-generation', 'edge-generation', 'layout', 'rendering'];

      stages.forEach(stage => {
        const vizError: VisualizationError = {
          message: `${stage} failed`,
          stage,
          inputData: []
        };

        const result = errorHandler.handleVisualizationError(vizError);

        expect(result.warning).toContain(stage);
        expect(result.removedFeatures.length).toBeGreaterThan(0);
      });
    });
  });

  describe('handleApplicationError', () => {
    it('should handle timeout errors', () => {
      const error = new Error('Operation timeout');
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOperation'
      };

      const result = errorHandler.handleApplicationError(error, context);

      expect(result.code).toBe('TESTCOMPONENT_TIMEOUT_ERROR');
      expect(result.message).toBe('Operation timed out');
      expect(result.suggestions).toContain('Try with smaller or simpler code');
    });

    it('should handle memory errors with critical severity', () => {
      const error = new Error('Out of memory');
      const context: ErrorContext = {
        component: 'MemoryComponent',
        operation: 'allocate'
      };

      const result = errorHandler.handleApplicationError(error, context);

      expect(result.severity).toBe('critical');
      expect(result.suggestions).toContain('Try with smaller code samples');
    });

    it('should handle type errors', () => {
      const error = new TypeError('Cannot read property of undefined');
      const context: ErrorContext = {
        component: 'TypeComponent',
        operation: 'process'
      };

      const result = errorHandler.handleApplicationError(error, context);

      expect(result.code).toBe('TYPECOMPONENT_TYPE_ERROR');
      expect(result.message).toBe('Data type error occurred');
      expect(result.severity).toBe('high');
    });
  });

  describe('createFallbackVisualization', () => {
    it('should create fallback for simple code', () => {
      const code = `
        function hello() {
          console.log('Hello');
        }
        const name = 'World';
      `;

      const result = errorHandler.createFallbackVisualization(code);

      expect(result.success).toBe(true);
      expect(result.diagram).toBeDefined();
      expect(result.recognizedPatterns).toContain('function');
      expect(result.recognizedPatterns).toContain('variable');
    });

    it('should handle empty code gracefully', () => {
      const result = errorHandler.createFallbackVisualization('');

      expect(result.success).toBe(false);
      expect(result.warning).toContain('No recognizable code elements found');
    });

    it('should handle code with only whitespace', () => {
      const result = errorHandler.createFallbackVisualization('   \n\t  ');

      expect(result.success).toBe(false);
      expect(result.warning).toContain('No recognizable code elements found');
    });
  });

  describe('retryOperation', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOp'
      };

      const result = await errorHandler.retryOperation(operation, context);

      expect(result).toBe('success');
      expect(attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry syntax errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Syntax error'));
      const context: ErrorContext = {
        component: 'ASTParserService',
        operation: 'parseCode'
      };

      await expect(errorHandler.retryOperation(operation, context)).rejects.toThrow('Syntax error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry memory errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Out of memory'));
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOp'
      };

      await expect(errorHandler.retryOperation(operation, context)).rejects.toThrow('Out of memory');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retry attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      const context: ErrorContext = {
        component: 'TestComponent',
        operation: 'testOp'
      };

      await expect(errorHandler.retryOperation(operation, context, 2)).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('error recovery scenarios', () => {
    it('should handle complex error scenarios', () => {
      const complexError: ParseError = {
        message: 'Unexpected token, expected ";"',
        line: 10,
        column: 25,
        start: 150,
        end: 151,
        type: 'syntax',
        suggestion: 'Add semicolon after statement'
      };

      const result = errorHandler.handleParseError(complexError);

      expect(result.suggestions).toContain('Add semicolon after statement');
      expect(result.suggestions).toContain('Try simplifying the code to isolate the issue');
      expect(result.description).toContain('line 10, column 25');
    });

    it('should provide context-aware error messages', () => {
      const error = new Error('Network request failed');
      const context: ErrorContext = {
        component: 'ApiService',
        operation: 'fetchData',
        metadata: { url: 'https://api.example.com' }
      };

      const result = errorHandler.handleApplicationError(error, context);

      expect(result.description).toContain('while performing fetchData in ApiService');
      expect(result.context).toEqual(context);
    });
  });
});