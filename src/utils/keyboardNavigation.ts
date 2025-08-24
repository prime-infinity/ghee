/**
 * Keyboard navigation utilities for accessibility
 */

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
};

/**
 * Trap focus within a container (useful for modals)
 */
export const trapFocus = (container: HTMLElement) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus the first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Handle arrow key navigation for a list of elements
 */
export const handleArrowNavigation = (
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number,
  options: {
    vertical?: boolean;
    horizontal?: boolean;
    wrap?: boolean;
  } = {}
): number => {
  const { vertical = true, horizontal = true, wrap = true } = options;
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowUp':
      if (vertical) {
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : wrap ? elements.length - 1 : currentIndex;
      }
      break;
    case 'ArrowDown':
      if (vertical) {
        event.preventDefault();
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : wrap ? 0 : currentIndex;
      }
      break;
    case 'ArrowLeft':
      if (horizontal) {
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : wrap ? elements.length - 1 : currentIndex;
      }
      break;
    case 'ArrowRight':
      if (horizontal) {
        event.preventDefault();
        newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : wrap ? 0 : currentIndex;
      }
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = elements.length - 1;
      break;
  }

  if (newIndex !== currentIndex && elements[newIndex]) {
    elements[newIndex].focus();
  }

  return newIndex;
};

/**
 * Create a roving tabindex manager for a group of elements
 */
export class RovingTabindexManager {
  private elements: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(
    private container: HTMLElement,
    private selector: string,
    private options: {
      vertical?: boolean;
      horizontal?: boolean;
      wrap?: boolean;
    } = {}
  ) {
    this.updateElements();
    this.setupEventListeners();
  }

  /**
   * Update the list of managed elements
   */
  updateElements() {
    this.elements = Array.from(this.container.querySelectorAll(this.selector));
    this.updateTabindices();
  }

  /**
   * Update tabindex attributes
   */
  private updateTabindices() {
    this.elements.forEach((element, index) => {
      element.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
    });
  }

  /**
   * Set focus to a specific element
   */
  focusElement(index: number) {
    if (index >= 0 && index < this.elements.length) {
      this.currentIndex = index;
      this.updateTabindices();
      this.elements[index].focus();
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.container.addEventListener('focusin', this.handleFocusIn.bind(this));
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const currentIndex = this.elements.indexOf(target);
    
    if (currentIndex === -1) return;

    const newIndex = handleArrowNavigation(event, this.elements, currentIndex, this.options);
    
    if (newIndex !== currentIndex) {
      this.currentIndex = newIndex;
      this.updateTabindices();
    }
  }

  /**
   * Handle focus events
   */
  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    const index = this.elements.indexOf(target);
    
    if (index !== -1) {
      this.currentIndex = index;
      this.updateTabindices();
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.container.removeEventListener('focusin', this.handleFocusIn.bind(this));
  }
}

/**
 * Announce text to screen readers
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
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if an element is visible and focusable
 */
export const isElementFocusable = (element: HTMLElement): boolean => {
  // Check if element is disabled
  if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
    return false;
  }

  // Check if element is hidden
  if (element.hidden || element.style.display === 'none' || element.style.visibility === 'hidden') {
    return false;
  }

  // Check if element has negative tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex === '-1') {
    return false;
  }

  return true;
};