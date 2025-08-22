import React from "react";
import { MousePointer, User, Database, Globe } from "lucide-react";
import { Tooltip } from "./ui/Tooltip";
import { ExplanationService } from "../services/ExplanationService";
import type { VisualNode, VisualEdge } from "../types/visualization";

/**
 * Demo component to showcase the tooltip system with child-friendly explanations
 */
export const TooltipDemo: React.FC = () => {
  // Sample nodes for demonstration
  const sampleNodes: VisualNode[] = [
    {
      id: "button-demo",
      type: "button",
      position: { x: 0, y: 0 },
      icon: MousePointer,
      label: "Click Me",
      explanation: "A button that can be clicked",
      metadata: {
        patternNodeId: "demo-1",
        patternType: "counter",
      },
    },
    {
      id: "counter-demo",
      type: "counter",
      position: { x: 0, y: 0 },
      icon: User,
      label: "Score",
      explanation: "Shows the current score",
      metadata: {
        patternNodeId: "demo-2",
        patternType: "counter",
      },
    },
    {
      id: "api-demo",
      type: "api",
      position: { x: 0, y: 0 },
      icon: Globe,
      label: "Get Data",
      explanation: "Fetches data from server",
      metadata: {
        patternNodeId: "demo-3",
        patternType: "api-call",
      },
    },
    {
      id: "db-demo",
      type: "database",
      position: { x: 0, y: 0 },
      icon: Database,
      label: "User Info",
      explanation: "Stores user information",
      metadata: {
        patternNodeId: "demo-4",
        patternType: "database",
      },
    },
  ];

  // Sample edges for demonstration
  const sampleEdges: VisualEdge[] = [
    {
      id: "edge-1",
      source: "button-demo",
      target: "counter-demo",
      label: "increment",
      type: "action",
      color: "#3b82f6",
    },
    {
      id: "edge-2",
      source: "api-demo",
      target: "db-demo",
      label: "save data",
      type: "success",
      color: "#10b981",
    },
    {
      id: "edge-3",
      source: "api-demo",
      target: "counter-demo",
      label: "error",
      type: "error",
      color: "#ef4444",
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Tooltip System Demo
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Node Tooltips with Child-Friendly Explanations
          </h2>
          <p className="text-gray-600 mb-6">
            Hover over each node to see child-friendly explanations with helpful
            analogies:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sampleNodes.map((node) => {
              const explanation = ExplanationService.getNodeExplanation(node);
              const tooltipText =
                ExplanationService.getTooltipText(explanation);
              const Icon = node.icon;

              return (
                <div key={node.id} className="text-center">
                  <Tooltip
                    content={tooltipText}
                    position="top"
                    showDelay={200}
                    hideDelay={100}
                  >
                    <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 hover:bg-blue-200 transition-colors cursor-pointer">
                      <Icon size={32} className="mx-auto mb-2 text-blue-600" />
                      <div className="text-sm font-medium text-blue-800">
                        {node.label}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {node.type}
                      </div>
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Edge Tooltips with Simple Explanations
          </h2>
          <p className="text-gray-600 mb-6">
            Hover over each connection to understand what it does:
          </p>

          <div className="flex flex-wrap gap-4">
            {sampleEdges.map((edge) => {
              const explanation = ExplanationService.getEdgeExplanation(edge);
              const tooltipText =
                ExplanationService.getTooltipText(explanation);

              return (
                <div key={edge.id}>
                  <Tooltip
                    content={tooltipText}
                    position="top"
                    showDelay={200}
                    hideDelay={100}
                  >
                    <div
                      className="px-4 py-2 rounded-full text-white text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: edge.color }}
                    >
                      {edge.label}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Features Implemented
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">
                ✅ Tooltip Component
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hover and click interactions</li>
                <li>• Customizable positioning</li>
                <li>• Configurable delays</li>
                <li>• Accessibility support</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">
                ✅ Child-Friendly Explanations
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Simple, non-technical language</li>
                <li>• Helpful analogies</li>
                <li>• Focus on "what" not "how"</li>
                <li>• Positive, encouraging tone</li>
                <li>• Age-appropriate content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TooltipDemo;
