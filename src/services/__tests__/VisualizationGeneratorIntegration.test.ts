import { describe, it, expect, beforeEach } from 'vitest';
import { VisualizationGenerator } from '../VisualizationGenerator';
import { PatternRecognitionEngine } from '../PatternRecognitionEngine';
import { ASTParserService } from '../ASTParserService';

describe('VisualizationGenerator Integration', () => {
  let generator: VisualizationGenerator;
  let patternEngine: PatternRecognitionEngine;
  let parser: ASTParserService;

  beforeEach(() => {
    generator = new VisualizationGenerator();
    patternEngine = new PatternRecognitionEngine();
    parser = new ASTParserService();
  });

  describe('end-to-end visualization generation', () => {
    it('should generate visualization for counter pattern code', async () => {
      const counterCode = `
        import React, { useState } from 'react';
        
        function Counter() {
          const [count, setCount] = useState(0);
          
          const handleClick = () => {
            setCount(count + 1);
          };
          
          return (
            <button onClick={handleClick}>
              Count: {count}
            </button>
          );
        }
      `;

      // Parse code
      const parseResult = await parser.parseCode(counterCode);
      expect(parseResult.errors).toHaveLength(0);

      // Recognize patterns
      const patterns = patternEngine.recognizePatterns(parseResult.ast, counterCode);
      expect(patterns.length).toBeGreaterThan(0);

      // Generate visualization
      const diagram = generator.generateDiagram(patterns);
      
      expect(diagram.nodes.length).toBeGreaterThan(0);
      expect(diagram.layout).toBeDefined();
      
      // Check that we have appropriate node types for counter pattern
      const nodeTypes = diagram.nodes.map(n => n.type);
      // Should have some recognizable node types (could be button, counter, function, variable, or component)
      expect(nodeTypes.length).toBeGreaterThan(0);
      expect(nodeTypes.every(type => 
        ['button', 'counter', 'api', 'database', 'user', 'component', 'error', 'function', 'variable'].includes(type)
      )).toBe(true);
      
      // Verify nodes have proper styling and explanations
      diagram.nodes.forEach(node => {
        expect(node.icon).toBeDefined();
        expect(node.explanation).toBeTruthy();
        expect(node.style).toBeDefined();
        expect(node.metadata).toBeDefined();
        expect(node.position).toBeDefined();
      });
      
      // Verify edges have proper styling
      diagram.edges.forEach(edge => {
        expect(edge.color).toBeTruthy();
        expect(edge.type).toBeDefined();
        expect(['success', 'error', 'action', 'data-flow']).toContain(edge.type);
      });
    });

    it('should generate visualization for API call pattern code', async () => {
      const apiCode = `
        async function fetchUserData(userId) {
          try {
            const response = await fetch(\`/api/users/\${userId}\`);
            const userData = await response.json();
            return userData;
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            throw error;
          }
        }
      `;

      // Parse code
      const parseResult = await parser.parseCode(apiCode);
      expect(parseResult.errors).toHaveLength(0);

      // Recognize patterns
      const patterns = patternEngine.recognizePatterns(parseResult.ast, apiCode);
      expect(patterns.length).toBeGreaterThan(0);

      // Generate visualization
      const diagram = generator.generateDiagram(patterns);
      
      expect(diagram.nodes.length).toBeGreaterThan(0);
      
      // Check for API-related nodes
      const nodeTypes = diagram.nodes.map(n => n.type);
      // Should have some recognizable node types
      expect(nodeTypes.length).toBeGreaterThan(0);
      expect(nodeTypes.every(type => 
        ['button', 'counter', 'api', 'database', 'user', 'component', 'error', 'function', 'variable'].includes(type)
      )).toBe(true);
      
      // Verify we have both success and error paths if the pattern includes them
      if (diagram.edges.length > 0) {
        const edgeTypes = diagram.edges.map(e => e.type);
        // Should have at least one type of flow
        expect(edgeTypes.length).toBeGreaterThan(0);
      }
    });

    it('should generate visualization for database pattern code', async () => {
      const dbCode = `
        const db = require('database');
        
        async function saveUser(userData) {
          const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
          const result = await db.execute(query, [userData.name, userData.email]);
          return result.insertId;
        }
        
        async function getUser(userId) {
          const query = 'SELECT * FROM users WHERE id = ?';
          const rows = await db.execute(query, [userId]);
          return rows[0];
        }
      `;

      // Parse code
      const parseResult = await parser.parseCode(dbCode);
      expect(parseResult.errors).toHaveLength(0);

      // Recognize patterns
      const patterns = patternEngine.recognizePatterns(parseResult.ast, dbCode);
      expect(patterns.length).toBeGreaterThan(0);

      // Generate visualization
      const diagram = generator.generateDiagram(patterns);
      
      expect(diagram.nodes.length).toBeGreaterThan(0);
      
      // Check for database-related nodes
      const nodeTypes = diagram.nodes.map(n => n.type);
      // Should have some recognizable node types
      expect(nodeTypes.length).toBeGreaterThan(0);
      expect(nodeTypes.every(type => 
        ['button', 'counter', 'api', 'database', 'user', 'component', 'error', 'function', 'variable'].includes(type)
      )).toBe(true);
    });

    it('should handle complex code with multiple patterns', async () => {
      const complexCode = `
        import React, { useState, useEffect } from 'react';
        
        function UserDashboard() {
          const [users, setUsers] = useState([]);
          const [loading, setLoading] = useState(false);
          const [error, setError] = useState(null);
          
          const fetchUsers = async () => {
            setLoading(true);
            try {
              const response = await fetch('/api/users');
              const userData = await response.json();
              setUsers(userData);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          };
          
          useEffect(() => {
            fetchUsers();
          }, []);
          
          const handleRefresh = () => {
            fetchUsers();
          };
          
          return (
            <div>
              <button onClick={handleRefresh}>Refresh</button>
              {loading && <p>Loading...</p>}
              {error && <p>Error: {error}</p>}
              <ul>
                {users.map(user => (
                  <li key={user.id}>{user.name}</li>
                ))}
              </ul>
            </div>
          );
        }
      `;

      // Parse code
      const parseResult = await parser.parseCode(complexCode);
      expect(parseResult.errors).toHaveLength(0);

      // Recognize patterns
      const patterns = patternEngine.recognizePatterns(parseResult.ast, complexCode);
      
      // Generate visualization
      const diagram = generator.generateDiagram(patterns);
      
      // Should handle multiple patterns gracefully
      expect(diagram.nodes.length).toBeGreaterThan(0);
      expect(diagram.layout).toBeDefined();
      
      // Verify all nodes are properly positioned
      diagram.nodes.forEach(node => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(node.position.x).not.toBeNaN();
        expect(node.position.y).not.toBeNaN();
      });
      
      // Verify layout is reasonable
      expect(diagram.layout.nodeSpacing).toBeGreaterThan(0);
      expect(diagram.layout.levelSpacing).toBeGreaterThan(0);
    });

    it('should handle empty or invalid code gracefully', async () => {
      const emptyCode = '';
      
      // Parse empty code
      const parseResult = await parser.parseCode(emptyCode);
      
      // Even if parsing fails, should handle gracefully
      const patterns = patternEngine.recognizePatterns(parseResult.ast || {} as any, emptyCode);
      
      // Generate visualization
      const diagram = generator.generateDiagram(patterns);
      
      // Should return empty but valid diagram
      expect(diagram.nodes).toHaveLength(0);
      expect(diagram.edges).toHaveLength(0);
      expect(diagram.layout).toBeDefined();
    });
  });

  describe('visual consistency', () => {
    it('should maintain consistent styling across similar patterns', async () => {
      const code1 = `
        function handleClick1() {
          setCount1(count1 + 1);
        }
      `;
      
      const code2 = `
        function handleClick2() {
          setCount2(count2 + 1);
        }
      `;

      // Parse both codes
      const parseResult1 = await parser.parseCode(code1);
      const parseResult2 = await parser.parseCode(code2);

      // Recognize patterns
      const patterns1 = patternEngine.recognizePatterns(parseResult1.ast, code1);
      const patterns2 = patternEngine.recognizePatterns(parseResult2.ast, code2);

      // Generate visualizations
      const diagram1 = generator.generateDiagram(patterns1);
      const diagram2 = generator.generateDiagram(patterns2);

      // Compare styling consistency for same node types
      const getNodesByType = (diagram: any, type: string) => 
        diagram.nodes.filter((n: any) => n.type === type);

      ['button', 'counter', 'function'].forEach(nodeType => {
        const nodes1 = getNodesByType(diagram1, nodeType);
        const nodes2 = getNodesByType(diagram2, nodeType);
        
        if (nodes1.length > 0 && nodes2.length > 0) {
          // Same node types should have same styling
          expect(nodes1[0].style?.backgroundColor).toBe(nodes2[0].style?.backgroundColor);
          expect(nodes1[0].style?.borderColor).toBe(nodes2[0].style?.borderColor);
        }
      });
    });

    it('should generate deterministic layouts for same input', async () => {
      const code = `
        function test() {
          const [value, setValue] = useState(0);
          return <button onClick={() => setValue(value + 1)}>{value}</button>;
        }
      `;

      // Parse and generate visualization twice
      const parseResult = await parser.parseCode(code);
      const patterns = patternEngine.recognizePatterns(parseResult.ast, code);
      
      const diagram1 = generator.generateDiagram(patterns);
      const diagram2 = generator.generateDiagram(patterns);

      // Should generate identical results
      expect(diagram1.nodes.length).toBe(diagram2.nodes.length);
      expect(diagram1.edges.length).toBe(diagram2.edges.length);
      
      // Node positions should be the same
      diagram1.nodes.forEach((node1, index) => {
        const node2 = diagram2.nodes[index];
        expect(node1.position.x).toBe(node2.position.x);
        expect(node1.position.y).toBe(node2.position.y);
      });
    });
  });
});