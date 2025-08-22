import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Node } from '@babel/types';
import * as t from '@babel/types';
import { 
  PatternRecognitionEngine, 
  type PatternMatcher, 
  type TraversalContext, 
  type PatternMatch 
} from '../PatternRecognitionEngine';
import { ASTParserService } from '../ASTParserService';
import type { RecognizedPattern } from '../../types';

// Mock pattern matcher for testing
class MockPatternMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'counter';
  private mockMatches: PatternMatch[] = [];
  private mockConfidence = 0.8;
  private shouldMatch = false;

  constructor(matches: PatternMatch[] = [], confidence = 0.8) {
    this.mockMatches = matches;
    this.mockConfidence = confidence;
  }

  match(node: Node, context: TraversalContext): PatternMatch[] {
    // Only return matches when explicitly set to do so
    if (this.shouldMatch && this.mockMatches.length > 0) {
      // Return matches only once to avoid duplicates
      const matches = [...this.mockMatches];
      this.shouldMatch = false;
      return matches;
    }
    return [];
  }

  getConfidence(match: PatternMatch): number {
    return this.mockConfidence;
  }

  setMockMatches(matches: PatternMatch[]): void {
    this.mockMatches = matches;
    this.shouldMatch = matches.length > 0;
  }

  setMockConfidence(confidence: number): void {
    this.mockConfidence = confidence;
  }
}

describe('PatternRecognitionEngine', () => {
  let engine: PatternRecognitionEngine;
  let astParser: ASTParserService;
  let mockMatcher: MockPatternMatcher;

  beforeEach(() => {
    engine = new PatternRecognitionEngine();
    astParser = new ASTParserService();
    mockMatcher = new MockPatternMatcher();
  });

  describe('constructor', () => {
    it('should create an instance with built-in matchers', () => {
      expect(engine.getRegisteredPatternTypes()).toContain('counter');
    });

    it('should set default confidence threshold', () => {
      expect(engine.getConfidenceThreshold()).toBe(0.6);
    });
  });

  describe('registerMatcher', () => {
    it('should register a pattern matcher', () => {
      engine.registerMatcher(mockMatcher);
      expect(engine.getRegisteredPatternTypes()).toContain('counter');
    });

    it('should allow multiple matchers for different pattern types', () => {
      const apiMatcher = new MockPatternMatcher();
      (apiMatcher as any).patternType = 'api-call';
      
      engine.registerMatcher(mockMatcher);
      engine.registerMatcher(apiMatcher);
      
      const types = engine.getRegisteredPatternTypes();
      expect(types).toContain('counter');
      expect(types).toContain('api-call');
      expect(types).toHaveLength(3); // Now includes database matcher
    });

    it('should replace existing matcher for same pattern type', () => {
      const firstMatcher = new MockPatternMatcher();
      const secondMatcher = new MockPatternMatcher();
      
      engine.registerMatcher(firstMatcher);
      engine.registerMatcher(secondMatcher);
      
      // Should still have 3 types: 'counter' (replaced), 'api-call', and 'database' (built-in)
      expect(engine.getRegisteredPatternTypes()).toHaveLength(3);
      expect(engine.getRegisteredPatternTypes()).toContain('counter');
      expect(engine.getRegisteredPatternTypes()).toContain('api-call');
    });
  });

  describe('recognizePatterns', () => {
    it('should return empty array when no patterns match', async () => {
      const code = 'const x = 1;'; // Simple code that won't match counter pattern
      const parseResult = await astParser.parseCode(code);
      
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      expect(patterns).toEqual([]);
    });

    it('should return empty array when no patterns are found', async () => {
      engine.registerMatcher(mockMatcher);
      
      const code = 'const x = 1;';
      const parseResult = await astParser.parseCode(code);
      
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      expect(patterns).toEqual([]);
    });

    it('should recognize patterns when matches are found', async () => {
      // Create a mock match
      const mockMatch: PatternMatch = {
        type: 'counter',
        rootNode: t.variableDeclarator(t.identifier('test'), t.numericLiteral(1)),
        involvedNodes: [t.variableDeclarator(t.identifier('test'), t.numericLiteral(1))],
        variables: ['test'],
        functions: [],
        metadata: { testData: 'value' }
      };

      mockMatcher.setMockMatches([mockMatch]);
      engine.registerMatcher(mockMatcher);
      
      const code = 'const test = 1;';
      const parseResult = await astParser.parseCode(code);
      
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe('counter');
      expect(patterns[0].metadata.variables).toContain('test');
      expect(patterns[0].metadata.confidence).toBe(0.8);
    });

    it('should filter out patterns below confidence threshold', async () => {
      const mockMatch: PatternMatch = {
        type: 'counter',
        rootNode: t.variableDeclarator(t.identifier('test'), t.numericLiteral(1)),
        involvedNodes: [t.variableDeclarator(t.identifier('test'), t.numericLiteral(1))],
        variables: ['test'],
        functions: [],
        metadata: {}
      };

      mockMatcher.setMockMatches([mockMatch]);
      mockMatcher.setMockConfidence(0.3); // Below default threshold of 0.6
      engine.registerMatcher(mockMatcher);
      
      const code = 'const test = 1;';
      const parseResult = await astParser.parseCode(code);
      
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      expect(patterns).toHaveLength(0);
    });

    it('should handle matcher errors gracefully', async () => {
      const errorMatcher: PatternMatcher = {
        patternType: 'counter',
        match: () => {
          throw new Error('Matcher error');
        },
        getConfidence: () => 0.8
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      engine.registerMatcher(errorMatcher);
      
      const code = 'const test = 1;';
      const parseResult = await astParser.parseCode(code);
      
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      
      expect(patterns).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pattern matcher counter failed:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('confidence threshold management', () => {
    it('should allow setting confidence threshold', () => {
      engine.setConfidenceThreshold(0.8);
      expect(engine.getConfidenceThreshold()).toBe(0.8);
    });

    it('should throw error for invalid confidence threshold', () => {
      expect(() => engine.setConfidenceThreshold(-0.1)).toThrow(
        'Confidence threshold must be between 0 and 1'
      );
      expect(() => engine.setConfidenceThreshold(1.1)).toThrow(
        'Confidence threshold must be between 0 and 1'
      );
    });

    it('should accept boundary values for confidence threshold', () => {
      expect(() => engine.setConfidenceThreshold(0)).not.toThrow();
      expect(() => engine.setConfidenceThreshold(1)).not.toThrow();
      
      engine.setConfidenceThreshold(0);
      expect(engine.getConfidenceThreshold()).toBe(0);
      
      engine.setConfidenceThreshold(1);
      expect(engine.getConfidenceThreshold()).toBe(1);
    });
  });

  describe('AST traversal', () => {
    it('should traverse all nodes in the AST', async () => {
      const visitedNodes: Node[] = [];
      
      const trackingMatcher: PatternMatcher = {
        patternType: 'counter',
        match: (node: Node) => {
          visitedNodes.push(node);
          return [];
        },
        getConfidence: () => 0.8
      };

      engine.registerMatcher(trackingMatcher);
      
      const code = `
        function test() {
          const x = 1;
          return x + 1;
        }
      `;
      const parseResult = await astParser.parseCode(code);
      
      engine.recognizePatterns(parseResult.ast, code);
      
      // Should visit multiple nodes (function, variable declaration, return statement, etc.)
      expect(visitedNodes.length).toBeGreaterThan(5);
      
      // Should include different node types
      const nodeTypes = visitedNodes.map(node => node.type);
      expect(nodeTypes).toContain('FunctionDeclaration');
      expect(nodeTypes).toContain('VariableDeclarator');
    });

    it('should provide correct traversal context', async () => {
      let capturedContext: TraversalContext | null = null;
      
      const contextMatcher: PatternMatcher = {
        patternType: 'counter',
        match: (node: Node, context: TraversalContext) => {
          if (t.isVariableDeclarator(node)) {
            capturedContext = context;
          }
          return [];
        },
        getConfidence: () => 0.8
      };

      engine.registerMatcher(contextMatcher);
      
      const code = `
        function outer() {
          const x = 1;
        }
      `;
      const parseResult = await astParser.parseCode(code);
      
      engine.recognizePatterns(parseResult.ast, code);
      
      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.depth).toBeGreaterThan(0);
      expect(capturedContext!.ancestors.length).toBeGreaterThan(0);
      expect(capturedContext!.sourceCode).toBe(code);
    });
  });

  describe('scope tracking', () => {
    it('should track variable declarations in scope', async () => {
      let capturedContext: TraversalContext | null = null;
      
      const scopeMatcher: PatternMatcher = {
        patternType: 'counter',
        match: (node: Node, context: TraversalContext) => {
          if (t.isReturnStatement(node)) {
            capturedContext = context;
          }
          return [];
        },
        getConfidence: () => 0.8
      };

      engine.registerMatcher(scopeMatcher);
      
      const code = `
        function test() {
          const x = 1;
          const y = 2;
          return x + y;
        }
      `;
      const parseResult = await astParser.parseCode(code);
      
      engine.recognizePatterns(parseResult.ast, code);
      
      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.scope.has('x')).toBe(true);
      expect(capturedContext!.scope.has('y')).toBe(true);
    });

    it('should track function declarations in scope', async () => {
      let capturedContext: TraversalContext | null = null;
      
      const functionMatcher: PatternMatcher = {
        patternType: 'counter',
        match: (node: Node, context: TraversalContext) => {
          if (t.isCallExpression(node)) {
            capturedContext = context;
          }
          return [];
        },
        getConfidence: () => 0.8
      };

      engine.registerMatcher(functionMatcher);
      
      const code = `
        function helper() {
          return 1;
        }
        
        function main() {
          return helper();
        }
      `;
      const parseResult = await astParser.parseCode(code);
      
      engine.recognizePatterns(parseResult.ast, code);
      
      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.functions.has('helper')).toBe(true);
      expect(capturedContext!.functions.has('main')).toBe(true);
    });
  });

  describe('counter pattern integration', () => {
    it('should recognize counter patterns with built-in matcher', async () => {
      const code = `
        function Counter() {
          const [count, setCount] = useState(0);
          
          const handleClick = () => {
            setCount(count + 1);
          };
          
          return (
            <button onClick={handleClick}>
              Count: {count}
            </button>
          );
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe('counter');
      expect(patterns[0].metadata.confidence).toBeGreaterThan(0.6);
      expect(patterns[0].metadata.variables).toContain('count');
      expect(patterns[0].metadata.variables).toContain('setCount');
    });

    it('should not recognize incomplete counter patterns', async () => {
      const code = `
        function Component() {
          const [count, setCount] = useState(0);
          
          return (
            <div>Count: {count}</div>
          );
        }
      `;

      const parseResult = await astParser.parseCode(code);
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      
      expect(patterns).toHaveLength(0); // No onClick, so no counter pattern
    });
  });

  describe('pattern conversion', () => {
    it('should generate unique IDs for patterns', async () => {
      const mockMatch1: PatternMatch = {
        type: 'counter',
        rootNode: t.variableDeclarator(t.identifier('test1'), t.numericLiteral(1)),
        involvedNodes: [t.variableDeclarator(t.identifier('test1'), t.numericLiteral(1))],
        variables: ['test1'],
        functions: [],
        metadata: {}
      };

      const mockMatch2: PatternMatch = {
        type: 'counter',
        rootNode: t.variableDeclarator(t.identifier('test2'), t.numericLiteral(2)),
        involvedNodes: [t.variableDeclarator(t.identifier('test2'), t.numericLiteral(2))],
        variables: ['test2'],
        functions: [],
        metadata: {}
      };

      mockMatcher.setMockMatches([mockMatch1, mockMatch2]);
      engine.registerMatcher(mockMatcher);
      
      const code = 'const test1 = 1; const test2 = 2;';
      const parseResult = await astParser.parseCode(code);
      
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      
      expect(patterns).toHaveLength(2);
      expect(patterns[0].id).not.toBe(patterns[1].id);
      expect(patterns[0].id).toMatch(/^pattern-counter-\d+$/);
      expect(patterns[1].id).toMatch(/^pattern-counter-\d+$/);
    });

    it('should calculate complexity correctly', async () => {
      // Simple pattern (few nodes, variables, functions)
      const simpleMatch: PatternMatch = {
        type: 'counter',
        rootNode: t.variableDeclarator(t.identifier('x'), t.numericLiteral(1)),
        involvedNodes: [t.variableDeclarator(t.identifier('x'), t.numericLiteral(1))],
        variables: ['x'],
        functions: [],
        metadata: {}
      };

      // Test simple pattern
      mockMatcher.setMockMatches([simpleMatch]);
      engine.registerMatcher(mockMatcher);
      
      let patterns = engine.recognizePatterns(t.program([]), '');
      expect(patterns[0].metadata.complexity).toBe('simple');

      // Test complex pattern with a new engine instance to avoid interference
      const complexEngine = new PatternRecognitionEngine();
      const complexMatch: PatternMatch = {
        type: 'api-call',
        rootNode: t.functionDeclaration(t.identifier('complex'), [], t.blockStatement([])),
        involvedNodes: new Array(10).fill(t.identifier('node')),
        variables: ['a', 'b', 'c', 'd', 'e'],
        functions: ['func1', 'func2', 'func3'],
        metadata: {}
      };

      const apiMatcher = new MockPatternMatcher();
      (apiMatcher as any).patternType = 'api-call';
      apiMatcher.setMockMatches([complexMatch]); // This will set shouldMatch to true
      complexEngine.registerMatcher(apiMatcher);
      
      const complexPatterns = complexEngine.recognizePatterns(t.program([]), '');
      expect(complexPatterns).toHaveLength(1);
      expect(complexPatterns[0].metadata.complexity).toBe('complex');
    });
  });

  describe('error handling', () => {
    it('should handle conversion errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create a match with invalid data that will cause conversion to fail
      const invalidMatch: PatternMatch = {
        type: 'counter',
        rootNode: null as any, // Invalid node
        involvedNodes: [],
        variables: [],
        functions: [],
        metadata: {}
      };

      mockMatcher.setMockMatches([invalidMatch]);
      engine.registerMatcher(mockMatcher);
      
      const code = 'const test = 1;';
      const parseResult = await astParser.parseCode(code);
      
      const patterns = engine.recognizePatterns(parseResult.ast, code);
      
      expect(patterns).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to convert match to pattern:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});