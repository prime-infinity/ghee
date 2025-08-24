import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Keyboard,
  Volume2,
  X,
} from "lucide-react";
import { useAccessibilityContext } from "./AccessibilityProvider";

/**
 * Props for AccessibilityMenu
 */
interface AccessibilityMenuProps {
  /** Custom CSS class */
  className?: string;
}

/**
 * Accessibility menu component for managing accessibility preferences
 */
export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    preferences,
    toggleHighContrast,
    toggleReducedMotion,
    updatePreference,
  } = useAccessibilityContext();

  /**
   * Handle menu toggle
   */
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Handle font size changes
   */
  const increaseFontSize = () => {
    const newSize = Math.min(preferences.fontSizeMultiplier + 0.1, 2);
    updatePreference("fontSizeMultiplier", newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(preferences.fontSizeMultiplier - 0.1, 0.8);
    updatePreference("fontSizeMultiplier", newSize);
  };

  const resetFontSize = () => {
    updatePreference("fontSizeMultiplier", 1);
  };

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Focus management for menu
   */
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstFocusable = menuRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Menu Toggle Button */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        aria-label="Open accessibility menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Accessibility Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Menu Panel */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          role="menu"
          aria-label="Accessibility settings menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Accessibility Settings
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close accessibility menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings */}
          <div className="p-4 space-y-4">
            {/* High Contrast Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {preferences.highContrast ? (
                  <Eye className="w-5 h-5 text-blue-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <label
                    htmlFor="high-contrast"
                    className="text-sm font-medium text-gray-900"
                  >
                    High Contrast Mode
                  </label>
                  <p className="text-xs text-gray-500">
                    Increase color contrast for better visibility
                  </p>
                </div>
              </div>
              <button
                id="high-contrast"
                onClick={toggleHighContrast}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${preferences.highContrast ? "bg-blue-600" : "bg-gray-200"}
                `}
                role="switch"
                aria-checked={preferences.highContrast}
                aria-labelledby="high-contrast"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${
                      preferences.highContrast
                        ? "translate-x-6"
                        : "translate-x-1"
                    }
                  `}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <div>
                  <label
                    htmlFor="reduced-motion"
                    className="text-sm font-medium text-gray-900"
                  >
                    Reduced Motion
                  </label>
                  <p className="text-xs text-gray-500">
                    Minimize animations and transitions
                  </p>
                </div>
              </div>
              <button
                id="reduced-motion"
                onClick={toggleReducedMotion}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${preferences.reducedMotion ? "bg-blue-600" : "bg-gray-200"}
                `}
                role="switch"
                aria-checked={preferences.reducedMotion}
                aria-labelledby="reduced-motion"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${
                      preferences.reducedMotion
                        ? "translate-x-6"
                        : "translate-x-1"
                    }
                  `}
                />
              </button>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Keyboard className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Font Size
                  </label>
                  <p className="text-xs text-gray-500">
                    Adjust text size for better readability
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decreaseFontSize}
                  disabled={preferences.fontSizeMultiplier <= 0.8}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Decrease font size"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-sm text-gray-700">
                    {Math.round(preferences.fontSizeMultiplier * 100)}%
                  </span>
                </div>
                <button
                  onClick={increaseFontSize}
                  disabled={preferences.fontSizeMultiplier >= 2}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Increase font size"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-center">
                <button
                  onClick={resetFontSize}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                >
                  Reset to default
                </button>
              </div>
            </div>

            {/* Screen Reader Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p className="mb-1">
                  <strong>Screen Reader Users:</strong> This application
                  provides comprehensive ARIA labels and descriptions for all
                  interactive elements.
                </p>
                <p>
                  Use Tab to navigate between elements, Enter/Space to activate
                  buttons, and Escape to close dialogs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
