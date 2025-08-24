import React, { createContext, useContext } from "react";
import {
  useAccessibility,
  type AccessibilityPreferences,
} from "../../hooks/useAccessibility";

/**
 * Accessibility context interface
 */
interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  isKeyboardUser: boolean;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  detectSystemPreferences: () => void;
}

/**
 * Accessibility context
 */
const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null
);

/**
 * Props for AccessibilityProvider
 */
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for accessibility features
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const accessibility = useAccessibility();

  return (
    <AccessibilityContext.Provider value={accessibility}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to use accessibility context
 */
export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibilityContext must be used within an AccessibilityProvider"
    );
  }
  return context;
};
