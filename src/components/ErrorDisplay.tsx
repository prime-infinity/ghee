import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  X,
} from "lucide-react";
import type { UserFriendlyError } from "../types/errors";

/**
 * Props for ErrorDisplay component
 */
interface ErrorDisplayProps {
  /** Error to display */
  error: UserFriendlyError;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Callback when dismiss is clicked */
  onDismiss?: () => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show dismiss button */
  showDismiss?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Component for displaying user-friendly errors with suggestions and actions
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  showDetails = false,
  onRetry,
  onDismiss,
  showRetry = false,
  showDismiss = false,
  className = "",
}) => {
  const getSeverityConfig = (severity: UserFriendlyError["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: AlertTriangle,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-900",
          textColor: "text-red-800",
        };
      case "high":
        return {
          icon: AlertTriangle,
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          iconColor: "text-orange-600",
          titleColor: "text-orange-900",
          textColor: "text-orange-800",
        };
      case "medium":
        return {
          icon: AlertCircle,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-900",
          textColor: "text-yellow-800",
        };
      case "low":
        return {
          icon: Info,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-900",
          textColor: "text-blue-800",
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          titleColor: "text-gray-900",
          textColor: "text-gray-800",
        };
    }
  };

  const config = getSeverityConfig(error.severity);
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border ${config.bgColor} ${config.borderColor} p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Error header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${config.titleColor}`}>
                {error.message}
              </h3>
              <p className={`mt-1 text-sm ${config.textColor}`}>
                {error.description}
              </p>
            </div>

            {/* Dismiss button */}
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className={`flex-shrink-0 p-1 rounded-md hover:bg-white/50 transition-colors ${config.iconColor}`}
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Error suggestions */}
          {error.suggestions.length > 0 && (
            <div className="mt-3">
              <h4 className={`text-sm font-medium ${config.titleColor} mb-2`}>
                Suggestions:
              </h4>
              <ul className={`text-sm ${config.textColor} space-y-1`}>
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle
                      className={`w-3 h-3 mt-0.5 flex-shrink-0 ${config.iconColor}`}
                    />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error details (development/debug mode) */}
          {showDetails && (error.context || error.originalError) && (
            <div className="mt-3 p-3 bg-white/50 rounded border">
              <h4 className={`text-xs font-medium ${config.titleColor} mb-2`}>
                Technical Details:
              </h4>

              {error.context && (
                <div className="mb-2">
                  <span className={`text-xs ${config.textColor}`}>
                    Component: {error.context.component} | Operation:{" "}
                    {error.context.operation}
                  </span>
                  {error.context.line && error.context.column && (
                    <span className={`text-xs ${config.textColor} ml-2`}>
                      | Line {error.context.line}, Column {error.context.column}
                    </span>
                  )}
                </div>
              )}

              {error.originalError && (
                <div
                  className={`text-xs font-mono ${config.textColor} bg-white p-2 rounded border overflow-auto max-h-20`}
                >
                  {error.originalError.toString()}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {(showRetry || showDismiss) && (
            <div className="mt-4 flex gap-2">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    error.severity === "critical" || error.severity === "high"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : error.severity === "medium"
                      ? "bg-yellow-600 text-white hover:bg-yellow-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Props for ErrorList component
 */
interface ErrorListProps {
  /** List of errors to display */
  errors: UserFriendlyError[];
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Callback when retry is clicked for an error */
  onRetry?: (error: UserFriendlyError) => void;
  /** Callback when dismiss is clicked for an error */
  onDismiss?: (error: UserFriendlyError) => void;
  /** Whether to show retry buttons */
  showRetry?: boolean;
  /** Whether to show dismiss buttons */
  showDismiss?: boolean;
  /** Custom className */
  className?: string;
  /** Maximum number of errors to show */
  maxErrors?: number;
}

/**
 * Component for displaying a list of errors
 */
export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  showDetails = false,
  onRetry,
  onDismiss,
  showRetry = false,
  showDismiss = false,
  className = "",
  maxErrors = 5,
}) => {
  if (errors.length === 0) {
    return null;
  }

  const displayErrors = errors.slice(0, maxErrors);
  const hasMoreErrors = errors.length > maxErrors;

  return (
    <div className={`space-y-3 ${className}`}>
      {displayErrors.map((error, index) => (
        <ErrorDisplay
          key={`${error.code}-${index}`}
          error={error}
          showDetails={showDetails}
          onRetry={onRetry ? () => onRetry(error) : undefined}
          onDismiss={onDismiss ? () => onDismiss(error) : undefined}
          showRetry={showRetry}
          showDismiss={showDismiss}
        />
      ))}

      {hasMoreErrors && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-500">
            ... and {errors.length - maxErrors} more error
            {errors.length - maxErrors !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Props for WarningDisplay component
 */
interface WarningDisplayProps {
  /** Warning message */
  message: string;
  /** Additional warnings */
  warnings?: string[];
  /** Whether to show as dismissible */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Component for displaying warnings
 */
export const WarningDisplay: React.FC<WarningDisplayProps> = ({
  message,
  warnings = [],
  dismissible = false,
  onDismiss,
  className = "",
}) => {
  return (
    <div
      className={`rounded-lg border bg-yellow-50 border-yellow-200 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-900">{message}</h3>

              {warnings.length > 0 && (
                <ul className="mt-2 text-sm text-yellow-800 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-md hover:bg-white/50 transition-colors text-yellow-600"
                aria-label="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
