import { test, expect } from '@playwright/test';
import { testCodeSamples } from '../data/testCodeSamples';

/**
 * Accessibility tests for keyboard navigation, screen readers, and WCAG compliance
 * Validates that the application meets accessibility requirements
 */

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should support full keyboard navigation', async ({ page }) => {
    // Requirement 8.1: Keyboard navigation for all interactive elements
    
    // Tab to textarea
    await page.keyboard.press('Tab');
    await expect(page.locator('textarea')).toBeFocused();
    
    // Type code
    await page.keyboard.type(testCodeSamples.counterPatterns[0]);
    
    // Tab to visualize button
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Visualize Code")')).toBeFocused();
    
    // Activate with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Tab into diagram
    await page.keyboard.press('Tab');
    
    // Should focus first interactive element in diagram
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Should be able to navigate between nodes
    await page.keyboard.press('Tab');
    const secondFocused = page.locator(':focus');
    
    // Elements should be different
    const firstId = await focusedElement.getAttribute('data-testid');
    const secondId = await secondFocused.getAttribute('data-testid');
    expect(firstId).not.toBe(secondId);
  });

  test('should provide proper ARIA labels and descriptions', async ({ page }) => {
    // Requirement 8.2: ARIA labels and descriptions for screen readers
    
    // Check textarea has proper labeling
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveAttribute('aria-label');
    
    const ariaLabel = await textarea.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/code|input|paste/i);
    
    // Check visualize button has description
    const visualizeButton = page.locator('button:has-text("Visualize Code")');
    const buttonAriaLabel = await visualizeButton.getAttribute('aria-label');
    if (buttonAriaLabel) {
      expect(buttonAriaLabel).toMatch(/visualize|analyze|process/i);
    }
    
    // Generate diagram and check ARIA labels
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Diagram should have proper role and label
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    const diagramRole = await diagram.getAttribute('role');
    const diagramLabel = await diagram.getAttribute('aria-label');
    
    expect(diagramRole).toBe('img');
    expect(diagramLabel).toMatch(/diagram|visualization|flow/i);
    
    // Nodes should have descriptive labels
    const nodes = page.locator('[data-testid="diagram-node"]');
    const nodeCount = await nodes.count();
    
    for (let i = 0; i < Math.min(nodeCount, 3); i++) {
      const node = nodes.nth(i);
      const nodeLabel = await node.getAttribute('aria-label');
      expect(nodeLabel).toBeTruthy();
      expect(nodeLabel!.length).toBeGreaterThan(5);
    }
  });

  test('should provide alternative text for visual elements', async ({ page }) => {
    // Requirement 8.3: Alternative text for all visual elements
    
    await page.fill('textarea', testCodeSamples.apiCallPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Icons should have alt text or aria-label
    const icons = page.locator('[data-testid="node-icon"]');
    const iconCount = await icons.count();
    
    for (let i = 0; i < Math.min(iconCount, 5); i++) {
      const icon = icons.nth(i);
      const altText = await icon.getAttribute('alt');
      const ariaLabel = await icon.getAttribute('aria-label');
      
      expect(altText || ariaLabel).toBeTruthy();
    }
    
    // Edges should have descriptions
    const edges = page.locator('[data-testid="diagram-edge"]');
    const edgeCount = await edges.count();
    
    for (let i = 0; i < Math.min(edgeCount, 3); i++) {
      const edge = edges.nth(i);
      const edgeLabel = await edge.getAttribute('aria-label');
      expect(edgeLabel).toBeTruthy();
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Test screen reader compatibility
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Should have proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Main content should be in landmarks
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Should have skip links or similar navigation aids
    const skipLink = page.locator('[href="#main-content"], [href="#diagram"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toHaveAttribute('href');
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // Requirement 8.1: High contrast mode for better visibility
    
    // Enable high contrast mode
    await page.addStyleTag({
      content: `
        .high-contrast {
          filter: contrast(150%) brightness(120%);
        }
        .high-contrast * {
          border-color: #000 !important;
          color: #000 !important;
          background-color: #fff !important;
        }
      `
    });
    
    await page.evaluate(() => {
      document.body.classList.add('high-contrast');
    });
    
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Elements should still be visible and functional in high contrast
    const nodes = page.locator('[data-testid="diagram-node"]');
    await expect(nodes.first()).toBeVisible();
    
    // Should be able to interact with elements
    await nodes.first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible();
  });

  test('should provide focus indicators', async ({ page }) => {
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Tab to diagram elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Focus should be visually indicated
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      };
    });
    
    // Should have some form of focus indicator
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' ||
      focusStyles.outlineWidth !== '0px' ||
      focusStyles.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Respect prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Animations should be reduced or disabled
    const animatedElements = page.locator('[data-testid="diagram-edge"][class*="animate"]');
    const animatedCount = await animatedElements.count();
    
    // If animations exist, they should respect reduced motion
    if (animatedCount > 0) {
      const animationDuration = await animatedElements.first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.animationDuration;
      });
      
      // Should be very short or none
      expect(animationDuration === 'none' || animationDuration === '0s').toBeTruthy();
    }
  });

  test('should provide meaningful error messages for screen readers', async ({ page }) => {
    const invalidCode = 'function broken() { const x = ; return x; }';
    await page.fill('textarea', invalidCode);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Should have proper ARIA role
    const errorRole = await errorMessage.getAttribute('role');
    expect(errorRole).toBe('alert');
    
    // Should have descriptive text
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(10);
    
    // Should not contain technical jargon
    expect(errorText).not.toMatch(/SyntaxError|Unexpected token|Parse error/i);
  });

  test('should support voice control and speech recognition', async ({ page }) => {
    // Test that elements have proper names for voice control
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    // Buttons should have clear, speakable names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      const speakableName = buttonText || ariaLabel;
      expect(speakableName).toBeTruthy();
      expect(speakableName!.trim().length).toBeGreaterThan(2);
    }
    
    // Interactive elements should be identifiable
    const interactiveElements = page.locator('button, [role="button"], [tabindex="0"]');
    const interactiveCount = await interactiveElements.count();
    expect(interactiveCount).toBeGreaterThan(0);
  });

  test('should maintain accessibility during dynamic content changes', async ({ page }) => {
    // Start with empty state
    await expect(page.locator('textarea')).toBeVisible();
    
    // Add code and visualize
    await page.fill('textarea', testCodeSamples.counterPatterns[0]);
    await page.click('button:has-text("Visualize Code")');
    
    // During loading, accessibility should be maintained
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    if (await loadingIndicator.isVisible()) {
      const loadingRole = await loadingIndicator.getAttribute('role');
      const loadingLabel = await loadingIndicator.getAttribute('aria-label');
      
      expect(loadingRole).toBe('status');
      expect(loadingLabel).toMatch(/loading|processing/i);
    }
    
    // After completion, new content should be accessible
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 10000 });
    
    const diagram = page.locator('[data-testid="interactive-diagram"]');
    const diagramLabel = await diagram.getAttribute('aria-label');
    expect(diagramLabel).toBeTruthy();
    
    // Focus should be managed appropriately
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should provide context and instructions for complex interactions', async ({ page }) => {
    await page.fill('textarea', testCodeSamples.complexCombinations[0]);
    await page.click('button:has-text("Visualize Code")');
    
    await expect(page.locator('[data-testid="interactive-diagram"]')).toBeVisible({ timeout: 15000 });
    
    // Should provide instructions for diagram interaction
    const instructions = page.locator('[data-testid="diagram-instructions"], [aria-describedby]');
    if (await instructions.count() > 0) {
      const instructionText = await instructions.first().textContent();
      expect(instructionText).toMatch(/click|navigate|interact/i);
    }
    
    // Tooltips should provide context
    await page.locator('[data-testid="diagram-node"]').first().click();
    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible();
    
    const tooltip = page.locator('[data-testid="node-tooltip"]');
    const tooltipRole = await tooltip.getAttribute('role');
    expect(tooltipRole).toBe('tooltip');
    
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toBeTruthy();
    expect(tooltipText!.length).toBeGreaterThan(5);
  });
});