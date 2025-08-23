import React from "react";
import {
  X,
  ArrowRight,
  CheckCircle,
  XCircle,
  Zap,
  Database,
} from "lucide-react";
import type { VisualEdge } from "../../types/visualization";
import { ExplanationService } from "../../services/ExplanationService";

/**
 * Props for the EdgeDetailsModal component
 */
export interface EdgeDetailsModalProps {
  /** The edge to display details for */
  edge: VisualEdge;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Modal component for displaying detailed information about an edge
 */
export const EdgeDetailsModal: React.FC<EdgeDetailsModalProps> = ({
  edge,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { label, type, color } = edge;

  // Get child-friendly explanation
  const edgeExplanation = ExplanationService.getEdgeExplanation(edge);
  const detailedExplanation =
    ExplanationService.getDetailedExplanation(edgeExplanation);

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

  const getTypeIcon = (edgeType: string) => {
    switch (edgeType) {
      case "success":
        return CheckCircle;
      case "error":
        return XCircle;
      case "action":
        return Zap;
      case "data-flow":
        return Database;
      default:
        return ArrowRight;
    }
  };

  // const getTypeDescription = (_edgeType: string) => {
  //   switch (_edgeType) {
  //     case "success":
  //       return "This shows what happens when everything goes right. The green color means success!";
  //     case "error":
  //       return "This shows what happens when something goes wrong. The red color means there's an error to handle.";
  //     case "action":
  //       return "This represents an action or event, like clicking a button or triggering something.";
  //     case "data-flow":
  //       return "This shows how information moves from one part of the code to another.";
  //     default:
  //       return "This connection shows how different parts of the code work together.";
  //   }
  // };

  const getTypeColor = (edgeType: string) => {
    switch (edgeType) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "action":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "data-flow":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const TypeIcon = getTypeIcon(type);

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
              style={{ backgroundColor: color + "20", color }}
            >
              <TypeIcon size={24} />
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
          {/* Connection Type Badge */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Connection Type
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(
                type
              )}`}
            >
              <TypeIcon size={16} className="mr-2" />
              {type.replace("-", " ").toUpperCase()}
            </span>
          </div>

          {/* Simple Explanation */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              What does this connection do?
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {detailedExplanation}
            </p>
          </div>

          {/* Fun Fact */}
          {edgeExplanation.analogy && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                🎯 Think of it like this:
              </h4>
              <p className="text-sm text-yellow-800">
                {edgeExplanation.analogy}
              </p>
            </div>
          )}

          {/* Connection Label */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Action Description
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              This connection represents: <strong>{label}</strong>
            </p>
          </div>

          {/* Visual Properties */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Visual Properties
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Color:</span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs text-gray-900 font-mono">
                    {color}
                  </span>
                </div>
              </div>

              {edge.animated && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Animation:</span>
                  <span className="text-xs text-gray-900">Animated flow</span>
                </div>
              )}

              {edge.style?.strokeDasharray && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Style:</span>
                  <span className="text-xs text-gray-900">Dashed line</span>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Tip</h4>
            <p className="text-xs text-blue-800">
              {type === "success" &&
                "Green arrows show the happy path - when everything works as expected."}
              {type === "error" &&
                "Red arrows show error paths - it's good to handle these cases!"}
              {type === "action" &&
                "Blue arrows show user actions or events happening in the code."}
              {type === "data-flow" &&
                "Purple arrows show how data moves through your application."}
              {!["success", "error", "action", "data-flow"].includes(type) &&
                "Follow the arrows to understand the flow of your code!"}
            </p>
          </div>
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

export default EdgeDetailsModal;
