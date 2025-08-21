import { describe, it, expect, beforeEach } from 'vitest';
import { PatternRecognitionEngine } from '../../PatternRecognitionEngine';
import { ASTParserService } from '../../ASTParserService';

describe('API Call Pattern Integration', () => {
  let engine: PatternRecognitionEngine;
  let parser: ASTParserService;

  beforeEach(() => {
    engine = new PatternRecognitionEngine();
    parser = new ASTParserService();
  });

  it('should recognize fetch API call patterns in real code', async () => {
    const code = `
      async function fetchUsers() {
        try {
          const response = await fetch('/api/users');
          const users = await response.json();
          return users;
        } catch (error) {
          console.error('Failed to fetch users:', error);
          throw error;
        }
      }
    `;

    const parseResult = await parser.parseCode(code);
    expect(parseResult.errors).toHaveLength(0);

    const patterns = engine.recognizePatterns(parseResult.ast, code);
    
    // Should find at least one API call pattern
    const apiCallPatterns = patterns.filter(p => p.type === 'api-call');
    expect(apiCallPatterns.length).toBeGreaterThan(0);

    const fetchPattern = apiCallPatterns[0];
    expect(fetchPattern.metadata.apiType).toBe('fetch');
    expect(fetchPattern.metadata.endpoint).toBe('/api/users');
    expect(fetchPattern.metadata.httpMethod).toBe('GET');
    expect(fetchPattern.metadata.hasSuccessHandling).toBe(true);
    expect(fetchPattern.metadata.hasErrorHandling).toBe(true);
  });

  it('should recognize axios API call patterns in real code', async () => {
    const code = `
      const createUser = async (userData) => {
        return axios.post('/api/users', userData);
      };
    `;

    const parseResult = await parser.parseCode(code);
    expect(parseResult.errors).toHaveLength(0);

    const patterns = engine.recognizePatterns(parseResult.ast, code);
    
    // Should find at least one API call pattern
    const apiCallPatterns = patterns.filter(p => p.type === 'api-call');
    expect(apiCallPatterns.length).toBeGreaterThan(0);

    const axiosPattern = apiCallPatterns[0];
    expect(axiosPattern.metadata.apiType).toBe('axios');
    expect(axiosPattern.metadata.endpoint).toBe('/api/users');
    expect(axiosPattern.metadata.httpMethod).toBe('POST');
    expect(axiosPattern.metadata.variables).toContain('userData');
  });

  it('should recognize multiple API calls in the same code', async () => {
    const code = `
      const userService = {
        async getUser(id) {
          const response = await fetch(\`/api/users/\${id}\`);
          return response.json();
        },
        
        async updateUser(id, data) {
          return axios.put(\`/api/users/\${id}\`, data);
        },
        
        async deleteUser(id) {
          return fetch(\`/api/users/\${id}\`, { method: 'DELETE' });
        }
      };
    `;

    const parseResult = await parser.parseCode(code);
    expect(parseResult.errors).toHaveLength(0);

    const patterns = engine.recognizePatterns(parseResult.ast, code);
    
    // Should find multiple API call patterns
    const apiCallPatterns = patterns.filter(p => p.type === 'api-call');
    expect(apiCallPatterns.length).toBe(3);

    // Check that we have different HTTP methods
    const methods = apiCallPatterns.map(p => p.metadata.httpMethod);
    expect(methods).toContain('GET');
    expect(methods).toContain('PUT');
    expect(methods).toContain('DELETE');

    // Check that we have both fetch and axios
    const apiTypes = apiCallPatterns.map(p => p.metadata.apiType);
    expect(apiTypes).toContain('fetch');
    expect(apiTypes).toContain('axios');
  });

  it('should handle complex API call patterns with error handling', async () => {
    const code = `
      async function makeRequest() {
        try {
          const response = await axios.get('/api/data');
          return response.data;
        } catch (error) {
          console.error('Request failed:', error);
          throw error;
        }
      }
    `;

    const parseResult = await parser.parseCode(code);
    expect(parseResult.errors).toHaveLength(0);

    const patterns = engine.recognizePatterns(parseResult.ast, code);
    
    // Should find API call pattern
    const apiCallPatterns = patterns.filter(p => p.type === 'api-call');
    expect(apiCallPatterns.length).toBeGreaterThan(0);

    const axiosPattern = apiCallPatterns[0];
    expect(axiosPattern.metadata.apiType).toBe('axios');
    expect(axiosPattern.metadata.endpoint).toBe('/api/data');
    expect(axiosPattern.metadata.httpMethod).toBe('GET');
    expect(axiosPattern.metadata.hasSuccessHandling).toBe(true);
    expect(axiosPattern.metadata.hasErrorHandling).toBe(true);
  });
});