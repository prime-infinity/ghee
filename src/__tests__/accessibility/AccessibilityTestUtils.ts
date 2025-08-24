/**
 * Accessibility testing utilities
 * Provides helper functions for testing accessibility features
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test keyboard navigation through a set of elements
 */
export const testKeyboardNavigation = async (elements: HTMLElement[]) => {
  const user = userEvent.setup();
  
  // Start from the first element
  elements[0].focus();
  expect(elements[0]).toHaveFocus();
  
  // Tab through all elements
  for (let i = 1; i < elements.length; i++) {
    await user.tab();
    expect(elements[i]).toHaveFocus();
  }
  
  // Shift+Tab back through elements
  for (let i = elements.length - 2; i >= 0; i--) {
    await user.tab({ shift: true });
    expect(elements[i]).toHaveFocus();
  }
};

/**
 * Test that an element has proper ARIA attributes
 */
export const testAriaAttributes = (element: HTMLElement, expectedAttributes: Record<string, string>) => {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element).toHaveAttribute(attr, value);
  });
};

/**
 * Test that all interactive elements have accessible names
 */
export const testAccessibleNames = (container: HTMLElement) => {
  const interactiveElements = within(container).getAllByRole(/button|link|textbox|combobox|checkbox|radio|slider|spinbutton/);
  
  interactiveElements.forEach((element) => {
    // Check if element has an accessible name
    const accessibleName = element.getAttribute('aria-label') ||
                          element.getAttribute('aria-labelledby') ||
                          element.textContent?.trim();
    
    expect(accessibleName).toBeTruthy();
  });
};

/**
 * Test that all images have alt text or are marked as decorative
 */
export const testImageAltText = (container: HTMLElement) => {
  const images = container.querySelectorAll('img');
  
  images.forEach((img) => {
    const hasAltText = img.hasAttribute('alt');
    const isDecorative = img.getAttribute('aria-hidden') === 'true' || img.getAttribute('role') === 'presentation';
    
    expect(hasAltText || isDecorative).toBe(true);
  });
};

/**
 * Test focus management in modals
 */
export const testModalFocusManagement = async (
  openModalTrigger: HTMLElement,
  modalSelector: string,
  closeModalTrigger?: HTMLElement
) => {
  const user = userEvent.setup();
  
  // Focus should be on the trigger initially
  openModalTrigger.focus();
  expect(openModalTrigger).toHaveFocus();
  
  // Open modal
  await user.click(openModalTrigger);
  
  // Wait for modal to appear
  const modal = await screen.findByRole('dialog');
  expect(modal).toBeInTheDocument();
  
  // Focus should move to first focusable element in modal
  const firstFocusable = within(modal).getAllByRole(/button|link|textbox/)[0];
  expect(firstFocusable).toHaveFocus();
  
  // Test Escape key closes modal
  await user.keyboard('{Escape}');
  
  // Modal should be closed and focus returned to trigger
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(openModalTrigger).toHaveFocus();
};

/**
 * Test screen reader announcements
 */
export const testScreenReaderAnnouncements = (container: HTMLElement) => {
  const liveRegions = container.querySelectorAll('[aria-live]');
  
  liveRegions.forEach((region) => {
    const ariaLive = region.getAttribute('aria-live');
    expect(['polite', 'assertive', 'off']).toContain(ariaLive);
  });
  
  // Check for status elements
  const statusElements = container.querySelectorAll('[role="status"], [role="alert"]');
  expect(statusElements.length).toBeGreaterThan(0);
};

/**
 * Test high contrast mode compatibility
 */
export const testHighContrastMode = (container: HTMLElement) => {
  // Add high contrast class
  document.documentElement.classList.add('high-contrast');
  
  // Check that elements are still visible and functional
  const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
  
  interactiveElements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    
    // Elements should have visible borders in high contrast mode
    expect(styles.borderWidth).not.toBe('0px');
  });
  
  // Clean up
  document.documentElement.classList.remove('high-contrast');
};

/**
 * Test reduced motion preferences
 */
export const testReducedMotion = (container: HTMLElement) => {
  // Add reduced motion class
  document.documentElement.classList.add('reduced-motion');
  
  // Check that animations are disabled or minimal
  const animatedElements = container.querySelectorAll('[class*="animate"], [class*="transition"]');
  
  animatedElements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    
    // Animation duration should be very short or zero
    const animationDuration = parseFloat(styles.animationDuration || '0');
    const transitionDuration = parseFloat(styles.transitionDuration || '0');
    
    expect(animationDuration).toBeLessThanOrEqual(0.01);
    expect(transitionDuration).toBeLessThanOrEqual(0.01);
  });
  
  // Clean up
  document.documentElement.classList.remove('reduced-motion');
};

/**
 * Test color contrast ratios
 */
export const testColorContrast = (element: HTMLElement, minimumRatio: number = 4.5) => {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;
  
  // This is a simplified test - in a real implementation, you'd need
  // a proper color contrast calculation library
  expect(color).toBeTruthy();
  expect(backgroundColor).toBeTruthy();
  
  // For now, just ensure colors are defined
  expect(color).not.toBe('rgba(0, 0, 0, 0)');
  expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
};

/**
 * Test form accessibility
 */
export const testFormAccessibility = (form: HTMLElement) => {
  const formControls = within(form).getAllByRole(/textbox|combobox|checkbox|radio|button/);
  
  formControls.forEach((control) => {
    // Each form control should have a label
    const hasLabel = control.getAttribute('aria-label') ||
                    control.getAttribute('aria-labelledby') ||
                    form.querySelector(`label[for="${control.id}"]`);
    
    expect(hasLabel).toBeTruthy();
    
    // Required fields should be marked as such
    if (control.hasAttribute('required')) {
      expect(control).toHaveAttribute('aria-required', 'true');
    }
    
    // Invalid fields should be marked as such
    if (control.getAttribute('aria-invalid') === 'true') {
      const hasErrorMessage = control.getAttribute('aria-describedby') &&
                             form.querySelector(`#${control.getAttribute('aria-describedby')}`);
      expect(hasErrorMessage).toBeTruthy();
    }
  });
};

/**
 * Test tooltip accessibility
 */
export const testTooltipAccessibility = async (trigger: HTMLElement, expectedTooltipText: string) => {
  const user = userEvent.setup();
  
  // Trigger should have aria-describedby
  expect(trigger).toHaveAttribute('aria-describedby');
  
  const tooltipId = trigger.getAttribute('aria-describedby');
  expect(tooltipId).toBeTruthy();
  
  // Hover to show tooltip
  await user.hover(trigger);
  
  // Tooltip should appear
  const tooltip = document.getElementById(tooltipId!);
  expect(tooltip).toBeInTheDocument();
  expect(tooltip).toHaveTextContent(expectedTooltipText);
  expect(tooltip).toHaveAttribute('role', 'tooltip');
  
  // Unhover to hide tooltip
  await user.unhover(trigger);
};

/**
 * Test skip links functionality
 */
export const testSkipLinks = async () => {
  const user = userEvent.setup();
  
  // Tab to first skip link
  await user.tab();
  
  const skipLink = screen.getByRole('link', { name: /skip to main content/i });
  expect(skipLink).toHaveFocus();
  
  // Activate skip link
  await user.keyboard('{Enter}');
  
  // Focus should move to main content
  const mainContent = screen.getByRole('main');
  expect(mainContent).toHaveFocus();
};

/**
 * Test landmark regions
 */
export const testLandmarkRegions = (container: HTMLElement) => {
  // Check for required landmark regions
  const main = within(container).getByRole('main');
  expect(main).toBeInTheDocument();
  
  // Check for navigation if present
  const nav = within(container).queryByRole('navigation');
  if (nav) {
    expect(nav).toHaveAttribute('aria-label');
  }
  
  // Check for contentinfo (footer) if present
  const footer = within(container).queryByRole('contentinfo');
  if (footer) {
    expect(footer).toBeInTheDocument();
  }
};

/**
 * Comprehensive accessibility test suite
 */
export const runAccessibilityTestSuite = async (container: HTMLElement) => {
  // Test basic accessibility features
  testAccessibleNames(container);
  testImageAltText(container);
  testScreenReaderAnnouncements(container);
  testLandmarkRegions(container);
  
  // Test keyboard navigation
  const interactiveElements = within(container).getAllByRole(/button|link|textbox/);
  if (interactiveElements.length > 1) {
    await testKeyboardNavigation(interactiveElements);
  }
  
  // Test high contrast mode
  testHighContrastMode(container);
  
  // Test reduced motion
  testReducedMotion(container);
  
  // Test forms if present
  const forms = container.querySelectorAll('form');
  forms.forEach(testFormAccessibility);
};