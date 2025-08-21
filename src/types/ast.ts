import { Node } from '@babel/types';

/**
 * Result of parsing code into an Abstract Syntax Tree
 */
export interface ParseResult {
  /** The parsed AST node */
  ast: Node;
  /** Any parsing errors encountered */
  errors: ParseError[];
  /** The detected language of the code */
  language: 'javascript' | 'typescript';
}

/**
 * Result of validating code syntax
 */
export interface ValidationResult {
  /** Whether the code is syntactically valid */
  isValid: boolean;
  /** Any validation errors found */
  errors: ParseError[];
  /** Warnings that don't prevent parsing */
  warnings: ParseError[];
}

/**
 * Error encountered during code parsing
 */
export interface ParseError {
  /** Error message */
  message: string;
  /** Line number where error occurred */
  line: number;
  /** Column number where error occurred */
  column: number;
  /** Start position in the source code */
  start: number;
  /** End position in the source code */
  end: number;
  /** Type of error */
  type: 'syntax' | 'semantic' | 'warning';
  /** Suggested fix for the error */
  suggestion?: string;
}