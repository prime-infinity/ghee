import { describe, it, expect, beforeEach } from 'vitest';
import { VisualizationGenerator } from '../VisualizationGenerator';
import type { RecognizedPattern } from '../../types/patterns';

describe('VisualizationGenerator', () => {
  let generator: VisualizationGenerator;

  beforeEach(() => {
    generator = new VisualizationGenerator();
  });

  describe('generateDiagram', () => {
    it('should return empty diagram when no patterns provided', () => {
      const result = generator.generateDiagram([]);
      
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.layout).toBeDefined();
      expect(result.layout.direction).toBe('vertical');
    });

    it('should generate diagram with single pattern', () => {
      const pattern: RecognizedPattern = {
        id: 'test-pattern-1',
        type: 'counter',
        nodes: [
          {
            id: 'node-1',
            type: 'button',
            label: 'Click Me',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          },
          {
            id: 'node-2',
            type: 'counter',
            label: 'count',
            codeLocation: {
              start: 11,
              end: 20,
              startLine: 2,
              endLine: 2,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          }
        ],
        connections: [
          {
            id: 'connection-1',
            sourceId: 'node-1',
            targetId: 'node-2',
            type: 'event',
            label: 'click',
            properties: {}
          }
        ],
        metadata: {
          confidence: 0.9,
          codeLocation: {
            start: 0,
            end: 20,
            startLine: 1,
            endLine: 2,
            startColumn: 0,
            endColumn: 9
          },
          variables: ['count'],
          functions: ['handleClick'],
          complexity: 'simple'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      
      // Check nodes
      const buttonNode = result.nodes.find(n => n.type === 'button');
      const counterNode = result.nodes.find(n => n.type === 'counter');
      
      expect(buttonNode).toBeDefined();
      expect(counterNode).toBeDefined();
      expect(buttonNode!.label).toBe('Click Me');
      expect(counterNode!.label).toBe('count');
      
      // Check edge
      const edge = result.edges[0];
      expect(edge.label).toBe('click');
      expect(edge.type).toBe('action');
      expect(edge.color).toBe('#3b82f6'); // blue-500
    });

    it('should generate diagram with multiple patterns', () => {
      const patterns: RecognizedPattern[] = [
        {
          id: 'pattern-1',
          type: 'counter',
          nodes: [
            {
              id: 'node-1',
              type: 'button',
              label: 'Button',
              codeLocation: {
                start: 0,
                end: 10,
                startLine: 1,
                endLine: 1,
                startColumn: 0,
                endColumn: 10
              },
              properties: {}
            }
          ],
          connections: [],
          metadata: {
            confidence: 0.8,
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            variables: [],
            functions: [],
            complexity: 'simple'
          }
        },
        {
          id: 'pattern-2',
          type: 'api-call',
          nodes: [
            {
              id: 'node-2',
              type: 'api',
              label: 'fetchData',
              codeLocation: {
                start: 20,
                end: 30,
                startLine: 3,
                endLine: 3,
                startColumn: 0,
                endColumn: 10
              },
              properties: {}
            }
          ],
          connections: [],
          metadata: {
            confidence: 0.7,
            codeLocation: {
              start: 20,
              end: 30,
              startLine: 3,
              endLine: 3,
              startColumn: 0,
              endColumn: 10
            },
            variables: [],
            functions: ['fetchData'],
            complexity: 'medium'
          }
        }
      ];

      const result = generator.generateDiagram(patterns);
      
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(0);
      
      const buttonNode = result.nodes.find(n => n.type === 'button');
      const apiNode = result.nodes.find(n => n.type === 'api');
      
      expect(buttonNode).toBeDefined();
      expect(apiNode).toBeDefined();
    });
  });

  describe('node creation and styling', () => {
    it('should create visual nodes with correct icons and explanations', () => {
      const pattern: RecognizedPattern = {
        id: 'test-pattern',
        type: 'counter',
        nodes: [
          {
            id: 'button-node',
            type: 'button',
            label: 'Click Button',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          },
          {
            id: 'database-node',
            type: 'database',
            label: 'User DB',
            codeLocation: {
              start: 11,
              end: 20,
              startLine: 2,
              endLine: 2,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          },
          {
            id: 'error-node',
            type: 'error',
            label: 'Error Handler',
            codeLocation: {
              start: 21,
              end: 30,
              startLine: 3,
              endLine: 3,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          }
        ],
        connections: [],
        metadata: {
          confidence: 0.9,
          codeLocation: {
            start: 0,
            end: 30,
            startLine: 1,
            endLine: 3,
            startColumn: 0,
            endColumn: 9
          },
          variables: [],
          functions: [],
          complexity: 'simple'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      // Check button node
      const buttonNode = result.nodes.find(n => n.type === 'button')!;
      expect(buttonNode.explanation).toBe('A clickable button that users can press');
      expect(buttonNode.style?.backgroundColor).toBe('#dbeafe'); // blue-100
      expect(buttonNode.style?.borderColor).toBe('#3b82f6'); // blue-500
      
      // Check database node
      const databaseNode = result.nodes.find(n => n.type === 'database')!;
      expect(databaseNode.explanation).toBe('A place where information is stored');
      expect(databaseNode.style?.backgroundColor).toBe('#e0e7ff'); // indigo-100
      expect(databaseNode.style?.borderColor).toBe('#6366f1'); // indigo-500
      
      // Check error node
      const errorNode = result.nodes.find(n => n.type === 'error')!;
      expect(errorNode.explanation).toBe('Something that can go wrong');
      expect(errorNode.style?.backgroundColor).toBe('#fee2e2'); // red-100
      expect(errorNode.style?.borderColor).toBe('#ef4444'); // red-500
    });

    it('should include correct metadata in visual nodes', () => {
      const pattern: RecognizedPattern = {
        id: 'test-pattern',
        type: 'api-call',
        nodes: [
          {
            id: 'api-node',
            type: 'api',
            label: 'API Call',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {
              endpoint: '/api/users',
              method: 'GET'
            }
          }
        ],
        connections: [],
        metadata: {
          confidence: 0.85,
          codeLocation: {
            start: 0,
            end: 10,
            startLine: 1,
            endLine: 1,
            startColumn: 0,
            endColumn: 10
          },
          variables: ['response'],
          functions: ['fetchUsers'],
          complexity: 'medium'
        }
      };

      const result = generator.generateDiagram([pattern]);
      const apiNode = result.nodes[0];
      
      expect(apiNode.metadata.patternNodeId).toBe('api-node');
      expect(apiNode.metadata.patternType).toBe('api-call');
      expect(apiNode.metadata.codeLocation).toEqual({
        start: 0,
        end: 10
      });
      expect(apiNode.metadata.context).toEqual({
        endpoint: '/api/users',
        method: 'GET',
        patternConfidence: 0.85,
        complexity: 'medium'
      });
    });
  });

  describe('edge creation and styling', () => {
    it('should create edges with correct colors and styles', () => {
      const pattern: RecognizedPattern = {
        id: 'test-pattern',
        type: 'counter',
        nodes: [
          {
            id: 'node-1',
            type: 'button',
            label: 'Button',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          },
          {
            id: 'node-2',
            type: 'counter',
            label: 'Counter',
            codeLocation: {
              start: 11,
              end: 20,
              startLine: 2,
              endLine: 2,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          }
        ],
        connections: [
          {
            id: 'success-connection',
            sourceId: 'node-1',
            targetId: 'node-2',
            type: 'success-path',
            label: 'success',
            properties: {}
          },
          {
            id: 'error-connection',
            sourceId: 'node-1',
            targetId: 'node-2',
            type: 'error-path',
            label: 'error',
            properties: {}
          }
        ],
        metadata: {
          confidence: 0.9,
          codeLocation: {
            start: 0,
            end: 20,
            startLine: 1,
            endLine: 2,
            startColumn: 0,
            endColumn: 9
          },
          variables: [],
          functions: [],
          complexity: 'simple'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      expect(result.edges).toHaveLength(2);
      
      const successEdge = result.edges.find(e => e.label === 'success')!;
      expect(successEdge.type).toBe('success');
      expect(successEdge.color).toBe('#10b981'); // green-500
      expect(successEdge.style?.strokeWidth).toBe(3);
      
      const errorEdge = result.edges.find(e => e.type === 'error')!;
      expect(errorEdge).toBeDefined();
      expect(errorEdge.type).toBe('error');
      expect(errorEdge.color).toBe('#ef4444'); // red-500
      expect(errorEdge.style?.strokeWidth).toBe(3);
      expect(errorEdge.style?.strokeDasharray).toBe('5,5');
      expect(errorEdge.label).toContain('⚠️'); // Should have warning emoji
    });

    it('should map connection types to edge types correctly', () => {
      const pattern: RecognizedPattern = {
        id: 'test-pattern',
        type: 'api-call',
        nodes: [
          {
            id: 'node-1',
            type: 'user',
            label: 'User',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          },
          {
            id: 'node-2',
            type: 'api',
            label: 'API',
            codeLocation: {
              start: 11,
              end: 20,
              startLine: 2,
              endLine: 2,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          }
        ],
        connections: [
          {
            id: 'data-flow-connection',
            sourceId: 'node-1',
            targetId: 'node-2',
            type: 'data-flow',
            label: 'sends data',
            properties: {}
          },
          {
            id: 'event-connection',
            sourceId: 'node-1',
            targetId: 'node-2',
            type: 'event',
            label: 'triggers',
            properties: {}
          }
        ],
        metadata: {
          confidence: 0.8,
          codeLocation: {
            start: 0,
            end: 20,
            startLine: 1,
            endLine: 2,
            startColumn: 0,
            endColumn: 9
          },
          variables: [],
          functions: [],
          complexity: 'medium'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      const dataFlowEdge = result.edges.find(e => e.label === 'sends data')!;
      expect(dataFlowEdge.type).toBe('data-flow');
      expect(dataFlowEdge.color).toBe('#8b5cf6'); // purple-500
      expect(dataFlowEdge.animated).toBe(true);
      
      const eventEdge = result.edges.find(e => e.label === 'triggers')!;
      expect(eventEdge.type).toBe('action');
      expect(eventEdge.color).toBe('#3b82f6'); // blue-500
      expect(eventEdge.animated).toBe(true);
    });
  });

  describe('node positioning', () => {
    it('should position single node at origin', () => {
      const pattern: RecognizedPattern = {
        id: 'single-node-pattern',
        type: 'counter',
        nodes: [
          {
            id: 'single-node',
            type: 'button',
            label: 'Single Button',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          }
        ],
        connections: [],
        metadata: {
          confidence: 0.9,
          codeLocation: {
            start: 0,
            end: 10,
            startLine: 1,
            endLine: 1,
            startColumn: 0,
            endColumn: 10
          },
          variables: [],
          functions: [],
          complexity: 'simple'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].position).toEqual({ x: 0, y: 0 });
    });

    it('should position connected nodes in layers', () => {
      const pattern: RecognizedPattern = {
        id: 'layered-pattern',
        type: 'api-call',
        nodes: [
          {
            id: 'root-node',
            type: 'user',
            label: 'User',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          },
          {
            id: 'middle-node',
            type: 'api',
            label: 'API',
            codeLocation: {
              start: 11,
              end: 20,
              startLine: 2,
              endLine: 2,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          },
          {
            id: 'end-node',
            type: 'database',
            label: 'Database',
            codeLocation: {
              start: 21,
              end: 30,
              startLine: 3,
              endLine: 3,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          }
        ],
        connections: [
          {
            id: 'connection-1',
            sourceId: 'root-node',
            targetId: 'middle-node',
            type: 'data-flow',
            label: 'request',
            properties: {}
          },
          {
            id: 'connection-2',
            sourceId: 'middle-node',
            targetId: 'end-node',
            type: 'data-flow',
            label: 'query',
            properties: {}
          }
        ],
        metadata: {
          confidence: 0.8,
          codeLocation: {
            start: 0,
            end: 30,
            startLine: 1,
            endLine: 3,
            startColumn: 0,
            endColumn: 9
          },
          variables: [],
          functions: [],
          complexity: 'medium'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      expect(result.nodes).toHaveLength(3);
      
      // Check that nodes are positioned in different layers (different Y coordinates)
      const positions = result.nodes.map(n => n.position);
      const yCoordinates = positions.map(p => p.y);
      const uniqueYCoordinates = [...new Set(yCoordinates)];
      
      expect(uniqueYCoordinates.length).toBeGreaterThan(1);
      
      // Root node should be at Y=0
      const rootNode = result.nodes.find(n => n.label === 'User')!;
      expect(rootNode.position.y).toBe(0);
    });

    it('should handle multiple nodes in same layer', () => {
      const pattern: RecognizedPattern = {
        id: 'same-layer-pattern',
        type: 'counter',
        nodes: [
          {
            id: 'node-1',
            type: 'button',
            label: 'Button 1',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          },
          {
            id: 'node-2',
            type: 'button',
            label: 'Button 2',
            codeLocation: {
              start: 11,
              end: 20,
              startLine: 2,
              endLine: 2,
              startColumn: 0,
              endColumn: 9
            },
            properties: {}
          }
        ],
        connections: [], // No connections means both nodes are in same layer
        metadata: {
          confidence: 0.7,
          codeLocation: {
            start: 0,
            end: 20,
            startLine: 1,
            endLine: 2,
            startColumn: 0,
            endColumn: 9
          },
          variables: [],
          functions: [],
          complexity: 'simple'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      expect(result.nodes).toHaveLength(2);
      
      // Both nodes should be at same Y coordinate (same layer)
      expect(result.nodes[0].position.y).toBe(result.nodes[1].position.y);
      
      // But different X coordinates (spread horizontally)
      expect(result.nodes[0].position.x).not.toBe(result.nodes[1].position.x);
    });
  });

  describe('layout configuration', () => {
    it('should create appropriate layout config', () => {
      const pattern: RecognizedPattern = {
        id: 'layout-test-pattern',
        type: 'counter',
        nodes: [
          {
            id: 'test-node',
            type: 'button',
            label: 'Test Button',
            codeLocation: {
              start: 0,
              end: 10,
              startLine: 1,
              endLine: 1,
              startColumn: 0,
              endColumn: 10
            },
            properties: {}
          }
        ],
        connections: [],
        metadata: {
          confidence: 0.9,
          codeLocation: {
            start: 0,
            end: 10,
            startLine: 1,
            endLine: 1,
            startColumn: 0,
            endColumn: 10
          },
          variables: [],
          functions: [],
          complexity: 'simple'
        }
      };

      const result = generator.generateDiagram([pattern]);
      
      expect(result.layout.direction).toBe('vertical');
      expect(result.layout.nodeSpacing).toBe(150);
      expect(result.layout.levelSpacing).toBe(200);
      expect(result.layout.autoFit).toBe(true);
      expect(result.layout.padding).toEqual({
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
    });
  });
});