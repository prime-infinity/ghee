import { ExplanationService } from '../ExplanationService';
import type { VisualNode, VisualEdge } from '../../types/visualization';
import { User, MousePointer, Database, Globe } from 'lucide-react';

describe('ExplanationService', () => {
  describe('getNodeExplanation', () => {
    it('provides child-friendly explanation for button nodes', () => {
      const buttonNode: VisualNode = {
        id: 'button-1',
        type: 'button',
        position: { x: 0, y: 0 },
        icon: MousePointer,
        label: 'Click Me',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'counter',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(buttonNode);

      expect(explanation.simple).toContain('Click Me');
      expect(explanation.simple).toContain('button');
      expect(explanation.whatItDoes).toContain('click');
      expect(explanation.analogy).toContain('doorbell');
      expect(explanation.moreInfo).toContain('interact');
    });

    it('provides child-friendly explanation for counter nodes', () => {
      const counterNode: VisualNode = {
        id: 'counter-1',
        type: 'counter',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Score',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'counter',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(counterNode);

      expect(explanation.simple).toContain('Score');
      expect(explanation.simple).toContain('number');
      expect(explanation.whatItDoes).toContain('number');
      expect(explanation.analogy).toContain('score counter');
      expect(explanation.moreInfo).toContain('counter pattern');
    });

    it('provides child-friendly explanation for API nodes', () => {
      const apiNode: VisualNode = {
        id: 'api-1',
        type: 'api',
        position: { x: 0, y: 0 },
        icon: Globe,
        label: 'User Data',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'api-call',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(apiNode);

      expect(explanation.simple).toContain('User Data');
      expect(explanation.simple).toContain('internet');
      expect(explanation.whatItDoes).toContain('computers');
      expect(explanation.analogy).toContain('letter');
      expect(explanation.moreInfo).toContain('getting data from the internet');
    });

    it('provides child-friendly explanation for database nodes', () => {
      const databaseNode: VisualNode = {
        id: 'db-1',
        type: 'database',
        position: { x: 0, y: 0 },
        icon: Database,
        label: 'User Info',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'database',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(databaseNode);

      expect(explanation.simple).toContain('User Info');
      expect(explanation.simple).toContain('information');
      expect(explanation.whatItDoes).toContain('saves data');
      expect(explanation.analogy).toContain('filing cabinet');
      expect(explanation.moreInfo).toContain('saving and loading information');
    });

    it('provides child-friendly explanation for user nodes', () => {
      const userNode: VisualNode = {
        id: 'user-1',
        type: 'user',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'You',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'user-interaction',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(userNode);

      expect(explanation.simple).toContain('you');
      expect(explanation.simple).toContain('person');
      expect(explanation.whatItDoes).toContain('interact');
      expect(explanation.analogy).toContain('character in a video game');
    });

    it('provides child-friendly explanation for component nodes', () => {
      const componentNode: VisualNode = {
        id: 'comp-1',
        type: 'component',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Header',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'react-component',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(componentNode);

      expect(explanation.simple).toContain('piece of the app');
      expect(explanation.whatItDoes).toContain('specific task');
      expect(explanation.analogy).toContain('LEGO block');
    });

    it('provides child-friendly explanation for error nodes', () => {
      const errorNode: VisualNode = {
        id: 'error-1',
        type: 'error',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Error Handler',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'error-handling',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(errorNode);

      expect(explanation.simple).toContain('something goes wrong');
      expect(explanation.whatItDoes).toContain('problem');
      expect(explanation.analogy).toContain('warning light');
    });

    it('provides child-friendly explanation for function nodes', () => {
      const functionNode: VisualNode = {
        id: 'func-1',
        type: 'function',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'calculateTotal',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'function',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(functionNode);

      expect(explanation.simple).toContain('calculateTotal');
      expect(explanation.simple).toContain('instructions');
      expect(explanation.whatItDoes).toContain('information');
      expect(explanation.analogy).toContain('recipe');
    });

    it('provides child-friendly explanation for variable nodes', () => {
      const variableNode: VisualNode = {
        id: 'var-1',
        type: 'variable',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'userName',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'variable',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(variableNode);

      expect(explanation.simple).toContain('userName');
      expect(explanation.simple).toContain('box');
      expect(explanation.whatItDoes).toContain('stores data');
      expect(explanation.analogy).toContain('labeled jar');
    });

    it('provides generic explanation for unknown node types', () => {
      const unknownNode: VisualNode = {
        id: 'unknown-1',
        type: 'unknown' as any,
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Mystery',
        explanation: 'Original explanation',
        metadata: {
          patternNodeId: 'pattern-1',
          patternType: 'unknown',
        },
      };

      const explanation = ExplanationService.getNodeExplanation(unknownNode);

      expect(explanation.simple).toContain('part of the app');
      expect(explanation.whatItDoes).toContain('helps the app work');
      expect(explanation.moreInfo).toContain('specific job');
    });
  });

  describe('getEdgeExplanation', () => {
    it('provides child-friendly explanation for success edges', () => {
      const successEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Success',
        type: 'success',
        color: '#10b981',
      };

      const explanation = ExplanationService.getEdgeExplanation(successEdge);

      expect(explanation.simple).toContain('things work correctly');
      expect(explanation.whatItDoes).toContain('everything goes as planned');
      expect(explanation.analogy).toContain('green light');
      expect(explanation.moreInfo).toContain('happy flow');
    });

    it('provides child-friendly explanation for error edges', () => {
      const errorEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Error',
        type: 'error',
        color: '#ef4444',
      };

      const explanation = ExplanationService.getEdgeExplanation(errorEdge);

      expect(explanation.simple).toContain('something goes wrong');
      expect(explanation.whatItDoes).toContain('problem');
      expect(explanation.analogy).toContain('red light');
      expect(explanation.moreInfo).toContain('handle problems');
    });

    it('provides child-friendly explanation for action edges', () => {
      const actionEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Click',
        type: 'action',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(actionEdge);

      expect(explanation.simple).toContain('action happening');
      expect(explanation.whatItDoes).toContain('cause other things to happen');
      expect(explanation.analogy).toContain('arrow');
    });

    it('provides child-friendly explanation for data-flow edges', () => {
      const dataFlowEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Data',
        type: 'data-flow',
        color: '#8b5cf6',
      };

      const explanation = ExplanationService.getEdgeExplanation(dataFlowEdge);

      expect(explanation.simple).toContain('information moving');
      expect(explanation.whatItDoes).toContain('data travels');
      expect(explanation.analogy).toContain('water flowing');
      expect(explanation.moreInfo).toContain('information moves');
    });

    it('customizes explanation based on edge label', () => {
      const clickEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'onClick',
        type: 'action',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(clickEdge);

      expect(explanation.simple).toContain('what happens when you click');
      expect(explanation.whatItDoes).toContain('button to what happens when you click');
    });

    it('customizes explanation for fetch/request labels', () => {
      const fetchEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'fetch data',
        type: 'action',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(fetchEdge);

      expect(explanation.simple).toContain('asking for information');
      expect(explanation.whatItDoes).toContain('asking for data');
    });

    it('customizes explanation for save/store labels', () => {
      const saveEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'save user',
        type: 'action',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(saveEdge);

      expect(explanation.simple).toContain('saving information');
      expect(explanation.whatItDoes).toContain('storing data');
    });

    it('provides generic explanation for unknown edge types', () => {
      const unknownEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Unknown',
        type: 'unknown' as any,
        color: '#6b7280',
      };

      const explanation = ExplanationService.getEdgeExplanation(unknownEdge);

      expect(explanation.simple).toContain('connects two parts');
      expect(explanation.whatItDoes).toContain('work together');
      expect(explanation.moreInfo).toContain('relationships');
    });
  });

  describe('getTooltipText', () => {
    it('returns simple explanation by default', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something',
        analogy: 'Like a thing',
      };

      const tooltipText = ExplanationService.getTooltipText(explanation);

      expect(tooltipText).toBe('This is simple\n\nLike a thing');
    });

    it('excludes analogy when requested', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something',
        analogy: 'Like a thing',
      };

      const tooltipText = ExplanationService.getTooltipText(explanation, false);

      expect(tooltipText).toBe('This is simple');
    });

    it('handles missing analogy gracefully', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something',
      };

      const tooltipText = ExplanationService.getTooltipText(explanation);

      expect(tooltipText).toBe('This is simple');
    });
  });

  describe('getDetailedExplanation', () => {
    it('combines whatItDoes, analogy, and moreInfo', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something important',
        analogy: 'Like a helpful tool',
        moreInfo: 'Additional context here',
      };

      const detailedText = ExplanationService.getDetailedExplanation(explanation);

      expect(detailedText).toContain('It does something important');
      expect(detailedText).toContain('Think of it like this: Like a helpful tool');
      expect(detailedText).toContain('Additional context here');
    });

    it('handles missing analogy in detailed explanation', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something important',
        moreInfo: 'Additional context here',
      };

      const detailedText = ExplanationService.getDetailedExplanation(explanation);

      expect(detailedText).toContain('It does something important');
      expect(detailedText).not.toContain('Think of it like this:');
      expect(detailedText).toContain('Additional context here');
    });

    it('handles missing moreInfo in detailed explanation', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something important',
        analogy: 'Like a helpful tool',
      };

      const detailedText = ExplanationService.getDetailedExplanation(explanation);

      expect(detailedText).toContain('It does something important');
      expect(detailedText).toContain('Think of it like this: Like a helpful tool');
      expect(detailedText).not.toContain('\n\nAdditional');
    });
  });

  describe('Child-Friendly Language Requirements', () => {
    const testNodes: VisualNode[] = [
      {
        id: 'test-1',
        type: 'button',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Test Button',
        explanation: 'Test',
        metadata: { patternNodeId: 'p1', patternType: 'test' },
      },
      {
        id: 'test-2',
        type: 'api',
        position: { x: 0, y: 0 },
        icon: Globe,
        label: 'Test API',
        explanation: 'Test',
        metadata: { patternNodeId: 'p2', patternType: 'test' },
      },
    ];

    const testEdges: VisualEdge[] = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        label: 'Test Action',
        type: 'action',
        color: '#3b82f6',
      },
      {
        id: 'edge-2',
        source: 'node-1',
        target: 'node-2',
        label: 'Test Error',
        type: 'error',
        color: '#ef4444',
      },
    ];

    it('uses simple, non-technical language in all explanations', () => {
      testNodes.forEach(node => {
        const explanation = ExplanationService.getNodeExplanation(node);
        
        // Should avoid technical jargon
        expect(explanation.simple.toLowerCase()).not.toContain('function');
        expect(explanation.simple.toLowerCase()).not.toContain('method');
        expect(explanation.simple.toLowerCase()).not.toContain('object');
        expect(explanation.simple.toLowerCase()).not.toContain('instance');
        expect(explanation.simple.toLowerCase()).not.toContain('parameter');
        
        // Should use child-friendly terms
        expect(explanation.simple.length).toBeGreaterThan(10); // Has meaningful content
        expect(explanation.analogy).toBeDefined(); // Has analogy for better understanding
      });
    });

    it('focuses on "what" rather than "how" in explanations', () => {
      testNodes.forEach(node => {
        const explanation = ExplanationService.getNodeExplanation(node);
        
        // Should focus on what it does, not how it works
        expect(explanation.whatItDoes.toLowerCase()).toMatch(/does|shows|helps|keeps|stores|gets|saves/);
        expect(explanation.whatItDoes.toLowerCase()).not.toContain('implements');
        expect(explanation.whatItDoes.toLowerCase()).not.toContain('executes');
        expect(explanation.whatItDoes.toLowerCase()).not.toContain('instantiates');
      });

      testEdges.forEach(edge => {
        const explanation = ExplanationService.getEdgeExplanation(edge);
        
        // Should focus on what the connection does
        expect(explanation.whatItDoes.toLowerCase()).toMatch(/shows|connects|happens|moves|flows/);
      });
    });

    it('provides helpful analogies for complex concepts', () => {
      testNodes.forEach(node => {
        const explanation = ExplanationService.getNodeExplanation(node);
        
        if (explanation.analogy) {
          expect(explanation.analogy.toLowerCase()).toContain('like');
          expect(explanation.analogy.length).toBeGreaterThan(15); // Meaningful analogy
        }
      });

      testEdges.forEach(edge => {
        const explanation = ExplanationService.getEdgeExplanation(edge);
        
        if (explanation.analogy) {
          expect(explanation.analogy.toLowerCase()).toContain('like');
          expect(explanation.analogy.length).toBeGreaterThan(15); // Meaningful analogy
        }
      });
    });
  });
});