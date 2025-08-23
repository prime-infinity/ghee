import React from "react";
import { Code, Github, HelpCircle } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Ghee</h1>
                <p className="text-xs text-gray-500">Code Visualizer</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#visualizer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Visualizer
              </a>
              <a
                href="#examples"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Examples
              </a>
              <a
                href="#help"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Help
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <a
                href="https://github.com/your-repo/ghee"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">About Ghee</h3>
              <p className="text-gray-600 text-sm">
                Transform your JavaScript and TypeScript code into interactive
                visual diagrams. Understand patterns, flows, and relationships
                in your code at a glance.
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Pattern Recognition</li>
                <li>• Interactive Diagrams</li>
                <li>• Real-time Validation</li>
                <li>• TypeScript Support</li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>
                  <a
                    href="#help"
                    className="hover:text-gray-900 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#examples"
                    className="hover:text-gray-900 transition-colors"
                  >
                    Examples
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/your-repo/ghee/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition-colors"
                  >
                    Report Issues
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© 2024 Ghee Code Visualizer. Built with React and TypeScript.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
