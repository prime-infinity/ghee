import type { Node } from '@babel/types';
import * as t from '@babel/types';
import type { 
  PatternMatcher, 
  TraversalContext, 
  PatternMatch 
} from '../PatternRecognitionEngine';
import type { RecognizedPattern } from '../../types';

/**
 * Pattern matcher for database operation patterns (SQL operations, database connections)
 */
export class DatabasePatternMatcher implements PatternMatcher {
  readonly patternType: RecognizedPattern['type'] = 'database';

  // Common database operation keywords
  private readonly sqlOperations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
  
  // Common database connection patterns
  private readonly dbConnectionPatterns = [
    'connect', 'connection', 'createConnection', 'getConnection',
    'pool', 'createPool', 'client', 'db', 'database'
  ];

  // Common database libraries and their methods
  private readonly dbLibraries = {
    'mysql': ['createConnection', 'createPool', 'query', 'execute'],
    'mysql2': ['createConnection', 'createPool', 'query', 'execute'],
    'pg': ['Client', 'Pool', 'connect', 'query'],
    'sqlite3': ['Database', 'run', 'get', 'all'],
    'mongodb': ['MongoClient', 'connect', 'collection', 'find', 'insertOne', 'updateOne', 'deleteOne', 'deleteMany'],
    'mongoose': ['connect', 'model', 'find', 'save', 'remove', 'update'],
    'sequelize': ['Sequelize', 'define', 'findAll', 'create', 'update', 'destroy'],
    'typeorm': ['createConnection', 'getRepository', 'find', 'save', 'remove'],
    'prisma': ['PrismaClient', 'findMany', 'findUnique', 'create', 'update', 'delete']
  };

  /**
   * Match database patterns in the given AST node
   * @param node - Current AST node
   * @param context - Traversal context
   * @returns Array of pattern matches
   */
  match(node: Node, context: TraversalContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    // Look for SQL query patterns (only in string/template literals)
    if (t.isStringLiteral(node) || t.isTemplateLiteral(node)) {
      const sqlMatch = this.findSqlQueryPattern(node, context);
      if (sqlMatch) {
        matches.push(sqlMatch);
      }
    }

    // Look for database connection and ORM patterns (only in call expressions)
    if (t.isCallExpression(node)) {
      const connectionMatch = this.findDatabaseConnectionPattern(node, context);
      if (connectionMatch) {
        matches.push(connectionMatch);
        return matches; // Don't check for ORM if we found a connection
      }

      const ormMatch = this.findOrmPattern(node, context);
      if (ormMatch) {
        matches.push(ormMatch);
        return matches; // Don't check for generic query if we found ORM
      }

      // Check for generic query execution patterns
      const queryMatch = this.findGenericQueryPattern(node, context);
      if (queryMatch) {
        matches.push(queryMatch);
      }
    }

    // Handle NewExpression for database clients
    if (t.isNewExpression(node)) {
      const newMatch = this.findNewExpressionPattern(node, context);
      if (newMatch) {
        matches.push(newMatch);
      }
    }

    return matches;
  }

  /**
   * Get confidence score for a database pattern match
   * @param match - Pattern match to evaluate
   * @returns Confidence score (0-1)
   */
  getConfidence(match: PatternMatch): number {
    let confidence = 0.3; // Base confidence

    // Higher confidence if we found SQL operations
    if (match.metadata.hasSqlOperation) {
      confidence += 0.35;
      
      // Extra confidence for well-formed SQL with table names
      if (match.metadata.tables && match.metadata.tables.length > 0) {
        confidence += 0.1;
      }
    }

    // Higher confidence if we found database connection
    if (match.metadata.hasDbConnection) {
      confidence += 0.1;
    }

    // Higher confidence if we found known database library
    if (match.metadata.dbLibrary && match.metadata.dbLibrary !== 'orm') {
      confidence += 0.15;
    } else if (match.metadata.dbLibrary === 'orm') {
      confidence += 0.1; // Less confidence for generic ORM detection
    }

    // Higher confidence if we found query execution
    if (match.metadata.hasQueryExecution) {
      confidence += 0.15;
    }

    // Higher confidence if we found data flow patterns
    if (match.metadata.hasDataFlow) {
      confidence += 0.05;
    }

    // Higher confidence if we found error handling
    if (match.metadata.hasErrorHandling) {
      confidence += 0.05;
    }

    // Bonus for complete patterns (SQL + execution + library)
    if (match.metadata.hasSqlOperation && match.metadata.hasQueryExecution && match.metadata.dbLibrary) {
      confidence += 0.15;
    }

    // Penalty for simple connection patterns without much context
    if (match.metadata.hasDbConnection && !match.metadata.hasSqlOperation && 
        !match.metadata.hasQueryExecution && !match.metadata.dbLibrary) {
      confidence -= 0.1;
    }

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  /**
   * Find SQL query patterns in string literals or template literals
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findSqlQueryPattern(node: Node, context: TraversalContext): PatternMatch | null {
    let sqlQuery: string | null = null;
    let queryNode: Node | null = null;

    // Check string literals for SQL
    if (t.isStringLiteral(node)) {
      const query = node.value.trim().toUpperCase();
      if (this.containsSqlOperation(query)) {
        sqlQuery = node.value;
        queryNode = node;
      }
    }

    // Check template literals for SQL
    if (t.isTemplateLiteral(node)) {
      const query = this.extractTemplateLiteralText(node).toUpperCase();
      if (this.containsSqlOperation(query)) {
        sqlQuery = this.extractTemplateLiteralText(node);
        queryNode = node;
      }
    }

    if (!sqlQuery || !queryNode) {
      return null;
    }

    const involvedNodes: Node[] = [queryNode];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasSqlOperation: true,
      hasDbConnection: false,
      hasQueryExecution: false,
      hasDataFlow: false,
      hasErrorHandling: false,
      dbLibrary: null,
      sqlQuery,
      operationType: this.extractOperationType(sqlQuery),
      operationCount: 1,
      tables: this.extractTableNames(sqlQuery),
      parameters: []
    };

    // Extract variables from template literals
    if (t.isTemplateLiteral(node)) {
      const templateVars = this.extractTemplateVariables(node);
      variables.push(...templateVars);
      metadata.parameters = templateVars;
    }

    // Look for query execution context
    const executionContext = this.findQueryExecutionContext(queryNode, context);
    if (executionContext) {
      metadata.hasQueryExecution = true;
      metadata.hasDbConnection = executionContext.hasConnection;
      metadata.hasErrorHandling = executionContext.hasErrorHandling;
      metadata.dbLibrary = executionContext.library;
      
      involvedNodes.push(...executionContext.nodes);
      variables.push(...executionContext.variables);
      functions.push(...executionContext.functions);
    }

    return {
      type: 'database',
      rootNode: queryNode,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find database connection patterns in new expressions
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findNewExpressionPattern(node: t.NewExpression, context: TraversalContext): PatternMatch | null {
    const connectionInfo = this.analyzeNewExpressionConnection(node);
    if (!connectionInfo.isConnection) {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasSqlOperation: false,
      hasDbConnection: true,
      hasQueryExecution: false,
      hasDataFlow: true,
      hasErrorHandling: false,
      dbLibrary: connectionInfo.library,
      connectionType: 'constructor',
      operationCount: 1,
      connectionConfig: connectionInfo.config,
      tables: [],
      parameters: []
    };

    // Extract connection configuration
    if (connectionInfo.config) {
      variables.push(...connectionInfo.variables);
    }

    return {
      type: 'database',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find database connection patterns
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findDatabaseConnectionPattern(node: Node, context: TraversalContext): PatternMatch | null {
    // Look for function calls that establish database connections
    if (!t.isCallExpression(node)) {
      return null;
    }

    const connectionInfo = this.analyzeConnectionCall(node);
    if (!connectionInfo.isConnection) {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasSqlOperation: false,
      hasDbConnection: true,
      hasQueryExecution: false,
      hasDataFlow: true,
      hasErrorHandling: false,
      dbLibrary: connectionInfo.library,
      connectionType: connectionInfo.type,
      operationCount: 1,
      connectionConfig: connectionInfo.config,
      tables: [],
      parameters: []
    };

    // Extract connection configuration
    if (connectionInfo.config) {
      variables.push(...connectionInfo.variables);
    }

    // Look for error handling around connection
    const errorHandling = this.findConnectionErrorHandling(node, context);
    if (errorHandling) {
      metadata.hasErrorHandling = true;
      involvedNodes.push(...errorHandling.nodes);
      functions.push(...errorHandling.functions);
    }

    return {
      type: 'database',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find ORM and database library patterns
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findOrmPattern(node: Node, context: TraversalContext): PatternMatch | null {
    if (!t.isCallExpression(node)) {
      return null;
    }

    const ormInfo = this.analyzeOrmCall(node);
    if (!ormInfo.isOrmCall) {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasSqlOperation: false,
      hasDbConnection: false,
      hasQueryExecution: true,
      hasDataFlow: true,
      hasErrorHandling: false,
      dbLibrary: ormInfo.library,
      operationType: ormInfo.operation,
      operationCount: 1,
      modelName: ormInfo.model,
      methodName: ormInfo.method,
      tables: ormInfo.model ? [ormInfo.model] : [],
      parameters: []
    };

    // Extract method arguments as parameters
    if (node.arguments.length > 0) {
      const params = this.extractCallArguments(node);
      variables.push(...params.variables);
      metadata.parameters = params.parameters;
    }

    // Look for promise handling (most ORM calls return promises)
    const promiseHandling = this.findPromiseHandling(node, context);
    if (promiseHandling) {
      metadata.hasErrorHandling = promiseHandling.hasError;
      involvedNodes.push(...promiseHandling.nodes);
      variables.push(...promiseHandling.variables);
      functions.push(...promiseHandling.functions);
    }

    return {
      type: 'database',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Check if a query string contains SQL operations
   * @param query - Query string to check
   * @returns True if contains SQL operations
   */
  private containsSqlOperation(query: string): boolean {
    const trimmedQuery = query.trim().toUpperCase();
    
    // Must start with a SQL operation keyword, not just contain it
    return this.sqlOperations.some(op => {
      const pattern = new RegExp(`^\\s*${op}\\s+`, 'i');
      return pattern.test(trimmedQuery);
    });
  }

  /**
   * Extract operation type from SQL query
   * @param query - SQL query string
   * @returns Operation type
   */
  private extractOperationType(query: string): string {
    const upperQuery = query.trim().toUpperCase();
    for (const op of this.sqlOperations) {
      if (upperQuery.startsWith(op)) {
        return op.toLowerCase();
      }
    }
    return 'unknown';
  }

  /**
   * Extract table names from SQL query
   * @param query - SQL query string
   * @returns Array of table names
   */
  private extractTableNames(query: string): string[] {
    const tables: string[] = [];
    const upperQuery = query.toUpperCase();
    
    // Simple regex patterns for common SQL table references
    const patterns = [
      /FROM\s+(\w+)/g,
      /INTO\s+(\w+)/g,
      /UPDATE\s+(\w+)/g,
      /JOIN\s+(\w+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(upperQuery)) !== null) {
        if (match[1] && !tables.includes(match[1].toLowerCase())) {
          tables.push(match[1].toLowerCase());
        }
      }
    });

    return tables;
  }

  /**
   * Extract text content from template literal
   * @param node - Template literal node
   * @returns Concatenated text content
   */
  private extractTemplateLiteralText(node: t.TemplateLiteral): string {
    return node.quasis.map(quasi => quasi.value.cooked || quasi.value.raw).join('');
  }

  /**
   * Extract variables from template literal expressions
   * @param node - Template literal node
   * @returns Array of variable names
   */
  private extractTemplateVariables(node: t.TemplateLiteral): string[] {
    const variables: string[] = [];
    
    node.expressions.forEach(expr => {
      if (t.isIdentifier(expr)) {
        variables.push(expr.name);
      }
    });

    return variables;
  }

  /**
   * Find query execution context around a SQL query
   * @param queryNode - The SQL query node
   * @param context - Traversal context
   * @returns Execution context information
   */
  private findQueryExecutionContext(queryNode: Node, context: TraversalContext): {
    hasConnection: boolean;
    hasErrorHandling: boolean;
    library: string | null;
    nodes: Node[];
    variables: string[];
    functions: string[];
  } | null {
    // Look for the query node within a function call
    for (let i = context.ancestors.length - 1; i >= 0; i--) {
      const ancestor = context.ancestors[i];
      
      if (t.isCallExpression(ancestor) && this.nodeContains(ancestor, queryNode)) {
        const callInfo = this.analyzeQueryCall(ancestor);
        if (callInfo.isQueryCall) {
          return {
            hasConnection: callInfo.hasConnection,
            hasErrorHandling: false, // Will be determined separately
            library: callInfo.library,
            nodes: [ancestor],
            variables: callInfo.variables,
            functions: callInfo.functions
          };
        }
      }
    }

    return null;
  }

  /**
   * Analyze a new expression to determine if it's a database connection
   * @param node - New expression node
   * @returns Connection analysis result
   */
  private analyzeNewExpressionConnection(node: t.NewExpression): {
    isConnection: boolean;
    library: string | null;
    type: string;
    config: any;
    variables: string[];
  } {
    const result = {
      isConnection: false,
      library: null as string | null,
      type: 'constructor',
      config: null,
      variables: [] as string[]
    };

    // Check for database client constructors
    if (t.isMemberExpression(node.callee)) {
      const memberInfo = this.analyzeMemberExpression(node.callee);
      if (memberInfo.isDbLibrary) {
        result.isConnection = true;
        result.library = memberInfo.library;
      }
    } else if (t.isIdentifier(node.callee)) {
      const constructorName = node.callee.name.toLowerCase();
      
      // Check for known database constructors
      for (const [library, methods] of Object.entries(this.dbLibraries)) {
        if (methods.some(method => method.toLowerCase() === constructorName)) {
          result.isConnection = true;
          result.library = library;
          break;
        }
      }
    }

    // Extract configuration if present
    if (result.isConnection && node.arguments && node.arguments.length > 0) {
      const configArg = node.arguments[0];
      if (t.isObjectExpression(configArg)) {
        result.config = this.extractObjectProperties(configArg);
        result.variables.push(...result.config.variables);
      }
    }

    return result;
  }

  /**
   * Analyze a function call to determine if it's a database connection call
   * @param node - Call expression node
   * @returns Connection analysis result
   */
  private analyzeConnectionCall(node: t.CallExpression): {
    isConnection: boolean;
    library: string | null;
    type: string;
    config: any;
    variables: string[];
  } {
    const result = {
      isConnection: false,
      library: null as string | null,
      type: 'unknown',
      config: null,
      variables: [] as string[]
    };

    // Check for direct library calls
    if (t.isIdentifier(node.callee)) {
      const functionName = node.callee.name;
      if (this.dbConnectionPatterns.some(pattern => 
          functionName.toLowerCase().includes(pattern.toLowerCase()))) {
        result.isConnection = true;
        result.type = 'direct';
      }
    }

    // Check for method calls on database libraries (but only connection methods, not ORM operations)
    if (t.isMemberExpression(node.callee)) {
      const memberInfo = this.analyzeMemberExpression(node.callee);
      if (memberInfo.isDbLibrary && memberInfo.method) {
        // Only consider it a connection if it's actually a connection method
        const connectionMethods = [
          'connect', 'createconnection', 'createpool', 'getconnection',
          'client', 'pool', 'database'
        ];
        
        if (connectionMethods.some(method => 
            memberInfo.method?.toLowerCase().includes(method.toLowerCase()))) {
          result.isConnection = true;
          result.library = memberInfo.library;
          result.type = 'method';
        }
      }
    }

    // Extract configuration if present
    if (result.isConnection && node.arguments.length > 0) {
      const configArg = node.arguments[0];
      if (t.isObjectExpression(configArg)) {
        result.config = this.extractObjectProperties(configArg);
        result.variables.push(...result.config.variables);
      }
    }

    return result;
  }

  /**
   * Analyze a function call to determine if it's an ORM operation
   * @param node - Call expression node
   * @returns ORM analysis result
   */
  private analyzeOrmCall(node: t.CallExpression): {
    isOrmCall: boolean;
    library: string | null;
    operation: string;
    model: string | null;
    method: string | null;
  } {
    const result = {
      isOrmCall: false,
      library: null as string | null,
      operation: 'unknown',
      model: null as string | null,
      method: null as string | null
    };

    if (t.isMemberExpression(node.callee)) {
      const memberInfo = this.analyzeMemberExpression(node.callee);
      
      if (memberInfo.isDbLibrary && memberInfo.method) {
        result.isOrmCall = true;
        result.library = memberInfo.library;
        result.method = memberInfo.method;
        result.operation = this.mapMethodToOperation(memberInfo.method);
        
        // Try to extract model name from the object
        if (t.isIdentifier(node.callee.object)) {
          result.model = node.callee.object.name;
        } else if (t.isMemberExpression(node.callee.object)) {
          const objectInfo = this.analyzeMemberExpression(node.callee.object);
          result.model = objectInfo.property;
        }
      }
    }

    return result;
  }

  /**
   * Analyze member expression to identify database library usage
   * @param node - Member expression node
   * @returns Analysis result
   */
  private analyzeMemberExpression(node: t.MemberExpression): {
    isDbLibrary: boolean;
    library: string | null;
    method: string | null;
    property: string | null;
  } {
    const result = {
      isDbLibrary: false,
      library: null as string | null,
      method: null as string | null,
      property: null as string | null
    };

    // Get the property name
    if (t.isIdentifier(node.property)) {
      result.property = node.property.name;
      result.method = node.property.name;
    }

    // Check if the method is a known database method
    if (result.method) {
      for (const [library, methods] of Object.entries(this.dbLibraries)) {
        if (methods.some(method => method.toLowerCase() === result.method?.toLowerCase())) {
          result.isDbLibrary = true;
          result.library = library;
          break;
        }
      }
    }

    // Special handling for model patterns (User.findAll, etc.) - check this first
    if (!result.isDbLibrary && t.isIdentifier(node.object) && result.method) {
      const objectName = node.object.name;
      const methodLower = result.method.toLowerCase();
      
      // Check for model patterns (capitalized object name + ORM method)
      if (/^[A-Z][a-zA-Z]*$/.test(objectName)) {
        // Check against known ORM methods
        const ormMethods = [
          'findall', 'findbypk', 'findone', 'findorcreate', 'create', 'update', 'destroy', 'save', 'remove',
          'find', 'findmany', 'findunique', 'findbyid', 'insertone', 'updateone', 'deleteone', 'deletemany', 'replaceone',
          'aggregate', 'count', 'distinct', 'populate'
        ];
        
        if (ormMethods.some(method => methodLower === method || methodLower.includes(method))) {
          result.isDbLibrary = true;
          result.library = this.detectOrmLibraryFromMethod(result.method);
        }
      }
    }

    // Also check if the object name suggests a database library
    if (!result.isDbLibrary && t.isIdentifier(node.object)) {
      const objectName = node.object.name.toLowerCase();
      
      // Check for generic database object names first
      if (objectName === 'db' || objectName === 'database' ||
          objectName === 'connection' || objectName === 'client' ||
          objectName === 'pool' || objectName === 'repository') {
        result.isDbLibrary = true;
        result.library = 'generic';
      } else {
        // Check for specific library names
        for (const [library, methods] of Object.entries(this.dbLibraries)) {
          if (objectName.includes(library)) {
            result.isDbLibrary = true;
            result.library = library;
            break;
          }
        }
      }
    }

    return result;
  }

  /**
   * Detect ORM library from method name
   * @param method - Method name
   * @returns Library name
   */
  private detectOrmLibraryFromMethod(method: string): string {
    const methodLower = method.toLowerCase();
    
    // Sequelize methods
    if (['findall', 'findbypk', 'findone', 'findorcreate', 'create', 'update', 'destroy'].includes(methodLower)) {
      return 'sequelize';
    }
    
    // Mongoose methods
    if (['find', 'findone', 'findbyid', 'save', 'remove', 'populate', 'aggregate'].includes(methodLower)) {
      return 'mongoose';
    }
    
    // MongoDB methods
    if (['insertone', 'updateone', 'deleteone', 'deletemany', 'replaceone', 'find', 'count', 'distinct'].includes(methodLower)) {
      return 'mongodb';
    }
    
    // Prisma methods
    if (['findmany', 'findunique', 'create', 'update', 'delete', 'upsert'].includes(methodLower)) {
      return 'prisma';
    }
    
    return 'orm'; // Generic ORM
  }

  /**
   * Map ORM method names to operation types
   * @param method - Method name
   * @returns Operation type
   */
  private mapMethodToOperation(method: string): string {
    const methodLower = method.toLowerCase();
    
    if (methodLower.includes('find') || methodLower.includes('get') || methodLower.includes('select')) {
      return 'select';
    }
    if (methodLower.includes('create') || methodLower.includes('insert') || methodLower.includes('add')) {
      return 'insert';
    }
    if (methodLower.includes('update') || methodLower.includes('modify') || methodLower.includes('set')) {
      return 'update';
    }
    if (methodLower.includes('delete') || methodLower.includes('remove') || methodLower.includes('destroy')) {
      return 'delete';
    }
    
    return 'unknown';
  }

  /**
   * Analyze a query execution call
   * @param node - Call expression node
   * @returns Query call analysis
   */
  private analyzeQueryCall(node: t.CallExpression): {
    isQueryCall: boolean;
    hasConnection: boolean;
    library: string | null;
    variables: string[];
    functions: string[];
  } {
    const result = {
      isQueryCall: false,
      hasConnection: false,
      library: null as string | null,
      variables: [] as string[],
      functions: [] as string[]
    };

    // Check for query method calls
    if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
      const methodName = node.callee.property.name.toLowerCase();
      
      if (['query', 'execute', 'run', 'get', 'all'].includes(methodName)) {
        result.isQueryCall = true;
        result.hasConnection = true;
        
        // Try to identify the library
        const memberInfo = this.analyzeMemberExpression(node.callee);
        result.library = memberInfo.library || 'generic'; // Default to generic if not identified
        
        // If we have a query method, it's likely a database call even if we can't identify the library
        if (!memberInfo.isDbLibrary && t.isIdentifier(node.callee.object)) {
          const objectName = node.callee.object.name.toLowerCase();
          // Common database object names
          if (objectName.includes('connection') || objectName.includes('client') || 
              objectName.includes('db') || objectName.includes('database') ||
              objectName.includes('pool')) {
            result.library = 'generic';
          }
        }
      }
    }

    return result;
  }

  /**
   * Extract arguments from a function call
   * @param node - Call expression node
   * @returns Extracted arguments information
   */
  private extractCallArguments(node: t.CallExpression): {
    parameters: string[];
    variables: string[];
  } {
    const result = {
      parameters: [] as string[],
      variables: [] as string[]
    };

    node.arguments.forEach((arg, index) => {
      if (t.isIdentifier(arg)) {
        result.parameters.push(arg.name);
        result.variables.push(arg.name);
      } else if (t.isStringLiteral(arg)) {
        result.parameters.push(`"${arg.value}"`);
      } else if (t.isNumericLiteral(arg)) {
        result.parameters.push(arg.value.toString());
      } else if (t.isObjectExpression(arg)) {
        result.parameters.push('object');
        const objProps = this.extractObjectProperties(arg);
        result.variables.push(...objProps.variables);
      } else {
        result.parameters.push(`arg${index}`);
      }
    });

    return result;
  }

  /**
   * Extract properties from object expression
   * @param node - Object expression node
   * @returns Extracted properties
   */
  private extractObjectProperties(node: t.ObjectExpression): {
    properties: Record<string, any>;
    variables: string[];
  } {
    const result = {
      properties: {} as Record<string, any>,
      variables: [] as string[]
    };

    node.properties.forEach(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        const key = prop.key.name;
        
        if (t.isStringLiteral(prop.value)) {
          result.properties[key] = prop.value.value;
        } else if (t.isNumericLiteral(prop.value)) {
          result.properties[key] = prop.value.value;
        } else if (t.isIdentifier(prop.value)) {
          result.properties[key] = `{${prop.value.name}}`;
          result.variables.push(prop.value.name);
        } else if (t.isObjectExpression(prop.value)) {
          result.properties[key] = 'nested_object';
          // Recursively extract variables from nested objects
          const nestedProps = this.extractObjectProperties(prop.value);
          result.variables.push(...nestedProps.variables);
        } else {
          result.properties[key] = 'expression';
        }
      }
    });

    return result;
  }

  /**
   * Find error handling around database connections
   * @param connectionNode - Connection node
   * @param context - Traversal context
   * @returns Error handling information
   */
  private findConnectionErrorHandling(connectionNode: Node, context: TraversalContext): {
    nodes: Node[];
    functions: string[];
  } | null {
    // Look for try-catch blocks or .catch() calls
    const errorHandling = this.findPromiseHandling(connectionNode, context);
    if (errorHandling && errorHandling.hasError) {
      return {
        nodes: errorHandling.nodes,
        functions: errorHandling.functions
      };
    }

    return null;
  }

  /**
   * Find generic query execution patterns (like connection.query())
   * @param node - AST node to analyze
   * @param context - Traversal context
   * @returns Pattern match if found, null otherwise
   */
  private findGenericQueryPattern(node: Node, context: TraversalContext): PatternMatch | null {
    if (!t.isCallExpression(node)) {
      return null;
    }

    // Check for method calls that look like database queries
    if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
      const methodName = node.callee.property.name.toLowerCase();
      
      if (['query', 'execute', 'run', 'get', 'all'].includes(methodName)) {
        // This looks like a query call, proceed with pattern creation
      } else {
        return null;
      }
    } else {
      return null;
    }

    const involvedNodes: Node[] = [node];
    const variables: string[] = [];
    const functions: string[] = [];
    const metadata: Record<string, any> = {
      hasSqlOperation: false,
      hasDbConnection: true,
      hasQueryExecution: true,
      hasDataFlow: true,
      hasErrorHandling: false,
      dbLibrary: queryInfo.library,
      operationType: 'unknown',
      operationCount: 1,
      tables: [],
      parameters: []
    };

    // Extract method arguments as parameters
    if (node.arguments.length > 0) {
      const params = this.extractCallArguments(node);
      variables.push(...params.variables);
      metadata.parameters = params.parameters;

      // Check if first argument is a SQL query
      const firstArg = node.arguments[0];
      if (t.isStringLiteral(firstArg)) {
        const query = firstArg.value.trim().toUpperCase();
        if (this.containsSqlOperation(query)) {
          metadata.hasSqlOperation = true;
          metadata.sqlQuery = firstArg.value;
          metadata.operationType = this.extractOperationType(firstArg.value);
          metadata.tables = this.extractTableNames(firstArg.value);
        }
      }
    }

    // Look for error handling
    const errorHandling = this.findPromiseHandling(node, context);
    if (errorHandling && errorHandling.hasError) {
      metadata.hasErrorHandling = true;
      involvedNodes.push(...errorHandling.nodes);
      variables.push(...errorHandling.variables);
      functions.push(...errorHandling.functions);
    }

    return {
      type: 'database',
      rootNode: node,
      involvedNodes,
      variables,
      functions,
      metadata
    };
  }

  /**
   * Find promise handling patterns (.then, .catch, await, try-catch)
   * @param node - Node to analyze
   * @param context - Traversal context
   * @returns Promise handling information
   */
  private findPromiseHandling(node: Node, context: TraversalContext): {
    hasError: boolean;
    nodes: Node[];
    variables: string[];
    functions: string[];
  } | null {
    const result = {
      hasError: false,
      nodes: [] as Node[],
      variables: [] as string[],
      functions: [] as string[]
    };

    // Look for .catch() in the chain
    for (let i = context.ancestors.length - 1; i >= 0; i--) {
      const ancestor = context.ancestors[i];
      
      if (t.isCallExpression(ancestor) && 
          t.isMemberExpression(ancestor.callee) &&
          t.isIdentifier(ancestor.callee.property) &&
          ancestor.callee.property.name === 'catch') {
        
        result.hasError = true;
        result.nodes.push(ancestor);
        
        if (ancestor.arguments.length > 0) {
          const handler = ancestor.arguments[0];
          if (t.isIdentifier(handler)) {
            result.functions.push(handler.name);
          }
        }
      }
    }

    // Look for try-catch blocks
    for (let i = context.ancestors.length - 1; i >= 0; i--) {
      const ancestor = context.ancestors[i];
      
      if (t.isTryStatement(ancestor) && this.nodeContains(ancestor, node)) {
        result.hasError = true;
        result.nodes.push(ancestor);
        break;
      }
    }

    return result.hasError ? result : null;
  }

  /**
   * Check if a parent node contains a child node
   * @param parent - Parent node
   * @param child - Child node to find
   * @returns True if parent contains child
   */
  private nodeContains(parent: Node, child: Node): boolean {
    if (parent === child) return true;

    const queue: Node[] = [parent];
    const visited = new Set<Node>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current === child) return true;

      // Add child nodes to queue
      Object.values(current).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
              queue.push(item as Node);
            }
          });
        } else if (value && typeof value === 'object' && value.type) {
          queue.push(value as Node);
        }
      });
    }

    return false;
  }
}