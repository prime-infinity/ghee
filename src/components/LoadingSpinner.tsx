import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "gray" | "white";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "blue",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colorClasses = {
    blue: "border-blue-600",
    gray: "border-gray-600",
    white: "border-white",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-transparent ${sizeClasses[size]} ${colorClasses[color]} border-t-current ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface PulsingDotsProps {
  className?: string;
  dotColor?: string;
}

export const PulsingDots: React.FC<PulsingDotsProps> = ({
  className = "",
  dotColor = "bg-blue-600",
}) => {
  return (
    <div
      className={`flex space-x-1 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div
        className={`w-2 h-2 ${dotColor} rounded-full animate-pulse`}
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className={`w-2 h-2 ${dotColor} rounded-full animate-pulse`}
        style={{ animationDelay: "150ms" }}
      ></div>
      <div
        className={`w-2 h-2 ${dotColor} rounded-full animate-pulse`}
        style={{ animationDelay: "300ms" }}
      ></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  lines = 1,
}) => {
  return (
    <div
      className={`animate-pulse ${className}`}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${
            index === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          } h-4 ${index > 0 ? "mt-2" : ""}`}
        ></div>
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
};
