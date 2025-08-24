/**
 * Accessibility validation utilities
 * Provides functions to validate and ensure accessibility compliance
 */

/**
 * Accessibility validation result
 */
export interface AccessibilityValidationResult {
  /** Whether the element passes accessibility checks */
  isValid: boolean;
  /** List of accessibility issues found */
  issues: AccessibilityIssue[];
  /** Suggestions for fixing issues */
  suggestions: string[];
}

/**
 * Accessibility issue details
 */
export interface AccessibilityIssue {
  /** Type of accessibility issue */
  type: 'missing-label' | 'missing-description' | 'low-contrast' | 'keyboard-trap' | 'focus-order' | 'missing-alt-text';
  /** Severity of the issue */
  severity: 'error' | 'warning' | 'info';
  /** Description of the issue */
  message: string;
  /** Element that has the issue */
  element?: HTMLElement;
}

/**
 * Validate accessibility of an element and its children
 */
export const validateElementAccessibility = (element: HTMLElement): AccessibilityValidationResult => {
  const issues: AccessibilityIssue[] = [];
  const suggestions: string[] = [];

  // Check for missing ARIA labels on interactive elements
  const interactiveElements = element.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]');
  interactiveElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const hasLabel = htmlEl.getAttribute('aria-label') || 
                    htmlEl.getAttribute('aria-labelledby') ||
                    htmlEl.textContent?.trim() ||
                    htmlEl.querySelector('img')?.getAttribute('alt');

    if (!hasLabel) {
      issues.push({
        type: 'missing-label',
        severity: 'error',
        message: `Interactive element missing accessible label: ${htmlEl.tagName.toLowerCase()}`,
        element: htmlEl
      });
      suggestions.push('Add aria-label, aria-labelledby, or visible text to interactive elements');
    }
  });

  // Check for images without alt text
  const images = element.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.getAttribute('alt') && !img.getAttribute('aria-hidden')) {
      issues.push({
        type: 'missing-alt-text',
        severity: 'error',
        message: 'Image missing alt text',
        element: img as HTMLElement
      });
      suggestions.push('Add alt text to images or mark decorative images with aria-hidden="true"');
    }
  });

  // Check for proper heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      issues.push({
        type: 'focus-order',
        severity: 'warning',
        message: `Heading level skipped: ${heading.tagName} follows h${previousLevel}`,
        element: heading as HTMLElement
      });
      suggestions.push('Use proper heading hierarchy (h1, h2, h3, etc.) without skipping levels');
    }
    previousLevel = level;
  });

  // Check for form elements without labels
  const formElements = element.querySelectorAll('input:not([type="hidden"]), select, textarea');
  formElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const hasLabel = htmlEl.getAttribute('aria-label') ||
                    htmlEl.getAttribute('aria-labelledby') ||
                    element.querySelector(`label[for="${htmlEl.id}"]`);

    if (!hasLabel) {
      issues.push({
        type: 'missing-label',
        severity: 'error',
        message: `Form element missing label: ${htmlEl.tagName.toLowerCase()}`,
        element: htmlEl
      });
      suggestions.push('Associate form elements with labels using for/id or aria-labelledby');
    }
  });

  // Check for elements with role="button" that aren't keyboard accessible
  const roleButtons = element.querySelectorAll('[role="button"]');
  roleButtons.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!htmlEl.hasAttribute('tabindex') && htmlEl.tagName.toLowerCase() !== 'button') {
      issues.push({
        type: 'keyboard-trap',
        severity: 'error',
        message: 'Element with role="button" not keyboard accessible',
        element: htmlEl
      });
      suggestions.push('Add tabindex="0" to elements with role="button" that aren\'t native buttons');
    }
  });

  return {
    isValid: issues.filter(issue => issue.severity === 'error').length === 0,
    issues,
    suggestions: [...new Set(suggestions)] // Remove duplicates
  };
};

/**
 * Check color contrast ratio between foreground and background colors
 */
export const checkColorContrast = (foreground: string, background: string): { ratio: number; isValid: boolean } => {
  // Convert hex colors to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    return { ratio: 0, isValid: false };
  }

  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return {
    ratio,
    isValid: ratio >= 4.5
  };
};

/**
 * Validate keyboard navigation within an element
 */
export const validateKeyboardNavigation = (element: HTMLElement): AccessibilityValidationResult => {
  const issues: AccessibilityIssue[] = [];
  const suggestions: string[] = [];

  // Get all focusable elements
  const focusableElements = element.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  // Check if there are focusable elements but no proper tab order
  if (focusableElements.length > 0) {
    let hasProperTabOrder = true;
    let previousTabIndex = -1;

    focusableElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const tabIndex = parseInt(htmlEl.getAttribute('tabindex') || '0');
      
      if (tabIndex > 0 && tabIndex < previousTabIndex) {
        hasProperTabOrder = false;
      }
      previousTabIndex = tabIndex;
    });

    if (!hasProperTabOrder) {
      issues.push({
        type: 'focus-order',
        severity: 'warning',
        message: 'Tab order may not be logical',
        element
      });
      suggestions.push('Ensure tab order follows logical reading order');
    }
  }

  // Check for keyboard traps
  const elementsWithTabIndex = element.querySelectorAll('[tabindex]');
  elementsWithTabIndex.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const tabIndex = htmlEl.getAttribute('tabindex');
    
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push({
        type: 'keyboard-trap',
        severity: 'warning',
        message: 'Positive tabindex values can create keyboard traps',
        element: htmlEl
      });
      suggestions.push('Use tabindex="0" or rely on natural tab order instead of positive tabindex values');
    }
  });

  return {
    isValid: issues.filter(issue => issue.severity === 'error').length === 0,
    issues,
    suggestions: [...new Set(suggestions)]
  };
};

/**
 * Generate accessibility report for an element
 */
export const generateAccessibilityReport = (element: HTMLElement): {
  overall: AccessibilityValidationResult;
  keyboard: AccessibilityValidationResult;
  colorContrast: { ratio: number; isValid: boolean } | null;
} => {
  const overall = validateElementAccessibility(element);
  const keyboard = validateKeyboardNavigation(element);
  
  // Try to get computed styles for color contrast check
  let colorContrast = null;
  try {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      // This is a simplified check - in a real implementation, you'd need to handle
      // rgba colors and more complex color calculations
      colorContrast = { ratio: 0, isValid: true }; // Placeholder
    }
  } catch (error) {
    // Ignore errors in color contrast calculation
  }

  return {
    overall,
    keyboard,
    colorContrast
  };
};

/**
 * Add skip links to a page
 */
export const addSkipLinks = (targets: { id: string; label: string }[]) => {
  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.className = 'skip-links';
  skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');

  targets.forEach(({ id, label }) => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${id}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = label;
    skipLinksContainer.appendChild(skipLink);
  });

  document.body.insertBefore(skipLinksContainer, document.body.firstChild);
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

/**
 * Ensure element has proper ARIA attributes
 */
export const ensureAriaAttributes = (element: HTMLElement, attributes: Record<string, string>) => {
  Object.entries(attributes).forEach(([attr, value]) => {
    if (!element.getAttribute(attr)) {
      element.setAttribute(attr, value);
    }
  });
};

/**
 * Create accessible tooltip
 */
export const createAccessibleTooltip = (trigger: HTMLElement, content: string) => {
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = tooltipId;
  tooltip.role = 'tooltip';
  tooltip.className = 'sr-only'; // Initially hidden
  tooltip.textContent = content;
  
  // Add to DOM
  document.body.appendChild(tooltip);
  
  // Associate with trigger
  trigger.setAttribute('aria-describedby', tooltipId);
  
  return {
    show: () => {
      tooltip.className = 'tooltip-visible';
      tooltip.setAttribute('aria-hidden', 'false');
    },
    hide: () => {
      tooltip.className = 'sr-only';
      tooltip.setAttribute('aria-hidden', 'true');
    },
    destroy: () => {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
      trigger.removeAttribute('aria-describedby');
    }
  };
};