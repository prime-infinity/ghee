import type { Node } from '@babel/types';
import * as t from '@babel/types';
import type { 
  PatternMatcher, 
  TraversalContext, 
  PatternMatch 
} from '../PatternRecognitionEngine';
import type { RecognizedPattern } from '../../types';

/**
 * Pattern matcher for React component lifecycle patterns
 */
export class ReactComponentPatternMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'react-component';

  /**
   * Match React component patterns in the given AST node
   * @param node - Current AST node
   * @param context - Traversal context
   * @returns Array of pattern matches
   */
  match(node: Node, context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Look for React functional components
    if (this.isFunctionalComponent(node)) {
      const componentMatch = this.findComponentPattern(node, context);
      if (componentMatch) {
        matches.push(componentMatch);
      }
    }

    // Look for React class components
    if (this.isClassComponent(node)) {
      const classMatch = this.findClassComponentPattern(node, context);
      if (classMatch) {
        matches.push(classMatch);
      }
    }

    return matches;
  }

  /**
   * Get confidence score for a React component pattern match
   * @param match - Pattern match to evaluate
   * @returns Confidence score (0-1)
   */
  getConfidence(match: PatternMatch): number {
    let confidence = 0.4; // Base confidence

    // Higher confidence for hooks usage
    if (match.metadata.usesHooks) {
      confidence += 0.2;
    }

    // Higher confidence for state management
    if (match.metadata.stateVariables?.length > 0) {
      confidence += 0.15;
    }

    // Higher confidence for effects
    if (match.metadata.effects?.length > 0) {
      confidence += 0.15;
    }

    // Higher confidence for props
    if (match.metadata.props?.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }  /**
  
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
   * Check if a node represents a class component
   * @param node - AST node to check
   * @returns True if node is a class component
   */
  private isClassComponent(node: Node): boolean {
    if (!t.isClassDeclaration(node)) return false;
    
    // Check if it extends React.Component or Component
    if (node.superClass) {
      if (t.isIdentifier(node.superClass) && node.superClass.name === 'Component') {
        return true;
      }
      if (t.isMemberExpression(node.superClass) && 
          t.isIdentifier(node.superClass.object) && 
          node.superClass.object.name === 'React' &&
          t.isIdentifier(node.superClass.property) && 
          node.superClass.property.name === 'Component') {
        return true;
      }
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
   * Find React component pattern within a functional component
   * @param componentNode - Component AST node
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findComponentPattern(componentNode: Node, _context: TraversalContext): PatternMatch | null {
    const involvedNodes: Node[] = [componentNode];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      componentName: this.getComponentName(componentNode),
      usesHooks: false,
      hasLifecycleMethods: false,
      stateVariables: [],
      effects: [],
      props: [],
      childComponents: [],
      handlesRerendering: false
    };

    const functionBody = this.getFunctionBody(componentNode);
    if (!functionBody) return null;

    // Analyze hooks usage
    const hooksInfo = this.analyzeHooks(functionBody);
    if (hooksInfo.hasHooks) {
      metadata.usesHooks = true;
      metadata.stateVariables = hooksInfo.stateVariables;
      metadata.effects = hooksInfo.effects;
      
      hooksInfo.nodes.forEach(node => involvedNodes.push(node));
      variables.push(...hooksInfo.stateVariables);
      functions.push(...hooksInfo.effects);
    }

    // Analyze props
    const propsInfo = this.analyzeProps(componentNode);
    if (propsInfo.length > 0) {
      metadata.props = propsInfo;
      variables.push(...propsInfo);
    }

    // Analyze child components
    const childComponents = this.findChildComponents(functionBody);
    if (childComponents.length > 0) {
      metadata.childComponents = childComponents.map(c => c.name);
      childComponents.forEach(c => involvedNodes.push(c.node));
    }

    // Check for re-rendering patterns
    if (this.hasRerenderingLogic(functionBody)) {
      metadata.handlesRerendering = true;
    }

    return {
      type: 'react-component',
      rootNode: componentNode,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find React class component pattern
   * @param componentNode - Class component AST node
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findClassComponentPattern(componentNode: Node, _context: TraversalContext): PatternMatch | null {
    if (!t.isClassDeclaration(componentNode)) return null;

    const involvedNodes: Node[] = [componentNode];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      componentName: componentNode.id?.name || 'UnnamedComponent',
      usesHooks: false,
      hasLifecycleMethods: false,
      stateVariables: [],
      effects: [],
      props: [],
      childComponents: [],
      handlesRerendering: false
    };

    // Analyze lifecycle methods
    const lifecycleMethods = this.findLifecycleMethods(componentNode);
    if (lifecycleMethods.length > 0) {
      metadata.hasLifecycleMethods = true;
      metadata.effects = lifecycleMethods.map(m => m.name);
      lifecycleMethods.forEach(m => {
        involvedNodes.push(m.node);
        functions.push(m.name);
      });
    }

    // Analyze state usage
    const stateInfo = this.analyzeClassState(componentNode);
    if (stateInfo.length > 0) {
      metadata.stateVariables = stateInfo;
      variables.push(...stateInfo);
    }

    return {
      type: 'react-component',
      rootNode: componentNode,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }  /**

   * Get component name from node
   * @param node - Component node
   * @returns Component name
   */
  private getComponentName(node: Node): string {
    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name;
    }
    if (t.isVariableDeclarator(node) && t.isIdentifier(node.id)) {
      return node.id.name;
    }
    return 'UnnamedComponent';
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
   * Analyze hooks usage in component
   * @param body - Function body to analyze
   * @returns Hooks analysis result
   */
  private analyzeHooks(body: t.BlockStatement | t.Expression): {
    hasHooks: boolean;
    stateVariables: string[];
    effects: string[];
    nodes: Node[];
  } {
    const result = {
      hasHooks: false,
      stateVariables: [] as string[],
      effects: [] as string[],
      nodes: [] as Node[]
    };

    const searchForHooks = (node: Node) => {
      // useState hooks
      if (t.isVariableDeclarator(node) && 
          t.isCallExpression(node.init) &&
          t.isIdentifier(node.init.callee) &&
          node.init.callee.name === 'useState') {
        
        result.hasHooks = true;
        result.nodes.push(node);
        
        if (t.isArrayPattern(node.id) && node.id.elements.length >= 1) {
          const stateElement = node.id.elements[0];
          if (t.isIdentifier(stateElement)) {
            result.stateVariables.push(stateElement.name);
          }
        }
      }

      // useEffect hooks
      if (t.isCallExpression(node) &&
          t.isIdentifier(node.callee) &&
          node.callee.name === 'useEffect') {
        
        result.hasHooks = true;
        result.nodes.push(node);
        result.effects.push('useEffect');
      }

      // Other hooks (useContext, useReducer, etc.)
      if (t.isCallExpression(node) &&
          t.isIdentifier(node.callee) &&
          node.callee.name.startsWith('use') &&
          node.callee.name.length > 3) {
        
        result.hasHooks = true;
        result.nodes.push(node);
        result.effects.push(node.callee.name);
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForHooks(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForHooks(value);
        }
      });
    };

    searchForHooks(body);
    return result;
  } 
 /**
   * Analyze props usage in component
   * @param node - Component node
   * @returns Array of prop names
   */
  private analyzeProps(node: Node): string[] {
    const props: string[] = [];

    // For functional components, check function parameters
    if (t.isFunctionDeclaration(node) && node.params.length > 0) {
      const propsParam = node.params[0];
      if (t.isObjectPattern(propsParam)) {
        propsParam.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            props.push(prop.key.name);
          }
        });
      } else if (t.isIdentifier(propsParam)) {
        props.push(propsParam.name);
      }
    }

    if (t.isVariableDeclarator(node) && 
        t.isArrowFunctionExpression(node.init) && 
        node.init.params.length > 0) {
      const propsParam = node.init.params[0];
      if (t.isObjectPattern(propsParam)) {
        propsParam.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            props.push(prop.key.name);
          }
        });
      } else if (t.isIdentifier(propsParam)) {
        props.push(propsParam.name);
      }
    }

    return props;
  }

  /**
   * Find child components in JSX
   * @param body - Function body to search
   * @returns Array of child component information
   */
  private findChildComponents(body: t.BlockStatement | t.Expression): Array<{
    name: string;
    node: Node;
  }> {
    const childComponents: Array<{ name: string; node: Node }> = [];

    const searchForComponents = (node: Node) => {
      // Look for JSX elements with custom component names (capitalized)
      if (t.isJSXElement(node) && 
          t.isJSXIdentifier(node.openingElement.name)) {
        const componentName = node.openingElement.name.name;
        
        // Custom components start with uppercase
        if (componentName[0] === componentName[0].toUpperCase() && 
            componentName !== 'Fragment') {
          childComponents.push({
            name: componentName,
            node
          });
        }
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForComponents(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForComponents(value);
        }
      });
    };

    searchForComponents(body);
    return childComponents;
  }

  /**
   * Check if component has re-rendering logic
   * @param body - Function body to check
   * @returns True if re-rendering logic is found
   */
  private hasRerenderingLogic(body: t.BlockStatement | t.Expression): boolean {
    let hasRerendering = false;

    const searchForRerendering = (node: Node) => {
      // Look for useEffect with dependencies
      if (t.isCallExpression(node) &&
          t.isIdentifier(node.callee) &&
          node.callee.name === 'useEffect' &&
          node.arguments.length > 1) {
        hasRerendering = true;
      }

      // Look for useMemo or useCallback
      if (t.isCallExpression(node) &&
          t.isIdentifier(node.callee) &&
          (node.callee.name === 'useMemo' || node.callee.name === 'useCallback')) {
        hasRerendering = true;
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForRerendering(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForRerendering(value);
        }
      });
    };

    searchForRerendering(body);
    return hasRerendering;
  }  /**
  
 * Find lifecycle methods in class component
   * @param classNode - Class component node
   * @returns Array of lifecycle method information
   */
  private findLifecycleMethods(classNode: t.ClassDeclaration): Array<{
    name: string;
    node: Node;
  }> {
    const lifecycleMethods: Array<{ name: string; node: Node }> = [];
    const lifecycleNames = [
      'componentDidMount',
      'componentDidUpdate',
      'componentWillUnmount',
      'shouldComponentUpdate',
      'getSnapshotBeforeUpdate',
      'componentDidCatch',
      'getDerivedStateFromError'
    ];

    classNode.body.body.forEach(member => {
      if (t.isClassMethod(member) && 
          t.isIdentifier(member.key) &&
          lifecycleNames.includes(member.key.name)) {
        lifecycleMethods.push({
          name: member.key.name,
          node: member
        });
      }
    });

    return lifecycleMethods;
  }

  /**
   * Analyze state usage in class component
   * @param classNode - Class component node
   * @returns Array of state variable names
   */
  private analyzeClassState(classNode: t.ClassDeclaration): string[] {
    const stateVariables: string[] = [];

    classNode.body.body.forEach(member => {
      // Look for state property
      if (t.isClassProperty(member) && 
          t.isIdentifier(member.key) &&
          member.key.name === 'state' &&
          t.isObjectExpression(member.value)) {
        
        member.value.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            stateVariables.push(prop.key.name);
          }
        });
      }

      // Look for constructor with state initialization
      if (t.isClassMethod(member) && 
          t.isIdentifier(member.key) &&
          member.key.name === 'constructor') {
        
        const constructorBody = member.body;
        if (constructorBody && constructorBody.body) {
          constructorBody.body.forEach(stmt => {
          if (t.isExpressionStatement(stmt) &&
              t.isAssignmentExpression(stmt.expression) &&
              t.isMemberExpression(stmt.expression.left) &&
              t.isThisExpression(stmt.expression.left.object) &&
              t.isIdentifier(stmt.expression.left.property) &&
              stmt.expression.left.property.name === 'state' &&
              t.isObjectExpression(stmt.expression.right)) {
            
            stmt.expression.right.properties.forEach(prop => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                stateVariables.push(prop.key.name);
              }
            });
          }
        });
        }
      }
    });

    return stateVariables;
  }
}