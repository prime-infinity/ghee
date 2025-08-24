import React, { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";
import type { DiagramData, UserFriendlyError } from "../types";

/**
 * Application state interface
 */
export interface AppState {
  /** Current code being processed */
  code: string;
  /** Whether code is currently being processed */
  isProcessing: boolean;
  /** Generated diagram data */
  diagramData: DiagramData | null;
  /** Current validation errors */
  validationErrors: UserFriendlyError[];
  /** Whether the current code is valid */
  isValid: boolean;
  /** Processing stage for user feedback */
  processingStage:
    | "parsing"
    | "pattern-recognition"
    | "visualization"
    | "optimization"
    | null;
  /** General application errors */
  applicationError: UserFriendlyError | null;
}

/**
 * Application actions
 */
export type AppAction =
  | { type: "SET_CODE"; payload: string }
  | { type: "START_PROCESSING"; payload: string }
  | { type: "SET_PROCESSING_STAGE"; payload: AppState["processingStage"] }
  | { type: "SET_VALIDATION_ERRORS"; payload: UserFriendlyError[] }
  | { type: "SET_DIAGRAM_DATA"; payload: DiagramData }
  | { type: "SET_APPLICATION_ERROR"; payload: UserFriendlyError }
  | { type: "PROCESSING_COMPLETE" }
  | { type: "CANCEL_PROCESSING" }
  | { type: "CLEAR_ERRORS" }
  | { type: "RESET_STATE" };

/**
 * Context interface
 */
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * Initial application state
 */
const initialState: AppState = {
  code: "",
  isProcessing: false,
  diagramData: null,
  validationErrors: [],
  isValid: true,
  processingStage: null,
  applicationError: null,
};

/**
 * Application state reducer
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CODE":
      return {
        ...state,
        code: action.payload,
        // Clear previous results when code changes
        diagramData: null,
        validationErrors: [],
        applicationError: null,
      };

    case "START_PROCESSING":
      return {
        ...state,
        code: action.payload,
        isProcessing: true,
        processingStage: "parsing",
        diagramData: null,
        validationErrors: [],
        applicationError: null,
        isValid: true,
      };

    case "SET_PROCESSING_STAGE":
      return {
        ...state,
        processingStage: action.payload,
      };

    case "SET_VALIDATION_ERRORS":
      return {
        ...state,
        validationErrors: action.payload,
        isValid: action.payload.length === 0,
      };

    case "SET_DIAGRAM_DATA":
      return {
        ...state,
        diagramData: action.payload,
      };

    case "SET_APPLICATION_ERROR":
      return {
        ...state,
        applicationError: action.payload,
        isProcessing: false,
        processingStage: null,
      };

    case "PROCESSING_COMPLETE":
      return {
        ...state,
        isProcessing: false,
        processingStage: null,
      };

    case "CANCEL_PROCESSING":
      return {
        ...state,
        isProcessing: false,
        processingStage: null,
      };

    case "CLEAR_ERRORS":
      return {
        ...state,
        validationErrors: [],
        applicationError: null,
      };

    case "RESET_STATE":
      return initialState;

    default:
      return state;
  }
}

/**
 * Create the context
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Context provider component
 */
export interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to use the app context
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
