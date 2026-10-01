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

    this.register('clarification', async (state) => {
      logger.info('Routing execution into Clarification node');
      const lastUserMsg = [...state.messages].reverse().find((m) => m.role === 'user')?.content || '';
      return {
        response: `Hello! I'm your AI Shopping and Support Assistant. I can help you search our catalog (e.g. *"Show me black running shoes under ₹10,000"*), check your order status (e.g. *"What is the status of ORD-1001?"*), process returns, or answer policy questions. How can I assist you today?`,
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
