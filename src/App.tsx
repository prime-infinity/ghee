import React, { useCallback, useState } from "react";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { CodeInputComponent } from "./components/CodeInputComponent";
import { InteractiveDiagramComponent } from "./components/InteractiveDiagramComponent";
import { ProgressiveLoadingIndicator } from "./components/ProgressiveLoadingIndicator";
import { ErrorList } from "./components/ErrorDisplay";
import { ExamplesAndGuide } from "./components/ExamplesAndGuide";
import { AccessibilityProvider } from "./components/accessibility/AccessibilityProvider";
import {
  CodeVisualizationService,
  type ProcessingStage,
} from "./services/CodeVisualizationService";
import type { VisualNode, VisualEdge } from "./types";
import type {
  CodeComplexityMetrics,
  PerformanceMetrics,
} from "./services/PerformanceService";

/**
 * Main application content component
 */
const AppContent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const visualizationService = React.useMemo(
    () => new CodeVisualizationService(),
    []
  );

  // Additional state for performance monitoring
  const [complexity, setComplexity] = useState<CodeComplexityMetrics | null>(
    null
  );
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingWarnings, setProcessingWarnings] = useState<string[]>([]);

  /**
   * Handle code submission for visualization
   */
  const handleCodeSubmit = useCallback(
    async (code: string) => {
      // Analyze complexity before processing
      const codeComplexity = visualizationService.analyzeCodeComplexity(code);
      setComplexity(codeComplexity);

      // Check if code should be processed
      const complexityCheck = visualizationService
        .getPerformanceService()
        .shouldProcessCode(codeComplexity);
      setProcessingWarnings(complexityCheck.warnings);

      dispatch({ type: "START_PROCESSING", payload: code });
      setProcessingProgress(0);

      try {
        const result = await visualizationService.visualizeCode(
          code,
          (stage: ProcessingStage, progress: number) => {
            dispatch({ type: "SET_PROCESSING_STAGE", payload: stage });
            setProcessingProgress(progress);
          }
        );

        // Store performance metrics
        if (result.performanceMetrics) {
          setPerformanceMetrics(result.performanceMetrics);
        }

        if (result.success && result.diagramData) {
          dispatch({ type: "SET_DIAGRAM_DATA", payload: result.diagramData });
          dispatch({ type: "PROCESSING_COMPLETE" });

          // Show warnings if fallback was used or optimizations were applied
          if (result.fallbackUsed && result.warnings) {
            console.warn("Fallback visualization used:", result.warnings);
          }
          if (result.optimizations && result.optimizations.length > 0) {
            console.info(
              "Diagram optimizations applied:",
              result.optimizations
            );
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
      } finally {
        setProcessingProgress(0);
        setComplexity(null);
        setProcessingWarnings([]);
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
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            Ghee Code Visualizer
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform your JavaScript and TypeScript code into interactive
            visual diagrams. Understand patterns, flows, and relationships in
            your code at a glance.
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-6 md:space-y-8">
          {/* Code Input Section */}
          <section className="animate-slide-in-left">
            <CodeInputComponent
              onCodeSubmit={handleCodeSubmit}
              isProcessing={state.isProcessing}
              onCancel={state.isProcessing ? handleCancel : undefined}
              validationErrors={state.validationErrors}
              isValid={state.isValid}
              initialCode={state.code}
            />
          </section>

          {/* Examples and Guide Section - Show when no diagram is displayed */}
          {!state.diagramData && !state.isProcessing && (
            <section className="animate-slide-in-right">
              <ExamplesAndGuide
                onExampleSelect={handleCodeSubmit}
                className="max-w-4xl mx-auto"
              />
            </section>
          )}

          {/* Progressive Loading Indicator */}
          {state.isProcessing && state.processingStage && (
            <section className="max-w-4xl mx-auto animate-fade-in">
              <ProgressiveLoadingIndicator
                currentStage={state.processingStage}
                progress={processingProgress}
                complexity={complexity || undefined}
                estimatedTimeRemaining={
                  complexity && performanceMetrics
                    ? Math.max(
                        0,
                        complexity.estimatedProcessingTime -
                          (Date.now() - performanceMetrics.startTime)
                      )
                    : complexity?.estimatedProcessingTime
                }
                canCancel={true}
                onCancel={handleCancel}
                warnings={processingWarnings}
              />
            </section>
          )}

          {/* Error Display */}
          {(state.applicationError || state.validationErrors.length > 0) && (
            <section className="max-w-4xl mx-auto animate-fade-in">
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
            <section className="max-w-6xl mx-auto animate-fade-in">
              <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover-lift transition-smooth">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
                    Code Visualization
                  </h2>
                  <div className="text-sm text-gray-500">
                    {state.diagramData.nodes.length} nodes,{" "}
                    {state.diagramData.edges.length} connections
                  </div>
                </div>
                <InteractiveDiagramComponent
                  diagramData={state.diagramData}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  isLoading={state.isProcessing}
                  className="h-80 md:h-96 lg:h-[500px]"
                />
              </div>
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
      <AccessibilityProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
