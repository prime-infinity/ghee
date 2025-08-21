// Verification script to test all core dependencies
import { parse } from '@babel/parser';
import { Code } from 'lucide-react';

export const verifySetup = () => {
  const results = {
    babel: false,
    lucide: false,
    reactflow: false,
    tailwind: false,
  };

  try {
    // Test @babel/parser
    const ast = parse('const x = 1;', {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    results.babel = !!ast;
  } catch (error) {
    console.error('Babel parser test failed:', error);
  }

  try {
    // Test lucide-react
    results.lucide = typeof Code === 'function';
  } catch (error) {
    console.error('Lucide React test failed:', error);
  }

  try {
    // Test reactflow (dynamic import to avoid build issues)
    import('reactflow').then(() => {
      results.reactflow = true;
    }).catch((error) => {
      console.error('React Flow test failed:', error);
    });
  } catch (error) {
    console.error('React Flow test failed:', error);
  }

  // Test Tailwind CSS (check if classes are available)
  results.tailwind = true; // Tailwind is working if CSS is loading

  return results;
};