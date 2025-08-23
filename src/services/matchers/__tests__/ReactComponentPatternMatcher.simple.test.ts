import { describe, it, expect } from 'vitest';
import { parse } from '@babel/parser';
import { ReactComponentPatternMatcher } from '../ReactComponentPatternMatcher';
import type { TraversalContext } from '../../PatternRecognitionEngine';

describe('ReactComponentPatternMatcher - Simple Tests', () => {
  const matcher = new ReactComponentPatternMatcher();

  const createContext = (): TraversalContext => ({
    depth: 0,
    ancestors: [],
    scope: new Map(),
    functions: new Map(),
    sourceCode: ''
  });

  it('should detect a simple functional component', () => {
    const code = `function MyComponent() { return <div>Hello</div>; }`;
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    expect(ast.program.body).toHaveLength(1);
    const matches = matcher.match(ast.program.body[0], createContext());
    
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe('react-component');
    expect(matches[0].metadata.componentName).toBe('MyComponent');
  });

  it('should detect arrow function component', () => {
    const code = `const MyComponent = () => <div>Hello</div>;`;
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    expect(ast.program.body).toHaveLength(1);
    const variableDeclaration = ast.program.body[0];
    expect(variableDeclaration.type).toBe('VariableDeclaration');
    
    const matches = matcher.match((variableDeclaration as any).declarations[0], createContext());
    
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe('react-component');
    expect(matches[0].metadata.componentName).toBe('MyComponent');
  });

  it('should not match non-JSX functions', () => {
    const code = `function regularFunction() { return "hello"; }`;
    
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    
    const matches = matcher.match(ast.program.body[0], createContext());
    
    expect(matches).toHaveLength(0);
  });
});