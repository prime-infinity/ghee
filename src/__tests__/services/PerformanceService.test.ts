import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { beforeEach } from 'vitest';
import { PerformanceService } from '../../services/PerformanceService';
import type { DiagramData } from '../../types/visualization';

describe('PerformanceService', () => {
  let performanceService: PerformanceService;

  beforeEach(() => {
    performanceService = new PerformanceService();
  });

  describe('analyzeCodeComplexity', () => {
    it('should analyze simple code correctly', () => {
      const simpleCode = `
        const greeting = "Hello World";
        console.log(greeting);
      `;

      const result = performanceService.analyzeCodeComplexity(simpleCode);

      expect(result.level).toBe('simple');
      expect(result.lines).toBe(2);
      expect(result.functions).toBe(0);
      expect(result.variables).toBe(1);
      expect(result.nestingDepth).toBe(0);
      expect(result.estimatedProcessingTime).toBe(1000);
    });

    it('should analyze medium complexity code correctly', () => {
      const mediumCode = `
        function Counter() {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('');
          const [data, setData] = useState([]);
          const [loading, setLoading] = useState(false);
          const [error, setError] = useState(null);
          
          const handleClick = () => {
            setCount(count + 1);
          };
          
          const handleNameChange = (e) => {
            setName(e.target.value);
          };
          
          const fetchData = async () => {
            setLoading(true);
            try {
              const response = await fetch('/api/data');
              const result = await response.json();
              setData(result);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          };
          
          const processData = (items) => {
            return items.map(item => {
              if (item.type === 'special') {
                return { ...item, processed: true };
              }
              return item;
            });
          };
          
          return (
            <div>
              <h1>{name}</h1>
              <button onClick={handleClick}>
                Count: {count}
              </button>
              <button onClick={fetchData}>
                Load Data
              </button>
              {loading && <div>Loading...</div>}
              {error && <div>Error: {error}</div>}
              {data.length > 0 && (
                <ul>
                  {processData(data).map(item => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        }
      `;

      const result = performanceService.analyzeCodeComplexity(mediumCode);

      expect(['medium', 'complex']).toContain(result.level);
      expect(result.functions).toBeGreaterThan(2);
      expect(result.variables).toBeGreaterThan(4);
      expect(result.reactHooks).toBeGreaterThan(2);
      expect(result.estimatedProcessingTime).toBeGreaterThan(1000);
    });

    it('should analyze complex code correctly', () => {
      const complexCode = `
        import React, { useState, useEffect, useCallback, useMemo } from 'react';
        import axios from 'axios';
        
        function ComplexComponent() {
          const [data, setData] = useState([]);
          const [loading, setLoading] = useState(false);
          const [error, setError] = useState(null);
          const [filter, setFilter] = useState('');
          const [sortBy, setSortBy] = useState('name');
          
          const fetchData = useCallback(async () => {
            setLoading(true);
            try {
              const response = await axios.get('/api/data');
              setData(response.data);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          }, []);
          
          useEffect(() => {
            fetchData();
          }, [fetchData]);
          
          const filteredData = useMemo(() => {
            return data.filter(item => {
              if (filter) {
                return item.name.toLowerCase().includes(filter.toLowerCase());
              }
              return true;
            }).sort((a, b) => {
              if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
              } else if (sortBy === 'date') {
                return new Date(a.date) - new Date(b.date);
              }
              return 0;
            });
          }, [data, filter, sortBy]);
          
          const handleFilterChange = (e) => {
            setFilter(e.target.value);
          };
          
          const handleSortChange = (e) => {
            setSortBy(e.target.value);
          };
          
          if (loading) return <div>Loading...</div>;
          if (error) return <div>Error: {error}</div>;
          
          return (
            <div>
              <input onChange={handleFilterChange} placeholder="Filter..." />
              <select onChange={handleSortChange}>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
              </select>
              <ul>
                {filteredData.map(item => (
                  <li key={item.id}>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <span>{item.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      `;

      const result = performanceService.analyzeCodeComplexity(complexCode);

      expect(['complex', 'very-complex']).toContain(result.level);
      expect(result.functions).toBeGreaterThanOrEqual(3);
      expect(result.variables).toBeGreaterThan(3);
      expect(result.reactHooks).toBeGreaterThan(3);
      expect(result.imports).toBe(2);
      expect(result.estimatedProcessingTime).toBeGreaterThan(3000);
    });

    it('should identify very complex code', () => {
      // Generate a very large code sample
      const veryComplexCode = `
        import React from 'react';
        ${Array.from({ length: 25 }, (_, i) => `
          function Component${i}() {
            const [state${i}, setState${i}] = useState(${i});
            const [data${i}, setData${i}] = useState([]);
            
            useEffect(() => {
              fetch('/api/data${i}')
                .then(response => response.json())
                .then(data => {
                  if (data && data.length > 0) {
                    setData${i}(data.map(item => {
                      if (item.type === 'special') {
                        return { ...item, processed: true };
                      } else {
                        return item;
                      }
                    }));
                  }
                });
            }, []);
            
            return <div>{data${i}.length}</div>;
          }
        `).join('\n')}
      `;

      const result = performanceService.analyzeCodeComplexity(veryComplexCode);

      expect(result.level).toBe('very-complex');
      expect(result.lines).toBeGreaterThan(500);
      expect(result.functions).toBeGreaterThan(20);
      expect(result.estimatedProcessingTime).toBe(15000);
    });
  });

  describe('shouldProcessCode', () => {
    it('should allow simple code to be processed', () => {
      const simpleComplexity = {
        lines: 10,
        functions: 2,
        variables: 3,
        nestingDepth: 2,
        imports: 1,
        reactHooks: 1,
        estimatedProcessingTime: 1000,
        level: 'simple' as const,
      };

      const result = performanceService.shouldProcessCode(simpleComplexity);

      expect(result.shouldProcess).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about complex code but allow processing', () => {
      const complexComplexity = {
        lines: 300,
        functions: 15,
        variables: 20,
        nestingDepth: 6,
        imports: 5,
        reactHooks: 8,
        estimatedProcessingTime: 8000,
        level: 'complex' as const,
      };

      const result = performanceService.shouldProcessCode(complexComplexity);

      expect(result.shouldProcess).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should reject code that is too large', () => {
      const tooLargeComplexity = {
        lines: 3000, // Exceeds default max of 2000
        functions: 50,
        variables: 100,
        nestingDepth: 10,
        imports: 20,
        reactHooks: 30,
        estimatedProcessingTime: 30000,
        level: 'very-complex' as const,
      };

      const result = performanceService.shouldProcessCode(tooLargeComplexity);

      expect(result.shouldProcess).toBe(false);
      expect(result.warnings.some(w => w.includes('too large'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('smaller parts'))).toBe(true);
    });
  });

  describe('performance monitoring', () => {
    it('should start and end monitoring correctly', () => {
      const code = 'const x = 1;';
      
      const metrics = performanceService.startMonitoring(code);
      expect(metrics.startTime).toBeGreaterThan(0);
      expect(metrics.complexity).toBeDefined();
      expect(metrics.stageTimings).toEqual({});

      // Record some stage times
      performanceService.recordStageTime('parsing');
      performanceService.recordStageTime('pattern-recognition');

      const finalMetrics = performanceService.endMonitoring();
      
      expect(finalMetrics).toBeDefined();
      expect(finalMetrics!.endTime).toBeGreaterThan(finalMetrics!.startTime);
      expect(finalMetrics!.duration).toBeGreaterThan(0);
      expect(finalMetrics!.stageTimings).toHaveProperty('parsing');
      expect(finalMetrics!.stageTimings).toHaveProperty('pattern-recognition');
    });

    it('should handle timeout promises', async () => {
      const fastPromise = Promise.resolve('success');
      const result = await performanceService.createTimeoutPromise(fastPromise, 1000);
      expect(result).toBe('success');
    });

    it('should timeout slow promises', async () => {
      const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow'), 2000));
      
      await expect(
        performanceService.createTimeoutPromise(slowPromise, 100)
      ).rejects.toThrow('Processing timeout after 100ms');
    });
  });

  describe('diagram optimization', () => {
    it('should not optimize small diagrams', () => {
      const smallDiagram: DiagramData = {
        nodes: Array.from({ length: 10 }, (_, i) => ({
          id: `node-${i}`,
          type: 'button',
          position: { x: i * 100, y: 0 },
          icon: 'Play',
          label: `Node ${i}`,
          explanation: `This is node ${i}`,
          metadata: { confidence: 0.8 },
        })),
        edges: [],
        layout: { direction: 'horizontal' },
      };

      const result = performanceService.optimizeDiagramForRendering(smallDiagram);

      expect(result.optimizedData.nodes).toHaveLength(10);
      expect(result.optimizations).toHaveLength(0);
    });

    it('should optimize large diagrams by reducing nodes', () => {
      const largeDiagram: DiagramData = {
        nodes: Array.from({ length: 150 }, (_, i) => ({
          id: `node-${i}`,
          type: 'button',
          position: { x: i * 100, y: 0 },
          icon: 'Play',
          label: `Node ${i}`,
          explanation: `This is node ${i}`,
          metadata: { confidence: Math.random() },
        })),
        edges: [],
        layout: { direction: 'horizontal' },
      };

      const result = performanceService.optimizeDiagramForRendering(largeDiagram);

      expect(result.optimizedData.nodes.length).toBeLessThan(150);
      expect(result.optimizedData.nodes.length).toBeLessThanOrEqual(100); // Default max
      expect(result.optimizations.length).toBeGreaterThan(0);
      expect(result.optimizations[0]).toContain('Reduced nodes');
    });

    it('should truncate long node labels', () => {
      const longLabelDiagram: DiagramData = {
        nodes: [{
          id: 'node-1',
          type: 'button',
          position: { x: 0, y: 0 },
          icon: 'Play',
          label: 'This is a very long label that should be truncated because it exceeds the maximum length',
          explanation: 'Test node',
          metadata: { confidence: 0.8 },
        }],
        edges: [],
        layout: { direction: 'horizontal' },
      };

      const result = performanceService.optimizeDiagramForRendering(longLabelDiagram);

      expect(result.optimizedData.nodes[0].label).toHaveLength(50); // 47 chars + '...'
      expect(result.optimizedData.nodes[0].label.endsWith('...')).toBe(true);
      expect(result.optimizedData.nodes[0].originalLabel).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customService = new PerformanceService({
        maxProcessingTime: 5000,
        maxCodeLines: 500,
        maxDiagramNodes: 50,
      });

      const config = customService.getConfig();
      expect(config.maxProcessingTime).toBe(5000);
      expect(config.maxCodeLines).toBe(500);
      expect(config.maxDiagramNodes).toBe(50);
    });

    it('should update configuration', () => {
      performanceService.updateConfig({
        maxProcessingTime: 10000,
      });

      const config = performanceService.getConfig();
      expect(config.maxProcessingTime).toBe(10000);
      expect(config.maxCodeLines).toBe(2000); // Should keep default
    });
  });
});