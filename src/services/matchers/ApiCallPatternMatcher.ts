import type { Node } from '@babel/types';
import * as t from '@babel/types';
import type { 
  PatternMatcher, 
  TraversalContext, 
  PatternMatch 
} from '../PatternRecognitionEngine';
import type { RecognizedPattern } from '../../types';

/**
 * Pattern matcher for API call patterns (fetch() and axios calls)
 */
export class ApiCallPatternMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'api-call';

  /**
   * Match API call patterns in the given AST node
   * @param node - Current AST node
   * @param context - Traversal context
   * @returns Array of pattern matches
   */
  match(node: Node, context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Look for fetch() calls
    const fetchMatch = this.findFetchPattern(node, context);
    if (fetchMatch) {
      matches.push(fetchMatch);
    }

    // Look for axios calls
    const axiosMatch = this.findAxiosPattern(node, context);
    if (axiosMatch) {
      matches.push(axiosMatch);
    }

    return matches;
  }

  /**
   * Get confidence score for an API call pattern match
   * @param match - Pattern match to evaluate
   * @returns Confidence score (0-1)
   */
  getConfidence(match: PatternMatch): number {
    let confidence = 0.4; // Base confidence

    // Higher confidence if we found a clear API call
    if (match.metadata.hasApiCall) {
      confidence += 0.3;
    }

    // Higher confidence if we found endpoint information
    if (match.metadata.endpoint) {
      confidence += 0.1;
    }

    // Higher confidence if we found HTTP method
    if (match.metadata.httpMethod) {
      confidence += 0.1;
    }

    // Higher confidence if we found error handling
    if (match.metadata.hasErrorHandling) {
      confidence += 0.1;
    }

    // Higher confidence if we found success handling
    if (match.metadata.hasSuccessHandling) {
      confidence += 0.1;
    }

    // Higher confidence if we found both success and error paths
    if (match.metadata.hasErrorHandling && match.metadata.hasSuccessHandling) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Find fetch() API call patterns
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findFetchPattern(node: Node, context: TraversalContext): PatternMatch | null {
    // Only match on the root fetch() call, not on chain methods
    if (!t.isCallExpression(node) || 
        !t.isIdentifier(node.callee) || 
        node.callee.name !== 'fetch') {
      return null;
    }
    
    const fetchNode = node;

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasApiCall: true,
      apiType: 'fetch',
      endpoint: null,
      httpMethod: 'GET', // Default for fetch
      hasErrorHandling: false,
      hasSuccessHandling: false,
      requestData: null,
      responseHandling: [],
      errorHandling: [],
      successHandlers: [],
      errorHandlers: []
    };

    // Extract endpoint information
    if (node.arguments.length > 0) {
      const firstArg = node.arguments[0];
      if (t.isStringLiteral(firstArg)) {
        metadata.endpoint = firstArg.value;
      } else if (t.isTemplateLiteral(firstArg)) {
        metadata.endpoint = this.extractTemplateLiteralValue(firstArg, variables);
      } else if (t.isIdentifier(firstArg)) {
        metadata.endpoint = `{${firstArg.name}}`;
        variables.push(firstArg.name);
      }
    }

    // Extract options (second argument)
    if (node.arguments.length > 1) {
      const optionsArg = node.arguments[1];
      if (t.isObjectExpression(optionsArg)) {
        const optionsInfo = this.extractFetchOptions(optionsArg);
        metadata.httpMethod = optionsInfo.method || 'GET';
        metadata.requestData = optionsInfo.body;
        if (optionsInfo.variables.length > 0) {
          variables.push(...optionsInfo.variables);
        }
      }
    }

    // Look for promise handling (.then, .catch, await)
    const promiseHandling = this.findPromiseHandling(node, context);
    if (promiseHandling) {
      metadata.hasSuccessHandling = promiseHandling.hasSuccess;
      metadata.hasErrorHandling = promiseHandling.hasError;
      metadata.responseHandling = promiseHandling.successHandlers;
      metadata.errorHandling = promiseHandling.errorHandlers;
      metadata.successHandlers = promiseHandling.successHandlers;
      metadata.errorHandlers = promiseHandling.errorHandlers;
      
      involvedNodes.push(...promiseHandling.nodes);
      variables.push(...promiseHandling.variables);
      functions.push(...promiseHandling.functions);
    }

    return {
      type: 'api-call',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find axios API call patterns
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findAxiosPattern(node: Node, context: TraversalContext): PatternMatch | null {
    if (!t.isCallExpression(node)) {
      return null;
    }
    
    let isAxiosCall = false;
    let axiosMethod = 'get';

    // Check for various axios call patterns
    if (t.isCallExpression(node)) {
      // axios() call
      if (t.isIdentifier(node.callee) && node.callee.name === 'axios') {
        isAxiosCall = true;
        axiosMethod = 'request';
      }
      // axios.get(), axios.post(), etc.
      else if (t.isMemberExpression(node.callee) && 
               t.isIdentifier(node.callee.object) && 
               node.callee.object.name === 'axios' &&
               t.isIdentifier(node.callee.property)) {
        isAxiosCall = true;
        axiosMethod = node.callee.property.name;
      }
    }

    if (!isAxiosCall) {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasApiCall: true,
      apiType: 'axios',
      endpoint: null,
      httpMethod: axiosMethod.toUpperCase(),
      hasErrorHandling: false,
      hasSuccessHandling: false,
      requestData: null,
      responseHandling: [],
      errorHandling: [],
      successHandlers: [],
      errorHandlers: []
    };

    // Extract endpoint and options based on axios method
    if (axiosMethod === 'request' && node.arguments.length > 0) {
      // axios({ url: '...', method: '...' })
      const configArg = node.arguments[0];
      if (t.isObjectExpression(configArg)) {
        const configInfo = this.extractAxiosConfig(configArg);
        metadata.endpoint = configInfo.url;
        metadata.httpMethod = configInfo.method || 'GET';
        metadata.requestData = configInfo.data;
        variables.push(...configInfo.variables);
      }
    } else if (node.arguments.length > 0) {
      // axios.get(url), axios.post(url, data), etc.
      const firstArg = node.arguments[0];
      if (t.isStringLiteral(firstArg)) {
        metadata.endpoint = firstArg.value;
      } else if (t.isTemplateLiteral(firstArg)) {
        metadata.endpoint = this.extractTemplateLiteralValue(firstArg, variables);
      } else if (t.isIdentifier(firstArg)) {
        metadata.endpoint = `{${firstArg.name}}`;
        variables.push(firstArg.name);
      }

      // For POST, PUT, PATCH - second argument is usually data
      if (['post', 'put', 'patch'].includes(axiosMethod) && node.arguments.length > 1) {
        const dataArg = node.arguments[1];
        if (t.isIdentifier(dataArg)) {
          metadata.requestData = `{${dataArg.name}}`;
          variables.push(dataArg.name);
        } else if (t.isObjectExpression(dataArg)) {
          metadata.requestData = 'object';
        }
      }
    }

    // Look for promise handling (.then, .catch, await)
    const promiseHandling = this.findPromiseHandling(node, context);
    if (promiseHandling) {
      metadata.hasSuccessHandling = promiseHandling.hasSuccess;
      metadata.hasErrorHandling = promiseHandling.hasError;
      metadata.responseHandling = promiseHandling.successHandlers;
      metadata.errorHandling = promiseHandling.errorHandlers;
      metadata.successHandlers = promiseHandling.successHandlers;
      metadata.errorHandlers = promiseHandling.errorHandlers;
      
      involvedNodes.push(...promiseHandling.nodes);
      variables.push(...promiseHandling.variables);
      functions.push(...promiseHandling.functions);
    }

    return {
      type: 'api-call',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Extract fetch options from object expression
   * @param optionsNode - Object expression containing fetch options
   * @returns Extracted options information
   */
  private extractFetchOptions(optionsNode: t.ObjectExpression): {
    method?: string;
    body?: string;
    variables: string[];
  } {
    const result = {
      method: undefined as string | undefined,
      body: undefined as string | undefined,
      variables: [] as string[]
    };

    optionsNode.properties.forEach(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const key = prop.key.name;
        
        if (key === 'method' && t.isStringLiteral(prop.value)) {
          result.method = prop.value.value;
        } else if (key === 'body') {
          if (t.isStringLiteral(prop.value)) {
            result.body = prop.value.value;
          } else if (t.isIdentifier(prop.value)) {
            result.body = `{${prop.value.name}}`;
            result.variables.push(prop.value.name);
          } else if (t.isCallExpression(prop.value) && 
                     t.isMemberExpression(prop.value.callee) &&
                     t.isIdentifier(prop.value.callee.property) &&
                     prop.value.callee.property.name === 'stringify') {
            result.body = 'JSON';
          }
        }
      }
    });

    return result;
  }

  /**
   * Extract axios configuration from object expression
   * @param configNode - Object expression containing axios config
   * @returns Extracted configuration information
   */
  private extractAxiosConfig(configNode: t.ObjectExpression): {
    url?: string;
    method?: string;
    data?: string;
    variables: string[];
  } {
    const result = {
      url: undefined as string | undefined,
      method: undefined as string | undefined,
      data: undefined as string | undefined,
      variables: [] as string[]
    };

    configNode.properties.forEach(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const key = prop.key.name;
        
        if (key === 'url' && t.isStringLiteral(prop.value)) {
          result.url = prop.value.value;
        } else if (key === 'method' && t.isStringLiteral(prop.value)) {
          result.method = prop.value.value;
        } else if (key === 'data') {
          if (t.isStringLiteral(prop.value)) {
            result.data = prop.value.value;
          } else if (t.isIdentifier(prop.value)) {
            result.data = `{${prop.value.name}}`;
            result.variables.push(prop.value.name);
          } else if (t.isObjectExpression(prop.value)) {
            result.data = 'object';
          }
        }
        
        // Track variables used in config
        if (t.isIdentifier(prop.value)) {
          result.variables.push(prop.value.name);
        }
      }
    });

    return result;
  }

  /**
   * Extract value from template literal and collect variables
   * @param templateLiteral - Template literal node
   * @param variables - Array to collect variables into
   * @returns String representation of the template
   */
  private extractTemplateLiteralValue(templateLiteral: t.TemplateLiteral, variables?: string[]): string {
    let result = '';
    
    for (let i = 0; i < templateLiteral.quasis.length; i++) {
      result += templateLiteral.quasis[i].value.cooked || templateLiteral.quasis[i].value.raw;
      
      if (i < templateLiteral.expressions.length) {
        const expr = templateLiteral.expressions[i];
        if (t.isIdentifier(expr)) {
          result += `{${expr.name}}`;
          if (variables) {
            variables.push(expr.name);
          }
        } else {
          result += '{expression}';
        }
      }
    }
    
    return result;
  }

  /**
   * Find promise handling patterns (.then, .catch, await, try-catch)
   * @param apiCallNode - The API call node
   * @param context - Traversal context
   * @returns Promise handling information
   */
  private findPromiseHandling(apiCallNode: Node, context: TraversalContext): {
    hasSuccess: boolean;
    hasError: boolean;
    successHandlers: string[];
    errorHandlers: string[];
    errorTypes: string[];
    successResponseTypes: string[];
    nodes: Node[];
    variables: string[];
    functions: string[];
  } | null {
    const result = {
      hasSuccess: false,
      hasError: false,
      successHandlers: [] as string[],
      errorHandlers: [] as string[],
      errorTypes: [] as string[],
      successResponseTypes: [] as string[],
      nodes: [] as Node[],
      variables: [] as string[],
      functions: [] as string[]
    };

    // Look for .then() and .catch() chains
    const chainHandling = this.findPromiseChainHandling(apiCallNode, context);
    if (chainHandling) {
      result.hasSuccess = chainHandling.hasSuccess;
      result.hasError = chainHandling.hasError;
      result.successHandlers.push(...chainHandling.successHandlers);
      result.errorHandlers.push(...chainHandling.errorHandlers);
      result.errorTypes.push(...chainHandling.errorTypes);
      result.successResponseTypes.push(...chainHandling.successResponseTypes);
      result.nodes.push(...chainHandling.nodes);
      result.variables.push(...chainHandling.variables);
      result.functions.push(...chainHandling.functions);
    }

    // Look for await with try-catch
    const awaitHandling = this.findAwaitHandling(apiCallNode, context);
    if (awaitHandling) {
      result.hasSuccess = result.hasSuccess || awaitHandling.hasSuccess;
      result.hasError = result.hasError || awaitHandling.hasError;
      result.successHandlers.push(...awaitHandling.successHandlers);
      result.errorHandlers.push(...awaitHandling.errorHandlers);
      result.errorTypes.push(...awaitHandling.errorTypes);
      result.successResponseTypes.push(...awaitHandling.successResponseTypes);
      result.nodes.push(...awaitHandling.nodes);
      result.variables.push(...awaitHandling.variables);
      result.functions.push(...awaitHandling.functions);
    }

    return (result.hasSuccess || result.hasError) ? result : null;
  }

  /**
   * Find promise chain handling (.then, .catch)
   * @param apiCallNode - The API call node
   * @param context - Traversal context
   * @returns Chain handling information
   */
  private findPromiseChainHandling(apiCallNode: Node, context: TraversalContext): {
    hasSuccess: boolean;
    hasError: boolean;
    successHandlers: string[];
    errorHandlers: string[];
    errorTypes: string[];
    successResponseTypes: string[];
    nodes: Node[];
    variables: string[];
    functions: string[];
  } | null {
    // Find all promise chain calls in the current context
    const chainCalls = this.findAllChainCalls(context);
    if (chainCalls.length === 0) return null;

    const result = {
      hasSuccess: false,
      hasError: false,
      successHandlers: [] as string[],
      errorHandlers: [] as string[],
      errorTypes: [] as string[],
      successResponseTypes: [] as string[],
      nodes: [] as Node[],
      variables: [] as string[],
      functions: [] as string[]
    };

    // Analyze each chain call
    chainCalls.forEach(chainCall => {
      if (t.isMemberExpression(chainCall.callee) && t.isIdentifier(chainCall.callee.property)) {
        const methodName = chainCall.callee.property.name;

        if (methodName === 'then' && chainCall.arguments.length > 0) {
          result.hasSuccess = true;
          result.nodes.push(chainCall);
          
          const handler = chainCall.arguments[0];
          if (t.isIdentifier(handler)) {
            result.successHandlers.push(handler.name);
            result.functions.push(handler.name);
          } else if (t.isArrowFunctionExpression(handler) || t.isFunctionExpression(handler)) {
            result.successHandlers.push('inline-success');
            result.successResponseTypes.push('json', 'text');
            // Extract variables from the handler
            this.extractVariablesFromFunction(handler, result.variables);
            // Analyze success handler body for response types
            this.extractResponseTypesFromHandler(handler, result.successResponseTypes);
          }
        } else if (methodName === 'catch' && chainCall.arguments.length > 0) {
          result.hasError = true;
          result.nodes.push(chainCall);
          result.errorTypes.push('network', 'server', 'timeout', 'client');
          
          const handler = chainCall.arguments[0];
          if (t.isIdentifier(handler)) {
            result.errorHandlers.push(handler.name);
            result.functions.push(handler.name);
          } else if (t.isArrowFunctionExpression(handler) || t.isFunctionExpression(handler)) {
            result.errorHandlers.push('inline-error');
            // Extract variables from the handler
            this.extractVariablesFromFunction(handler, result.variables);
            // Analyze error handler body for specific error types
            this.extractErrorTypesFromHandler(handler, result.errorTypes);
          }
        } else if (methodName === 'finally' && chainCall.arguments.length > 0) {
          result.nodes.push(chainCall);
          
          const handler = chainCall.arguments[0];
          if (t.isIdentifier(handler)) {
            result.functions.push(handler.name);
          } else if (t.isArrowFunctionExpression(handler) || t.isFunctionExpression(handler)) {
            this.extractVariablesFromFunction(handler, result.variables);
          }
        }
      }
    });

    return (result.hasSuccess || result.hasError) ? result : null;
  }

  /**
   * Find await handling with try-catch
   * @param apiCallNode - The API call node
   * @param context - Traversal context
   * @returns Await handling information
   */
  private findAwaitHandling(apiCallNode: Node, context: TraversalContext): {
    hasSuccess: boolean;
    hasError: boolean;
    successHandlers: string[];
    errorHandlers: string[];
    errorTypes: string[];
    successResponseTypes: string[];
    nodes: Node[];
    variables: string[];
    functions: string[];
  } | null {
    // Check if the API call is within an await expression
    const awaitParent = this.findAwaitParent(apiCallNode, context);
    if (!awaitParent) return null;

    const result = {
      hasSuccess: true, // await implies success handling
      hasError: false,
      successHandlers: ['await-success'] as string[],
      errorHandlers: [] as string[],
      errorTypes: [] as string[],
      successResponseTypes: ['json', 'text'] as string[],
      nodes: [awaitParent] as Node[],
      variables: [] as string[],
      functions: [] as string[]
    };

    // Look for try-catch block containing the await
    const tryCatchBlock = this.findTryCatchParent(awaitParent, context);
    if (tryCatchBlock) {
      result.hasError = true;
      result.errorHandlers.push('try-catch-error');
      result.errorTypes.push('exception', 'network', 'timeout');
      result.nodes.push(tryCatchBlock);
    }

    return result;
  }

  /**
   * Find the parent chain node for promise chaining
   * @param node - Current node
   * @param context - Traversal context
   * @returns Parent chain node or null
   */
  private findChainParent(node: Node, context: TraversalContext): Node | null {
    // For promise chains, we need to find the outermost call expression in the chain
    // Look through ancestors to find the topmost call expression in a chain
    let chainRoot: Node | null = null;
    
    for (let i = context.ancestors.length - 1; i >= 0; i--) {
      const ancestor = context.ancestors[i];
      
      // Look for call expressions with member expressions (method calls)
      if (t.isCallExpression(ancestor) && t.isMemberExpression(ancestor.callee)) {
        // Check if this is part of a promise chain (.then, .catch, .finally)
        if (t.isIdentifier(ancestor.callee.property)) {
          const methodName = ancestor.callee.property.name;
          if (['then', 'catch', 'finally'].includes(methodName)) {
            chainRoot = ancestor;
          }
        }
      }
    }
    
    return chainRoot;
  }

  /**
   * Find await expression parent
   * @param node - Current node
   * @param context - Traversal context
   * @returns Await expression or null
   */
  private findAwaitParent(node: Node, context: TraversalContext): t.AwaitExpression | null {
    for (let i = context.ancestors.length - 1; i >= 0; i--) {
      const ancestor = context.ancestors[i];
      if (t.isAwaitExpression(ancestor) && this.nodeContains(ancestor, node)) {
        return ancestor;
      }
    }
    return null;
  }

  /**
   * Find try-catch block parent
   * @param node - Current node
   * @param context - Traversal context
   * @returns Try statement or null
   */
  private findTryCatchParent(node: Node, context: TraversalContext): t.TryStatement | null {
    for (let i = context.ancestors.length - 1; i >= 0; i--) {
      const ancestor = context.ancestors[i];
      if (t.isTryStatement(ancestor) && this.nodeContains(ancestor, node)) {
        return ancestor;
      }
    }
    return null;
  }

  /**
   * Check if a parent node contains a child node
   * @param parent - Parent node
   * @param child - Child node to find
   * @returns True if parent contains child
   */
  private nodeContains(parent: Node, child: Node): boolean {
    if (parent === child) return true;

    const queue: Node[] = [parent];
    const visited = new Set<Node>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current === child) return true;

      // Add child nodes to queue
      Object.values(current).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              queue.push(item as Node);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          queue.push(value as Node);
        }
      });
    }

    return false;
  }

  /**
   * Find fetch call in a promise chain
   * @param chainNode - A node in the promise chain (.then, .catch, etc.)
   * @returns The fetch call expression if found
   */
  private findFetchInChain(chainNode: t.CallExpression): t.CallExpression | null {
    let current = chainNode;
    
    // Traverse backwards through the chain to find the root fetch call
    while (current && t.isCallExpression(current) && t.isMemberExpression(current.callee)) {
      // Move to the object of the member expression (the left side of the dot)
      const object = current.callee.object;
      
      if (t.isCallExpression(object)) {
        if (t.isIdentifier(object.callee) && object.callee.name === 'fetch') {
          return object; // Found the fetch call
        }
        current = object; // Continue traversing
      } else {
        break; // Not a call expression, stop traversing
      }
    }
    
    return null;
  }

  /**
   * Find all promise chain calls in the current context
   * @param context - Traversal context
   * @returns Array of promise chain call expressions
   */
  private findAllChainCalls(context: TraversalContext): t.CallExpression[] {
    const chainCalls: t.CallExpression[] = [];
    
    // Look through ancestors for promise chain calls
    context.ancestors.forEach(ancestor => {
      if (t.isCallExpression(ancestor) && t.isMemberExpression(ancestor.callee)) {
        if (t.isIdentifier(ancestor.callee.property)) {
          const methodName = ancestor.callee.property.name;
          if (['then', 'catch', 'finally'].includes(methodName)) {
            chainCalls.push(ancestor);
          }
        }
      }
    });
    
    return chainCalls;
  }

  /**
   * Extract variables from a function expression
   * @param func - Function expression
   * @param variables - Array to add variables to
   */
  private extractVariablesFromFunction(func: t.Function, variables: string[]): void {
    // Extract parameter names
    func.params.forEach(param => {
      if (t.isIdentifier(param)) {
        variables.push(param.name);
      }
    });

    // Could add more sophisticated variable extraction from function body
    // For now, just extract parameters
  }

  /**
   * Extract error types from error handler function
   * @param handler - Error handler function
   * @param errorTypes - Array to add error types to
   */
  private extractErrorTypesFromHandler(handler: t.Function, errorTypes: string[]): void {
    // Look for specific error handling patterns in the function body
    const searchForErrorTypes = (node: Node) => {
      // Look for error.status, error.code, error.name checks
      if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
        const property = node.property.name;
        if (property === 'status' || property === 'statusCode') {
          errorTypes.push('http-status');
        } else if (property === 'code') {
          errorTypes.push('error-code');
        } else if (property === 'name') {
          errorTypes.push('error-name');
        } else if (property === 'message') {
          errorTypes.push('error-message');
        }
      }

      // Look for specific error type checks
      if (t.isStringLiteral(node)) {
        const value = node.value.toLowerCase();
        if (value.includes('network')) {
          errorTypes.push('network');
        } else if (value.includes('timeout')) {
          errorTypes.push('timeout');
        } else if (value.includes('abort')) {
          errorTypes.push('abort');
        } else if (value.includes('cors')) {
          errorTypes.push('cors');
        }
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForErrorTypes(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForErrorTypes(value);
        }
      });
    };

    if (handler.body) {
      searchForErrorTypes(handler.body);
    }
  }

  /**
   * Extract response types from success handler function
   * @param handler - Success handler function
   * @param responseTypes - Array to add response types to
   */
  private extractResponseTypesFromHandler(handler: t.Function, responseTypes: string[]): void {
    // Look for response processing patterns in the function body
    const searchForResponseTypes = (node: Node) => {
      // Look for .json(), .text(), .blob(), etc.
      if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
        const property = node.property.name;
        if (['json', 'text', 'blob', 'arrayBuffer', 'formData'].includes(property)) {
          if (!responseTypes.includes(property)) {
            responseTypes.push(property);
          }
        }
      }

      // Look for JSON.parse calls
      if (t.isCallExpression(node) && 
          t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object) &&
          node.callee.object.name === 'JSON' &&
          t.isIdentifier(node.callee.property) &&
          node.callee.property.name === 'parse') {
        if (!responseTypes.includes('json')) {
          responseTypes.push('json');
        }
      }

      // Recursively search child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              searchForResponseTypes(item);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          searchForResponseTypes(value);
        }
      });
    };

    if (handler.body) {
      searchForResponseTypes(handler.body);
    }
  }
}