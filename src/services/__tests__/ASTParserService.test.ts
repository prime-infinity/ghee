import { describe, it, expect, beforeEach } from 'vitest';
import { ASTParserService } from '../ASTParserService';

describe('ASTParserService', () => {
  let parser: ASTParserService;

  beforeEach(() => {
    parser = new ASTParserService();
  });

  describe('parseCode', () => {
    it('should parse simple JavaScript code successfully', async () => {
      const code = 'const x = 5;';
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(0);
      expect(result.language).toBe('javascript');
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('File');
    });

    it('should parse simple TypeScript code successfully', async () => {
      const code = 'const x: number = 5;';
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(0);
      expect(result.language).toBe('typescript');
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('File');
    });

    it('should parse React component with hooks', async () => {
      const code = `
        import React, { useState } from 'react';
        
        function Counter() {
          const [count, setCount] = useState(0);
          
          return (
            <button onClick={() => setCount(count + 1)}>
              Count: {count}
            </button>
          );
        }
      `;
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('File');
    });

    it('should parse API call patterns', async () => {
      const code = `
        async function fetchData() {
          try {
            const response = await fetch('/api/data');
            const data = await response.json();
            return data;
          } catch (error) {
            console.error('Failed to fetch data:', error);
            throw error;
          }
        }
      `;
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    it('should parse database operation patterns', async () => {
      const code = `
        const db = require('database');
        
        async function getUser(id) {
          const query = 'SELECT * FROM users WHERE id = ?';
          const result = await db.query(query, [id]);
          return result[0];
        }
        
        async function createUser(userData) {
          const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
          return await db.query(query, [userData.name, userData.email]);
        }
      `;
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    it('should handle syntax errors gracefully', async () => {
      const code = 'const x = ;'; // Missing value
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
      expect(result.errors[0].message).toContain('Unexpected');
      expect(result.errors[0].line).toBe(1);
      expect(result.errors[0].suggestion).toBeDefined();
    });

    it('should handle complex TypeScript interfaces', async () => {
      const code = `
        interface User {
          id: number;
          name: string;
          email?: string;
          roles: string[];
        }
        
        type UserWithTimestamps = User & {
          createdAt: Date;
          updatedAt: Date;
        };
        
        enum UserRole {
          ADMIN = 'admin',
          USER = 'user',
          GUEST = 'guest'
        }
      `;
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(0);
      expect(result.language).toBe('typescript');
      expect(result.ast).toBeDefined();
    });

    it('should fallback from TypeScript to JavaScript when needed', async () => {
      // Code that looks like TypeScript but has JS-only features
      const code = `
        const x: any = 5;
        with (x) { // 'with' is not allowed in TypeScript strict mode
          console.log('test');
        }
      `;
      const result = await parser.parseCode(code);

      // Should either parse successfully or provide meaningful errors
      expect(result.ast).toBeDefined();
    });

    it('should handle empty code', async () => {
      const code = '';
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('empty');
    });

    it('should handle malformed JSX', async () => {
      const code = `
        function Component() {
          return <div><span>Unclosed div;
        }
      `;
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
    });
  });

  describe('validateSyntax', () => {
    it('should validate correct JavaScript syntax', () => {
      const code = 'const x = 5; console.log(x);';
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct TypeScript syntax', () => {
      const code = 'const x: number = 5; console.log(x);';
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect syntax errors', () => {
      const code = 'const x = {;'; // Malformed object
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
    });

    it('should return false for empty code', () => {
      const code = '';
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('empty');
    });

    it('should return false for whitespace-only code', () => {
      const code = '   \n  \t  ';
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should provide warnings for console.log statements', () => {
      const code = 'const x = 5; console.log(x);';
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('Console.log');
    });

    it('should provide warnings for missing semicolons', () => {
      const code = 'const x = 5\nreturn x';
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('semicolon'))).toBe(true);
    });

    it('should handle complex nested structures', () => {
      const code = `
        const config = {
          api: {
            endpoints: {
              users: '/api/users',
              posts: '/api/posts'
            },
            timeout: 5000
          },
          features: ['auth', 'posts', 'comments']
        };
      `;
      const result = parser.validateSyntax(code);

      expect(result.isValid).toBe(true);
    });
  });

  describe('language detection', () => {
    it('should detect TypeScript from type annotations', async () => {
      const code = 'function test(x: string): number { return x.length; }';
      const result = await parser.parseCode(code);

      expect(result.language).toBe('typescript');
    });

    it('should detect TypeScript from interfaces', async () => {
      const code = 'interface User { name: string; }';
      const result = await parser.parseCode(code);

      expect(result.language).toBe('typescript');
    });

    it('should detect TypeScript from type aliases', async () => {
      const code = 'type UserId = string | number;';
      const result = await parser.parseCode(code);

      expect(result.language).toBe('typescript');
    });

    it('should detect TypeScript from enums', async () => {
      const code = 'enum Color { RED, GREEN, BLUE }';
      const result = await parser.parseCode(code);

      expect(result.language).toBe('typescript');
    });

    it('should detect TypeScript from generics', async () => {
      const code = 'function identity<T>(arg: T): T { return arg; }';
      const result = await parser.parseCode(code);

      expect(result.language).toBe('typescript');
    });

    it('should detect TypeScript from access modifiers', async () => {
      const code = 'class User { private name: string; }';
      const result = await parser.parseCode(code);

      expect(result.language).toBe('typescript');
    });

    it('should default to JavaScript for plain JS code', async () => {
      const code = 'function test(x) { return x * 2; }';
      const result = await parser.parseCode(code);

      expect(result.language).toBe('javascript');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle unterminated strings', async () => {
      const code = 'const message = "Hello world';
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].suggestion).toContain('unclosed');
    });

    it('should handle mismatched brackets', async () => {
      const code = 'const obj = { key: "value" ];';
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].suggestion).toContain('brackets');
    });

    it('should handle invalid assignment targets', async () => {
      const code = '5 = x;';
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].suggestion).toContain('assignment');
    });

    it('should provide line and column information for errors', async () => {
      const code = `
        const x = 5;
        const y = {;
        const z = 10;
      `;
      const result = await parser.parseCode(code);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(3);
      expect(result.errors[0].column).toBeGreaterThan(0);
    });

    it('should handle very large code files gracefully', async () => {
      // Generate a large but valid code string
      const largeCode = Array(100).fill('const x = 5;').join('\n');
      const result = await parser.parseCode(largeCode);

      expect(result.ast).toBeDefined();
      // Large files might generate warnings but should still parse
      expect(result.ast.type).toBe('File');
    });
  });
});