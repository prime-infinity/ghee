import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@babel/parser';
import type { Node } from '@babel/types';
import { DatabasePatternMatcher } from '../DatabasePatternMatcher';
import type { TraversalContext } from '../../PatternRecognitionEngine';

describe('DatabasePatternMatcher', () => {
  let matcher: DatabasePatternMatcher;
  let mockContext: TraversalContext;

  beforeEach(() => {
    matcher = new DatabasePatternMatcher();
    mockContext = {
      depth: 0,
      ancestors: [],
      scope: new Map(),
      functions: new Map(),
      sourceCode: ''
    };
  });

  describe('SQL Query Pattern Recognition', () => {
    it('should detect SELECT queries in string literals', () => {
      const code = `const query = "SELECT * FROM users WHERE id = 1";`;
      const ast = parse(code, { sourceType: 'module' });
      
      // Find the string literal node
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      expect(stringLiteral).toBeTruthy();
      
      const matches = matcher.match(stringLiteral!, mockContext);
      expect(matches).toHaveLength(1);
      
      const match = matches[0];
      expect(match.type).toBe('database');
      expect(match.metadata.hasSqlOperation).toBe(true);
      expect(match.metadata.operationType).toBe('select');
      expect(match.metadata.sqlQuery).toBe('SELECT * FROM users WHERE id = 1');
      expect(match.metadata.tables).toContain('users');
    });

    it('should detect INSERT queries in string literals', () => {
      const code = `const query = "INSERT INTO products (name, price) VALUES (?, ?)";`;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.operationType).toBe('insert');
      expect(matches[0].metadata.tables).toContain('products');
    });

    it('should detect UPDATE queries in string literals', () => {
      const code = `const query = "UPDATE users SET name = ? WHERE id = ?";`;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.operationType).toBe('update');
      expect(matches[0].metadata.tables).toContain('users');
    });

    it('should detect DELETE queries in string literals', () => {
      const code = `const query = "DELETE FROM orders WHERE status = 'cancelled'";`;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.operationType).toBe('delete');
      expect(matches[0].metadata.tables).toContain('orders');
    });

    it('should detect SQL queries in template literals', () => {
      const code = `const query = \`SELECT * FROM users WHERE name = \${userName}\`;`;
      const ast = parse(code, { sourceType: 'module' });
      
      const templateLiteral = findNodeByType(ast, 'TemplateLiteral');
      const matches = matcher.match(templateLiteral!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasSqlOperation).toBe(true);
      expect(matches[0].metadata.operationType).toBe('select');
      expect(matches[0].variables).toContain('userName');
      expect(matches[0].metadata.parameters).toContain('userName');
    });

    it('should extract multiple table names from complex queries', () => {
      const code = `const query = "SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id";`;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.tables).toContain('users');
      expect(matches[0].metadata.tables).toContain('posts');
    });

    it('should not match non-SQL strings', () => {
      const code = `const message = "Hello world";`;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('Database Connection Pattern Recognition', () => {
    it('should detect MySQL connection creation', () => {
      const code = `const connection = mysql.createConnection({ host: 'localhost', user: 'root' });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasDbConnection).toBe(true);
      expect(matches[0].metadata.dbLibrary).toBe('mysql');
      expect(matches[0].metadata.connectionType).toBe('method');
    });

    it('should detect PostgreSQL client creation', () => {
      const code = `const client = new pg.Client({ connectionString: process.env.DATABASE_URL });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const newExpression = findNodeByType(ast, 'NewExpression');
      const matches = matcher.match(newExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasDbConnection).toBe(true);
      expect(matches[0].metadata.dbLibrary).toBe('pg');
    });

    it('should detect connection pool creation', () => {
      const code = `const pool = mysql.createPool({ host: 'localhost', user: 'admin' });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasDbConnection).toBe(true);
      expect(matches[0].metadata.connectionType).toBe('method');
    });

    it('should extract connection configuration variables', () => {
      const code = `const connection = mysql.createConnection({ host: dbHost, user: dbUser });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].variables).toContain('dbHost');
      expect(matches[0].variables).toContain('dbUser');
    });
  });

  describe('ORM Pattern Recognition', () => {
    it('should detect Sequelize findAll operations', () => {
      const code = `const users = await User.findAll({ where: { active: true } });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasQueryExecution).toBe(true);
      expect(matches[0].metadata.operationType).toBe('select');
      expect(matches[0].metadata.methodName).toBe('findAll');
      expect(matches[0].metadata.modelName).toBe('User');
    });

    it('should detect Mongoose create operations', () => {
      const code = `const newUser = await User.create({ name: 'John', email: 'john@example.com' });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.operationType).toBe('insert');
      expect(matches[0].metadata.methodName).toBe('create');
    });

    it('should detect Prisma update operations', () => {
      const code = `const updatedUser = await prisma.user.update({ where: { id: 1 }, data: { name: 'Jane' } });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.operationType).toBe('update');
      expect(matches[0].metadata.methodName).toBe('update');
      expect(matches[0].metadata.modelName).toBe('user');
    });

    it('should detect TypeORM delete operations', () => {
      const code = `await repository.remove(userToDelete);`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.operationType).toBe('delete');
      expect(matches[0].metadata.methodName).toBe('remove');
    });

    it('should extract parameters from ORM method calls', () => {
      const code = `const user = await User.findOne({ where: { email: userEmail } });`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].variables).toContain('userEmail');
      expect(matches[0].metadata.parameters).toContain('object');
    });
  });

  describe('Query Execution Context', () => {
    it('should detect query execution with database connection', () => {
      const code = `
        const connection = mysql.createConnection(config);
        const results = connection.query("SELECT * FROM users");
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      // Find the query call
      const callExpressions = findAllNodesByType(ast, 'CallExpression');
      const queryCall = callExpressions.find(call => 
        call.type === 'CallExpression' && 
        call.callee.type === 'MemberExpression' &&
        call.callee.property.type === 'Identifier' &&
        call.callee.property.name === 'query'
      );
      
      expect(queryCall).toBeTruthy();
      
      // Create context with the connection call as ancestor
      const contextWithAncestors = {
        ...mockContext,
        ancestors: [ast, ...callExpressions]
      };
      
      const matches = matcher.match(queryCall!, contextWithAncestors);
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasQueryExecution).toBe(true);
    });


  });

  describe('Confidence Scoring', () => {
    it('should give high confidence for complete SQL patterns', () => {
      const code = `
        const connection = mysql.createConnection(config);
        const results = connection.query("SELECT * FROM users WHERE id = ?", [userId]);
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(1);
      const confidence = matcher.getConfidence(matches[0]);
      expect(confidence).toBeGreaterThan(0.7);
    });

    it('should give medium confidence for ORM patterns', () => {
      const code = `const users = await User.findAll();`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      const confidence = matcher.getConfidence(matches[0]);
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThan(0.8);
    });

    it('should give low confidence for simple connection patterns', () => {
      const code = `const connection = createConnection();`;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpression = findNodeByType(ast, 'CallExpression');
      const matches = matcher.match(callExpression!, mockContext);
      
      expect(matches).toHaveLength(1);
      const confidence = matcher.getConfidence(matches[0]);
      expect(confidence).toBeLessThan(0.6);
    });
  });

  describe('Complex Database Patterns', () => {
    it('should handle MongoDB operations', () => {
      const code = `
        const client = new MongoClient(uri);
        const collection = client.db('mydb').collection('users');
        const result = await collection.insertOne({ name: 'John', age: 30 });
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpressions = findAllNodesByType(ast, 'CallExpression');
      const insertCall = callExpressions.find(call => 
        call.type === 'CallExpression' && 
        call.callee.type === 'MemberExpression' &&
        call.callee.property.type === 'Identifier' &&
        call.callee.property.name === 'insertOne'
      );
      
      expect(insertCall).toBeTruthy();
      const matches = matcher.match(insertCall!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.operationType).toBe('insert');
      expect(matches[0].metadata.dbLibrary).toBe('mongodb');
    });

    it('should handle SQLite operations', () => {
      const code = `
        const db = new sqlite3.Database('database.db');
        db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpressions = findAllNodesByType(ast, 'CallExpression');
      const runCall = callExpressions.find(call => 
        call.type === 'CallExpression' && 
        call.callee.type === 'MemberExpression' &&
        call.callee.property.type === 'Identifier' &&
        call.callee.property.name === 'run'
      );
      
      expect(runCall).toBeTruthy();
      const matches = matcher.match(runCall!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasQueryExecution).toBe(true);
      expect(matches[0].metadata.dbLibrary).toBe('sqlite3');
    });

    it('should handle promise chains with error handling', () => {
      const code = `
        connection.query("SELECT * FROM users")
          .then(results => console.log(results))
          .catch(error => console.error(error));
      `;
      const ast = parse(code, { sourceType: 'module' });
      
      const callExpressions = findAllNodesByType(ast, 'CallExpression');
      const queryCall = callExpressions.find(call => 
        call.type === 'CallExpression' && 
        call.callee.type === 'MemberExpression' &&
        call.callee.property.type === 'Identifier' &&
        call.callee.property.name === 'query'
      );
      
      const catchCall = callExpressions.find(call => 
        call.type === 'CallExpression' && 
        call.callee.type === 'MemberExpression' &&
        call.callee.property.type === 'Identifier' &&
        call.callee.property.name === 'catch'
      );
      
      expect(queryCall).toBeTruthy();
      expect(catchCall).toBeTruthy();
      
      const contextWithChain = {
        ...mockContext,
        ancestors: [ast, catchCall!, queryCall!]
      };
      
      const matches = matcher.match(queryCall!, contextWithChain);
      expect(matches).toHaveLength(1);
      expect(matches[0].metadata.hasErrorHandling).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed SQL gracefully', () => {
      const code = `const query = "SELCT * FRM users";`; // Intentional typos
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(0); // Should not match malformed SQL
    });

    it('should handle empty query strings', () => {
      const code = `const query = "";`;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(0);
    });

    it('should handle complex template literals with multiple variables', () => {
      const code = `const query = \`SELECT \${columns} FROM \${tableName} WHERE \${condition} = \${value}\`;`;
      const ast = parse(code, { sourceType: 'module' });
      
      const templateLiteral = findNodeByType(ast, 'TemplateLiteral');
      const matches = matcher.match(templateLiteral!, mockContext);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].variables).toContain('columns');
      expect(matches[0].variables).toContain('tableName');
      expect(matches[0].variables).toContain('condition');
      expect(matches[0].variables).toContain('value');
    });

    it('should not match SQL keywords in comments or non-query contexts', () => {
      const code = `const comment = "This SELECT statement is just a comment";`;
      const ast = parse(code, { sourceType: 'module' });
      
      const stringLiteral = findNodeByType(ast, 'StringLiteral');
      const matches = matcher.match(stringLiteral!, mockContext);
      
      expect(matches).toHaveLength(0);
    });
  });
});

// Helper functions for finding nodes in AST
function findNodeByType(ast: Node, nodeType: string): Node | null {
  const queue: Node[] = [ast];
  const visited = new Set<Node>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current.type === nodeType) {
      return current;
    }

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

  return null;
}

function findAllNodesByType(ast: Node, nodeType: string): Node[] {
  const results: Node[] = [];
  const queue: Node[] = [ast];
  const visited = new Set<Node>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current.type === nodeType) {
      results.push(current);
    }

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

  return results;
}