import type { Node } from '@babel/types';
import * as t from '@babel/types';

/**
 * Information about a detected React hook
 */
export interface HookInfo {
  /** Name of the hook (e.g., 'useState', 'useEffect') */
  hookName: string;
  /** AST node where the hook is called */
  node: Node;
  /** Arguments passed to the hook */
  arguments: Node[];
  /** Variable names from destructuring (for hooks like useState) */
  destructuredNames: string[];
  /** Additional metadata specific to the hook type */
  metadata: Record<string, any>;
}

/**
 * Information about a useState hook specifically
 */
export interface UseStateInfo extends HookInfo {
  hookName: 'useState';
  /** Name of the state variable */
  stateName: string;
  /** Name of the setter function */
  setterName: string;
  /** Initial value of the state */
  initialValue: Node | null;
  /** Whether the initial value is numeric */
  isNumeric: boolean;
  /** Whether the initial value is boolean */
  isBoolean: boolean;
  /** Whether the initial value is a string */
  isString: boolean;
  /** Whether the initial value is an object */
  isObject: boolean;
  /** Whether the initial value is an array */
  isArray: boolean;
}

/**
 * Information about a useEffect hook specifically
 */
export interface UseEffectInfo extends HookInfo {
  hookName: 'useEffect';
  /** Dependencies array (if provided) */
  dependencies: Node[] | null;
  /** Whether the effect has a cleanup function */
  hasCleanup: boolean;
  /** Whether the effect runs only once (empty dependency array) */
  runsOnce: boolean;
}

/**
 * Utility class for detecting and analyzing React hooks in AST
 */
export class ReactHookDetector {
  /**
   * Find all React hooks in the given AST node
   * @param node - AST node to search
   * @returns Array of detected hooks
   */
  static findAllHooks(node: Node): HookInfo[] {
    const hooks: HookInfo[] = [];
    
    const searchForHooks = (currentNode: Node) => {
      // Look for hook calls (functions starting with 'use')
      if (t.isCallExpression(currentNode) && t.isIdentifier(currentNode.callee)) {
        const functionName = currentNode.callee.name;
        
        if (this.isHookName(functionName)) {
          const hookInfo = this.createHookInfo(currentNode, functionName);
          if (hookInfo) {
            hooks.push(hookInfo);
          }
        }
      }

      // Recursively search child nodes
      Object.values(currentNode).forEach(value => {
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

    searchForHooks(node);
    return hooks;
  }

  /**
   * Find useState hooks specifically
   * @param node - AST node to search
   * @returns Array of useState hook information
   */
  static findUseStateHooks(node: Node): UseStateInfo[] {
    const useStateHooks: UseStateInfo[] = [];
    
    const searchForUseState = (currentNode: Node) => {
      // Look for variable declarations with useState calls
      if (t.isVariableDeclarator(currentNode) && 
          t.isCallExpression(currentNode.init) &&
          t.isIdentifier(currentNode.init.callee) &&
          currentNode.init.callee.name === 'useState') {
        
        const useStateInfo = this.createUseStateInfo(currentNode);
        if (useStateInfo) {
          useStateHooks.push(useStateInfo);
        }
      }

      // Recursively search child nodes
      Object.values(currentNode).forEach(value => {
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

    searchForUseState(node);
    return useStateHooks;
  }

  /**
   * Find useEffect hooks specifically
   * @param node - AST node to search
   * @returns Array of useEffect hook information
   */
  static findUseEffectHooks(node: Node): UseEffectInfo[] {
    const useEffectHooks: UseEffectInfo[] = [];
    
    const searchForUseEffect = (currentNode: Node) => {
      // Look for useEffect calls
      if (t.isCallExpression(currentNode) &&
          t.isIdentifier(currentNode.callee) &&
          currentNode.callee.name === 'useEffect') {
        
        const useEffectInfo = this.createUseEffectInfo(currentNode);
        if (useEffectInfo) {
          useEffectHooks.push(useEffectInfo);
        }
      }

      // Recursively search child nodes
      Object.values(currentNode).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForUseEffect(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForUseEffect(value);
        }
      });
    };

    searchForUseEffect(node);
    return useEffectHooks;
  }

  /**
   * Check if a function name follows React hook naming convention
   * @param name - Function name to check
   * @returns True if name follows hook convention
   */
  private static isHookName(name: string): boolean {
    return name.startsWith('use') && name.length > 3 && /^use[A-Z]/.test(name);
  }

  /**
   * Create generic hook information from a call expression
   * @param callNode - Call expression node
   * @param hookName - Name of the hook
   * @returns Hook information or null
   */
  private static createHookInfo(callNode: t.CallExpression, hookName: string): HookInfo | null {
    try {
      // Find the parent variable declarator to get destructured names
      let destructuredNames: string[] = [];
      let parentNode = callNode;
      
      // This is a simplified approach - in a real implementation, you'd need
      // to traverse up the AST to find the parent variable declarator
      
      return {
        hookName,
        node: callNode,
        arguments: callNode.arguments,
        destructuredNames,
        metadata: {
          argumentCount: callNode.arguments.length
        }
      };
    } catch (error) {
      console.warn(`Failed to create hook info for ${hookName}:`, error);
      return null;
    }
  }

  /**
   * Create useState-specific information from a variable declarator
   * @param declaratorNode - Variable declarator node with useState call
   * @returns useState information or null
   */
  private static createUseStateInfo(declaratorNode: t.VariableDeclarator): UseStateInfo | null {
    try {
      if (!t.isCallExpression(declaratorNode.init) || 
          !t.isIdentifier(declaratorNode.init.callee) ||
          declaratorNode.init.callee.name !== 'useState') {
        return null;
      }

      const callExpression = declaratorNode.init;
      
      // Extract state and setter names from array destructuring
      let stateName = 'state';
      let setterName = 'setState';
      
      if (t.isArrayPattern(declaratorNode.id) && declaratorNode.id.elements.length >= 1) {
        const stateElement = declaratorNode.id.elements[0];
        const setterElement = declaratorNode.id.elements[1]; // May be undefined
        
        if (t.isIdentifier(stateElement)) {
          stateName = stateElement.name;
        }
        if (setterElement && t.isIdentifier(setterElement)) {
          setterName = setterElement.name;
        }
      }

      // Analyze initial value
      const initialValue = callExpression.arguments[0] || null;
      const isNumeric = initialValue ? t.isNumericLiteral(initialValue) || 
                       (t.isUnaryExpression(initialValue) && 
                        initialValue.operator === '-' && 
                        t.isNumericLiteral(initialValue.argument)) : false;
      const isBoolean = initialValue ? t.isBooleanLiteral(initialValue) : false;
      const isString = initialValue ? t.isStringLiteral(initialValue) : false;
      const isObject = initialValue ? t.isObjectExpression(initialValue) : false;
      const isArray = initialValue ? t.isArrayExpression(initialValue) : false;

      return {
        hookName: 'useState',
        node: declaratorNode,
        arguments: callExpression.arguments,
        destructuredNames: [stateName, setterName],
        metadata: {
          argumentCount: callExpression.arguments.length,
          initialValueType: initialValue?.type || 'undefined'
        },
        stateName,
        setterName,
        initialValue,
        isNumeric,
        isBoolean,
        isString,
        isObject,
        isArray
      };
    } catch (error) {
      console.warn('Failed to create useState info:', error);
      return null;
    }
  }

  /**
   * Create useEffect-specific information from a call expression
   * @param callNode - useEffect call expression
   * @returns useEffect information or null
   */
  private static createUseEffectInfo(callNode: t.CallExpression): UseEffectInfo | null {
    try {
      const effectFunction = callNode.arguments[0];
      const dependenciesArg = callNode.arguments[1];
      
      // Analyze dependencies
      let dependencies: Node[] | null = null;
      let runsOnce = false;
      
      if (dependenciesArg) {
        if (t.isArrayExpression(dependenciesArg)) {
          dependencies = dependenciesArg.elements.filter((el): el is Node => 
            el !== null && el !== undefined
          );
          runsOnce = dependencies.length === 0;
        }
      }

      // Check for cleanup function
      let hasCleanup = false;
      if (t.isFunctionExpression(effectFunction) || t.isArrowFunctionExpression(effectFunction)) {
        const body = effectFunction.body;
        if (t.isBlockStatement(body)) {
          // Look for return statement with function
          hasCleanup = body.body.some(statement => 
            t.isReturnStatement(statement) && 
            statement.argument && 
            (t.isFunctionExpression(statement.argument) || 
             t.isArrowFunctionExpression(statement.argument))
          );
        }
      }

      return {
        hookName: 'useEffect',
        node: callNode,
        arguments: callNode.arguments,
        destructuredNames: [],
        metadata: {
          argumentCount: callNode.arguments.length,
          hasDependencies: dependenciesArg !== undefined,
          dependencyCount: dependencies?.length || 0
        },
        dependencies,
        hasCleanup,
        runsOnce
      };
    } catch (error) {
      console.warn('Failed to create useEffect info:', error);
      return null;
    }
  }

  /**
   * Check if a node contains any React hooks
   * @param node - AST node to check
   * @returns True if hooks are found
   */
  static hasHooks(node: Node): boolean {
    return this.findAllHooks(node).length > 0;
  }

  /**
   * Get hook names used in a node
   * @param node - AST node to analyze
   * @returns Array of hook names
   */
  static getHookNames(node: Node): string[] {
    const hooks = this.findAllHooks(node);
    return [...new Set(hooks.map(hook => hook.hookName))];
  }

  /**
   * Check if a specific hook is used in a node
   * @param node - AST node to check
   * @param hookName - Name of the hook to look for
   * @returns True if the hook is found
   */
  static usesHook(node: Node, hookName: string): boolean {
    const hooks = this.findAllHooks(node);
    return hooks.some(hook => hook.hookName === hookName);
  }
}