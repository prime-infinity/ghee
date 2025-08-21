import { describe, it, expect } from 'vitest';
import { ASTParserService } from '../ASTParserService';
import type { ParseResult, ValidationResult } from '../../types';

describe('ASTParserService Integration', () => {
  it('should integrate properly with type definitions', async () => {
    const parser = new ASTParserService();
    
    // Test that the service returns the correct types
    const parseResult: ParseResult = await parser.parseCode('const x = 5;');
    expect(parseResult).toBeDefined();
    expect(parseResult.ast).toBeDefined();
    expect(parseResult.errors).toBeInstanceOf(Array);
    expect(parseResult.language).toMatch(/^(javascript|typescript)$/);
    
    const validationResult: ValidationResult = parser.validateSyntax('const x = 5;');
    expect(validationResult).toBeDefined();
    expect(typeof validationResult.isValid).toBe('boolean');
    expect(validationResult.errors).toBeInstanceOf(Array);
    expect(validationResult.warnings).toBeInstanceOf(Array);
  });

  it('should handle real-world React counter pattern', async () => {
    const parser = new ASTParserService();
    const counterCode = `
      import React, { useState } from 'react';
      
      function Counter() {
        const [count, setCount] = useState(0);
        
        const handleClick = () => {
          setCount(count + 1);
        };
        
        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={handleClick}>
              Increment
            </button>
          </div>
        );
      }
      
      export default Counter;
    `;
    
    const result = await parser.parseCode(counterCode);
    expect(result.errors).toHaveLength(0);
    expect(result.language).toMatch(/^(javascript|typescript)$/); // JSX can be detected as TypeScript
    expect(result.ast.type).toBe('File');
  });

  it('should handle real-world API call pattern', async () => {
    const parser = new ASTParserService();
    const apiCode = `
      async function fetchUserData(userId: string) {
        try {
          const response = await fetch(\`/api/users/\${userId}\`);
          
          if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
          }
          
          const userData = await response.json();
          return userData;
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          throw error;
        }
      }
    `;
    
    const result = await parser.parseCode(apiCode);
    expect(result.errors).toHaveLength(0);
    expect(result.language).toBe('typescript');
    expect(result.ast.type).toBe('File');
  });
});