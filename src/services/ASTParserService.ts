import { parse, ParserOptions } from '@babel/parser';
import { Node } from '@babel/types';
import { ParseResult, ValidationResult, ParseError } from '../types';

/**
 * Service for parsing JavaScript/TypeScript code into Abstract Syntax Trees
 */
export class ASTParserService {
  private readonly defaultOptions: ParserOptions = {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'classProperties',
      'objectRestSpread',
      'functionBind',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'dynamicImport',
      'nullishCoalescingOperator',
      'optionalChaining',
      'optionalCatchBinding',
      'throwExpressions',
      'topLevelAwait'
    ]
  };

  /**
   * Parse JavaScript/TypeScript code into an AST
   * @param code - The source code to parse
   * @returns Promise resolving to ParseResult with AST and any errors
   */
  async parseCode(code: string): Promise<ParseResult> {
    const errors: ParseError[] = [];
    let ast: Node;
    let language: 'javascript' | 'typescript' = 'javascript';

    // Check for empty code
    if (!code || code.trim().length === 0) {
      const parseError: ParseError = {
        message: 'Code cannot be empty',
        line: 1,
        column: 1,
        start: 0,
        end: 0,
        type: 'syntax',
        suggestion: 'Please enter some JavaScript or TypeScript code'
      };
      return {
        ast: this.createEmptyAST(),
        errors: [parseError],
        language
      };
    }

    // Detect language based on TypeScript-specific syntax
    language = this.detectLanguage(code);

    try {
      // First attempt: try parsing with detected language settings
      const options = this.getParserOptions(language);
      ast = parse(code, options);
    } catch (error) {
      // If TypeScript parsing fails, try JavaScript
      if (language === 'typescript') {
        try {
          const jsOptions = this.getParserOptions('javascript');
          ast = parse(code, jsOptions);
          language = 'javascript';
        } catch (jsError) {
          // Both failed, return the original TypeScript error
          const parseError = this.createParseError(error as Error, code);
          return {
            ast: this.createEmptyAST(),
            errors: [parseError],
            language
          };
        }
      } else {
        // JavaScript parsing failed
        const parseError = this.createParseError(error as Error, code);
        return {
          ast: this.createEmptyAST(),
          errors: [parseError],
          language
        };
      }
    }

    return {
      ast,
      errors,
      language
    };
  }

  /**
   * Validate code syntax without full parsing
   * @param code - The source code to validate
   * @returns ValidationResult with validation status and any errors
   */
  validateSyntax(code: string): ValidationResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];

    // Basic validation checks
    if (!code || code.trim().length === 0) {
      errors.push({
        message: 'Code cannot be empty',
        line: 1,
        column: 1,
        start: 0,
        end: 0,
        type: 'syntax',
        suggestion: 'Please enter some JavaScript or TypeScript code'
      });
      return { isValid: false, errors, warnings };
    }

    // Check for common syntax issues before parsing
    const syntaxIssues = this.checkCommonSyntaxIssues(code);
    warnings.push(...syntaxIssues);

    // Attempt to parse to validate syntax
    const language = this.detectLanguage(code);
    
    try {
      const options = this.getParserOptions(language);
      parse(code, options);
      return { isValid: true, errors, warnings };
    } catch (error) {
      // Try alternative language if first attempt fails
      if (language === 'typescript') {
        try {
          const jsOptions = this.getParserOptions('javascript');
          parse(code, jsOptions);
          return { isValid: true, errors, warnings };
        } catch (jsError) {
          // Both failed
          const parseError = this.createParseError(error as Error, code);
          errors.push(parseError);
        }
      } else {
        const parseError = this.createParseError(error as Error, code);
        errors.push(parseError);
      }
    }

    return { isValid: false, errors, warnings };
  }

  /**
   * Detect whether code is JavaScript or TypeScript
   * @param code - Source code to analyze
   * @returns Detected language
   */
  private detectLanguage(code: string): 'javascript' | 'typescript' {
    // Look for TypeScript-specific syntax
    const tsPatterns = [
      /:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*\s*[=;,)]/,  // Type annotations
      /interface\s+\w+/,                                 // Interface declarations
      /type\s+\w+\s*=/,                                 // Type aliases
      /enum\s+\w+/,                                     // Enum declarations
      /<\w+>/,                                          // Generic syntax
      /as\s+\w+/,                                       // Type assertions
      /public\s+|private\s+|protected\s+/,             // Access modifiers
      /readonly\s+/,                                    // Readonly modifier
      /\?\s*:/,                                         // Optional properties
      /!\s*\./                                          // Non-null assertion
    ];

    return tsPatterns.some(pattern => pattern.test(code)) ? 'typescript' : 'javascript';
  }

  /**
   * Get parser options for specific language
   * @param language - Target language
   * @returns Parser options
   */
  private getParserOptions(language: 'javascript' | 'typescript'): ParserOptions {
    const options = { ...this.defaultOptions };
    
    if (language === 'typescript') {
      // Add TypeScript-specific plugins
      options.plugins = [
        ...options.plugins!,
        'typescript'
      ];
    }

    return options;
  }

  /**
   * Create a ParseError from a Babel parsing error
   * @param error - The original error
   * @param code - The source code that caused the error
   * @returns Formatted ParseError
   */
  private createParseError(error: Error, code: string): ParseError {
    // Extract position information from Babel error
    const match = error.message.match(/\((\d+):(\d+)\)/);
    const line = match ? parseInt(match[1], 10) : 1;
    const column = match ? parseInt(match[2], 10) : 1;

    // Calculate start/end positions
    const lines = code.split('\n');
    let start = 0;
    for (let i = 0; i < line - 1; i++) {
      start += lines[i].length + 1; // +1 for newline
    }
    start += column - 1;

    return {
      message: this.cleanErrorMessage(error.message),
      line,
      column,
      start,
      end: start + 1,
      type: 'syntax',
      suggestion: this.getSuggestionForError(error.message)
    };
  }

  /**
   * Clean up Babel error messages for user-friendly display
   * @param message - Original error message
   * @returns Cleaned message
   */
  private cleanErrorMessage(message: string): string {
    // Remove Babel-specific prefixes and technical details
    return message
      .replace(/^SyntaxError:\s*/, '')
      .replace(/\s*\(\d+:\d+\)$/, '')
      .replace(/Unexpected token/, 'Unexpected symbol')
      .replace(/Expected/, 'Expected to find');
  }

  /**
   * Get helpful suggestions for common parsing errors
   * @param errorMessage - The error message
   * @returns Suggestion string or undefined
   */
  private getSuggestionForError(errorMessage: string): string | undefined {
    if (errorMessage.includes('Unexpected token')) {
      return 'Check for missing semicolons, brackets, or quotes';
    }
    if (errorMessage.includes('Expected')) {
      return 'Check for missing closing brackets, parentheses, or braces';
    }
    if (errorMessage.includes('Unterminated')) {
      return 'Check for unclosed strings or comments';
    }
    if (errorMessage.includes('Invalid left-hand side')) {
      return 'Check your assignment statements and variable declarations';
    }
    return 'Please check your code syntax and try again';
  }

  /**
   * Check for common syntax issues that might cause problems
   * @param code - Source code to check
   * @returns Array of warning ParseErrors
   */
  private checkCommonSyntaxIssues(code: string): ParseError[] {
    const warnings: ParseError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for potential issues
      if (line.includes('console.log') && !line.includes('//')) {
        warnings.push({
          message: 'Console.log statement detected',
          line: index + 1,
          column: line.indexOf('console.log') + 1,
          start: 0,
          end: 0,
          type: 'warning',
          suggestion: 'Consider removing console.log statements in production code'
        });
      }

      // Check for missing semicolons (basic check)
      if (line.trim().match(/^(let|const|var|return|throw)\s+.*[^;{}\s]$/)) {
        warnings.push({
          message: 'Missing semicolon',
          line: index + 1,
          column: line.length,
          start: 0,
          end: 0,
          type: 'warning',
          suggestion: 'Consider adding a semicolon at the end of the statement'
        });
      }
    });

    return warnings;
  }

  /**
   * Create an empty AST for error cases
   * @returns Empty program node
   */
  private createEmptyAST(): Node {
    return {
      type: 'File',
      program: {
        type: 'Program',
        body: [],
        directives: [],
        sourceType: 'module'
      },
      comments: [],
      tokens: []
    } as Node;
  }
}