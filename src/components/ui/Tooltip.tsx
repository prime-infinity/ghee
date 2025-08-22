import React, { useState, useRef, useEffect } from "react";

/**
 * Position options for tooltip placement
 */
export type TooltipPosition = "top" | "bottom" | "left" | "right" | "auto";

/**
 * Props for the Tooltip component
 */
export interface TooltipProps {
  /** Content to display in the tooltip */
  content: string;
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition;
  /** Whether to show the tooltip */
  show?: boolean;
  /** Delay before showing tooltip on hover (ms) */
  showDelay?: number;
  /** Delay before hiding tooltip (ms) */
  hideDelay?: number;
  /** Whether tooltip should be triggered by click instead of hover */
  clickToShow?: boolean;
  /** Custom CSS classes for the tooltip */
  className?: string;
  /** Children elements that trigger the tooltip */
  children: React.ReactNode;
  /** Callback when tooltip visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * A flexible tooltip component with child-friendly explanations
 * Supports both hover and click interactions with customizable positioning
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = "auto",
  show: controlledShow,
  showDelay = 300,
  hideDelay = 100,
  clickToShow = false,
  className = "",
  children,
  onVisibilityChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState<TooltipPosition>("top");
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Use controlled visibility if provided, otherwise use internal state
  const visible = controlledShow !== undefined ? controlledShow : isVisible;

  /**
   * Calculate the best position for the tooltip based on viewport constraints
   */
  const calculatePosition = (): TooltipPosition => {
    if (position !== "auto") return position;

    if (!triggerRef.current || !tooltipRef.current) return "top";

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Check space availability in each direction
    const spaceTop = triggerRect.top;
    const spaceBottom = viewport.height - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewport.width - triggerRect.right;

    // Prefer top/bottom over left/right for better readability
    if (spaceTop >= tooltipRect.height + 10) return "top";
    if (spaceBottom >= tooltipRect.height + 10) return "bottom";
    if (spaceRight >= tooltipRect.width + 10) return "right";
    if (spaceLeft >= tooltipRect.width + 10) return "left";

    // Default to top if no space is ideal
    return "top";
  };

  /**
   * Show the tooltip with optional delay
   */
  const showTooltip = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }

    if (showDelay > 0 && !clickToShow) {
      const timeout = setTimeout(() => {
        setIsVisible(true);
        onVisibilityChange?.(true);
      }, showDelay);
      setShowTimeout(timeout);
    } else {
      setIsVisible(true);
      onVisibilityChange?.(true);
    }
  };

  /**
   * Hide the tooltip with optional delay
   */
  const hideTooltip = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }

    if (hideDelay > 0 && !clickToShow) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
        onVisibilityChange?.(false);
      }, hideDelay);
      setHideTimeout(timeout);
    } else {
      setIsVisible(false);
      onVisibilityChange?.(false);
    }
  };

  /**
   * Toggle tooltip visibility for click interactions
   */
  const toggleTooltip = () => {
    if (visible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (visible && tooltipRef.current) {
      setActualPosition(calculatePosition());
    }
  }, [visible, position]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [showTimeout, hideTimeout]);

  // Handle click outside to close tooltip when using click interaction
  useEffect(() => {
    if (!clickToShow || !visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        tooltipRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clickToShow, visible]);

  /**
   * Get positioning styles based on calculated position
   */
  const getPositionStyles = () => {
    const baseStyles = {
      position: "absolute" as const,
      zIndex: 1000,
      pointerEvents: "none" as const,
    };

    switch (actualPosition) {
      case "top":
        return {
          ...baseStyles,
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "8px",
        };
      case "bottom":
        return {
          ...baseStyles,
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: "8px",
        };
      case "left":
        return {
          ...baseStyles,
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          marginRight: "8px",
        };
      case "right":
        return {
          ...baseStyles,
          left: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          marginLeft: "8px",
        };
      default:
        return baseStyles;
    }
  };

  /**
   * Get arrow styles for the tooltip pointer
   */
  const getArrowStyles = () => {
    const arrowSize = 6;
    const arrowColor = "#1f2937"; // gray-800

    switch (actualPosition) {
      case "top":
        return {
          position: "absolute" as const,
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid ${arrowColor}`,
        };
      case "bottom":
        return {
          position: "absolute" as const,
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid ${arrowColor}`,
        };
      case "left":
        return {
          position: "absolute" as const,
          left: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid ${arrowColor}`,
        };
      case "right":
        return {
          position: "absolute" as const,
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid ${arrowColor}`,
        };
      default:
        return {};
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={!clickToShow ? showTooltip : undefined}
      onMouseLeave={!clickToShow ? hideTooltip : undefined}
      onClick={clickToShow ? toggleTooltip : undefined}
    >
      {children}

      {visible && content && (
        <div
          ref={tooltipRef}
          style={getPositionStyles()}
          className={`
            px-3 py-2 
            bg-gray-800 text-white text-sm 
            rounded-lg shadow-lg
            max-w-xs
            transition-opacity duration-200
            ${visible ? "opacity-100" : "opacity-0"}
            ${className}
          `}
          role="tooltip"
          aria-hidden={!visible}
        >
          {content}
          <div style={getArrowStyles()} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
