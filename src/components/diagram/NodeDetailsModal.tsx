import React from "react";
import { X } from "lucide-react";
import type { VisualNode } from "../../types/visualization";
import { ExplanationService } from "../../services/ExplanationService";

/**
 * Props for the NodeDetailsModal component
 */
export interface NodeDetailsModalProps {
  /** The node to display details for */
  node: VisualNode;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Modal component for displaying detailed information about a node
 */
export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { icon: Icon, label, type, metadata } = node;

  // Get child-friendly explanation
  const nodeExplanation = ExplanationService.getNodeExplanation(node);
  const detailedExplanation =
    ExplanationService.getDetailedExplanation(nodeExplanation);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // const getTypeDescription = (_nodeType: string) => {
  //   switch (_nodeType) {
  //     case "button":
  //       return "An interactive element that users can click to trigger actions";
  //     case "counter":
  //       return "A numeric value that keeps track of something, like how many times a button was clicked";
  //     case "api":
  //       return "A connection to the internet that fetches or sends data to other services";
  //     case "database":
  //       return "A storage system where information is saved and retrieved";
  //     case "user":
  //       return "Represents a person using the application";
  //     case "component":
  //       return "A reusable piece of the user interface";
  //     case "error":
  //       return "Something that can go wrong and needs to be handled";
  //     case "function":
  //       return "A set of instructions that performs a specific task";
  //     case "variable":
  //       return "A container that holds information or data";
  //     default:
  //       return "A part of the code that does something specific";
  //   }
  // };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: node.style?.backgroundColor || "#f3f4f6",
                color: node.style?.textColor || "#374151",
              }}
            >
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
              <p className="text-sm text-gray-500 capitalize">
                {type.replace("-", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Simple Explanation */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              What does this do?
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {detailedExplanation}
            </p>
          </div>

          {/* Fun Fact */}
          {nodeExplanation.analogy && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                🎯 Think of it like this:
              </h4>
              <p className="text-sm text-yellow-800">
                {nodeExplanation.analogy}
              </p>
            </div>
          )}

          {/* Pattern Information */}
          {metadata.patternType && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Pattern Type
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {metadata.patternType.replace("-", " ")}
              </span>
            </div>
          )}

          {/* Code Location */}
          {metadata.codeLocation && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Code Location
              </h3>
              <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                Characters {metadata.codeLocation.start} -{" "}
                {metadata.codeLocation.end}
              </p>
            </div>
          )}

          {/* Additional Context */}
          {metadata.context && Object.keys(metadata.context).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Additional Details
              </h3>
              <div className="space-y-2">
                {Object.entries(metadata.context).map(([key, value]) => {
                  if (
                    key === "patternConfidence" &&
                    typeof value === "number"
                  ) {
                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center"
                      >
                        <span className="text-xs text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${value * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round(value * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (typeof value === "string" || typeof value === "number") {
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-xs text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                        </span>
                        <span className="text-xs text-gray-900">
                          {String(value)}
                        </span>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsModal;
