import React, { useState, useCallback, useRef } from "react";
import { Play, Square, AlertCircle, CheckCircle } from "lucide-react";
import type { UserFriendlyError } from "../types";

export interface CodeInputProps {
  /** Callback when user submits code for visualization */
  onCodeSubmit: (code: string) => void;
  /** Whether code is currently being processed */
  isProcessing: boolean;
  /** Callback to cancel processing */
  onCancel?: () => void;
  /** Current validation errors */
  validationErrors?: UserFriendlyError[];
  /** Whether the code is valid */
  isValid?: boolean;
  /** Initial code value */
  initialCode?: string;
}

/**
 * Code Input Component with syntax highlighting and validation
 * Handles user code input with real-time validation and processing states
 */
export const CodeInputComponent: React.FC<CodeInputProps> = ({
  onCodeSubmit,
  isProcessing,
  onCancel,
  validationErrors = [],
  isValid = true,
  initialCode = "",
}) => {
  const [code, setCode] = useState(initialCode);
  const [hasUserInput, setHasUserInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = event.target.value;
      setCode(newCode);
      setHasUserInput(true);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (code.trim() && !isProcessing) {
      onCodeSubmit(code);
    }
  }, [code, isProcessing, onCodeSubmit]);

  const handleCancel = useCallback(() => {
    if (onCancel && isProcessing) {
      onCancel();
    }
  }, [onCancel, isProcessing]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Allow Ctrl+Enter to submit
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const canSubmit = code.trim().length > 0 && !isProcessing;
  const showValidation = hasUserInput && code.trim().length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Code Visualizer
        </h2>
        <p className="text-gray-600">
          Paste your JavaScript or TypeScript code below to see it visualized as
          an interactive diagram.
        </p>
      </div>

      <div className="space-y-4">
        {/* Code Input Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            placeholder="Paste your code here...

Example:
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}"
            className={`
              w-full h-64 p-4 border-2 rounded-lg font-mono text-sm
              resize-y min-h-32 max-h-96
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${
                showValidation && !isValid
                  ? "border-red-300 bg-red-50"
                  : showValidation && isValid
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              }
              ${isProcessing ? "opacity-75 cursor-not-allowed" : ""}
            `}
            disabled={isProcessing}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />

          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {code.length} characters
          </div>
        </div>

        {/* Validation Messages */}
        {showValidation && (
          <div className="space-y-2">
            {isValid && validationErrors.length === 0 && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle size={16} />
                <span>Code looks good!</span>
              </div>
            )}

            {validationErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-red-600 text-sm"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{error.message}</div>
                  {error.description && (
                    <div className="text-red-500 mt-1">{error.description}</div>
                  )}
                  {error.suggestions.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {error.suggestions.map((suggestion, suggestionIndex) => (
                        <li key={suggestionIndex} className="text-red-500">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium
              transition-all duration-200
              ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            <Play size={18} />
            {isProcessing ? "Processing..." : "Visualize Code"}
          </button>

          {isProcessing && onCancel && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium
                       bg-red-600 hover:bg-red-700 text-white
                       transition-all duration-200"
            >
              <Square size={16} />
              Cancel
            </button>
          )}

          {/* Keyboard shortcut hint */}
          <div className="text-sm text-gray-500 ml-auto">
            Press{" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
              Ctrl+Enter
            </kbd>{" "}
            to visualize
          </div>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <div className="font-medium text-blue-800">
                Analyzing your code...
              </div>
              <div className="text-sm text-blue-600">
                This may take a few moments for complex code
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeInputComponent;
