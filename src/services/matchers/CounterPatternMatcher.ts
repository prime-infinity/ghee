import type { Node } from '@babel/types';
import * as t from '@babel/types';
import type { 
  PatternMatcher, 
  TraversalContext, 
  PatternMatch 
} from '../PatternRecognitionEngine';
import type { RecognizedPattern } from '../../types';

/**
 * Pattern matcher for React counter patterns (useState + onClick combinations)
 */
export class CounterPatternMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'counter';

  /**
   * Match counter patterns in the given AST node
   * @param node - Current AST node
   * @param context - Traversal context
   * @returns Array of pattern matches
   */
  match(node: Node, context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Look for React functional components that might contain counter patterns
    if (this.isFunctionalComponent(node)) {
      const counterMatch = this.findCounterPattern(node, context);
      if (counterMatch) {
        matches.push(counterMatch);
      }
    }

    return matches;
  }

  /**
   * Get confidence score for a counter pattern match
   * @param match - Pattern match to evaluate
   * @returns Confidence score (0-1)
   */
  getConfidence(match: PatternMatch): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence if we found useState hook
    if (match.metadata.hasUseState) {
      confidence += 0.2;
    }

    // Higher confidence if we found onClick handler
    if (match.metadata.hasOnClick) {
      confidence += 0.2;
    }

    // Higher confidence if state is numeric
    if (match.metadata.isNumericState) {
      confidence += 0.1;
    }

    // Higher confidence if we found increment/decrement operations
    if (match.metadata.hasIncrementOperation) {
      confidence += 0.15;
    }

    // Higher confidence if variable names suggest counter behavior
    if (match.metadata.hasCounterVariableNames) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Check if a node represents a functional component
   * @param node - AST node to check
   * @returns True if node is a functional component
   */
  private isFunctionalComponent(node: Node): boolean {
    // Function declaration that returns JSX
    if (t.isFunctionDeclaration(node) && node.id && this.returnsJSX(node)) {
      return true;
    }

    // Arrow function assigned to variable that returns JSX
    if (t.isVariableDeclarator(node) && 
        t.isArrowFunctionExpression(node.init) && 
        this.returnsJSX(node.init)) {
      return true;
    }

    return false;
  }

  /**
   * Check if a function returns JSX
   * @param func - Function node to check
   * @returns True if function returns JSX
   */
  private returnsJSX(func: t.Function): boolean {
    if (!func.body) return false;

    // Check if function body contains JSX elements
    let hasJSX = false;
    
    const checkForJSX = (node: Node) => {
      if (t.isJSXElement(node) || t.isJSXFragment(node)) {
        hasJSX = true;
        return;
      }
      
      // Recursively check child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              checkForJSX(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          checkForJSX(value);
        }
      });
    };

    checkForJSX(func.body);
    return hasJSX;
  }

  /**
   * Find counter pattern within a functional component
   * @param componentNode - Component AST node
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findCounterPattern(componentNode: Node, context: TraversalContext): PatternMatch | null {
    const involvedNodes: Node[] = [componentNode];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasUseState: false,
      hasOnClick: false,
      isNumericState: false,
      hasIncrementOperation: false,
      hasCounterVariableNames: false,
      stateVariables: [],
      setterFunctions: [],
      clickHandlers: []
    };

    // Extract function body for analysis
    const functionBody = this.getFunctionBody(componentNode);
    if (!functionBody) return null;

    // Look for useState hooks
    const useStateInfo = this.findUseStateHooks(functionBody);
    if (useStateInfo.length > 0) {
      metadata.hasUseState = true;
      metadata.stateVariables = useStateInfo.map(info => info.stateName);
      metadata.setterFunctions = useStateInfo.map(info => info.setterName);
      
      useStateInfo.forEach(info => {
        variables.push(info.stateName, info.setterName);
        involvedNodes.push(info.node);
        
        // Check if initial state is numeric
        if (info.isNumeric) {
          metadata.isNumericState = true;
        }
        
        // Check for counter-like variable names
        if (this.isCounterVariableName(info.stateName)) {
          metadata.hasCounterVariableNames = true;
        }
      });
    }

    // Look for onClick handlers
    const clickHandlers = this.findClickHandlers(functionBody);
    if (clickHandlers.length > 0) {
      metadata.hasOnClick = true;
      metadata.clickHandlers = clickHandlers.map(handler => handler.name);
      
      clickHandlers.forEach(handler => {
        if (handler.name) {
          functions.push(handler.name);
        }
        involvedNodes.push(handler.node);
        
        // Check if click handler contains increment operations
        if (this.hasIncrementOperation(handler.node, metadata.setterFunctions)) {
          metadata.hasIncrementOperation = true;
        }
      });
    }

    // Only consider it a counter pattern if we have both useState and onClick
    if (!metadata.hasUseState || !metadata.hasOnClick) {
      return null;
    }

    return {
      type: 'counter',
      rootNode: componentNode,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Get function body from a component node
   * @param node - Component node
   * @returns Function body or null
   */
  private getFunctionBody(node: Node): t.BlockStatement | t.Expression | null {
    if (t.isFunctionDeclaration(node)) {
      return node.body;
    }
    
    if (t.isVariableDeclarator(node) && t.isArrowFunctionExpression(node.init)) {
      return node.init.body;
    }
    
    return null;
  }

  /**
   * Find useState hooks in function body
   * @param body - Function body to search
   * @returns Array of useState hook information
   */
  private findUseStateHooks(body: t.BlockStatement | t.Expression): Array<{
    node: Node;
    stateName: string;
    setterName: string;
    isNumeric: boolean;
  }> {
    const useStateHooks: Array<{
      node: Node;
      stateName: string;
      setterName: string;
      isNumeric: boolean;
    }> = [];

    const searchForUseState = (node: Node) => {
      // Look for variable declarations with useState calls
      if (t.isVariableDeclarator(node) && 
          t.isCallExpression(node.init) &&
          t.isIdentifier(node.init.callee) &&
          node.init.callee.name === 'useState') {
        
        // Extract state and setter names from array destructuring
        if (t.isArrayPattern(node.id) && node.id.elements.length >= 2) {
          const stateElement = node.id.elements[0];
          const setterElement = node.id.elements[1];
          
          if (t.isIdentifier(stateElement) && t.isIdentifier(setterElement)) {
            // Check if initial value is numeric
            const initialValue = node.init.arguments[0];
            const isNumeric = t.isNumericLiteral(initialValue) || 
                            (t.isUnaryExpression(initialValue) && 
                             initialValue.operator === '-' && 
                             t.isNumericLiteral(initialValue.argument));
            
            useStateHooks.push({
              node,
              stateName: stateElement.name,
              setterName: setterElement.name,
              isNumeric
            });
          }
        }
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForUseState(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForUseState(value);
        }
      });
    };

    searchForUseState(body);
    return useStateHooks;
  }

  /**
   * Find onClick handlers in function body
   * @param body - Function body to search
   * @returns Array of click handler information
   */
  private findClickHandlers(body: t.BlockStatement | t.Expression): Array<{
    node: Node;
    name?: string;
  }> {
    const clickHandlers: Array<{ node: Node; name?: string }> = [];

    const searchForClickHandlers = (node: Node) => {
      // Look for onClick attributes in JSX
      if (t.isJSXAttribute(node) && 
          t.isJSXIdentifier(node.name) && 
          node.name.name === 'onClick') {
        
        if (node.value) {
          if (t.isJSXExpressionContainer(node.value)) {
            const expression = node.value.expression;
            
            // Direct function reference
            if (t.isIdentifier(expression)) {
              clickHandlers.push({
                node,
                name: expression.name
              });
            }
            // Inline arrow function or function expression
            else if (t.isArrowFunctionExpression(expression) || 
                     t.isFunctionExpression(expression)) {
              clickHandlers.push({
                node: expression
              });
            }
          }
        }
      }

      // Look for function declarations that might be click handlers
      if (t.isFunctionDeclaration(node) && node.id) {
        const name = node.id.name;
        if (this.isClickHandlerName(name)) {
          clickHandlers.push({
            node,
            name
          });
        }
      }

      // Look for arrow functions assigned to variables with click handler names
      if (t.isVariableDeclarator(node) && 
          t.isIdentifier(node.id) &&
          (t.isArrowFunctionExpression(node.init) || t.isFunctionExpression(node.init))) {
        
        const name = node.id.name;
        if (this.isClickHandlerName(name)) {
          clickHandlers.push({
            node,
            name
          });
        }
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForClickHandlers(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForClickHandlers(value);
        }
      });
    };

    searchForClickHandlers(body);
    return clickHandlers;
  }

  /**
   * Check if a function contains increment/decrement operations on state setters
   * @param functionNode - Function node to check
   * @param setterFunctions - Array of setter function names
   * @returns True if increment/decrement operations are found
   */
  private hasIncrementOperation(functionNode: Node, setterFunctions: string[]): boolean {
    let hasIncrement = false;

    const searchForIncrement = (node: Node) => {
      // Look for setter function calls
      if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
        const functionName = node.callee.name;
        
        if (setterFunctions.includes(functionName) && node.arguments.length > 0) {
          const argument = node.arguments[0];
          
          // Check for increment/decrement patterns: setter(prev => prev + 1), setter(count + 1), etc.
          if (t.isArrowFunctionExpression(argument)) {
            // Pattern: setter(prev => prev + 1) or setter(prev => prev - 1)
            if (t.isBinaryExpression(argument.body) && 
                (argument.body.operator === '+' || argument.body.operator === '-') &&
                t.isIdentifier(argument.body.left)) {
              hasIncrement = true;
            }
          } else if (t.isBinaryExpression(argument) && 
                     (argument.operator === '+' || argument.operator === '-')) {
            // Pattern: setter(count + 1) or setter(count - 1)
            hasIncrement = true;
          } else if (t.isUpdateExpression(argument) && 
                     (argument.operator === '++' || argument.operator === '--')) {
            // Pattern: setter(++count) or setter(count++)
            hasIncrement = true;
          }
        }
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForIncrement(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForIncrement(value);
        }
      });
    };

    searchForIncrement(functionNode);
    return hasIncrement;
  }

  /**
   * Check if a variable name suggests counter behavior
   * @param name - Variable name to check
   * @returns True if name suggests counter behavior
   */
  private isCounterVariableName(name: string): boolean {
    const counterNames = [
      'count', 'counter', 'num', 'number', 'value', 'val',
      'index', 'idx', 'i', 'j', 'k', 'step', 'clicks',
      'total', 'sum', 'score', 'points', 'level'
    ];
    
    const lowerName = name.toLowerCase();
    return counterNames.some(counterName => 
      lowerName.includes(counterName) || counterName.includes(lowerName)
    );
  }

  /**
   * Check if a function name suggests it's a click handler
   * @param name - Function name to check
   * @returns True if name suggests click handler
   */
  private isClickHandlerName(name: string): boolean {
    const clickHandlerPatterns = [
      'click', 'handle', 'on', 'increment', 'decrement',
      'add', 'subtract', 'increase', 'decrease', 'plus', 'minus',
      'up', 'down', 'next', 'prev', 'step'
    ];
    
    const lowerName = name.toLowerCase();
    return clickHandlerPatterns.some(pattern => lowerName.includes(pattern));
  }
}