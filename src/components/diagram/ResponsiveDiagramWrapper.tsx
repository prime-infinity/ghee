import React, { useState, useEffect } from "react";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { InteractiveDiagramComponent } from "../InteractiveDiagramComponent";
import type { InteractiveDiagramProps } from "../InteractiveDiagramComponent";

/**
 * Props for the ResponsiveDiagramWrapper component
 */
export interface ResponsiveDiagramWrapperProps
  extends Omit<InteractiveDiagramProps, "className"> {
  /** Custom CSS class for the wrapper */
  className?: string;
  /** Whether to show fullscreen toggle */
  showFullscreenToggle?: boolean;
  /** Whether to show reset view button */
  showResetView?: boolean;
}

/**
 * Responsive wrapper for the InteractiveDiagramComponent
 * Handles different screen sizes and provides fullscreen functionality
 */
export const ResponsiveDiagramWrapper: React.FC<
  ResponsiveDiagramWrapperProps
> = ({
  className = "",
  showFullscreenToggle = true,
  showResetView = true,
  ...diagramProps
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  // Detect screen size
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize("mobile");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  // Get responsive height based on screen size
  const getResponsiveHeight = () => {
    if (isFullscreen) return "h-screen";

    switch (screenSize) {
      case "mobile":
        return "h-64 sm:h-80";
      case "tablet":
        return "h-80 md:h-96";
      case "desktop":
      default:
        return "h-96 lg:h-[500px]";
    }
  };

  // Get responsive class names
  const getResponsiveClasses = () => {
    const baseClasses = "relative";
    const heightClasses = getResponsiveHeight();

    if (isFullscreen) {
      return `${baseClasses} ${heightClasses} fixed inset-0 z-50 bg-white`;
    }

    return `${baseClasses} ${heightClasses} ${className}`;
  };

  // Get diagram class names
  const getDiagramClasses = () => {
    const baseClasses = "w-full";
    const heightClasses = getResponsiveHeight();

    return `${baseClasses} ${heightClasses}`;
  };

  return (
    <div className={getResponsiveClasses()}>
      {/* Control Bar */}
      {(showFullscreenToggle || showResetView) && (
        <div className="absolute top-2 right-2 z-10 flex space-x-2">
          {showResetView && (
            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
              title="Reset view"
              aria-label="Reset diagram view"
            >
              <RotateCcw size={16} className="text-gray-600" />
            </button>
          )}

          {showFullscreenToggle && (
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 size={16} className="text-gray-600" />
              ) : (
                <Maximize2 size={16} className="text-gray-600" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleFullscreen}
        />
      )}

      {/* Diagram Component */}
      <InteractiveDiagramComponent
        {...diagramProps}
        className={getDiagramClasses()}
      />

      {/* Mobile Instructions */}
      {screenSize === "mobile" &&
        !isFullscreen &&
        diagramProps.diagramData.nodes.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-800">
            <p className="font-medium mb-1">📱 Mobile Tip:</p>
            <p>Pinch to zoom, drag to pan. Tap nodes and arrows for details.</p>
          </div>
        )}

      {/* Tablet Instructions */}
      {screenSize === "tablet" &&
        !isFullscreen &&
        diagramProps.diagramData.nodes.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-600">
            <p>💡 Tap the fullscreen button for a better view</p>
          </div>
        )}
    </div>
  );
};

export default ResponsiveDiagramWrapper;
