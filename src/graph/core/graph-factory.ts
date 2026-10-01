import { ChatState } from './types.js';
import { createCommerceGraph } from '../commerce/graph.js';
import { createSupportGraph } from '../support/graph.js';
import { createKnowledgeGraph } from '../knowledge/graph.js';
import { logger } from '../../observability/logger.js';

export type SubgraphRunner = (state: ChatState) => Promise<Partial<ChatState>>;

export class SubgraphRegistry {
  private runners: Map<string, SubgraphRunner> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const commerceGraph = createCommerceGraph();
    const supportGraph = createSupportGraph();
    const knowledgeGraph = createKnowledgeGraph();

    this.register('commerce', async (state) => {
      logger.info('Routing execution into Commerce Subgraph');
      const result = await commerceGraph.invoke(state);
      return result;
    });

    this.register('support', async (state) => {
      logger.info('Routing execution into Support Subgraph');
      const result = await supportGraph.invoke(state);
      return result;
    });

    this.register('knowledge', async (state) => {
      logger.info('Routing execution into Knowledge Subgraph');
      const result = await knowledgeGraph.invoke(state);
      return result;
    });

    this.register('clarification', async (_state) => {
      logger.info('Routing execution into Clarification node');
      return {
        response:
          `I'm your surfaces assistant. I can help with:

` +
          `• **Finding a decor** — *"Show me white marble laminate under ₹4,000"* or *"What quartz do you have in charcoal?"*
` +
          `• **Care & specifications** — *"How do I clean quartz?"*, *"What is the minimum corner radius?"*, *"Is compact laminate fire rated?"*
` +
          `• **Policies** — *"What is your return policy?"*, *"What does the warranty cover?"*, *"How long are lead times?"*
` +
          `• **Your orders** — *"What is the status of ORD-1001?"* (sign in required)

` +
          `What would you like to look at?`,
      };
    });
  }

  register(routeName: string, runner: SubgraphRunner): void {
    this.runners.set(routeName, runner);
  }

  getRunner(routeName: string): SubgraphRunner {
    const runner = this.runners.get(routeName);
    if (!runner) {
      return this.runners.get('clarification')!;
    }
    return runner;
  }
}

export const subgraphRegistry = new SubgraphRegistry();
