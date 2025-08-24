import React from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { VisualNode } from "../../types/visualization";
import { Tooltip } from "../ui/Tooltip";
import { ExplanationService } from "../../services/ExplanationService";

/**
 * Data passed to the custom node component
 */
export interface CustomNodeData {
  visualNode: VisualNode;
  onClick: (nodeData: VisualNode) => void;
}

/**
 * Custom node component for displaying visual nodes with Lucide React icons
 */
export const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({
  data,
  selected,
}) => {
  const { visualNode, onClick } = data;
  const { icon: Icon, label, explanation: _explanation, style } = visualNode;

  const handleClick = () => {
    onClick(visualNode);
  };

  const nodeStyle = {
    backgroundColor: style?.backgroundColor || "#f3f4f6",
    borderColor: style?.borderColor || "#6b7280",
    color: style?.textColor || "#374151",
    borderWidth: style?.borderWidth || 2,
    borderRadius: style?.borderRadius || 8,
    width: style?.width || 120,
    height: style?.height || 80,
  };

  const selectedStyle = selected
    ? {
        borderColor: "#3b82f6",
        borderWidth: 3,
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
      }
    : {};

  // Get child-friendly explanation
  const nodeExplanation = ExplanationService.getNodeExplanation(visualNode);
  const tooltipText = ExplanationService.getTooltipText(nodeExplanation);

  return (
    <Tooltip
      content={tooltipText}
      position="auto"
      showDelay={200}
      hideDelay={100}
    >
      <button
        className="relative cursor-pointer transition-all duration-200 hover:shadow-md group border-0 p-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{
          ...nodeStyle,
          ...selectedStyle,
          border: `${
            selectedStyle.borderWidth || nodeStyle.borderWidth
          }px solid ${selectedStyle.borderColor || nodeStyle.borderColor}`,
          borderRadius: `${nodeStyle.borderRadius}px`,
          width: `${nodeStyle.width}px`,
          height: `${nodeStyle.height}px`,
          boxShadow: selectedStyle.boxShadow || "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
        onClick={handleClick}
        aria-label={`${label}: ${nodeExplanation.simple}`}
        aria-describedby={`node-${visualNode.id}-description`}
        aria-pressed={selected}
        role="button"
        tabIndex={0}
        data-id={`node-${visualNode.id}`}
      >
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 border-2 border-gray-400 bg-white"
          style={{ top: -6 }}
        />

        {/* Node Content */}
        <div className="flex flex-col items-center justify-center h-full p-2">
          {/* Icon */}
          <div className="mb-1">
            <Icon
              size={24}
              className="transition-transform duration-200 group-hover:scale-110"
              style={{ color: nodeStyle.color }}
            />
          </div>

          {/* Label */}
          <div
            className="text-xs font-medium text-center leading-tight truncate w-full"
            style={{ color: nodeStyle.color }}
            title={label}
          >
            {label}
          </div>
        </div>

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 border-2 border-gray-400 bg-white"
          style={{ bottom: -6 }}
        />

        {/* Hidden description for screen readers */}
        <div id={`node-${visualNode.id}-description`} className="sr-only">
          {nodeExplanation.whatItDoes || nodeExplanation.simple}
          {visualNode.metadata.patternType &&
            ` This is part of a ${visualNode.metadata.patternType.replace(
              "-",
              " "
            )} pattern.`}
        </div>
      </button>
    </Tooltip>
  );
};

export default CustomNode;
