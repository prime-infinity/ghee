import { useEffect, useState, useCallback } from "react";

/**
 * Accessibility preferences interface
 */
export interface AccessibilityPreferences {
  /** High contrast mode enabled */
  highContrast: boolean;
  /** Reduced motion preference */
  reducedMotion: boolean;
  /** Keyboard navigation mode */
  keyboardNavigation: boolean;
  /** Screen reader mode */
  screenReader: boolean;
  /** Font size multiplier */
  fontSizeMultiplier: number;
}

/**
 * Default accessibility preferences
 */
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  keyboardNavigation: false,
  screenReader: false,
  fontSizeMultiplier: 1,
};

/**
 * Hook for managing accessibility preferences and features
 */
export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    DEFAULT_PREFERENCES
  );
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  /**
   * Load preferences from localStorage
   */
  const loadPreferences = useCallback(() => {
    try {
      const stored = localStorage.getItem("ghee-accessibility-preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn("Failed to load accessibility preferences:", error);
    }
  }, []);

  /**
   * Save preferences to localStorage
   */
  const savePreferences = useCallback((newPreferences: AccessibilityPreferences) => {
    try {
      localStorage.setItem(
        "ghee-accessibility-preferences",
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.warn("Failed to save accessibility preferences:", error);
    }
  }, []);

  /**
   * Update a specific preference
   */
  const updatePreference = useCallback(
    <K extends keyof AccessibilityPreferences>(
      key: K,
      value: AccessibilityPreferences[K]
    ) => {
      const newPreferences = { ...preferences, [key]: value };
      savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  /**
   * Toggle high contrast mode
   */
  const toggleHighContrast = useCallback(() => {
    updatePreference("highContrast", !preferences.highContrast);
  }, [preferences.highContrast, updatePreference]);

  /**
   * Toggle reduced motion
   */
  const toggleReducedMotion = useCallback(() => {
    updatePreference("reducedMotion", !preferences.reducedMotion);
  }, [preferences.reducedMotion, updatePreference]);

  /**
   * Detect system preferences
   */
  const detectSystemPreferences = useCallback(() => {
    // Detect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Detect prefers-contrast
    const prefersHighContrast = window.matchMedia(
      "(prefers-contrast: high)"
    ).matches;

    // Update preferences if not already set by user
    const updates: Partial<AccessibilityPreferences> = {};
    
    if (prefersReducedMotion && !preferences.reducedMotion) {
      updates.reducedMotion = true;
    }
    
    if (prefersHighContrast && !preferences.highContrast) {
      updates.highContrast = true;
    }

    if (Object.keys(updates).length > 0) {
      savePreferences({ ...preferences, ...updates });
    }
  }, [preferences, savePreferences]);

  /**
   * Detect keyboard usage
   */
  const detectKeyboardUsage = useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsKeyboardUser(true);
        updatePreference("keyboardNavigation", true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [updatePreference]);

  /**
   * Apply accessibility styles to document
   */
  const applyAccessibilityStyles = useCallback(() => {
    const root = document.documentElement;

    // High contrast mode
    if (preferences.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    // Keyboard navigation
    if (preferences.keyboardNavigation || isKeyboardUser) {
      root.classList.add("keyboard-navigation");
    } else {
      root.classList.remove("keyboard-navigation");
    }

    // Font size
    root.style.fontSize = `${preferences.fontSizeMultiplier * 100}%`;
  }, [preferences, isKeyboardUser]);

  // Initialize on mount
  useEffect(() => {
    loadPreferences();
    detectSystemPreferences();
    const cleanup = detectKeyboardUsage();
    return cleanup;
  }, []);

  // Apply styles when preferences change
  useEffect(() => {
    applyAccessibilityStyles();
  }, [applyAccessibilityStyles]);

  return {
    preferences,
    isKeyboardUser,
    updatePreference,
    toggleHighContrast,
    toggleReducedMotion,
    detectSystemPreferences,
  };
};