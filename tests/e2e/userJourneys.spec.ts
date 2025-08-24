import { test, expect } from '@playwright/test';
import { testCodeSamples, performanceTestCases, visualRegressionTestCases } from '../data/testCodeSamples';

/**
 * End-to-end tests for complete user journeys in ghee code visualization
 * Tests cover all major user flows and requirements validation
 */

test.describe('Complete User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete basic counter pattern visualization journey', async ({ page }) => {
    // Requirement 1.1, 1.2, 1.3, 1.4: Code input interface
    await expect(page.locator('textarea[placeholder*="Paste your code here"]')).toBeVisible();
    
    // Input counter pattern code
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    
    // Requirement 1.4: Visualize button
    const visualizeButton = page.locator('button:has-text("Visualize Code")');
    await expect(visualizeButton).toBeVisible();
    await visualizeButton.click();
    
    // Requirement 12.1: Loading indicator
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Wait for visualization to complete
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Requirement 6.1, 6.2: Interactive flow diagram with icons
    await expect(page.locator('[data-testid="diagram-node"]')).toHaveCount(3); // Button, click action, counter
    
    // Requirement 6.3: Labeled arrows
    await expect(page.locator('[data-testid="diagram-edge"]')).toBeVisible();
    
    // Requirement 6.5, 9.1: Click interactions and tooltips
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible();
    
    // Requirement 9.2: Simple explanations
    const tooltip = page.locator('[data-testid="node-tooltip"]');
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toMatch(/button|click|counter/i);
    expect(tooltipText).not.toMatch(/useState|onClick|handler/i); // Should avoid technical terms
  });

  test('should complete API call pattern visualization journey', async ({ page }) => {
    // Input API call pattern code
    await page.fill('textarea', testCodeSamples.apiCallPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    // Wait for visualization
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Requirement 4.1, 4.2: API call pattern recognition
    const nodes = page.locator('[data-testid="diagram-node"]');
    await expect(nodes).toHaveCount(4); // User, form, server, component
    
    // Requirement 7.1, 7.2: Error path visualization
    const edges = page.locator('[data-testid="diagram-edge"]');
    const successEdge = edges.filter({ hasText: 'success' }).or(edges.locator('.text-green-500'));
    const errorEdge = edges.filter({ hasText: 'error' }).or(edges.locator('.text-red-500'));
    
    await expect(successEdge).toBeVisible();
    await expect(errorEdge).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Requirement 13.1, 13.2: Error handling
    const invalidCode = 'function broken() { const x = ; return x; }';
    await page.fill('textarea', invalidCode);
    await page.click('button:has-text("Visualize Code")');
    
    // Should show user-friendly error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    
    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText).toMatch(/syntax error|invalid code/i);
    expect(errorText).not.toMatch(/SyntaxError|Unexpected token/i); // Should avoid technical error messages
    
    // Requirement 13.3: Application stability
    await expect(page.locator('textarea')).toBeVisible(); // App should still be functional
  });

  test('should support responsive design', async ({ page }) => {
    // Requirement 8.1, 8.2, 8.3: Responsive design
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Requirement 8.1: Accessibility - keyboard navigation
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    
    // Navigate using keyboard
    await page.keyboard.press('Tab'); // Should focus visualize button
    await expect(page.locator('button:has-text("Visualize Code")').first()).toBeFocused();
    
    await page.keyboard.press('Enter'); // Should trigger visualization
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate diagram nodes with keyboard
    await page.keyboard.press('Tab');
    const focusedNode = page.locator('[data-testid="diagram-node"]:focus');
    await expect(focusedNode).toBeVisible();
    
    // Should be able to activate node with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible();
  });

  test('should handle complex code patterns', async ({ page }) => {
    // Test with complex combination pattern
    await page.fill('textarea', testCodeSamples.complexCombinations[0]);
    await page.click('button:has-text("Visualize Code")');
    
    // Should handle complex code without crashing
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 15000 });
    
    // Should show multiple pattern types
    const nodes = page.locator('[data-testid="diagram-node"]');
    await expect(nodes).toHaveCount.greaterThan(5);
    
    // Should maintain performance
    const startTime = Date.now();
    await page.locator('[data-testid="diagram-node"]').first().click();
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
  });

  test('should support cancellation of long operations', async ({ page }) => {
    // Requirement 12.2: Cancel functionality
    await page.fill('textarea', performanceTestCases.large);
    await page.click('button:has-text("Visualize Code")');
    
    // Should show cancel button during processing
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible({ timeout: 2000 });
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Should return to initial state
    await expect(page.locator('button:has-text("Visualize Code")')).toBeVisible();
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });
});

test.describe('Pattern Recognition Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should recognize React component patterns', async ({ page }) => {
    // Requirement 11.1, 11.2, 11.3, 11.4: React component support
    await page.fill('textarea', testCodeSamples.reactComponentPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Should identify component lifecycle patterns
    const nodes = page.locator('[data-testid="diagram-node"]');
    await expect(nodes).toHaveCount.greaterThan(3);
    
    // Should show prop flow
    const edges = page.locator('[data-testid="diagram-edge"]');
    await expect(edges).toHaveCount.greaterThan(2);
  });

  test('should recognize database operation patterns', async ({ page }) => {
    // Requirement 5.1, 5.2, 5.3: Database operation recognition
    await page.fill('textarea', testCodeSamples.databasePatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Should show database icon
    const databaseNode = page.locator('[data-testid="diagram-node"]').filter({ hasText: /database|db|query/i });
    await expect(databaseNode).toBeVisible();
  });

  test('should recognize error handling patterns', async ({ page }) => {
    // Requirement 7.1, 7.2, 7.3, 7.4: Error path visualization
    await page.fill('textarea', testCodeSamples.errorHandlingPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Should show error paths with red styling
    const errorEdges = page.locator('[data-testid="diagram-edge"].text-red-500');
    await expect(errorEdges).toHaveCount.greaterThan(0);
    
    // Should show warning icons
    const warningIcons = page.locator('[data-testid="warning-icon"]');
    await expect(warningIcons).toHaveCount.greaterThan(0);
  });
});

test.describe('Performance and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle empty code input', async ({ page }) => {
    await page.click('button:has-text("Visualize Code")');
    
    // Should show appropriate message for empty input
    await expect(page.locator('[data-testid="empty-code-message"]')).toBeVisible();
  });

  test('should handle code with only comments', async ({ page }) => {
    await page.fill('textarea', testCodeSamples.edgeCases[1]);
    await page.click('button:has-text("Visualize Code")');
    
    // Should handle gracefully
    await expect(page.locator('[data-testid="no-patterns-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain performance with large code samples', async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('textarea', performanceTestCases.medium);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 15000 });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Should complete within reasonable time (15 seconds for medium complexity)
    expect(processingTime).toBeLessThan(15000);
    
    // Diagram should be interactive
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible({ timeout: 2000 });
  });
});