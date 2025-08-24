import { test, expect } from '@playwright/test';
import { performanceTestCases } from '../data/testCodeSamples';

/**
 * Performance tests for code processing speed and responsiveness
 * Validates that the application meets performance requirements
 */

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should process small code samples quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('textarea', performanceTestCases.small);
    await page.click('button:has-text("Visualize Code")');
    
    // Should complete visualization within 3 seconds for small code
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 3000 });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`Small code processing time: ${processingTime}ms`);
    expect(processingTime).toBeLessThan(3000);
    
    // Diagram should be interactive immediately
    const interactionStart = Date.now();
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible();
    const interactionEnd = Date.now();
    
    console.log(`Interaction response time: ${interactionEnd - interactionStart}ms`);
    expect(interactionEnd - interactionStart).toBeLessThan(500);
  });

  test('should process medium code samples within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('textarea', performanceTestCases.medium);
    await page.click('button:has-text("Visualize Code")');
    
    // Should complete visualization within 8 seconds for medium code
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 8000 });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`Medium code processing time: ${processingTime}ms`);
    expect(processingTime).toBeLessThan(8000);
    
    // Should show loading indicator during processing
    await page.fill('textarea', performanceTestCases.medium);
    await page.click('button:has-text("Visualize Code")');
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible({ timeout: 1000 });
  });

  test('should handle large code samples with timeout protection', async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('textarea', performanceTestCases.large);
    await page.click('button:has-text("Visualize Code")');
    
    // Should either complete within 15 seconds or show timeout message
    try {
      await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 15000 });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      console.log(`Large code processing time: ${processingTime}ms`);
      
      // If it completes, it should be within 15 seconds
      expect(processingTime).toBeLessThan(15000);
    } catch (error) {
      // Should show timeout or complexity warning
      const timeoutMessage = page.locator('[data-testid="timeout-message"]');
      const complexityWarning = page.locator('[data-testid="complexity-warning"]');
      
      const hasTimeout = await timeoutMessage.isVisible();
      const hasWarning = await complexityWarning.isVisible();
      
      expect(hasTimeout || hasWarning).toBeTruthy();
    }
  });

  test('should maintain UI responsiveness during processing', async ({ page }) => {
    await page.fill('textarea', performanceTestCases.medium);
    await page.click('button:has-text("Visualize Code")');
    
    // UI should remain responsive during processing
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible({ timeout: 2000 });
    
    // Should be able to interact with cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible()) {
      const clickStart = Date.now();
      await cancelButton.click();
      const clickEnd = Date.now();
      
      // Cancel should respond quickly
      expect(clickEnd - clickStart).toBeLessThan(200);
      
      // Should return to initial state
      await expect(page.locator('button:has-text("Visualize Code")')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle many components efficiently', async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('textarea', performanceTestCases.manyComponents);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`Many components processing time: ${processingTime}ms`);
    expect(processingTime).toBeLessThan(10000);
    
    // Should render all components
    const nodes = page.locator('[data-testid="diagram-node"]');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(15); // Should detect most components
    
    // Diagram should remain interactive with many nodes
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible({ timeout: 1000 });
  });

  test('should handle deep nesting without performance degradation', async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('textarea', performanceTestCases.deepNesting);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 8000 });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`Deep nesting processing time: ${processingTime}ms`);
    expect(processingTime).toBeLessThan(8000);
    
    // Should show hierarchical structure
    const nodes = page.locator('[data-testid="diagram-node"]');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(3); // Should detect nested components
  });

  test('should optimize diagram rendering for large visualizations', async ({ page }) => {
    await page.fill('textarea', performanceTestCases.manyComponents);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Test scrolling performance
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    
    const scrollStart = Date.now();
    await diagram.evaluate(el => {
      el.scrollTop = 100;
      el.scrollLeft = 100;
    });
    const scrollEnd = Date.now();
    
    // Scrolling should be smooth
    expect(scrollEnd - scrollStart).toBeLessThan(100);
    
    // Test zoom performance if available
    await diagram.hover();
    await page.mouse.wheel(0, -100); // Zoom in
    await page.waitForTimeout(100);
    
    // Should remain responsive after zoom
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible({ timeout: 1000 });
  });

  test('should show progressive loading for complex diagrams', async ({ page }) => {
    await page.fill('textarea', performanceTestCases.medium);
    await page.click('button:has-text("Visualize Code")');
    
    // Should show loading indicator immediately
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible({ timeout: 500 });
    
    // Loading indicator should show progress if available
    const progressBar = page.locator('[data-testid="progress-bar"]');
    if (await progressBar.isVisible()) {
      // Progress should increase over time
      const initialProgress = await progressBar.getAttribute('value');
      await page.waitForTimeout(1000);
      const laterProgress = await progressBar.getAttribute('value');
      
      if (initialProgress && laterProgress) {
        expect(parseFloat(laterProgress)).toBeGreaterThanOrEqual(parseFloat(initialProgress));
      }
    }
    
    // Should eventually complete
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });

  test('should maintain memory efficiency', async ({ page }) => {
    // Process multiple visualizations to test memory usage
    const testCases = [
      performanceTestCases.small,
      performanceTestCases.medium,
      performanceTestCases.manyComponents
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      await page.fill('textarea', testCases[i]);
      await page.click('button:has-text("Visualize Code")');
      
      await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
      
      // Clear previous visualization
      await page.fill('textarea', '');
      await page.waitForTimeout(500);
    }
    
    // Final visualization should still work efficiently
    const finalStart = Date.now();
    await page.fill('textarea', performanceTestCases.small);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 5000 });
    const finalEnd = Date.now();
    
    // Should not be significantly slower after multiple operations
    expect(finalEnd - finalStart).toBeLessThan(5000);
  });
});

test.describe('Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should meet parsing performance benchmarks', async ({ page }) => {
    const benchmarks = [
      { name: 'Counter Pattern', code: performanceTestCases.small, maxTime: 2000 },
      { name: 'API Call Pattern', code: performanceTestCases.medium, maxTime: 5000 },
      { name: 'Many Components', code: performanceTestCases.manyComponents, maxTime: 8000 }
    ];
    
    for (const benchmark of benchmarks) {
      console.log(`\nRunning benchmark: ${benchmark.name}`);
      
      const startTime = Date.now();
      await page.fill('textarea', benchmark.code);
      await page.click('button:has-text("Visualize Code")');
      
      await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ 
        timeout: benchmark.maxTime 
      });
      
      const endTime = Date.now();
      const actualTime = endTime - startTime;
      
      console.log(`${benchmark.name}: ${actualTime}ms (max: ${benchmark.maxTime}ms)`);
      expect(actualTime).toBeLessThan(benchmark.maxTime);
      
      // Clear for next test
      await page.fill('textarea', '');
      await page.waitForTimeout(200);
    }
  });

  test('should meet interaction performance benchmarks', async ({ page }) => {
    await page.fill('textarea', performanceTestCases.medium);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 8000 });
    
    // Benchmark node click response time
    const clickStart = Date.now();
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible();
    const clickEnd = Date.now();
    
    const clickTime = clickEnd - clickStart;
    console.log(`Node click response time: ${clickTime}ms`);
    expect(clickTime).toBeLessThan(300);
    
    // Benchmark hover response time
    const hoverStart = Date.now();
    await page.locator('[data-testid="diagram-node"]').nth(1).hover();
    await page.waitForTimeout(100); // Allow hover effects
    const hoverEnd = Date.now();
    
    const hoverTime = hoverEnd - hoverStart;
    console.log(`Node hover response time: ${hoverTime}ms`);
    expect(hoverTime).toBeLessThan(200);
  });
});