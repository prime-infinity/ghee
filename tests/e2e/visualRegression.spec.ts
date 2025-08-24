import { test, expect } from '@playwright/test';
import { visualRegressionTestCases } from '../data/testCodeSamples';

/**
 * Visual regression tests for diagram consistency
 * Ensures visual elements remain consistent across changes
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should maintain consistent counter pattern visualization', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.simpleCounter);
    await page.click('button:has-text("Visualize Code")');
    
    // Wait for diagram to be fully rendered
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Allow animations to complete
    
    // Take screenshot of the diagram area
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    await expect(diagram).toHaveScreenshot('counter-pattern-diagram.png');
    
    // Test node hover states
    await page.locator('[data-testid="diagram-node"]').first().hover();
    await page.waitForTimeout(500); // Allow hover animation
    await expect(diagram).toHaveScreenshot('counter-pattern-hover.png');
  });

  test('should maintain consistent API call pattern visualization', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.apiCall);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    await expect(diagram).toHaveScreenshot('api-call-pattern-diagram.png');
    
    // Test success and error path colors
    const successEdge = page.locator('[data-testid="diagram-edge"]').filter({ hasText: /success/i }).first();
    const errorEdge = page.locator('[data-testid="diagram-edge"]').filter({ hasText: /error/i }).first();
    
    if (await successEdge.isVisible()) {
      await expect(successEdge).toHaveScreenshot('success-edge.png');
    }
    
    if (await errorEdge.isVisible()) {
      await expect(errorEdge).toHaveScreenshot('error-edge.png');
    }
  });

  test('should maintain consistent error handling visualization', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.errorHandling);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    await expect(diagram).toHaveScreenshot('error-handling-diagram.png');
    
    // Test warning icons
    const warningIcons = page.locator('[data-testid="warning-icon"]');
    if (await warningIcons.count() > 0) {
      await expect(warningIcons.first()).toHaveScreenshot('warning-icon.png');
    }
  });

  test('should maintain consistent complex flow visualization', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.complexFlow);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000); // Allow more time for complex diagram
    
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    await expect(diagram).toHaveScreenshot('complex-flow-diagram.png');
  });

  test('should maintain consistent tooltip styling', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.simpleCounter);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Click on a node to show tooltip
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible();
    
    const tooltip = page.locator('[data-testid="node-tooltip"]');
    await expect(tooltip).toHaveScreenshot('node-tooltip.png');
  });

  test('should maintain consistent loading states', async ({ page }) => {
    // Start visualization but capture loading state quickly
    await page.fill('textarea', visualRegressionTestCases.complexFlow);
    
    // Use Promise.all to click and immediately capture loading state
    await Promise.all([
      page.click('button:has-text("Visualize Code")'),
      page.waitForSelector('[data-testid="loading-indicator"]', { timeout: 2000 })
    ]);
    
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toHaveScreenshot('loading-indicator.png');
  });

  test('should maintain consistent error message styling', async ({ page }) => {
    const invalidCode = 'function broken() { const x = ; return x; }';
    await page.fill('textarea', invalidCode);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toHaveScreenshot('error-message.png');
  });

  test('should maintain consistent responsive layouts', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.simpleCounter);
    await page.click('button:has-text("Visualize Code")');
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('desktop-layout.png');
    
    // Tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('tablet-layout.png');
    
    // Mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('mobile-layout.png');
  });

  test('should maintain consistent icon rendering', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.apiCall);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Capture individual node icons
    const nodes = page.locator('[data-testid="diagram-node"]');
    const nodeCount = await nodes.count();
    
    for (let i = 0; i < Math.min(nodeCount, 5); i++) {
      const node = nodes.nth(i);
      await expect(node).toHaveScreenshot(`node-icon-${i}.png`);
    }
  });

  test('should maintain consistent edge styling', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.apiCall);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Capture different edge types
    const edges = page.locator('[data-testid="diagram-edge"]');
    const edgeCount = await edges.count();
    
    for (let i = 0; i < Math.min(edgeCount, 3); i++) {
      const edge = edges.nth(i);
      await expect(edge).toHaveScreenshot(`edge-style-${i}.png`);
    }
  });
});

test.describe('Accessibility Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should maintain consistent high contrast mode', async ({ page }) => {
    // Enable high contrast mode if available
    await page.evaluate(() => {
      document.body.classList.add('high-contrast');
    });
    
    await page.fill('textarea', visualRegressionTestCases.simpleCounter);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    await expect(diagram).toHaveScreenshot('high-contrast-diagram.png');
  });

  test('should maintain consistent focus indicators', async ({ page }) => {
    await page.fill('textarea', visualRegressionTestCases.simpleCounter);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Focus on first node using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to diagram
    
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toHaveScreenshot('focused-element.png');
    }
  });
});