import type { VisualNode, VisualEdge } from '../types/visualization';

/**
 * Explanation data for visual elements
 */
export interface ElementExplanation {
  /** Simple, child-friendly explanation */
  simple: string;
  /** What this element does (focus on "what" not "how") */
  whatItDoes: string;
  /** Fun analogy to help understand the concept */
  analogy?: string;
  /** Additional context for more curious users */
  moreInfo?: string;
}

/**
 * Service for generating child-friendly explanations for visual elements
 * Focuses on "what" rather than "how" with simple, non-technical language
 */
export class ExplanationService {
  /**
   * Get explanation for a visual node
   */
  static getNodeExplanation(node: VisualNode): ElementExplanation {
    const baseExplanations: Record<string, ElementExplanation> = {
      button: {
        simple: "This is a button you can click!",
        whatItDoes: "It helps you interact with the app when you click it",
        analogy: "Like a doorbell - press it and it does something!",
        moreInfo: "Buttons are how users interact with apps and websites"
      },
      counter: {
        simple: "This keeps track of a number that goes up or down",
        whatItDoes: "It shows a number and can change when you click buttons",
        analogy: "Like a score counter in a game - it keeps track of points!",
        moreInfo: "Counters help apps remember numbers and show them to users"
      },
      api: {
        simple: "This talks to other computers to get information",
        whatItDoes: "It asks other computers for data and gets it back",
        analogy: "Like sending a letter and getting a reply back!",
        moreInfo: "APIs help apps get information from the internet"
      },
      database: {
        simple: "This is where information is stored and kept safe",
        whatItDoes: "It saves data so the app can remember things later",
        analogy: "Like a filing cabinet that keeps all your important papers!",
        moreInfo: "Databases store information that apps need to remember"
      },
      user: {
        simple: "This represents you - the person using the app!",
        whatItDoes: "It shows where you interact with the app",
        analogy: "Like your character in a video game!",
        moreInfo: "User icons show where people interact with the system"
      },
      component: {
        simple: "This is a piece of the app that does one job",
        whatItDoes: "It handles one specific task in the app",
        analogy: "Like a LEGO block - small pieces that build something bigger!",
        moreInfo: "Components are reusable pieces that make up apps"
      },
      error: {
        simple: "This shows when something goes wrong",
        whatItDoes: "It appears when there's a problem that needs fixing",
        analogy: "Like a warning light on a car dashboard!",
        moreInfo: "Error handling helps apps deal with problems gracefully"
      },
      function: {
        simple: "This is a set of instructions that does a specific job",
        whatItDoes: "It takes some information and does something with it",
        analogy: "Like a recipe - follow the steps to make something!",
        moreInfo: "Functions are reusable pieces of code that perform tasks"
      },
      variable: {
        simple: "This is a box that holds information",
        whatItDoes: "It stores data that the app can use and change",
        analogy: "Like a labeled jar that holds different things!",
        moreInfo: "Variables store data that programs can use and modify"
      }
    };

    // Get base explanation or create a generic one
    const baseExplanation = baseExplanations[node.type] || {
      simple: "This is part of the app that does something important",
      whatItDoes: "It helps the app work properly",
      moreInfo: "Every part of an app has a specific job to do"
    };

    // Customize explanation based on node label and metadata
    return this.customizeExplanation(baseExplanation, node);
  }

  /**
   * Get explanation for a visual edge
   */
  static getEdgeExplanation(edge: VisualEdge): ElementExplanation {
    const baseExplanations: Record<string, ElementExplanation> = {
      success: {
        simple: "This shows when things work correctly!",
        whatItDoes: "It shows the path when everything goes as planned",
        analogy: "Like a green light that means 'go ahead!'",
        moreInfo: "Success paths show the happy flow through the app"
      },
      error: {
        simple: "This shows what happens when something goes wrong",
        whatItDoes: "It shows the path when there's a problem",
        analogy: "Like a red light that means 'stop and fix this!'",
        moreInfo: "Error paths help handle problems gracefully"
      },
      action: {
        simple: "This shows an action happening",
        whatItDoes: "It connects things that cause other things to happen",
        analogy: "Like an arrow showing which way to go!",
        moreInfo: "Action arrows show cause and effect in the app"
      },
      'data-flow': {
        simple: "This shows information moving from one place to another",
        whatItDoes: "It shows how data travels through the app",
        analogy: "Like water flowing through pipes!",
        moreInfo: "Data flow shows how information moves through the system"
      }
    };

    // Get base explanation or create a generic one
    const baseExplanation = baseExplanations[edge.type] || {
      simple: "This connects two parts of the app",
      whatItDoes: "It shows how different parts work together",
      moreInfo: "Connections show relationships between app components"
    };

    // Customize explanation based on edge label
    return this.customizeEdgeExplanation(baseExplanation, edge);
  }

  /**
   * Customize node explanation based on specific node properties
   */
  private static customizeExplanation(
    baseExplanation: ElementExplanation,
    node: VisualNode
  ): ElementExplanation {
    const customized = { ...baseExplanation };

    // Customize based on node label
    if (node.label) {
      switch (node.type) {
        case 'button':
          customized.simple = `This is the "${node.label}" button you can click!`;
          break;
        case 'counter':
          customized.simple = `This counter shows the ${node.label} number`;
          break;
        case 'api':
          customized.simple = `This talks to other computers to get ${node.label} information`;
          break;
        case 'database':
          customized.simple = `This is where ${node.label} information is stored and kept safe`;
          break;
        case 'function':
          customized.simple = `This is a set of instructions called "${node.label}" that does a specific job`;
          break;
        case 'variable':
          customized.simple = `This is a box called "${node.label}" that holds information`;
          break;
      }
    }

    // Add pattern-specific context (enhance existing moreInfo)
    if (node.metadata?.patternType) {
      const patternInfo = (() => {
        switch (node.metadata.patternType) {
          case 'counter':
            return "This is part of a counter pattern that tracks numbers";
          case 'api-call':
            return "This is part of getting data from the internet";
          case 'database':
            return "This is part of saving and loading information";
          default:
            return null;
        }
      })();
      
      if (patternInfo) {
        customized.moreInfo = customized.moreInfo 
          ? `${customized.moreInfo}. ${patternInfo}`
          : patternInfo;
      }
    }

    return customized;
  }

  /**
   * Customize edge explanation based on specific edge properties
   */
  private static customizeEdgeExplanation(
    baseExplanation: ElementExplanation,
    edge: VisualEdge
  ): ElementExplanation {
    const customized = { ...baseExplanation };

    // Customize based on edge label
    if (edge.label) {
      const label = edge.label.toLowerCase();
      
      if (label.includes('click')) {
        customized.simple = "This shows what happens when you click";
        customized.whatItDoes = "It connects a button to what happens when you click it";
      } else if (label.includes('fetch') || label.includes('request')) {
        customized.simple = "This shows asking for information";
        customized.whatItDoes = "It shows the app asking for data from somewhere else";
      } else if (label.includes('save') || label.includes('store')) {
        customized.simple = "This shows saving information";
        customized.whatItDoes = "It shows the app storing data to remember later";
      } else if (label.includes('load') || label.includes('get')) {
        customized.simple = "This shows getting information";
        customized.whatItDoes = "It shows the app loading data it needs";
      }
      // For other labels, keep the base explanation from the edge type
    }

    return customized;
  }

  /**
   * Get a formatted tooltip text for an element
   */
  static getTooltipText(explanation: ElementExplanation, includeAnalogy: boolean = true): string {
    let text = explanation.simple;
    
    if (includeAnalogy && explanation.analogy) {
      text += `\n\n${explanation.analogy}`;
    }
    
    return text;
  }

  /**
   * Get a detailed explanation for modal or expanded view
   */
  static getDetailedExplanation(explanation: ElementExplanation): string {
    let text = explanation.whatItDoes;
    
    if (explanation.analogy) {
      text += `\n\nThink of it like this: ${explanation.analogy}`;
    }
    
    if (explanation.moreInfo) {
      text += `\n\n${explanation.moreInfo}`;
    }
    
    return text;
  }
}

export default ExplanationService;