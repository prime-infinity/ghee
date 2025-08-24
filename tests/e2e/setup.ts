import { test as base, expect } from '@playwright/test';

/**
 * Test setup and utilities for comprehensive testing
 */

// Extend base test with custom fixtures
export const test = base.extend({
  // Custom fixture for performance monitoring
  performanceMonitor: async ({ page }, use) => {
    const performanceData: any[] = [];
    
    // Monitor performance metrics
    await page.addInitScript(() => {
      // Track performance marks
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        (window as any).performanceData = {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
    });
    
    await use({
      getMetrics: async () => {
        return await page.evaluate(() => (window as any).performanceData);
      },
      markStart: async (name: string) => {
        await page.evaluate((markName) => {
          performance.mark(`${markName}-start`);
        }, name);
      },
      markEnd: async (name: string) => {
        await page.evaluate((markName) => {
          performance.mark(`${markName}-end`);
          performance.measure(markName, `${markName}-start`, `${markName}-end`);
        }, name);
      },
      getMeasure: async (name: string) => {
        return await page.evaluate((measureName) => {
          const measure = performance.getEntriesByName(measureName)[0];
          return measure ? measure.duration : null;
        }, name);
      }
    });
  },

  // Custom fixture for accessibility testing
  accessibilityHelper: async ({ page }, use) => {
    await use({
      checkFocusOrder: async (selectors: string[]) => {
        for (let i = 0; i < selectors.length; i++) {
          await page.keyboard.press('Tab');
          const focused = page.locator(':focus');
          await expect(focused).toMatchSelector(selectors[i]);
        }
      },
      
      checkAriaLabels: async (selector: string) => {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          const ariaLabel = await element.getAttribute('aria-label');
          const ariaLabelledBy = await element.getAttribute('aria-labelledby');
          const title = await element.getAttribute('title');
          
          expect(ariaLabel || ariaLabelledBy || title).toBeTruthy();
        }
      },
      
      enableHighContrast: async () => {
        await page.addStyleTag({
          content: `
            .high-contrast * {
              filter: contrast(200%) !important;
            }
          `
        });
        await page.evaluate(() => {
          document.body.classList.add('high-contrast');
        });
      },
      
      simulateScreenReader: async () => {
        // Simulate screen reader by hiding visual elements and focusing on semantic structure
        await page.addStyleTag({
          content: `
            .sr-only {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }
          `
        });
      }
    });
  },

  // Custom fixture for visual regression testing
  visualTester: async ({ page }, use) => {
    await use({
      compareScreenshot: async (name: string, options?: any) => {
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Allow animations to complete
        return await expect(page).toHaveScreenshot(`${name}.png`, options);
      },
      
      compareElement: async (selector: string, name: string, options?: any) => {
        const element = page.locator(selector);
        await expect(element).toBeVisible();
        await page.waitForTimeout(300); // Allow element to stabilize
        return await expect(element).toHaveScreenshot(`${name}.png`, options);
      },
      
      waitForStableLayout: async () => {
        // Wait for layout to stabilize
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => {
          return document.readyState === 'complete';
        });
        await page.waitForTimeout(1000);
      }
    });
  }
});

// Custom expect matchers
expect.extend({
  async toBeAccessible(received: any) {
    // Basic accessibility checks
    const page = received;
    
    try {
      // Check for basic accessibility requirements
      const hasMainLandmark = await page.locator('main, [role="main"]').count() > 0;
      const hasHeadings = await page.locator('h1, h2, h3, h4, h5, h6').count() > 0;
      const hasSkipLinks = await page.locator('[href^="#"], [href*="skip"]').count() > 0;
      
      const issues = [];
      if (!hasMainLandmark) issues.push('Missing main landmark');
      if (!hasHeadings) issues.push('Missing heading structure');
      
      if (issues.length === 0) {
        return {
          message: () => 'Page meets basic accessibility requirements',
          pass: true
        };
      } else {
        return {
          message: () => `Accessibility issues found: ${issues.join(', ')}`,
          pass: false
        };
      }
    } catch (error) {
      return {
        message: () => `Error checking accessibility: ${error}`,
        pass: false
      };
    }
  },

  async toHavePerformantResponse(received: any, maxTime: number) {
    const actualTime = received;
    
    return {
      message: () => 
        actualTime <= maxTime 
          ? `Response time ${actualTime}ms is within acceptable range (${maxTime}ms)`
          : `Response time ${actualTime}ms exceeds acceptable range (${maxTime}ms)`,
      pass: actualTime <= maxTime
    };
  }
});

// Global test configuration
export const testConfig = {
  // Performance thresholds
  performance: {
    smallCodeMaxTime: 3000,
    mediumCodeMaxTime: 8000,
    largeCodeMaxTime: 15000,
    interactionMaxTime: 500,
    loadingMaxTime: 2000
  },
  
  // Visual regression settings
  visual: {
    threshold: 0.2,
    animations: 'disabled' as const,
    mode: 'css' as const
  },
  
  // Accessibility settings
  accessibility: {
    includeHidden: false,
    checkColorContrast: true,
    checkFocusOrder: true
  }
};

// Test data validation
export const validateTestData = {
  hasRequiredPatterns: (code: string) => {
    const patterns = [
      /useState/,
      /useEffect/,
      /fetch|axios/,
      /onClick/,
      /try.*catch/
    ];
    
    return patterns.some(pattern => pattern.test(code));
  },
  
  isValidJavaScript: (code: string) => {
    try {
      new Function(code);
      return true;
    } catch {
      return false;
    }
  },
  
  hasMinimumComplexity: (code: string) => {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    return lines.length >= 5;
  }
};

export { expect };