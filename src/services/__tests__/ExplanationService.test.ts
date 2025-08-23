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
      expect(explanation.whatItDoes).toContain('interact');
      expect(explanation.analogy).toContain('doorbell');
      expect(explanation.moreInfo).toContain('counter pattern');
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
      expect(explanation.whatItDoes).toContain('shows');
      expect(explanation.analogy).toContain('score counter');
      expect(explanation.moreInfo).toContain('counter pattern');
    });

    it('provides child-friendly explanation for API nodes', () => {
      const apiNode: VisualNode = {
        id: 'api-1',
        type: 'api',
        position: { x: 0, y: 0 },
        icon: Globe,
        label: 'Weather API',
        explanation: 'Original explanation',
      };

      const explanation = ExplanationService.getNodeExplanation(apiNode);

      expect(explanation.simple).toContain('Weather API');
      expect(explanation.simple).toContain('computers');
      expect(explanation.whatItDoes).toContain('asks');
      expect(explanation.analogy).toContain('letter');
    });

    it('provides child-friendly explanation for database nodes', () => {
      const databaseNode: VisualNode = {
        id: 'db-1',
        type: 'database',
        position: { x: 0, y: 0 },
        icon: Database,
        label: 'User Data',
        explanation: 'Original explanation',
      };

      const explanation = ExplanationService.getNodeExplanation(databaseNode);

      expect(explanation.simple).toContain('User Data');
      expect(explanation.simple).toContain('stored');
      expect(explanation.whatItDoes).toContain('saves');
      expect(explanation.analogy).toContain('filing cabinet');
    });

    it('provides child-friendly explanation for user nodes', () => {
      const userNode: VisualNode = {
        id: 'user-1',
        type: 'user',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Customer',
        explanation: 'Original explanation',
      };

      const explanation = ExplanationService.getNodeExplanation(userNode);

      expect(explanation.simple).toContain('you');
      expect(explanation.simple).toContain('person');
      expect(explanation.whatItDoes).toContain('shows');
      expect(explanation.analogy).toContain('character');
    });

    it('provides child-friendly explanation for component nodes', () => {
      const componentNode: VisualNode = {
        id: 'comp-1',
        type: 'component',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Header',
        explanation: 'Original explanation',
      };

      const explanation = ExplanationService.getNodeExplanation(componentNode);

      expect(explanation.simple).toContain('piece');
      expect(explanation.simple).toContain('job');
      expect(explanation.whatItDoes).toContain('handles');
      expect(explanation.analogy).toContain('LEGO');
    });

    it('provides child-friendly explanation for error nodes', () => {
      const errorNode: VisualNode = {
        id: 'error-1',
        type: 'error',
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Error Handler',
        explanation: 'Original explanation',
      };

      const explanation = ExplanationService.getNodeExplanation(errorNode);

      expect(explanation.simple).toContain('wrong');
      expect(explanation.whatItDoes).toContain('appears');
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
      };

      const explanation = ExplanationService.getNodeExplanation(functionNode);

      expect(explanation.simple).toContain('calculateTotal');
      expect(explanation.simple).toContain('instructions');
      expect(explanation.whatItDoes).toContain('takes');
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
      };

      const explanation = ExplanationService.getNodeExplanation(variableNode);

      expect(explanation.simple).toContain('userName');
      expect(explanation.simple).toContain('box');
      expect(explanation.whatItDoes).toContain('stores');
      expect(explanation.analogy).toContain('jar');
    });

    it('provides generic explanation for unknown node types', () => {
      const unknownNode: VisualNode = {
        id: 'unknown-1',
        type: 'unknown' as any,
        position: { x: 0, y: 0 },
        icon: User,
        label: 'Mystery',
        explanation: 'Original explanation',
      };

      const explanation = ExplanationService.getNodeExplanation(unknownNode);

      expect(explanation.simple).toContain('important');
      expect(explanation.whatItDoes).toContain('helps');
      expect(explanation.moreInfo).toContain('job');
    });
  });

  describe('getEdgeExplanation', () => {
    it('provides child-friendly explanation for success edges', () => {
      const successEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'success',
        label: 'Success',
        color: '#10b981',
      };

      const explanation = ExplanationService.getEdgeExplanation(successEdge);

      expect(explanation.simple).toContain('things work correctly');
      expect(explanation.whatItDoes).toContain('shows');
      expect(explanation.analogy).toContain('green light');
    });

    it('provides child-friendly explanation for error edges', () => {
      const errorEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'error',
        label: 'Error',
        color: '#ef4444',
      };

      const explanation = ExplanationService.getEdgeExplanation(errorEdge);

      expect(explanation.simple).toContain('something goes wrong');
      expect(explanation.whatItDoes).toContain('shows');
      expect(explanation.analogy).toContain('red light');
    });

    it('provides child-friendly explanation for action edges', () => {
      const actionEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'action',
        label: 'action',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(actionEdge);

      expect(explanation.simple).toContain('action happening');
      expect(explanation.whatItDoes).toContain('connects');
      expect(explanation.analogy).toContain('arrow');
    });

    it('provides child-friendly explanation for data-flow edges', () => {
      const dataFlowEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'data-flow',
        label: 'Data',
        color: '#8b5cf6',
      };

      const explanation = ExplanationService.getEdgeExplanation(dataFlowEdge);

      expect(explanation.simple).toContain('information moving');
      expect(explanation.whatItDoes).toContain('shows');
      expect(explanation.analogy).toContain('water flowing');
    });

    it('customizes explanation based on edge label', () => {
      const clickEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'action',
        label: 'click button',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(clickEdge);

      expect(explanation.simple).toContain('click');
      expect(explanation.whatItDoes).toContain('connects');
    });

    it('customizes explanation for fetch/request labels', () => {
      const fetchEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'action',
        label: 'fetch data',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(fetchEdge);

      expect(explanation.simple).toContain('asking for information');
      expect(explanation.whatItDoes).toContain('asking');
    });

    it('customizes explanation for save/store labels', () => {
      const saveEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'action',
        label: 'save user',
        color: '#3b82f6',
      };

      const explanation = ExplanationService.getEdgeExplanation(saveEdge);

      expect(explanation.simple).toContain('saving information');
      expect(explanation.whatItDoes).toContain('storing');
    });

    it('provides generic explanation for unknown edge types', () => {
      const unknownEdge: VisualEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'unknown' as any,
        label: 'Unknown',
        color: '#6b7280',
      };

      const explanation = ExplanationService.getEdgeExplanation(unknownEdge);

      expect(explanation.simple).toContain('connects two parts');
      expect(explanation.whatItDoes).toContain('shows');
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

      expect(tooltipText).toContain('This is simple');
      expect(tooltipText).toContain('Like a thing');
    });

    it('excludes analogy when requested', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something',
        analogy: 'Like a thing',
      };

      const tooltipText = ExplanationService.getTooltipText(explanation, false);

      expect(tooltipText).toContain('This is simple');
      expect(tooltipText).not.toContain('Like a thing');
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
    it('combines whole whatItDoes, analogy, and moreInfo', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something',
        analogy: 'Like a thing',
        moreInfo: 'More details here',
      };

      const detailedText = ExplanationService.getDetailedExplanation(explanation);

      expect(detailedText).toContain('It does something');
      expect(detailedText).toContain('Think of it like this: Like a thing');
      expect(detailedText).toContain('More details here');
    });

    it('handles missing analogy in detailed explanation', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something',
        moreInfo: 'More details here',
      };

      const detailedText = ExplanationService.getDetailedExplanation(explanation);

      expect(detailedText).toContain('It does something');
      expect(detailedText).toContain('More details here');
      expect(detailedText).not.toContain('Think of it like this');
    });

    it('handles missing moreInfo in detailed explanation', () => {
      const explanation = {
        simple: 'This is simple',
        whatItDoes: 'It does something',
        analogy: 'Like a thing',
      };

      const detailedText = ExplanationService.getDetailedExplanation(explanation);

      expect(detailedText).toContain('It does something');
      expect(detailedText).toContain('Think of it like this: Like a thing');
    });
  });

  describe('Child-Friendly Language Requirements', () => {
    it('uses simple, non-technical language in all explanations', () => {
      const buttonNode: VisualNode = {
        id: 'button-1',
        type: 'button',
        position: { x: 0, y: 0 },
        icon: MousePointer,
        label: 'Test Button',
        explanation: 'Original explanation',
      };

      const explanation = ExplanationService.getNodeExplanation(buttonNode);

      // Should avoid technical terms
      expect(explanation.simple.toLowerCase()).not.toContain('component');
      expect(explanation.simple.toLowerCase()).not.toContain('function');
      expect(explanation.simple.toLowerCase()).not.toContain('method');
      expect(explanation.simple.toLowerCase()).not.toContain('api');
      expect(explanation.simple.toLowerCase()).not.toContain('dom');
      expect(explanation.simple.toLowerCase()).not.toContain('event');
    });

    it('focuses on "what" rather than "how" in explanations', () => {
      const nodes = [
        { type: 'button', label: 'Click Me' },
        { type: 'counter', label: 'Count' },
        { type: 'api', label: 'Data API' },
      ];

      nodes.forEach((nodeData) => {
        const node: VisualNode = {
          id: `${nodeData.type}-1`,
          type: nodeData.type as any,
          position: { x: 0, y: 0 },
          icon: MousePointer,
          label: nodeData.label,
          explanation: 'Original explanation',
        };

        const explanation = ExplanationService.getNodeExplanation(node);

        // Should focus on what it does, not how it works
        expect(explanation.whatItDoes.toLowerCase()).toMatch(/does|shows|helps|keeps|stores|gets|saves/);
        expect(explanation.whatItDoes.toLowerCase()).not.toContain('implements');
        expect(explanation.whatItDoes.toLowerCase()).not.toContain('executes');
        expect(explanation.whatItDoes.toLowerCase()).not.toContain('processes');
        expect(explanation.whatItDoes.toLowerCase()).not.toContain('computes');
      });
    });

    it('provides helpful analogies for complex concepts', () => {
      const complexNodes = [
        { type: 'api', expectedAnalogy: 'letter' },
        { type: 'database', expectedAnalogy: 'filing cabinet' },
        { type: 'function', expectedAnalogy: 'recipe' },
      ];

      complexNodes.forEach(({ type, expectedAnalogy }) => {
        const node: VisualNode = {
          id: `${type}-1`,
          type: type as any,
          position: { x: 0, y: 0 },
          icon: MousePointer,
          label: `Test ${type}`,
          explanation: 'Original explanation',
        };

        const explanation = ExplanationService.getNodeExplanation(node);

        expect(explanation.analogy?.toLowerCase()).toContain(expectedAnalogy);
      });
    });
  });
});