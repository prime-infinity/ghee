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
import { DatabasePatternMatcher } from './matchers/DatabasePatternMatcher';
import { ErrorHandlingPatternMatcher } from './matchers/ErrorHandlingPatternMatcher';

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
    this.registerMatcher(new DatabasePatternMatcher());
    this.registerMatcher(new ErrorHandlingPatternMatcher());
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
      const properties = this.extractNodeProperties(node, match);
      
      // Enhance properties for API call patterns to identify success/error handlers
      if (match.type === 'api-call') {
        this.enhanceApiCallNodeProperties(properties, node, match, label);
      }
      
      nodes.push({
        id: `node-${match.type}-${index}`,
        type: nodeType,
        label,
        codeLocation,
        properties
      });
    });

    // Add implicit nodes for API call patterns if needed
    if (match.type === 'api-call') {
      this.addImplicitApiCallNodes(nodes, match);
    }

    return nodes;
  }

  /**
   * Enhance node properties for API call patterns
   * @param properties - Node properties to enhance
   * @param node - AST node
   * @param match - Pattern match
   * @param label - Node label
   */
  private enhanceApiCallNodeProperties(
    properties: Record<string, any>, 
    node: Node, 
    match: PatternMatch, 
    label: string
  ): void {
    // Mark success handlers
    if (match.metadata.successHandlers?.includes(label) || 
        label.toLowerCase().includes('then') || 
        label.toLowerCase().includes('success')) {
      properties.isSuccessHandler = true;
      properties.handlerType = 'success';
    }
    
    // Mark error handlers
    if (match.metadata.errorHandlers?.includes(label) || 
        label.toLowerCase().includes('catch') || 
        label.toLowerCase().includes('error')) {
      properties.isErrorHandler = true;
      properties.handlerType = 'error';
      properties.errorTypes = match.metadata.errorTypes || ['network', 'server'];
    }
    
    // Mark API call nodes
    if (label.toLowerCase().includes('fetch') || 
        label.toLowerCase().includes('axios') || 
        label.toLowerCase().includes('api')) {
      properties.isApiCall = true;
      properties.endpoint = match.metadata.endpoint;
      properties.httpMethod = match.metadata.httpMethod;
    }
  }

  /**
   * Add implicit nodes for API call patterns if they're missing
   * @param nodes - Current nodes array
   * @param match - Pattern match
   */
  private addImplicitApiCallNodes(nodes: PatternNode[], match: PatternMatch): void {
    let nodeIndex = nodes.length;
    
    // Add user node if not present but we have an API call
    const hasUserNode = nodes.some(n => n.type === 'user');
    const hasApiNode = nodes.some(n => n.type === 'api' || n.properties.isApiCall);
    
    if (!hasUserNode && hasApiNode) {
      const defaultLocation = {
        start: 0,
        end: 0,
        startLine: 1,
        endLine: 1,
        startColumn: 0,
        endColumn: 0
      };
      
      nodes.unshift({
        id: `node-${match.type}-user`,
        type: 'user',
        label: 'User',
        codeLocation: match.metadata.codeLocation || defaultLocation,
        properties: {
          isImplicit: true,
          description: 'User initiating the request'
        }
      });
    }
    
    // Add success handler node if we have success handling but no success node
    if (match.metadata.hasSuccessHandling && !nodes.some(n => n.properties.isSuccessHandler)) {
      const defaultLocation = {
        start: 0,
        end: 0,
        startLine: 1,
        endLine: 1,
        startColumn: 0,
        endColumn: 0
      };
      
      nodes.push({
        id: `node-${match.type}-success-${nodeIndex++}`,
        type: 'component',
        label: 'Success Handler',
        codeLocation: match.metadata.codeLocation || defaultLocation,
        properties: {
          isSuccessHandler: true,
          handlerType: 'success',
          isImplicit: true,
          responseTypes: match.metadata.successResponseTypes || ['json']
        }
      });
    }
    
    // Add error handler node if we have error handling but no error node
    if (match.metadata.hasErrorHandling && !nodes.some(n => n.properties.isErrorHandler)) {
      const defaultLocation = {
        start: 0,
        end: 0,
        startLine: 1,
        endLine: 1,
        startColumn: 0,
        endColumn: 0
      };
      
      nodes.push({
        id: `node-${match.type}-error-${nodeIndex++}`,
        type: 'error',
        label: 'Error Handler',
        codeLocation: match.metadata.codeLocation || defaultLocation,
        properties: {
          isErrorHandler: true,
          handlerType: 'error',
          isImplicit: true,
          errorTypes: match.metadata.errorTypes || ['network', 'server', 'timeout']
        }
      });
    }
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
    
    // Use pattern-specific connection generation if available
    if (match.type === 'api-call') {
      return this.generateApiCallConnections(match, nodes);
    } else if (match.type === 'counter') {
      return this.generateCounterConnections(match, nodes);
    } else if (match.type === 'database') {
      return this.generateDatabaseConnections(match, nodes);
    } else if (match.type === 'error-handling') {
      return this.generateErrorHandlingConnections(match, nodes);
    }
    
    // Basic sequential connections for other patterns
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
   * Generate connections for API call patterns with error and success paths
   * @param match - The API call pattern match
   * @param nodes - Generated pattern nodes
   * @returns Array of pattern connections
   */
  private generateApiCallConnections(
    match: PatternMatch, 
    nodes: PatternNode[]
  ): PatternConnection[] {
    const connections: PatternConnection[] = [];
    
    if (nodes.length < 2) return connections;
    
    // Find different types of nodes
    const userNode = nodes.find(n => n.type === 'user' || n.label.toLowerCase().includes('user'));
    const apiNode = nodes.find(n => n.type === 'api' || n.label.toLowerCase().includes('api') || n.label.toLowerCase().includes('fetch'));
    const successNodes = nodes.filter(n => 
      n.properties.isSuccessHandler || 
      match.metadata.successHandlers?.includes(n.label) ||
      n.label.toLowerCase().includes('success') ||
      n.label.toLowerCase().includes('then')
    );
    const errorNodes = nodes.filter(n => 
      n.properties.isErrorHandler || 
      match.metadata.errorHandlers?.includes(n.label) ||
      n.label.toLowerCase().includes('error') ||
      n.label.toLowerCase().includes('catch')
    );
    
    let connectionIndex = 0;
    
    // User to API connection (if user node exists)
    if (userNode && apiNode) {
      connections.push({
        id: `connection-${match.type}-${connectionIndex++}`,
        sourceId: userNode.id,
        targetId: apiNode.id,
        type: 'event',
        label: `${match.metadata.httpMethod || 'GET'} request`,
        properties: {
          httpMethod: match.metadata.httpMethod || 'GET',
          endpoint: match.metadata.endpoint || 'API endpoint'
        }
      });
    }
    
    // API to success handler connections
    if (apiNode && successNodes.length > 0 && match.metadata.hasSuccessHandling) {
      successNodes.forEach(successNode => {
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: apiNode.id,
          targetId: successNode.id,
          type: 'success-path',
          label: 'success response',
          properties: {
            responseType: 'success',
            statusCodes: '200-299',
            responseTypes: match.metadata.successResponseTypes || ['json']
          }
        });
      });
    }
    
    // API to error handler connections
    if (apiNode && errorNodes.length > 0 && match.metadata.hasErrorHandling) {
      errorNodes.forEach(errorNode => {
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: apiNode.id,
          targetId: errorNode.id,
          type: 'error-path',
          label: 'error response',
          properties: {
            responseType: 'error',
            statusCodes: '400-599',
            errorTypes: match.metadata.errorTypes || ['network', 'server', 'timeout']
          }
        });
      });
    }
    
    // If no specific success/error nodes, create basic flow
    if (connections.length === 0 && nodes.length >= 2) {
      for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: nodes[i].id,
          targetId: nodes[i + 1].id,
          type: 'data-flow',
          label: 'processes',
          properties: {}
        });
      }
    }
    
    return connections;
  }

  /**
   * Generate connections for counter patterns
   * @param match - The counter pattern match
   * @param nodes - Generated pattern nodes
   * @returns Array of pattern connections
   */
  private generateCounterConnections(
    match: PatternMatch, 
    nodes: PatternNode[]
  ): PatternConnection[] {
    const connections: PatternConnection[] = [];
    
    if (nodes.length < 2) return connections;
    
    // Find button and counter nodes
    const buttonNode = nodes.find(n => n.type === 'button' || n.label.toLowerCase().includes('button') || n.label.toLowerCase().includes('click'));
    const counterNode = nodes.find(n => n.type === 'counter' || n.label.toLowerCase().includes('count') || n.label.toLowerCase().includes('num'));
    
    let connectionIndex = 0;
    
    // Button to counter connection
    if (buttonNode && counterNode) {
      connections.push({
        id: `connection-${match.type}-${connectionIndex++}`,
        sourceId: buttonNode.id,
        targetId: counterNode.id,
        type: 'event',
        label: 'click updates',
        properties: {
          eventType: 'click',
          operation: match.metadata.hasIncrementOperation ? 'increment' : 'update'
        }
      });
    } else {
      // Basic sequential connections
      for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: nodes[i].id,
          targetId: nodes[i + 1].id,
          type: 'control-flow',
          label: 'updates',
          properties: {}
        });
      }
    }
    
    return connections;
  }

  /**
   * Generate connections for database patterns
   * @param match - The database pattern match
   * @param nodes - Generated pattern nodes
   * @returns Array of pattern connections
   */
  private generateDatabaseConnections(
    match: PatternMatch, 
    nodes: PatternNode[]
  ): PatternConnection[] {
    const connections: PatternConnection[] = [];
    
    if (nodes.length < 2) return connections;
    
    // Find database and related nodes
    const dbNode = nodes.find(n => n.type === 'database' || n.label.toLowerCase().includes('db') || n.label.toLowerCase().includes('database'));
    const otherNodes = nodes.filter(n => n !== dbNode);
    
    let connectionIndex = 0;
    
    if (dbNode && otherNodes.length > 0) {
      otherNodes.forEach(node => {
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: node.id,
          targetId: dbNode.id,
          type: 'data-flow',
          label: match.metadata.operationType || 'query',
          properties: {
            operationType: match.metadata.operationType,
            tables: match.metadata.tables
          }
        });
      });
    } else {
      // Basic sequential connections
      for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: nodes[i].id,
          targetId: nodes[i + 1].id,
          type: 'data-flow',
          label: 'processes',
          properties: {}
        });
      }
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
    // Check for API call patterns first
    if (match.type === 'api-call') {
      return this.determineApiCallNodeType(node, match);
    }
    
    // Check for counter patterns
    if (match.type === 'counter') {
      return this.determineCounterNodeType(node, match);
    }
    
    // Check for database patterns
    if (match.type === 'database') {
      return this.determineDatabaseNodeType(node, match);
    }
    
    // Check for error handling patterns
    if (match.type === 'error-handling') {
      return this.determineErrorHandlingNodeType(node, match);
    }
    
    // Basic node type determination
    if (t.isFunctionDeclaration(node) || t.isArrowFunctionExpression(node)) {
      return 'function';
    }
    if (t.isVariableDeclarator(node)) {
      return 'variable';
    }
    return 'component'; // Default fallback
  }

  /**
   * Determine node type for API call patterns
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Pattern node type
   */
  private determineApiCallNodeType(node: Node, match: PatternMatch): PatternNode['type'] {
    const label = this.generateNodeLabel(node, match).toLowerCase();
    
    // Check for error handling patterns
    if (t.isTryStatement(node) || 
        label.includes('catch') || 
        label.includes('error') ||
        match.metadata.errorHandlers?.some((handler: string) => label.includes(handler.toLowerCase()))) {
      return 'error';
    }
    
    // Check for API call patterns
    if (t.isCallExpression(node) && 
        (label.includes('fetch') || label.includes('axios') || label.includes('api'))) {
      return 'api';
    }
    
    // Check for success handlers
    if (label.includes('then') || 
        label.includes('success') ||
        match.metadata.successHandlers?.some((handler: string) => label.includes(handler.toLowerCase()))) {
      return 'component';
    }
    
    // Default for API patterns
    return 'api';
  }

  /**
   * Determine node type for counter patterns
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Pattern node type
   */
  private determineCounterNodeType(node: Node, match: PatternMatch): PatternNode['type'] {
    const label = this.generateNodeLabel(node, match).toLowerCase();
    
    // Check for button/click patterns
    if (label.includes('click') || label.includes('button') || label.includes('handle')) {
      return 'button';
    }
    
    // Check for counter state
    if (label.includes('count') || label.includes('num') || label.includes('value')) {
      return 'counter';
    }
    
    // Default for counter patterns
    return t.isVariableDeclarator(node) ? 'counter' : 'button';
  }

  /**
   * Determine node type for database patterns
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Pattern node type
   */
  private determineDatabaseNodeType(node: Node, match: PatternMatch): PatternNode['type'] {
    const label = this.generateNodeLabel(node, match).toLowerCase();
    
    // Check for database operations
    if (label.includes('db') || label.includes('database') || 
        label.includes('query') || label.includes('select') ||
        label.includes('insert') || label.includes('update') || label.includes('delete')) {
      return 'database';
    }
    
    // Default for database patterns
    return 'database';
  }

  /**
   * Determine node type for error handling patterns
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Pattern node type
   */
  private determineErrorHandlingNodeType(node: Node, match: PatternMatch): PatternNode['type'] {
    const label = this.generateNodeLabel(node, match).toLowerCase();
    
    // Check for error/catch blocks
    if (t.isTryStatement(node) || t.isCatchClause(node) || 
        label.includes('catch') || label.includes('error')) {
      return 'error';
    }
    
    // Check for try blocks or risky operations
    if (label.includes('try') || match.metadata.riskyOperations?.length > 0) {
      return 'component';
    }
    
    // Check for finally blocks or cleanup
    if (label.includes('finally') || label.includes('cleanup')) {
      return 'component';
    }
    
    // Default for error handling patterns
    return 'error';
  }

  /**
   * Generate a human-readable label for a pattern node
   * @param node - AST node
   * @param match - Pattern match context
   * @returns Node label
   */
  private generateNodeLabel(node: Node, _match: PatternMatch): string {
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
  private getCodeLocation(node: Node, _sourceCode?: string): CodeLocation {
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

  /**
   * Generate connections for error handling patterns
   * @param match - The error handling pattern match
   * @param nodes - Generated pattern nodes
   * @returns Array of pattern connections
   */
  private generateErrorHandlingConnections(
    match: PatternMatch, 
    nodes: PatternNode[]
  ): PatternConnection[] {
    const connections: PatternConnection[] = [];
    
    if (nodes.length < 2) return connections;
    
    // Find different types of nodes
    const tryNode = nodes.find(n => n.label.toLowerCase().includes('try') || n.properties.isTryBlock);
    const catchNode = nodes.find(n => n.type === 'error' || n.label.toLowerCase().includes('catch') || n.label.toLowerCase().includes('error'));
    const finallyNode = nodes.find(n => n.label.toLowerCase().includes('finally') || n.properties.isFinallyBlock);
    const operationNodes = nodes.filter(n => n !== tryNode && n !== catchNode && n !== finallyNode);
    
    let connectionIndex = 0;
    
    // Operation to try block connection
    if (operationNodes.length > 0 && tryNode) {
      operationNodes.forEach(opNode => {
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: opNode.id,
          targetId: tryNode.id,
          type: 'control-flow',
          label: 'executes in',
          properties: {
            riskLevel: match.metadata.riskyOperations?.length > 0 ? 'high' : 'medium'
          }
        });
      });
    }
    
    // Try to catch connection (error path)
    if (tryNode && catchNode) {
      connections.push({
        id: `connection-${match.type}-${connectionIndex++}`,
        sourceId: tryNode.id,
        targetId: catchNode.id,
        type: 'error-path',
        label: 'on error',
        properties: {
          errorTypes: match.metadata.errorTypes || ['exception'],
          recoveryActions: match.metadata.recoveryActions || []
        }
      });
    }
    
    // Try to finally connection (always executes)
    if (tryNode && finallyNode) {
      connections.push({
        id: `connection-${match.type}-${connectionIndex++}`,
        sourceId: tryNode.id,
        targetId: finallyNode.id,
        type: 'control-flow',
        label: 'always executes',
        properties: {
          executionType: 'always',
          cleanupActions: match.metadata.cleanupActions || []
        }
      });
    }
    
    // Catch to finally connection
    if (catchNode && finallyNode) {
      connections.push({
        id: `connection-${match.type}-${connectionIndex++}`,
        sourceId: catchNode.id,
        targetId: finallyNode.id,
        type: 'control-flow',
        label: 'then cleanup',
        properties: {
          executionType: 'after-error',
          cleanupActions: match.metadata.cleanupActions || []
        }
      });
    }
    
    // If no specific structure, create basic error flow
    if (connections.length === 0 && nodes.length >= 2) {
      for (let i = 0; i < nodes.length - 1; i++) {
        const connectionType = nodes[i + 1].type === 'error' ? 'error-path' : 'control-flow';
        connections.push({
          id: `connection-${match.type}-${connectionIndex++}`,
          sourceId: nodes[i].id,
          targetId: nodes[i + 1].id,
          type: connectionType,
          label: connectionType === 'error-path' ? 'on error' : 'flows to',
          properties: {}
        });
      }
    }
    
    return connections;
  }
}