import { CodeVisualizationService } from '../../services/CodeVisualizationService';
import { PerformanceService } from '../../services/PerformanceService';

/**
 * Performance benchmark tests
 * These tests measure actual performance and may take longer to run
 */
describe('Performance Benchmarks', () => {
  let visualizationService: CodeVisualizationService;
  let performanceService: PerformanceService;

  beforeEach(() => {
    visualizationService = new CodeVisualizationService();
    performanceService = new PerformanceService();
  });

  // Helper to generate code samples of different sizes
  const generateCodeSample = (complexity: 'simple' | 'medium' | 'complex') => {
    switch (complexity) {
      case 'simple':
        return `
          const greeting = "Hello World";
          function sayHello() {
            console.log(greeting);
          }
          sayHello();
        `;
      
      case 'medium':
        return `
          import React, { useState, useEffect } from 'react';
          
          function UserProfile({ userId }) {
            const [user, setUser] = useState(null);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            
            useEffect(() => {
              const fetchUser = async () => {
                try {
                  setLoading(true);
                  const response = await fetch(\`/api/users/\${userId}\`);
                  if (!response.ok) {
                    throw new Error('Failed to fetch user');
                  }
                  const userData = await response.json();
                  setUser(userData);
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              };
              
              if (userId) {
                fetchUser();
              }
            }, [userId]);
            
            const handleRefresh = () => {
              setError(null);
              fetchUser();
            };
            
            if (loading) return <div>Loading...</div>;
            if (error) return <div>Error: {error} <button onClick={handleRefresh}>Retry</button></div>;
            if (!user) return <div>No user found</div>;
            
            return (
              <div>
                <h1>{user.name}</h1>
                <p>{user.email}</p>
                <button onClick={handleRefresh}>Refresh</button>
              </div>
            );
          }
        `;
      
      case 'complex':
        return `
          import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
          import axios from 'axios';
          
          const DataContext = React.createContext();
          
          function useDataFetcher(endpoint, dependencies = []) {
            const [data, setData] = useState(null);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState(null);
            
            const fetchData = useCallback(async () => {
              setLoading(true);
              setError(null);
              try {
                const response = await axios.get(endpoint);
                setData(response.data);
              } catch (err) {
                setError(err.response?.data?.message || err.message);
              } finally {
                setLoading(false);
              }
            }, [endpoint]);
            
            useEffect(() => {
              fetchData();
            }, [fetchData, ...dependencies]);
            
            return { data, loading, error, refetch: fetchData };
          }
          
          function DataProvider({ children }) {
            const [globalState, setGlobalState] = useState({
              user: null,
              preferences: {},
              cache: new Map(),
            });
            
            const updateUser = useCallback((user) => {
              setGlobalState(prev => ({ ...prev, user }));
            }, []);
            
            const updatePreferences = useCallback((preferences) => {
              setGlobalState(prev => ({ 
                ...prev, 
                preferences: { ...prev.preferences, ...preferences }
              }));
            }, []);
            
            const cacheData = useCallback((key, data) => {
              setGlobalState(prev => {
                const newCache = new Map(prev.cache);
                newCache.set(key, data);
                return { ...prev, cache: newCache };
              });
            }, []);
            
            const value = useMemo(() => ({
              ...globalState,
              updateUser,
              updatePreferences,
              cacheData,
            }), [globalState, updateUser, updatePreferences, cacheData]);
            
            return (
              <DataContext.Provider value={value}>
                {children}
              </DataContext.Provider>
            );
          }
          
          function ComplexDashboard() {
            const { user, preferences, cache } = useContext(DataContext);
            const [activeTab, setActiveTab] = useState('overview');
            const [filters, setFilters] = useState({
              dateRange: 'last30days',
              category: 'all',
              status: 'active',
            });
            
            const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = 
              useDataFetcher('/api/dashboard', [filters]);
            
            const { data: analyticsData, loading: analyticsLoading } = 
              useDataFetcher('/api/analytics', [filters.dateRange]);
            
            const { data: reportsData, loading: reportsLoading } = 
              useDataFetcher('/api/reports', [filters.category]);
            
            const filteredData = useMemo(() => {
              if (!dashboardData) return [];
              
              return dashboardData.filter(item => {
                if (filters.category !== 'all' && item.category !== filters.category) {
                  return false;
                }
                if (filters.status !== 'all' && item.status !== filters.status) {
                  return false;
                }
                return true;
              }).sort((a, b) => {
                if (preferences.sortBy === 'name') {
                  return a.name.localeCompare(b.name);
                } else if (preferences.sortBy === 'date') {
                  return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return 0;
              });
            }, [dashboardData, filters, preferences.sortBy]);
            
            const handleFilterChange = useCallback((key, value) => {
              setFilters(prev => ({ ...prev, [key]: value }));
            }, []);
            
            const handleTabChange = useCallback((tab) => {
              setActiveTab(tab);
            }, []);
            
            const handleExport = useCallback(async () => {
              try {
                const response = await axios.post('/api/export', {
                  data: filteredData,
                  format: preferences.exportFormat || 'csv',
                });
                
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dashboard-export.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Export failed:', error);
              }
            }, [filteredData, preferences.exportFormat]);
            
            if (dashboardLoading) {
              return <div>Loading dashboard...</div>;
            }
            
            if (dashboardError) {
              return <div>Error loading dashboard: {dashboardError}</div>;
            }
            
            return (
              <div className="dashboard">
                <header>
                  <h1>Dashboard</h1>
                  <div className="filters">
                    <select 
                      value={filters.dateRange} 
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    >
                      <option value="last7days">Last 7 days</option>
                      <option value="last30days">Last 30 days</option>
                      <option value="last90days">Last 90 days</option>
                    </select>
                    
                    <select 
                      value={filters.category} 
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="sales">Sales</option>
                      <option value="marketing">Marketing</option>
                      <option value="support">Support</option>
                    </select>
                    
                    <button onClick={handleExport}>Export Data</button>
                  </div>
                </header>
                
                <nav>
                  <button 
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => handleTabChange('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    className={activeTab === 'analytics' ? 'active' : ''}
                    onClick={() => handleTabChange('analytics')}
                  >
                    Analytics
                  </button>
                  <button 
                    className={activeTab === 'reports' ? 'active' : ''}
                    onClick={() => handleTabChange('reports')}
                  >
                    Reports
                  </button>
                </nav>
                
                <main>
                  {activeTab === 'overview' && (
                    <div>
                      <h2>Overview</h2>
                      <div className="grid">
                        {filteredData.map(item => (
                          <div key={item.id} className="card">
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                            <span className="status">{item.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'analytics' && (
                    <div>
                      <h2>Analytics</h2>
                      {analyticsLoading ? (
                        <div>Loading analytics...</div>
                      ) : (
                        <div>
                          {analyticsData && analyticsData.map(metric => (
                            <div key={metric.id} className="metric">
                              <h4>{metric.name}</h4>
                              <span className="value">{metric.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'reports' && (
                    <div>
                      <h2>Reports</h2>
                      {reportsLoading ? (
                        <div>Loading reports...</div>
                      ) : (
                        <div>
                          {reportsData && reportsData.map(report => (
                            <div key={report.id} className="report">
                              <h4>{report.title}</h4>
                              <p>{report.summary}</p>
                              <button>View Details</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </main>
              </div>
            );
          }
        `;
    }
  };

  describe('Code Complexity Analysis Benchmarks', () => {
    it('should analyze simple code quickly', () => {
      const code = generateCodeSample('simple');
      
      const startTime = performance.now();
      const result = performanceService.analyzeCodeComplexity(code);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10); // Should complete in under 10ms
      expect(result.level).toBe('simple');
      
      console.log(`Simple code analysis: ${(endTime - startTime).toFixed(2)}ms`);
    });

    it('should analyze medium code efficiently', () => {
      const code = generateCodeSample('medium');
      
      const startTime = performance.now();
      const result = performanceService.analyzeCodeComplexity(code);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
      expect(result.level).toBe('medium');
      
      console.log(`Medium code analysis: ${(endTime - startTime).toFixed(2)}ms`);
    });

    it('should analyze complex code within reasonable time', () => {
      const code = generateCodeSample('complex');
      
      const startTime = performance.now();
      const result = performanceService.analyzeCodeComplexity(code);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(result.level).toBe('complex');
      
      console.log(`Complex code analysis: ${(endTime - startTime).toFixed(2)}ms`);
    });
  });

  describe('Full Visualization Pipeline Benchmarks', () => {
    it('should process simple code within performance targets', async () => {
      const code = generateCodeSample('simple');
      
      const startTime = performance.now();
      const result = await visualizationService.visualizeCode(code);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
      
      console.log(`Simple code visualization: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`Complexity: ${result.performanceMetrics?.complexity.level}`);
      console.log(`Stage timings:`, result.performanceMetrics?.stageTimings);
    });

    it('should process medium code within performance targets', async () => {
      const code = generateCodeSample('medium');
      
      const startTime = performance.now();
      const result = await visualizationService.visualizeCode(code);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      
      console.log(`Medium code visualization: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`Complexity: ${result.performanceMetrics?.complexity.level}`);
      console.log(`Patterns found: ${result.diagramData?.nodes.length || 0}`);
    });

    it('should process complex code within performance targets', async () => {
      const code = generateCodeSample('complex');
      
      const startTime = performance.now();
      const result = await visualizationService.visualizeCode(code);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
      
      console.log(`Complex code visualization: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`Complexity: ${result.performanceMetrics?.complexity.level}`);
      console.log(`Patterns found: ${result.diagramData?.nodes.length || 0}`);
      console.log(`Optimizations applied: ${result.optimizations?.length || 0}`);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should not leak memory during multiple visualizations', async () => {
      const code = generateCodeSample('medium');
      const iterations = 5;
      
      // Force garbage collection if available (Node.js)
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;
      
      // Run multiple visualizations
      for (let i = 0; i < iterations; i++) {
        const result = await visualizationService.visualizeCode(code);
        expect(result.success).toBe(true);
        
        // Create new service instance to avoid caching effects
        visualizationService = new CodeVisualizationService();
      }
      
      // Force garbage collection again
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase after ${iterations} visualizations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable (less than 50MB for 5 iterations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Diagram Optimization Benchmarks', () => {
    it('should optimize large diagrams efficiently', () => {
      // Create a large diagram
      const largeDiagram = {
        nodes: Array.from({ length: 200 }, (_, i) => ({
          id: `node-${i}`,
          type: 'button' as const,
          position: { x: i * 100, y: Math.floor(i / 10) * 100 },
          icon: 'Play' as const,
          label: `Node ${i} with a very long label that should be truncated`,
          explanation: `This is node ${i}`,
          metadata: { confidence: Math.random() },
        })),
        edges: Array.from({ length: 150 }, (_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${(i + 1) % 200}`,
          label: 'connects to',
          type: 'action' as const,
          color: '#3b82f6',
          animated: false,
        })),
        layout: { direction: 'horizontal' as const },
      };
      
      const startTime = performance.now();
      const result = performanceService.optimizeDiagramForRendering(largeDiagram);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(result.optimizedData.nodes.length).toBeLessThanOrEqual(100); // Should be reduced
      expect(result.optimizations.length).toBeGreaterThan(0);
      
      console.log(`Diagram optimization: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`Nodes reduced from ${largeDiagram.nodes.length} to ${result.optimizedData.nodes.length}`);
      console.log(`Optimizations: ${result.optimizations.join(', ')}`);
    });
  });

  describe('Timeout Handling Benchmarks', () => {
    it('should handle timeouts gracefully', async () => {
      // Configure very short timeout for testing
      const performanceService = visualizationService.getPerformanceService();
      performanceService.updateConfig({ maxProcessingTime: 50 });
      
      const complexCode = generateCodeSample('complex');
      
      const startTime = performance.now();
      const result = await visualizationService.visualizeCode(complexCode);
      const endTime = performance.now();
      
      // Should either succeed quickly or fail with timeout
      if (!result.success) {
        expect(result.errors.some(error => 
          error.message.includes('timeout') || error.message.includes('complex')
        )).toBe(true);
      }
      
      // Should not take much longer than the timeout
      expect(endTime - startTime).toBeLessThan(1000);
      
      console.log(`Timeout handling: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`Result: ${result.success ? 'Success' : 'Failed as expected'}`);
    });
  });
});

// Helper to run benchmarks with detailed logging
export const runPerformanceBenchmarks = async () => {
  console.log('🚀 Running Performance Benchmarks...\n');
  
  const service = new CodeVisualizationService();
  const samples = {
    simple: `const x = 1; console.log(x);`,
    medium: `
      function Counter() {
        const [count, setCount] = useState(0);
        return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
      }
    `,
    complex: Array.from({ length: 20 }, (_, i) => `
      function Component${i}() {
        const [state${i}, setState${i}] = useState(${i});
        useEffect(() => {
          fetch('/api/data${i}').then(r => r.json()).then(setState${i});
        }, []);
        return <div>{state${i}}</div>;
      }
    `).join('\n')
  };
  
  for (const [complexity, code] of Object.entries(samples)) {
    console.log(`📊 Testing ${complexity} code...`);
    
    const startTime = performance.now();
    const result = await service.visualizeCode(code);
    const endTime = performance.now();
    
    console.log(`  ⏱️  Total time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`  ✅ Success: ${result.success}`);
    console.log(`  🧠 Complexity: ${result.performanceMetrics?.complexity.level}`);
    console.log(`  📈 Nodes: ${result.diagramData?.nodes.length || 0}`);
    console.log(`  🔧 Optimizations: ${result.optimizations?.length || 0}`);
    console.log('');
  }
  
  console.log('✨ Benchmarks completed!');
};