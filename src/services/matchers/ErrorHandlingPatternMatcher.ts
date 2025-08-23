import type { Node } from '@babel/types';
import * as t from '@babel/types';
import type { 
  PatternMatcher, 
  TraversalContext, 
  PatternMatch 
} from '../PatternRecognitionEngine';
import type { RecognizedPattern } from '../../types';

/**
 * Pattern matcher for error handling patterns (try-catch blocks, error boundaries, etc.)
 */
export class ErrorHandlingPatternMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'error-handling';

  /**
   * Match error handling patterns in the given AST node
   * @param node - Current AST node
   * @param context - Traversal context
   * @returns Array of pattern matches
   */
  match(node: Node, context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Look for try-catch statements
    const tryCatchMatch = this.findTryCatchPattern(node, context);
    if (tryCatchMatch) {
      matches.push(tryCatchMatch);
    }

    // Look for React error boundaries
    const errorBoundaryMatch = this.findErrorBoundaryPattern(node, context);
    if (errorBoundaryMatch) {
      matches.push(errorBoundaryMatch);
    }

    // Look for promise rejection handling
    const promiseRejectionMatch = this.findPromiseRejectionPattern(node, context);
    if (promiseRejectionMatch) {
      matches.push(promiseRejectionMatch);
    }

    return matches;
  }

  /**
   * Get confidence score for an error handling pattern match
   * @param match - Pattern match to evaluate
   * @returns Confidence score (0-1)
   */
  getConfidence(match: PatternMatch): number {
    let confidence = 0.4; // Base confidence

    // Higher confidence if we found a clear try-catch block
    if (match.metadata.hasTryCatch) {
      confidence += 0.3;
    }

    // Higher confidence if we found error handling logic
    if (match.metadata.hasErrorHandling) {
      confidence += 0.2;
    }

    // Higher confidence if we found specific error types
    if (match.metadata.errorTypes && match.metadata.errorTypes.length > 0) {
      confidence += 0.1;
    }

    // Higher confidence if we found error recovery logic
    if (match.metadata.hasErrorRecovery) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Find try-catch error handling patterns
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findTryCatchPattern(node: Node, context: TraversalContext): PatternMatch | null {
    if (!t.isTryStatement(node)) {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasTryCatch: true,
      hasErrorHandling: true,
      hasErrorRecovery: false,
      errorTypes: [],
      errorVariables: [],
      recoveryActions: []
    };

    // Analyze the try block
    if (node.block) {
      const tryBlockInfo = this.analyzeTryBlock(node.block);
      metadata.tryBlockOperations = tryBlockInfo.operations;
      metadata.riskyOperations = tryBlockInfo.riskyOperations;
      involvedNodes.push(node.block);
    }

    // Analyze the catch block
    if (node.handler) {
      const catchBlockInfo = this.analyzeCatchBlock(node.handler);
      metadata.hasErrorHandling = true;
      metadata.errorTypes.push(...catchBlockInfo.errorTypes);
      metadata.errorVariables.push(...catchBlockInfo.errorVariables);
      metadata.recoveryActions.push(...catchBlockInfo.recoveryActions);
      
      if (catchBlockInfo.hasRecovery) {
        metadata.hasErrorRecovery = true;
      }
      
      variables.push(...catchBlockInfo.variables);
      functions.push(...catchBlockInfo.functions);
      involvedNodes.push(node.handler);
    }

    // Analyze the finally block
    if (node.finalizer) {
      const finallyBlockInfo = this.analyzeFinallyBlock(node.finalizer);
      metadata.hasFinally = true;
      metadata.cleanupActions = finallyBlockInfo.cleanupActions;
      involvedNodes.push(node.finalizer);
    }

    return {
      type: 'error-handling',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find React error boundary patterns
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findErrorBoundaryPattern(node: Node, _context: TraversalContext): PatternMatch | null {
    // Look for class components with componentDidCatch or getDerivedStateFromError
    if (!t.isClassDeclaration(node)) {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      isErrorBoundary: false,
      hasComponentDidCatch: false,
      hasGetDerivedStateFromError: false,
      hasErrorHandling: false,
      errorTypes: ['component-error', 'render-error'],
      recoveryActions: []
    };

    // Check for error boundary methods
    if (node.body && t.isClassBody(node.body)) {
      node.body.body.forEach(member => {
        if (t.isMethodDefinition(member) && t.isIdentifier(member.key)) {
          const methodName = member.key.name;
          
          if (methodName === 'componentDidCatch') {
            metadata.isErrorBoundary = true;
            metadata.hasComponentDidCatch = true;
            metadata.hasErrorHandling = true;
            functions.push(methodName);
            involvedNodes.push(member);
          } else if (methodName === 'getDerivedStateFromError') {
            metadata.isErrorBoundary = true;
            metadata.hasGetDerivedStateFromError = true;
            metadata.hasErrorHandling = true;
            functions.push(methodName);
            involvedNodes.push(member);
          }
        }
      });
    }

    // Only return a match if we found error boundary methods
    if (!metadata.isErrorBoundary) {
      return null;
    }

    return {
      type: 'error-handling',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find promise rejection handling patterns
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findPromiseRejectionPattern(node: Node, _context: TraversalContext): PatternMatch | null {
    // Look for unhandledRejection event listeners or process.on('unhandledRejection')
    if (!t.isCallExpression(node)) {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      isPromiseRejectionHandler: false,
      hasErrorHandling: false,
      errorTypes: ['unhandled-promise-rejection'],
      handlerType: null
    };

    // Check for process.on('unhandledRejection', handler)
    if (t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object) &&
        node.callee.object.name === 'process' &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'on' &&
        node.arguments.length >= 2) {
      
      const firstArg = node.arguments[0];
      if (t.isStringLiteral(firstArg) && firstArg.value === 'unhandledRejection') {
        metadata.isPromiseRejectionHandler = true;
        metadata.hasErrorHandling = true;
        metadata.handlerType = 'process-unhandled-rejection';
        
        const handler = node.arguments[1];
        if (t.isIdentifier(handler)) {
          functions.push(handler.name);
        }
      }
    }

    // Check for window.addEventListener('unhandledrejection', handler)
    if (t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.object) &&
        node.callee.object.name === 'window' &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'addEventListener' &&
        node.arguments.length >= 2) {
      
      const firstArg = node.arguments[0];
      if (t.isStringLiteral(firstArg) && firstArg.value === 'unhandledrejection') {
        metadata.isPromiseRejectionHandler = true;
        metadata.hasErrorHandling = true;
        metadata.handlerType = 'window-unhandled-rejection';
        
        const handler = node.arguments[1];
        if (t.isIdentifier(handler)) {
          functions.push(handler.name);
        }
      }
    }

    // Only return a match if we found promise rejection handling
    if (!metadata.isPromiseRejectionHandler) {
      return null;
    }

    return {
      type: 'error-handling',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Analyze try block to identify operations and risks
   * @param tryBlock - Try block statement
   * @returns Analysis results
   */
  private analyzeTryBlock(tryBlock: t.BlockStatement): {
    operations: string[];
    riskyOperations: string[];
  } {
    const operations: string[] = [];
    const riskyOperations: string[] = [];

    const analyzeNode = (node: Node) => {
      // Look for risky operations
      if (t.isCallExpression(node)) {
        if (t.isIdentifier(node.callee)) {
          const functionName = node.callee.name;
          operations.push(functionName);
          
          // Common risky operations
          if (['fetch', 'axios', 'JSON.parse', 'parseInt', 'parseFloat'].includes(functionName)) {
            riskyOperations.push(functionName);
          }
        } else if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
          const methodName = node.callee.property.name;
          operations.push(methodName);
          
          // Common risky methods
          if (['json', 'text', 'parse', 'querySelector', 'getElementById'].includes(methodName)) {
            riskyOperations.push(methodName);
          }
        }
      }

      // Recursively analyze child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              analyzeNode(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          analyzeNode(value);
        }
      });
    };

    tryBlock.body.forEach(analyzeNode);

    return { operations, riskyOperations };
  }

  /**
   * Analyze catch block to identify error handling patterns
   * @param catchClause - Catch clause
   * @returns Analysis results
   */
  private analyzeCatchBlock(catchClause: t.CatchClause): {
    errorTypes: string[];
    errorVariables: string[];
    recoveryActions: string[];
    hasRecovery: boolean;
    variables: string[];
    functions: string[];
  } {
    const errorTypes: string[] = [];
    const errorVariables: string[] = [];
    const recoveryActions: string[] = [];
    const variables: string[] = [];
    const functions: string[] = [];
    let hasRecovery = false;

    // Extract error parameter
    if (catchClause.param && t.isIdentifier(catchClause.param)) {
      errorVariables.push(catchClause.param.name);
      variables.push(catchClause.param.name);
    }

    // Analyze catch block body
    const analyzeNode = (node: Node) => {
      // Look for error type checks
      if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
        const property = node.property.name;
        if (property === 'name' || property === 'message' || property === 'code') {
          errorTypes.push(`error-${property}`);
        }
      }

      // Look for recovery actions
      if (t.isCallExpression(node)) {
        if (t.isIdentifier(node.callee)) {
          const functionName = node.callee.name;
          
          // Common recovery actions
          if (['retry', 'fallback', 'redirect', 'reload', 'reset'].some(action => 
              functionName.toLowerCase().includes(action))) {
            recoveryActions.push(functionName);
            hasRecovery = true;
          }
          
          functions.push(functionName);
        } else if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
          const methodName = node.callee.property.name;
          
          // Common recovery methods
          if (['log', 'warn', 'error', 'alert', 'notify'].includes(methodName)) {
            recoveryActions.push(methodName);
          }
          
          functions.push(methodName);
        }
      }

      // Look for console logging
      if (t.isMemberExpression(node) && 
          t.isIdentifier(node.object) && 
          node.object.name === 'console') {
        recoveryActions.push('console-log');
      }

      // Recursively analyze child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              analyzeNode(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          analyzeNode(value);
        }
      });
    };

    catchClause.body.body.forEach(analyzeNode);

    return {
      errorTypes,
      errorVariables,
      recoveryActions,
      hasRecovery,
      variables,
      functions
    };
  }

  /**
   * Analyze finally block to identify cleanup actions
   * @param finallyBlock - Finally block statement
   * @returns Analysis results
   */
  private analyzeFinallyBlock(finallyBlock: t.BlockStatement): {
    cleanupActions: string[];
  } {
    const cleanupActions: string[] = [];

    const analyzeNode = (node: Node) => {
      // Look for cleanup operations
      if (t.isCallExpression(node)) {
        if (t.isIdentifier(node.callee)) {
          const functionName = node.callee.name;
          
          // Common cleanup actions
          if (['close', 'cleanup', 'dispose', 'clear', 'reset', 'destroy'].some(action => 
              functionName.toLowerCase().includes(action))) {
            cleanupActions.push(functionName);
          }
        } else if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
          const methodName = node.callee.property.name;
          
          // Common cleanup methods
          if (['close', 'end', 'disconnect', 'abort', 'cancel'].includes(methodName)) {
            cleanupActions.push(methodName);
          }
        }
      }

      // Recursively analyze child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              analyzeNode(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          analyzeNode(value);
        }
      });
    };

    finallyBlock.body.forEach(analyzeNode);

    return { cleanupActions };
  }
}