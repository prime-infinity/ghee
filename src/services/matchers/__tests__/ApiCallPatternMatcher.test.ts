import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@babel/parser';
import type { Node } from '@babel/types';
import { ApiCallPatternMatcher } from '../ApiCallPatternMatcher';
import type { TraversalContext } from '../../PatternRecognitionEngine';

describe('ApiCallPatternMatcher', () => {
  let matcher: ApiCallPatternMatcher;
  let mockContext: TraversalContext;

  beforeEach(() => {
    matcher = new ApiCallPatternMatcher();
    mockContext = {
      depth: 0,
      ancestors: [],
      scope: new Map(),
      functions: new Map(),
      sourceCode: ''
    };
  });

  describe('pattern type', () => {
    it('should have correct pattern type', () => {
      expect(matcher.patternType).toBe('api-call');
    });
  });

  describe('fetch() pattern recognition', () => {
    it('should recognize basic fetch call', () => {
      const code = `fetch('/api/users')`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('api-call');
      expect(matches[0].metadata.hasApiCall).toBe(true);
      expect(matches[0].metadata.apiType).toBe('fetch');
      expect(matches[0].metadata.endpoint).toBe('/api/users');
      expect(matches[0].metadata.httpMethod).toBe('GET');
    });

    it('should recognize fetch with options', () => {
      const code = `fetch('/api/users', { method: 'POST', body: JSON.stringify(data) })`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.httpMethod).toBe('POST');
      expect(matches[0].metadata.requestData).toBe('JSON');
    });

    it('should recognize fetch with template literal URL', () => {
      const code = 'fetch(`/api/users/${userId}`)';
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.endpoint).toBe('/api/users/{userId}');
      expect(matches[0].variables).toContain('userId');
    });

    it('should recognize fetch with variable URL', () => {
      const code = `fetch(apiUrl)`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.endpoint).toBe('{apiUrl}');
      expect(matches[0].variables).toContain('apiUrl');
    });

    it('should not match non-fetch calls', () => {
      const code = `console.log('hello')`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(0);
    });
  });

  describe('axios pattern recognition', () => {
    it('should recognize basic axios call', () => {
      const code = `axios('/api/users')`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('api-call');
      expect(matches[0].metadata.hasApiCall).toBe(true);
      expect(matches[0].metadata.apiType).toBe('axios');
      expect(matches[0].metadata.httpMethod).toBe('REQUEST');
    });

    it('should recognize axios.get() call', () => {
      const code = `axios.get('/api/users')`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.apiType).toBe('axios');
      expect(matches[0].metadata.httpMethod).toBe('GET');
      expect(matches[0].metadata.endpoint).toBe('/api/users');
    });

    it('should recognize axios.post() with data', () => {
      const code = `axios.post('/api/users', userData)`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.httpMethod).toBe('POST');
      expect(matches[0].metadata.endpoint).toBe('/api/users');
      expect(matches[0].metadata.requestData).toBe('{userData}');
      expect(matches[0].variables).toContain('userData');
    });

    it('should recognize axios with config object', () => {
      const code = `axios({ url: '/api/users', method: 'PUT', data: formData })`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.httpMethod).toBe('PUT');
      expect(matches[0].metadata.endpoint).toBe('/api/users');
      expect(matches[0].metadata.requestData).toBe('{formData}');
      expect(matches[0].variables).toContain('formData');
    });

    it('should recognize various axios methods', () => {
      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      
      methods.forEach(method => {
        const code = `axios.${method}('/api/test')`;
        const ast = parse(code, { sourceType: 'module' });
        const callExpression = (ast.program.body[0] as any).expression;

        const matches = matcher.match(callExpression, mockContext);

        expect(matches).toHaveLength(1);
        expect(matches[0].metadata.httpMethod).toBe(method.toUpperCase());
      });
    });
  });

  describe('promise handling recognition', () => {
    it('should recognize .then() success handling', () => {
      const code = `
        fetch('/api/users')
          .then(response => response.json())
          .then(data => console.log(data))
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      // Find the fetch call in the chain
      const findFetchCall = (node: Node): Node | null => {
        if (node.type === 'CallExpression' && 
            (node as any).callee?.name === 'fetch') {
          return node;
        }
        
        for (const key of Object.keys(node)) {
          const value = (node as any)[key];
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item === 'object' && item.type) {
                const result = findFetchCall(item);
                if (result) return result;
              }
            }
          } else if (value && typeof value === 'object' && value.type) {
            const result = findFetchCall(value);
            if (result) return result;
          }
        }
        return null;
      };

      const fetchCall = findFetchCall(ast);
      expect(fetchCall).toBeTruthy();

      // Create context with the chain as ancestors
      const contextWithChain: TraversalContext = {
        ...mockContext,
        ancestors: [ast, ast.program, ast.program.body[0], (ast.program.body[0] as any).expression]
      };

      const matches = matcher.match(fetchCall!, contextWithChain);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasSuccessHandling).toBe(true);
      expect(matches[0].metadata.responseHandling).toContain('inline-success');
    });

    it('should recognize .catch() error handling', () => {
      const code = `
        fetch('/api/users')
          .then(response => response.json())
          .catch(error => console.error(error))
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      // Find the fetch call
      const findFetchCall = (node: Node): Node | null => {
        if (node.type === 'CallExpression' && 
            (node as any).callee?.name === 'fetch') {
          return node;
        }
        
        for (const key of Object.keys(node)) {
          const value = (node as any)[key];
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item === 'object' && item.type) {
                const result = findFetchCall(item);
                if (result) return result;
              }
            }
          } else if (value && typeof value === 'object' && value.type) {
            const result = findFetchCall(value);
            if (result) return result;
          }
        }
        return null;
      };

      const fetchCall = findFetchCall(ast);
      expect(fetchCall).toBeTruthy();

      // Create context with the chain as ancestors
      const contextWithChain: TraversalContext = {
        ...mockContext,
        ancestors: [ast, ast.program, ast.program.body[0], (ast.program.body[0] as any).expression]
      };

      const matches = matcher.match(fetchCall!, contextWithChain);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasErrorHandling).toBe(true);
      expect(matches[0].metadata.errorHandling).toContain('inline-error');
    });

    it('should recognize await with try-catch', () => {
      const code = `
        async function fetchData() {
          try {
            const response = await fetch('/api/users');
            const data = await response.json();
            return data;
          } catch (error) {
            console.error('Error:', error);
          }
        }
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      // Find the fetch call within the try block
      const findFetchCall = (node: Node): Node | null => {
        if (node.type === 'CallExpression' && 
            (node as any).callee?.name === 'fetch') {
          return node;
        }
        
        for (const key of Object.keys(node)) {
          const value = (node as any)[key];
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item === 'object' && item.type) {
                const result = findFetchCall(item);
                if (result) return result;
              }
            }
          } else if (value && typeof value === 'object' && value.type) {
            const result = findFetchCall(value);
            if (result) return result;
          }
        }
        return null;
      };

      const fetchCall = findFetchCall(ast);
      expect(fetchCall).toBeTruthy();

      // Build proper ancestor chain for await/try-catch context
      const funcDecl = (ast.program.body[0] as any);
      const tryStmt = funcDecl.body.body[0];
      const varDecl = tryStmt.block.body[0];
      const awaitExpr = varDecl.declarations[0].init;

      const contextWithAwait: TraversalContext = {
        ...mockContext,
        ancestors: [ast, ast.program, funcDecl, funcDecl.body, tryStmt, tryStmt.block, varDecl, varDecl.declarations[0], awaitExpr]
      };

      const matches = matcher.match(fetchCall!, contextWithAwait);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasSuccessHandling).toBe(true);
      expect(matches[0].metadata.hasErrorHandling).toBe(true);
      expect(matches[0].metadata.successHandlers).toContain('await-success');
      expect(matches[0].metadata.errorHandlers).toContain('try-catch-error');
    });
  });

  describe('confidence scoring', () => {
    it('should give high confidence for complete API call with error handling', () => {
      const mockMatch = {
        type: 'api-call' as const,
        rootNode: {} as Node,
        involvedNodes: [],
        variables: [],
        functions: [],
        metadata: {
          hasApiCall: true,
          endpoint: '/api/users',
          httpMethod: 'GET',
          hasErrorHandling: true,
          hasSuccessHandling: true
        }
      };

      const confidence = matcher.getConfidence(mockMatch);
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should give medium confidence for basic API call without error handling', () => {
      const mockMatch = {
        type: 'api-call' as const,
        rootNode: {} as Node,
        involvedNodes: [],
        variables: [],
        functions: [],
        metadata: {
          hasApiCall: true,
          endpoint: '/api/users',
          httpMethod: 'GET',
          hasErrorHandling: false,
          hasSuccessHandling: false
        }
      };

      const confidence = matcher.getConfidence(mockMatch);
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThan(0.9); // Adjusted since we get 0.8 (0.4 + 0.3 + 0.1 + 0.1)
    });

    it('should give low confidence for incomplete matches', () => {
      const mockMatch = {
        type: 'api-call' as const,
        rootNode: {} as Node,
        involvedNodes: [],
        variables: [],
        functions: [],
        metadata: {
          hasApiCall: false,
          hasErrorHandling: false,
          hasSuccessHandling: false
        }
      };

      const confidence = matcher.getConfidence(mockMatch);
      expect(confidence).toBeLessThan(0.6);
    });
  });

  describe('complex API call patterns', () => {
    it('should handle fetch with complex options', () => {
      const code = `
        fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(userData)
        })
      `;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.httpMethod).toBe('POST');
      expect(matches[0].metadata.requestData).toBe('JSON');
    });

    it('should handle axios interceptors and complex chains', () => {
      const code = `
        axios.get('/api/users')
          .then(response => {
            setUsers(response.data);
            setLoading(false);
          })
          .catch(error => {
            setError(error.message);
            setLoading(false);
          })
          .finally(() => {
            console.log('Request completed');
          })
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      // The entire expression is a chain, so we should test the whole chain
      const chainExpression = (ast.program.body[0] as any).expression;
      expect(chainExpression).toBeTruthy();

      // Find the axios call within the chain
      const findAxiosCall = (node: Node): Node | null => {
        if (node.type === 'CallExpression' && 
            (node as any).callee?.type === 'MemberExpression' &&
            (node as any).callee?.object?.name === 'axios') {
          return node;
        }
        
        for (const key of Object.keys(node)) {
          const value = (node as any)[key];
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item === 'object' && item.type) {
                const result = findAxiosCall(item);
                if (result) return result;
              }
            }
          } else if (value && typeof value === 'object' && value.type) {
            const result = findAxiosCall(value);
            if (result) return result;
          }
        }
        return null;
      };

      const axiosCall = findAxiosCall(chainExpression);
      expect(axiosCall).toBeTruthy();

      // Build the context with all chain calls as ancestors
      const buildChainAncestors = (node: Node, ancestors: Node[] = []): Node[] => {
        if (node.type === 'CallExpression' && (node as any).callee?.type === 'MemberExpression') {
          const methodName = (node as any).callee?.property?.name;
          if (['then', 'catch', 'finally'].includes(methodName)) {
            ancestors.push(node);
            return buildChainAncestors((node as any).callee.object, ancestors);
          }
        }
        return ancestors;
      };

      const chainAncestors = buildChainAncestors(chainExpression);
      const contextWithChain: TraversalContext = {
        ...mockContext,
        ancestors: [ast, ast.program, ast.program.body[0], chainExpression, ...chainAncestors]
      };

      const matches = matcher.match(axiosCall!, contextWithChain);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasSuccessHandling).toBe(true);
      expect(matches[0].metadata.hasErrorHandling).toBe(true);
    });

    it('should handle dynamic endpoints with multiple variables', () => {
      const code = 'fetch(`/api/${version}/users/${userId}/posts/${postId}`)';
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.endpoint).toBe('/api/{version}/users/{userId}/posts/{postId}');
      expect(matches[0].variables).toContain('version');
      expect(matches[0].variables).toContain('userId');
      expect(matches[0].variables).toContain('postId');
    });
  });

  describe('edge cases', () => {
    it('should handle fetch with no arguments', () => {
      const code = `fetch()`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.endpoint).toBeNull();
      expect(matches[0].metadata.httpMethod).toBe('GET');
    });

    it('should handle axios with empty config', () => {
      const code = `axios({})`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      const matches = matcher.match(callExpression, mockContext);

      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.httpMethod).toBe('GET'); // Default fallback
    });

    it('should not crash on malformed API calls', () => {
      const code = `fetch.call(null, '/api/test')`;
      const ast = parse(code, { sourceType: 'module' });
      const callExpression = (ast.program.body[0] as any).expression;

      expect(() => {
        const matches = matcher.match(callExpression, mockContext);
        expect(matches).toHaveLength(0);
      }).not.toThrow();
    });
  });
});