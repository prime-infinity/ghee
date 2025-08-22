import React from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { VisualNode } from "../../types/visualization";

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
  const { icon: Icon, label, explanation, style } = visualNode;

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

  return (
    <button
      className="relative cursor-pointer transition-all duration-200 hover:shadow-md group border-0 p-0 bg-transparent"
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
      title={explanation}
      aria-label={`${label}: ${explanation}`}
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

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {explanation}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </button>
  );
};

export default CustomNode;
