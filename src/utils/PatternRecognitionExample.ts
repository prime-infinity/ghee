import type { Node } from '@babel/types';
import * as t from '@babel/types';
import { 
  PatternRecognitionEngine, 
  type PatternMatcher, 
  type TraversalContext, 
  type PatternMatch 
} from '../services';
import { ASTParserService } from '../services';
import type { RecognizedPattern } from '../types';

/**
 * Example pattern matcher that recognizes simple variable declarations
 * This demonstrates how to implement a concrete pattern matcher
 */
export class VariableDeclarationMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'component-lifecycle';

  match(node: Node, _context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Look for variable declarations
    if (t.isVariableDeclarator(node) && t.isIdentifier(node.id)) {
      const match: PatternMatch = {
        type: this.patternType,
        rootNode: node,
        involvedNodes: [node],
        variables: [node.id.name],
        functions: [],
        metadata: {
          variableName: node.id.name,
          hasInitializer: !!node.init,
          initializerType: node.init?.type || 'none'
        }
      };
      matches.push(match);
    }

    return matches;
  }

  getConfidence(match: PatternMatch): number {
    // Simple confidence calculation based on whether variable has initializer
    const hasInitializer = match.metadata.hasInitializer;
    return hasInitializer ? 0.8 : 0.6;
  }
}

/**
 * Example function that demonstrates how to use the Pattern Recognition Engine
 */
export async function demonstratePatternRecognition(): Promise<void> {
  // Create instances
  const parser = new ASTParserService();
  const engine = new PatternRecognitionEngine();
  
  // Register a pattern matcher
  const variableMatcher = new VariableDeclarationMatcher();
  engine.registerMatcher(variableMatcher);

  // Example code to analyze
  const sampleCode = `
    const userName = 'John';
    let userAge = 25;
    var isActive = true;
    
    function greetUser() {
      return 'Hello, ' + userName;
    }
  `;

  try {
    // Parse the code
    console.log('Parsing code...');
    const parseResult = await parser.parseCode(sampleCode);
    
    if (parseResult.errors.length > 0) {
      console.log('Parse errors:', parseResult.errors);
      return;
    }

    // Recognize patterns
    console.log('Recognizing patterns...');
    const patterns = engine.recognizePatterns(parseResult.ast, sampleCode);
    
    console.log(`Found ${patterns.length} patterns:`);
    
    patterns.forEach((pattern, index) => {
      console.log(`\nPattern ${index + 1}:`);
      console.log(`  Type: ${pattern.type}`);
      console.log(`  ID: ${pattern.id}`);
      console.log(`  Confidence: ${pattern.metadata.confidence}`);
      console.log(`  Complexity: ${pattern.metadata.complexity}`);
      console.log(`  Variables: ${pattern.metadata.variables.join(', ')}`);
      console.log(`  Functions: ${pattern.metadata.functions.join(', ')}`);
      console.log(`  Nodes: ${pattern.nodes.length}`);
      console.log(`  Connections: ${pattern.connections.length}`);
      
      // Show node details
      pattern.nodes.forEach((node, nodeIndex) => {
        console.log(`    Node ${nodeIndex + 1}: ${node.type} - ${node.label}`);
      });
    });

    // Show engine statistics
    console.log(`\nEngine Statistics:`);
    console.log(`  Registered pattern types: ${engine.getRegisteredPatternTypes().join(', ')}`);
    console.log(`  Confidence threshold: ${engine.getConfidenceThreshold()}`);

  } catch (error) {
    console.error('Error during pattern recognition:', error);
  }
}

/**
 * Example of how to create a custom pattern matcher for React hooks
 */
export class ReactHookMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'counter';

  match(node: Node, _context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Look for useState calls
    if (t.isCallExpression(node) && 
        t.isIdentifier(node.callee) && 
        node.callee.name === 'useState') {
      
      const match: PatternMatch = {
        type: this.patternType,
        rootNode: node,
        involvedNodes: [node],
        variables: [],
        functions: ['useState'],
        metadata: {
          hookType: 'useState',
          hasInitialValue: node.arguments.length > 0,
          initialValue: node.arguments[0]?.type || 'none'
        }
      };
      matches.push(match);
    }

    return matches;
  }

  getConfidence(match: PatternMatch): number {
    // Higher confidence for useState with initial value
    return match.metadata.hasInitialValue ? 0.9 : 0.7;
  }
}

/**
 * Utility function to create a pre-configured pattern recognition engine
 */
export function createConfiguredEngine(): PatternRecognitionEngine {
  const engine = new PatternRecognitionEngine();
  
  // Register common pattern matchers
  engine.registerMatcher(new VariableDeclarationMatcher());
  engine.registerMatcher(new ReactHookMatcher());
  
  // Set a custom confidence threshold
  engine.setConfidenceThreshold(0.7);
  
  return engine;
}