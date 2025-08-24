import React, { useEffect, useState } from "react";
import { Clock, Zap, Brain, Eye, AlertTriangle, X } from "lucide-react";
import { LoadingSpinner, PulsingDots } from "./LoadingSpinner";
import type { CodeComplexityMetrics } from "../services/PerformanceService";

/**
 * Processing stage information
 */
export interface ProcessingStageInfo {
  stage: "parsing" | "pattern-recognition" | "visualization" | "optimization";
  progress: number;
  message: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Props for ProgressiveLoadingIndicator
 */
export interface ProgressiveLoadingIndicatorProps {
  /** Current processing stage */
  currentStage: ProcessingStageInfo["stage"] | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Code complexity metrics */
  complexity?: CodeComplexityMetrics;
  /** Estimated total time remaining in milliseconds */
  estimatedTimeRemaining?: number;
  /** Whether processing can be cancelled */
  canCancel?: boolean;
  /** Callback to cancel processing */
  onCancel?: () => void;
  /** Additional warnings to display */
  warnings?: string[];
  /** Custom CSS class */
  className?: string;
}

/**
 * Stage definitions with icons and descriptions
 */
const STAGE_DEFINITIONS: Record<
  ProcessingStageInfo["stage"],
  Omit<ProcessingStageInfo, "progress">
> = {
  parsing: {
    stage: "parsing",
    message: "Parsing your code...",
    description: "Converting code into an abstract syntax tree for analysis",
    icon: <Zap className="w-5 h-5" />,
  },
  "pattern-recognition": {
    stage: "pattern-recognition",
    message: "Recognizing patterns...",
    description: "Identifying code patterns and relationships",
    icon: <Brain className="w-5 h-5" />,
  },
  visualization: {
    stage: "visualization",
    message: "Generating visualization...",
    description: "Creating interactive diagram from recognized patterns",
    icon: <Eye className="w-5 h-5" />,
  },
  optimization: {
    stage: "optimization",
    message: "Optimizing diagram...",
    description: "Optimizing diagram for better performance and readability",
    icon: <Zap className="w-5 h-5" />,
  },
};

/**
 * Progressive loading indicator with detailed stage information
 */
export const ProgressiveLoadingIndicator: React.FC<
  ProgressiveLoadingIndicatorProps
> = ({
  currentStage,
  progress,
  complexity,
  estimatedTimeRemaining,
  canCancel = false,
  onCancel,
  warnings = [],
  className = "",
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format time in seconds
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get current stage info
  const stageInfo = currentStage ? STAGE_DEFINITIONS[currentStage] : null;

  // Calculate progress bar segments
  const stages = Object.keys(
    STAGE_DEFINITIONS
  ) as ProcessingStageInfo["stage"][];
  const stageProgress = stages.map((stage, index) => {
    if (!currentStage) return 0;

    const currentIndex = stages.indexOf(currentStage);
    if (index < currentIndex) return 100;
    if (index === currentIndex) return progress;
    return 0;
  });

  return (
    <div
      className={`bg-white border border-blue-200 rounded-lg p-4 md:p-6 shadow-sm hover-lift transition-smooth animate-fade-in ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {stageInfo && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-pulse-soft">
                <LoadingSpinner size="sm" color="blue" />
              </div>
              <span className="font-medium text-sm md:text-base">
                {stageInfo.message}
              </span>
            </div>
          )}
        </div>

        {canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors-smooth hover-lift self-start sm:self-auto"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        )}
      </div>

      {/* Stage description */}
      {stageInfo && (
        <p className="text-xs md:text-sm text-gray-600 mb-4 animate-slide-in-left">
          {stageInfo.description}
        </p>
      )}

      {/* Progress bar with stages */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2 overflow-x-auto">
          {stages.map((stage, index) => (
            <span
              key={stage}
              className={`capitalize whitespace-nowrap transition-colors-smooth ${
                currentStage === stage ? "text-blue-600 font-medium" : ""
              }`}
            >
              <span className="hidden sm:inline">
                {stage.replace("-", " ")}
              </span>
              <span className="sm:hidden">{stage.split("-")[0]}</span>
            </span>
          ))}
        </div>

        <div className="flex gap-1">
          {stageProgress.map((progress, index) => (
            <div
              key={index}
              className="flex-1 bg-gray-200 rounded-full h-2 md:h-3"
            >
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out animate-shimmer"
                style={{ width: `${progress}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Time and complexity info */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>

          {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-1">
              <span>Est. remaining: {formatTime(estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>

        {complexity && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Complexity:</span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                complexity.level === "simple"
                  ? "bg-green-100 text-green-700"
                  : complexity.level === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : complexity.level === "complex"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {complexity.level}
            </span>
          </div>
        )}
      </div>

      {/* Complexity details */}
      {complexity && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
          <div>
            <span className="font-medium">{complexity.lines}</span>
            <span className="text-gray-500 ml-1">lines</span>
          </div>
          <div>
            <span className="font-medium">{complexity.functions}</span>
            <span className="text-gray-500 ml-1">functions</span>
          </div>
          <div>
            <span className="font-medium">{complexity.variables}</span>
            <span className="text-gray-500 ml-1">variables</span>
          </div>
          <div>
            <span className="font-medium">{complexity.nestingDepth}</span>
            <span className="text-gray-500 ml-1">max depth</span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-yellow-800 text-sm mb-1">
                Processing Warnings
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Performance tips for complex code */}
      {complexity && complexity.level === "very-complex" && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Performance Tips:</div>
            <ul className="space-y-1 text-blue-700">
              <li>• Large code files may have simplified visualizations</li>
              <li>• Consider breaking complex code into smaller functions</li>
              <li>• Some patterns may be grouped for better readability</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveLoadingIndicator;
