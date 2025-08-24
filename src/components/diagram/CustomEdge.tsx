import React from "react";
import {
  type EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";
import type { VisualEdge } from "../../types/visualization";
import { Tooltip } from "../ui/Tooltip";
import { ExplanationService } from "../../services/ExplanationService";

/**
 * Data passed to the custom edge component
 */
export interface CustomEdgeData {
  visualEdge: VisualEdge;
  onClick: (edgeData: VisualEdge) => void;
}

/**
 * Custom edge component for displaying visual edges with labels and interactions
 */
export const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id: _id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}) => {
  const { visualEdge, onClick } = data || {};

  if (!visualEdge) {
    return null;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleClick = () => {
    if (onClick && visualEdge) {
      onClick(visualEdge);
    }
  };

  // Enhanced styling based on edge type and selection state
  const baseStrokeWidth =
    typeof style.strokeWidth === "number" ? style.strokeWidth : 2;
  const edgeStyle = {
    ...style,
    stroke: visualEdge.color,
    strokeWidth: selected ? baseStrokeWidth + 1 : baseStrokeWidth,
    strokeDasharray: visualEdge.style?.strokeDasharray,
  };

  // Label styling based on edge type
  const getLabelStyle = () => {
    const baseStyle = {
      backgroundColor: "white",
      border: `2px solid ${visualEdge.color}`,
      borderRadius: "12px",
      padding: "2px 8px",
      fontSize: "11px",
      fontWeight: "500",
      color: visualEdge.color,
      cursor: "pointer",
      transition: "all 0.2s ease",
    };

    if (selected) {
      return {
        ...baseStyle,
        backgroundColor: visualEdge.color,
        color: "white",
        transform: "scale(1.1)",
      };
    }

    return baseStyle;
  };

  // Get child-friendly explanation
  const edgeExplanation = ExplanationService.getEdgeExplanation(visualEdge);
  const tooltipText = ExplanationService.getTooltipText(edgeExplanation);

  return (
    <>
      <BaseEdge path={edgePath} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <Tooltip
            content={tooltipText}
            position="auto"
            showDelay={200}
            hideDelay={100}
          >
            <button
              style={getLabelStyle()}
              onClick={handleClick}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = visualEdge.color;
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.color = visualEdge.color;
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
              aria-label={`${visualEdge.label}: ${edgeExplanation.simple}`}
              aria-describedby={`edge-${visualEdge.id}-description`}
              role="button"
              tabIndex={0}
              data-id={`edge-${visualEdge.id}`}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {visualEdge.label}
              {/* Hidden description for screen readers */}
              <div id={`edge-${visualEdge.id}-description`} className="sr-only">
                {edgeExplanation.detailed || edgeExplanation.simple}
                Connection type: {visualEdge.type.replace("-", " ")}
              </div>
            </button>
          </Tooltip>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
