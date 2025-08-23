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

    // Look for try-catch statements only
    const tryCatchMatch = this.findTryCatchPattern(node, context);
    if (tryCatchMatch) {
      matches.push(tryCatchMatch);
    }

    return matches;
  }

  /**
   * Get confidence score for an error handling pattern match
   * @param match - Pattern match to evaluate
   * @returns Confidence score (0-1)
   */
  getConfidence(match: PatternMatch): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence if we found a clear try-catch block
    if (match.metadata.hasTryCatch) {
      confidence += 0.4;
    }

    // Higher confidence if we found error handling logic
    if (match.metadata.hasErrorHandling) {
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
      errorTypes: ['exception'],
      errorVariables: []
    };

    // Analyze the try block
    if (node.block) {
      involvedNodes.push(node.block);
    }

    // Analyze the catch block
    if (node.handler) {
      metadata.hasErrorHandling = true;
      
      // Extract error parameter name
      if (node.handler.param && t.isIdentifier(node.handler.param)) {
        metadata.errorVariables.push(node.handler.param.name);
        variables.push(node.handler.param.name);
      }
      
      involvedNodes.push(node.handler);
    }

    // Analyze the finally block
    if (node.finalizer) {
      metadata.hasFinally = true;
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


}