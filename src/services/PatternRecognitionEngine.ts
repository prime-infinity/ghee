import type { Node } from '@babel/types';
import * as t from '@babel/types';
import type { 
  RecognizedPattern, 
  PatternNode, 
  PatternConnection, 
  PatternMetadata,
  CodeLocation 
} from '../types';
import { CounterPatternMatcher } from './matchers/CounterPatternMatcher';
import { ApiCallPatternMatcher } from './matchers/ApiCallPatternMatcher';

/**
 * Base interface for pattern matchers
 */
export interface PatternMatcher {
  /** Pattern type this matcher handles */
  readonly patternType: RecognizedPattern['type'];
  
  /** Match patterns in the given AST node */
  match(node: Node, context: TraversalContext): PatternMatch[];
  
  /** Get confidence score for a potential match */
  getConfidence(match: PatternMatch): number;
}

/**
 * Context information during AST traversal
 */
export interface TraversalContext {
  /** Current depth in the AST */
  depth: number;
  /** Parent nodes in the traversal path */
  ancestors: Node[];
  /** Variables in current scope */
  scope: Map<string, Node>;
  /** Functions in current scope */
  functions: Map<string, Node>;
  /** Source code for reference */
  sourceCode: string;
}

/**
 * A potential pattern match found during traversal
 */
export interface PatternMatch {
  /** Type of pattern matched */
  type: RecognizedPattern['type'];
  /** Root AST node of the match */
  rootNode: Node;
  /** All nodes involved in the pattern */
  involvedNodes: Node[];
  /** Extracted variables */
  variables: string[];
  /** Extracted functions */
  functions: string[];
  /** Additional match-specific data */
  metadata: Record<string, any>;
}

/**
 * Engine for recognizing code patterns in Abstract Syntax Trees
 */
export class PatternRecognitionEngine {
  private readonly matchers: Map<RecognizedPattern['type'], PatternMatcher> = new Map();
  private readonly confidenceThreshold = 0.6; // Minimum confidence to consider a pattern valid

  constructor() {
    // Register built-in pattern matchers
    this.registerMatcher(new CounterPatternMatcher());
    this.registerMatcher(new ApiCallPatternMatcher());
  }

  /**
   * Register a pattern matcher with the engine
   * @param matcher - The pattern matcher to register
   */
  registerMatcher(matcher: PatternMatcher): void {
    this.matchers.set(matcher.patternType, matcher);
  }

  /**
   * Recognize patterns in the given AST
   * @param ast - The Abstract Syntax Tree to analyze
   * @param sourceCode - Original source code for reference
   * @returns Array of recognized patterns
   */
  recognizePatterns(ast: Node, sourceCode: string = ''): RecognizedPattern[] {
    const patterns: RecognizedPattern[] = [];
    const context: TraversalContext = {
      depth: 0,
      ancestors: [],
      scope: new Map(),
      functions: new Map(),
      sourceCode
    };

    // Traverse the AST and collect potential matches
    const allMatches = this.traverseAndMatch(ast, context);
    
    // Filter matches by confidence and convert to recognized patterns
    const validMatches = allMatches.filter(match => {
      const matcher = this.matchers.get(match.type);
      return matcher && matcher.getConfidence(match) >= this.confidenceThreshold;
    });

    // Convert matches to recognized patterns
    validMatches.forEach((match, index) => {
      const pattern = this.convertMatchToPattern(match, index, sourceCode);
      if (pattern) {
        patterns.push(pattern);
      }
    });

    return patterns;
  }

  /**
   * Traverse AST and collect pattern matches
   * @param node - Current AST node
   * @param context - Traversal context
   * @returns Array of pattern matches
   */
  private traverseAndMatch(node: Node, context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Update context for current node
    const newContext: TraversalContext = {
      ...context,
      depth: context.depth + 1,
      ancestors: [...context.ancestors, node]
    };

    // Update scope information
    this.updateScope(node, newContext);

    // Try each registered matcher on the current node
    for (const matcher of this.matchers.values()) {
      try {
        const nodeMatches = matcher.match(node, newContext);
        matches.push(...nodeMatches);
      } catch (error) {
        // Log error but continue with other matchers
        console.warn(`Pattern matcher ${matcher.patternType} failed:`, error);
      }
    }

    // Recursively traverse child nodes
    this.getChildNodes(node).forEach(child => {
      const childMatches = this.traverseAndMatch(child, newContext);
      matches.push(...childMatches);
    });

    return matches;
  }

  /**
   * Update scope information based on current node
   * @param node - Current AST node
   * @param context - Traversal context to update
   */
  private updateScope(node: Node, context: TraversalContext): void {
    // Track variable declarations
    if (t.isVariableDeclarator(node) && t.isIdentifier(node.id)) {
      context.scope.set(node.id.name, node);
    }

    // Track function declarations
    if (t.isFunctionDeclaration(node) && node.id && t.isIdentifier(node.id)) {
      context.functions.set(node.id.name, node);
    }

    // Track arrow functions assigned to variables
    if (t.isVariableDeclarator(node) && 
        t.isIdentifier(node.id) && 
        t.isArrowFunctionExpression(node.init)) {
      context.functions.set(node.id.name, node);
    }
  }

  /**
   * Get child nodes for traversal
   * @param node - Parent AST node
   * @returns Array of child nodes
   */
  private getChildNodes(node: Node): Node[] {
    const children: Node[] = [];

    // Use Babel's visitor pattern to get child nodes
    Object.keys(node).forEach(key => {
      const value = (node as any)[key];
      
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object' && item.type) {
            children.push(item as Node);
          }
        });
      } else if (value && typeof value === 'object' && value.type) {
        children.push(value as Node);
      }
    });

    return children;
  }

  /**
   * Convert a pattern match to a recognized pattern
   * @param match - The pattern match to convert
   * @param index - Index for generating unique IDs
   * @param sourceCode - Original source code
   * @returns Recognized pattern or null if conversion fails
   */
  private convertMatchToPattern(
    match: PatternMatch, 
    index: number, 
    sourceCode: string
  ): RecognizedPattern | null {
    try {
      const matcher = this.matchers.get(match.type);
      if (!matcher) return null;

      const confidence = matcher.getConfidence(match);
      const codeLocation = this.getCodeLocation(match.rootNode, sourceCode);
      
      // Generate pattern nodes
      const nodes = this.generatePatternNodes(match);
      
      // Generate pattern connections
      const connections = this.generatePatternConnections(match, nodes);

      // Create pattern metadata, merging match metadata with standard fields
      const metadata: PatternMetadata = {
        confidence,
        codeLocation,
        variables: match.variables,
        functions: match.functions,
        complexity: this.calculateComplexity(match),
        context: this.extractContext(match, sourceCode),
        // Merge in all custom metadata from the match
        ...match.metadata
      };

      return {
        id: `pattern-${match.type}-${index}`,
        type: match.type,
        nodes,
        connections,
        metadata
      };
    } catch (error) {
      console.warn(`Failed to convert match to pattern:`, error);
      return null;
    }
  }

  /**
   * Generate pattern nodes from a match
   * @param match - The pattern match
   * @returns Array of pattern nodes
   */
  private generatePatternNodes(match: PatternMatch): PatternNode[] {
    const nodes: PatternNode[] = [];
    
    match.involvedNodes.forEach((node, index) => {
      const nodeType = this.determineNodeType(node, match);
      const label = this.generateNodeLabel(node, match);
      const codeLocation = this.getCodeLocation(node);
      
      nodes.push({
        id: `node-${match.type}-${index}`,
        type: nodeType,
        label,
        codeLocation,
        properties: this.extractNodeProperties(node, match)
      });
    });

    return nodes;
  }

  /**
   * Generate pattern connections from a match
   * @param match - The pattern match
   * @param nodes - Generated pattern nodes
   * @returns Array of pattern connections
   */
  private generatePatternConnections(
    match: PatternMatch, 
    nodes: PatternNode[]
  ): PatternConnection[] {
    const connections: PatternConnection[] = [];
    
    // Basic sequential connections for now
    // Specific matchers will override this logic
    for (let i = 0; i < nodes.length - 1; i++) {
      connections.push({
        id: `connection-${match.type}-${i}`,
        sourceId: nodes[i].id,
        targetId: nodes[i + 1].id,
        type: 'control-flow',
        label: 'flows to',
        properties: {}
      });
    }

    return connections;
  }

  /**
   * Determine the type of a pattern node based on AST node
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Pattern node type
   */
  private determineNodeType(node: Node, match: PatternMatch): PatternNode['type'] {
    // Basic node type determination - specific matchers will provide better logic
    if (t.isFunctionDeclaration(node) || t.isArrowFunctionExpression(node)) {
      return 'function';
    }
    if (t.isVariableDeclarator(node)) {
      return 'variable';
    }
    return 'component'; // Default fallback
  }

  /**
   * Generate a human-readable label for a pattern node
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Node label
   */
  private generateNodeLabel(node: Node, match: PatternMatch): string {
    if (t.isFunctionDeclaration(node) && node.id && t.isIdentifier(node.id)) {
      return node.id.name;
    }
    if (t.isVariableDeclarator(node) && t.isIdentifier(node.id)) {
      return node.id.name;
    }
    return node.type;
  }

  /**
   * Extract properties specific to a node
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Node properties
   */
  private extractNodeProperties(node: Node, match: PatternMatch): Record<string, any> {
    return {
      nodeType: node.type,
      ...match.metadata
    };
  }

  /**
   * Get code location information for an AST node
   * @param node - AST node
   * @param sourceCode - Original source code (optional)
   * @returns Code location
   */
  private getCodeLocation(node: Node, sourceCode?: string): CodeLocation {
    const loc = node.loc;
    const start = node.start || 0;
    const end = node.end || start;

    return {
      start,
      end,
      startLine: loc?.start.line || 1,
      endLine: loc?.end.line || 1,
      startColumn: loc?.start.column || 0,
      endColumn: loc?.end.column || 0
    };
  }

  /**
   * Calculate complexity level of a pattern match
   * @param match - Pattern match
   * @returns Complexity level
   */
  private calculateComplexity(match: PatternMatch): 'simple' | 'medium' | 'complex' {
    const nodeCount = match.involvedNodes.length;
    const variableCount = match.variables.length;
    const functionCount = match.functions.length;

    const complexityScore = nodeCount + variableCount * 2 + functionCount * 3;

    if (complexityScore <= 5) return 'simple';
    if (complexityScore <= 15) return 'medium';
    return 'complex';
  }

  /**
   * Extract contextual information about the pattern
   * @param match - Pattern match
   * @param sourceCode - Original source code
   * @returns Context string
   */
  private extractContext(match: PatternMatch, sourceCode: string): string {
    // Extract a snippet of code around the pattern for context
    if (!sourceCode || !match.rootNode.start || !match.rootNode.end) {
      return '';
    }

    const start = Math.max(0, match.rootNode.start - 50);
    const end = Math.min(sourceCode.length, match.rootNode.end + 50);
    
    return sourceCode.slice(start, end).trim();
  }

  /**
   * Get all registered pattern types
   * @returns Array of pattern types
   */
  getRegisteredPatternTypes(): RecognizedPattern['type'][] {
    return Array.from(this.matchers.keys());
  }

  /**
   * Get confidence threshold for pattern recognition
   * @returns Confidence threshold (0-1)
   */
  getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  /**
   * Set confidence threshold for pattern recognition
   * @param threshold - New threshold (0-1)
   */
  setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    (this as any).confidenceThreshold = threshold;
  }
}