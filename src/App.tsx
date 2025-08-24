import React, { useCallback } from "react";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { CodeInputComponent } from "./components/CodeInputComponent";
import { InteractiveDiagramComponent } from "./components/InteractiveDiagramComponent";
import { ErrorList, WarningDisplay } from "./components/ErrorDisplay";
import {
  CodeVisualizationService,
  type ProcessingStage,
} from "./services/CodeVisualizationService";
import type { VisualNode, VisualEdge } from "./types";

/**
 * Main application content component
 */
const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const visualizationService = React.useMemo(
    () => new CodeVisualizationService(),
    []
  );

  /**
   * Handle code submission for visualization
   */
  const handleCodeSubmit = useCallback(
    async (code: string) => {
      dispatch({ type: "START_PROCESSING", payload: code });

      try {
        const result = await visualizationService.visualizeCode(
          code,
          (stage: ProcessingStage, _progress: number) => {
            dispatch({ type: "SET_PROCESSING_STAGE", payload: stage });
          }
        );

        if (result.success && result.diagramData) {
          dispatch({ type: "SET_DIAGRAM_DATA", payload: result.diagramData });
          dispatch({ type: "PROCESSING_COMPLETE" });

          // Show warnings if fallback was used
          if (result.fallbackUsed && result.warnings) {
            // Store warnings in state for display
            console.warn("Fallback visualization used:", result.warnings);
          }
        } else {
          dispatch({ type: "SET_VALIDATION_ERRORS", payload: result.errors });
          dispatch({ type: "PROCESSING_COMPLETE" });
        }
      } catch (error) {
        const userError = {
          code: "PROCESSING_ERROR",
          message: "Failed to process code",
          description: "An error occurred while analyzing your code",
          suggestions: [
            "Check your code syntax",
            "Try with a simpler example",
            "Refresh the page and try again",
          ],
          severity: "high" as const,
          originalError: error as Error,
          context: {
            component: "App",
            operation: "handleCodeSubmit",
          },
        };
        dispatch({ type: "SET_APPLICATION_ERROR", payload: userError });
      }
    },
    [visualizationService, dispatch]
  );

  /**
   * Handle processing cancellation
   */
  const handleCancel = useCallback(() => {
    visualizationService.cancelProcessing();
    dispatch({ type: "CANCEL_PROCESSING" });
  }, [visualizationService, dispatch]);

  /**
   * Handle error retry
   */
  const handleErrorRetry = useCallback(() => {
    if (state.code) {
      handleCodeSubmit(state.code);
    }
  }, [state.code, handleCodeSubmit]);

  /**
   * Handle error dismissal
   */
  const handleErrorDismiss = useCallback(() => {
    dispatch({ type: "CLEAR_ERRORS" });
  }, [dispatch]);

  /**
   * Handle node clicks in the diagram
   */
  const handleNodeClick = useCallback(
    (nodeId: string, nodeData: VisualNode) => {
      console.log("Node clicked:", nodeId, nodeData);
      // Could implement node details modal or code highlighting here
    },
    []
  );

  /**
   * Handle edge clicks in the diagram
   */
  const handleEdgeClick = useCallback(
    (edgeId: string, edgeData: VisualEdge) => {
      console.log("Edge clicked:", edgeId, edgeData);
      // Could implement edge details modal here
    },
    []
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ghee Code Visualizer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your JavaScript and TypeScript code into interactive
            visual diagrams. Understand patterns, flows, and relationships in
            your code at a glance.
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Code Input Section */}
          <section>
            <CodeInputComponent
              onCodeSubmit={handleCodeSubmit}
              isProcessing={state.isProcessing}
              onCancel={state.isProcessing ? handleCancel : undefined}
              validationErrors={state.validationErrors}
              isValid={state.isValid}
              initialCode={state.code}
            />
          </section>

          {/* Processing Status */}
          {state.isProcessing && state.processingStage && (
            <section className="max-w-4xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <div className="font-medium text-blue-800">
                      {state.processingStage === "parsing" &&
                        "Parsing your code..."}
                      {state.processingStage === "pattern-recognition" &&
                        "Recognizing patterns..."}
                      {state.processingStage === "visualization" &&
                        "Generating visualization..."}
                    </div>
                    <div className="text-sm text-blue-600">
                      {state.processingStage === "parsing" &&
                        "Converting code into an abstract syntax tree"}
                      {state.processingStage === "pattern-recognition" &&
                        "Identifying code patterns and relationships"}
                      {state.processingStage === "visualization" &&
                        "Creating interactive diagram"}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Error Display */}
          {(state.applicationError || state.validationErrors.length > 0) && (
            <section className="max-w-4xl mx-auto">
              {state.applicationError && (
                <ErrorList
                  errors={[state.applicationError]}
                  showDetails={process.env.NODE_ENV === "development"}
                  onRetry={handleErrorRetry}
                  onDismiss={handleErrorDismiss}
                  showRetry={true}
                  showDismiss={true}
                  className="mb-4"
                />
              )}

              {state.validationErrors.length > 0 && (
                <ErrorList
                  errors={state.validationErrors}
                  showDetails={process.env.NODE_ENV === "development"}
                  onRetry={handleErrorRetry}
                  onDismiss={handleErrorDismiss}
                  showRetry={true}
                  showDismiss={true}
                />
              )}
            </section>
          )}

          {/* Visualization Section */}
          {state.diagramData && (
            <section className="max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Code Visualization
                </h2>
                <InteractiveDiagramComponent
                  diagramData={state.diagramData}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  isLoading={state.isProcessing}
                  className="h-96"
                />
              </div>
            </section>
          )}

          {/* Empty State */}
          {!state.diagramData &&
            !state.isProcessing &&
            !state.applicationError && (
              <section className="max-w-4xl mx-auto text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Ready to visualize your code
                </h3>
                <p className="text-gray-600">
                  Paste your JavaScript or TypeScript code above to see it
                  transformed into an interactive diagram.
                </p>
              </section>
            )}
        </div>
      </div>
    </Layout>
  );
};

/**
 * Main App component with providers and error boundary
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
