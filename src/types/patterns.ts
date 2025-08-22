/**
 * A recognized code pattern with its nodes and connections
 */
export interface RecognizedPattern {
  /** Unique identifier for the pattern */
  id: string;
  /** Type of pattern recognized */
  type: 'counter' | 'api-call' | 'database' | 'component-lifecycle' | 'error-handling';
  /** Nodes that make up this pattern */
  nodes: PatternNode[];
  /** Connections between nodes in this pattern */
  connections: PatternConnection[];
  /** Additional metadata about the pattern */
  metadata: PatternMetadata;
}

/**
 * A node within a recognized pattern
 */
export interface PatternNode {
  /** Unique identifier for the node */
  id: string;
  /** Type of node */
  type: 'button' | 'counter' | 'api' | 'database' | 'user' | 'component' | 'error' | 'function' | 'variable';
  /** Display label for the node */
  label: string;
  /** Position in the source code */
  codeLocation: CodeLocation;
  /** Additional properties specific to node type */
  properties: Record<string, any>;
}

/**
 * A connection between two pattern nodes
 */
export interface PatternConnection {
  /** Unique identifier for the connection */
  id: string;
  /** Source node ID */
  sourceId: string;
  /** Target node ID */
  targetId: string;
  /** Type of connection */
  type: 'data-flow' | 'control-flow' | 'event' | 'error-path' | 'success-path';
  /** Label describing the connection */
  label: string;
  /** Additional properties for the connection */
  properties: Record<string, any>;
}

/**
 * Metadata about a recognized pattern
 */
export interface PatternMetadata {
  /** Confidence score (0-1) for pattern recognition */
  confidence: number;
  /** Location of the pattern in source code */
  codeLocation: CodeLocation;
  /** Variables involved in the pattern */
  variables: string[];
  /** Functions involved in the pattern */
  functions: string[];
  /** Complexity level of the pattern */
  complexity: 'simple' | 'medium' | 'complex';
  /** Additional context about the pattern */
  context?: string;
  
  // API Call Pattern specific properties
  /** Type of API call (fetch, axios, etc.) */
  apiType?: string;
  /** API endpoint URL */
  endpoint?: string;
  /** HTTP method (GET, POST, etc.) */
  httpMethod?: string;
  /** Whether the pattern has success handling */
  hasSuccessHandling?: boolean;
  /** Whether the pattern has error handling */
  hasErrorHandling?: boolean;
  
  // Database Pattern specific properties
  /** Whether this pattern has SQL operations */
  hasSqlOperation?: boolean;
  /** Type of database operation (select, insert, update, delete) */
  operationType?: string;
  /** Database tables involved */
  tables?: string[];
  /** Whether this pattern has database connection */
  hasDbConnection?: boolean;
  /** Database library used (mysql, pg, prisma, etc.) */
  dbLibrary?: string;
  /** Method name for ORM operations */
  methodName?: string;
  /** Model name for ORM operations */
  modelName?: string;
}

/**
 * Location information in source code
 */
export interface CodeLocation {
  /** Starting position */
  start: number;
  /** Ending position */
  end: number;
  /** Starting line number */
  startLine: number;
  /** Ending line number */
  endLine: number;
  /** Starting column number */
  startColumn: number;
  /** Ending column number */
  endColumn: number;
}