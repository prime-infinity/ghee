import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug, HelpCircle } from "lucide-react";

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show detailed error information */
  showDetails?: boolean;
  /** Custom error title */
  title?: string;
  /** Custom error message */
  message?: string;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

/**
 * Error boundary component for graceful error handling
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReset = () => {
    // Reset the entire application state
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  getErrorSuggestions = (error: Error): string[] => {
    const suggestions: string[] = [];

    if (error.name === "ChunkLoadError") {
      suggestions.push("Refresh the page to reload the application");
      suggestions.push("Clear your browser cache and try again");
    } else if (error.message.includes("Network")) {
      suggestions.push("Check your internet connection");
      suggestions.push("Try again in a few moments");
    } else if (error.message.includes("Memory")) {
      suggestions.push("Close other browser tabs to free memory");
      suggestions.push("Try with smaller code samples");
    } else {
      suggestions.push("Try refreshing the page");
      suggestions.push("Try with different code");
      suggestions.push("Check browser console for more details");
    }

    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const suggestions = this.getErrorSuggestions(this.state.error);
      const showRetry = this.state.retryCount < 3; // Limit retry attempts

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {this.props.title || "Something went wrong"}
              </h1>
              <p className="text-gray-600 mb-4">
                {this.props.message ||
                  "We encountered an unexpected error. This might be due to invalid code or a temporary issue."}
              </p>

              {/* Error suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Suggestions:
                    </span>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                {showRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again{" "}
                    {this.state.retryCount > 0 &&
                      `(${this.state.retryCount}/3)`}
                  </button>
                )}

                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Reset Application
                </button>

                {/* Toggle error details */}
                {(this.props.showDetails ||
                  process.env.NODE_ENV === "development") &&
                  this.state.error && (
                    <button
                      onClick={this.toggleDetails}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Bug className="w-4 h-4" />
                      {this.state.showDetails ? "Hide" : "Show"} Error Details
                    </button>
                  )}
              </div>

              {/* Error details */}
              {this.state.showDetails && this.state.error && (
                <div className="mt-6 text-left">
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Error Details:
                    </div>
                    <div className="text-xs font-mono text-gray-800 mb-3 p-2 bg-white rounded border overflow-auto max-h-32">
                      {this.state.error.toString()}
                    </div>

                    {this.state.errorInfo && (
                      <>
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          Component Stack:
                        </div>
                        <div className="text-xs font-mono text-gray-800 p-2 bg-white rounded border overflow-auto max-h-32 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error);
    setError(error);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
};
