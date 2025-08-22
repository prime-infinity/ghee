import React, { useState, useCallback } from "react";
import { CodeInputComponent } from "./CodeInputComponent";
import { ASTParserService } from "../services/ASTParserService";
import { PatternRecognitionEngine } from "../services/PatternRecognitionEngine";
import { VisualizationGenerator } from "../services/VisualizationGenerator";
import type { UserFriendlyError, DiagramData } from "../types";

/**
 * Demo component showing CodeInputComponent integration with existing services
 * This demonstrates the complete workflow from code input to visualization
 */
export const CodeInputDemo: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<UserFriendlyError[]>(
    []
  );
  const [isValid, setIsValid] = useState(true);
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [processingStage, setProcessingStage] = useState<string>("");

  // Initialize services
  const astParser = new ASTParserService();
  const patternEngine = new PatternRecognitionEngine();
  const visualizationGenerator = new VisualizationGenerator();

  const handleCodeSubmit = useCallback(
    async (code: string) => {
      setIsProcessing(true);
      setValidationErrors([]);
      setIsValid(true);
      setDiagramData(null);

      try {
        // Stage 1: Parse code
        setProcessingStage("Parsing code...");
        const parseResult = await astParser.parseCode(code);

        if (parseResult.errors.length > 0) {
          // Convert parse errors to user-friendly errors
          const userErrors: UserFriendlyError[] = parseResult.errors.map(
            (error) => ({
              code: "PARSE_ERROR",
              message: "Syntax Error",
              description: error.message,
              suggestions: error.suggestion
                ? [error.suggestion]
                : [
                    "Check for missing semicolons, brackets, or parentheses",
                    "Ensure all strings are properly quoted",
                    "Verify function and variable declarations are correct",
                  ],
              severity: error.type === "syntax" ? "high" : ("medium" as const),
            })
          );

          setValidationErrors(userErrors);
          setIsValid(false);
          setIsProcessing(false);
          return;
        }

        // Stage 2: Recognize patterns
        setProcessingStage("Analyzing code patterns...");
        const patterns = patternEngine.recognizePatterns(parseResult.ast);

        if (patterns.length === 0) {
          const noPatternError: UserFriendlyError = {
            code: "NO_PATTERNS",
            message: "No Recognizable Patterns",
            description:
              "We couldn't find any common patterns in your code to visualize.",
            suggestions: [
              "Try adding some React components with useState hooks",
              "Include API calls using fetch() or axios",
              "Add database operations or conditional logic",
            ],
            severity: "low",
          };

          setValidationErrors([noPatternError]);
          setIsValid(false);
          setIsProcessing(false);
          return;
        }

        // Stage 3: Generate visualization
        setProcessingStage("Creating visualization...");
        const diagram = visualizationGenerator.generateDiagram(patterns);

        setDiagramData(diagram);
        setIsValid(true);
      } catch (error) {
        console.error("Error processing code:", error);

        const processingError: UserFriendlyError = {
          code: "PROCESSING_ERROR",
          message: "Processing Error",
          description:
            "An unexpected error occurred while processing your code.",
          suggestions: [
            "Try simplifying your code",
            "Check for unsupported language features",
            "Ensure your code is valid JavaScript or TypeScript",
          ],
          severity: "high",
        };

        setValidationErrors([processingError]);
        setIsValid(false);
      } finally {
        setIsProcessing(false);
        setProcessingStage("");
      }
    },
    [astParser, patternEngine, visualizationGenerator]
  );

  const handleCancel = useCallback(() => {
    setIsProcessing(false);
    setProcessingStage("");
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ghee - Code Visualizer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your JavaScript and TypeScript code into intuitive visual
            diagrams. Paste your code below to see how it works!
          </p>
        </div>

        <CodeInputComponent
          onCodeSubmit={handleCodeSubmit}
          isProcessing={isProcessing}
          onCancel={handleCancel}
          validationErrors={validationErrors}
          isValid={isValid}
          initialCode={`// Try this example code:
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
  };
  
  return (
    <button onClick={handleClick}>
      Count: {count}
    </button>
  );
}`}
        />

        {/* Processing Stage Indicator */}
        {isProcessing && processingStage && (
          <div className="mt-6 max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">
                  {processingStage}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {diagramData && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Visualization Results
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 mb-2">
                  Found <strong>{diagramData.nodes.length}</strong> visual
                  elements and <strong>{diagramData.edges.length}</strong>{" "}
                  connections
                </p>
                <div className="text-sm text-gray-500">
                  <p>
                    Nodes: {diagramData.nodes.map((n) => n.type).join(", ")}
                  </p>
                  <p>
                    Edges: {diagramData.edges.map((e) => e.type).join(", ")}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>
                  <strong>Next:</strong> This data would be passed to the
                  InteractiveDiagramComponent to render the actual visual
                  diagram (Task 10).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Example Code Suggestions */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Try These Examples
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  React Counter
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  A simple React component with state management
                </p>
                <code className="text-xs text-gray-500">
                  useState + onClick pattern
                </code>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">API Call</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Fetch data from an API with error handling
                </p>
                <code className="text-xs text-gray-500">
                  fetch() + try/catch pattern
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeInputDemo;
