import React, { useState } from "react";
import { Code, ExternalLink, HelpCircle, Menu, X } from "lucide-react";
import { AccessibilityMenu } from "./accessibility/AccessibilityMenu";

/**
 * Props for Layout component
 */
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component with navigation and responsive design
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Navigation Header */}
      <nav
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg animate-pulse-soft"
                aria-hidden="true"
              >
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                  Ghee
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Code Visualizer
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6" role="menubar">
              <a
                href="#visualizer"
                className="text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                role="menuitem"
              >
                Visualizer
              </a>
              <a
                href="#examples"
                className="text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                role="menuitem"
              >
                Examples
              </a>
              <a
                href="#help"
                className="text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                role="menuitem"
              >
                Help
              </a>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <AccessibilityMenu />
              <button
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded hover-lift"
                title="Help"
                aria-label="Help and documentation"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <a
                href="https://github.com/your-repo/ghee"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded hover-lift"
                title="View on GitHub"
                aria-label="View source code on GitHub (opens in new tab)"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <AccessibilityMenu />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 animate-fade-in">
              <div className="flex flex-col space-y-3">
                <a
                  href="#visualizer"
                  className="text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Visualizer
                </a>
                <a
                  href="#examples"
                  className="text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Examples
                </a>
                <a
                  href="#help"
                  className="text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Help
                </a>
                <div className="flex items-center gap-3 px-2 pt-2 border-t border-gray-200">
                  <button
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    title="Help"
                    aria-label="Help and documentation"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                  <a
                    href="https://github.com/your-repo/ghee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    title="View on GitHub"
                    aria-label="View source code on GitHub (opens in new tab)"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="flex-1" role="main">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="bg-white border-t border-gray-200 mt-12 md:mt-16"
        role="contentinfo"
      >
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* About */}
            <div className="animate-slide-in-left">
              <h3 className="font-semibold text-gray-900 mb-3">About Ghee</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Transform your JavaScript and TypeScript code into interactive
                visual diagrams. Understand patterns, flows, and relationships
                in your code at a glance.
              </p>
            </div>

            {/* Features */}
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Pattern Recognition</li>
                <li>• Interactive Diagrams</li>
                <li>• Real-time Validation</li>
                <li>• TypeScript Support</li>
                <li>• Accessibility Features</li>
                <li>• Mobile Responsive</li>
              </ul>
            </div>

            {/* Support */}
            <div
              className="animate-slide-in-right"
              style={{ animationDelay: "0.4s" }}
            >
              <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>
                  <a
                    href="#help"
                    className="hover:text-gray-900 transition-colors-smooth flex items-center gap-1"
                  >
                    Documentation
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="#examples"
                    className="hover:text-gray-900 transition-colors-smooth"
                  >
                    Examples
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/your-repo/ghee/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition-colors-smooth flex items-center gap-1"
                  >
                    Report Issues
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 Ghee Code Visualizer. Built with React and TypeScript.</p>
            <p className="mt-1 text-xs">
              Making code visualization accessible and intuitive for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
