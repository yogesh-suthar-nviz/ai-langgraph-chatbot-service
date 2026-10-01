import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatStateAnnotation, ChatState } from '../core/types.js';
import { vectorStore } from '../../rag/vector-store.js';
import { can } from '../../auth/authorization/authorizer.js';
import { PERMISSIONS } from '../../auth/authorization/permissions.js';
import { logger } from '../../observability/logger.js';

export async function searchKnowledgeNode(state: ChatState): Promise<Partial<ChatState>> {
  const query = state.query || [...state.messages].reverse().find((m) => m.role === 'user')?.content || '';
  logger.info('Executing Knowledge Node: searchKnowledge', { query, userId: state.user.id });

  const hasInternalAccess = can(state.user, PERMISSIONS.INTERNAL_KNOWLEDGE);
  const scoredResults = await vectorStore.search(query, 3, hasInternalAccess);
  const docs = scoredResults.map((s) => s.doc);

  return {
    retrievedDocuments: docs,
  };
}

export async function generateKnowledgeResponseNode(state: ChatState): Promise<Partial<ChatState>> {
  const docs = state.retrievedDocuments || [];

  if (docs.length === 0) {
    return {
      response:
        'I could not find that in our product documentation. I can help with care and cleaning, ' +
        'warranty terms, returns and restocking, lead times, samples, fabrication guidance, fire ' +
        'ratings and certifications — or you can reach the support desk at ' +
        'support@example-surfaces.com.',
      metadata: {
        citations: [],
        component: 'citation_list',
      },
    };
  }

  // Lead with the best match in full, then list the rest as follow-up reading.
  const [primary, ...others] = docs;
  let responseText = `**${primary.title}**\n\n${primary.content}`;

  if (others.length > 0) {
    const related = others
      .map((d) => {
        const firstSentence = d.content.split('. ')[0];
        return `• **${d.title}** — ${firstSentence}.`;
      })
      .join('\n');
    responseText += `\n\n**Related documents**\n${related}`;
  }

  return {
    response: responseText,
    metadata: {
      citations: docs.map((d) => ({ id: d.id, title: d.title, category: d.category })),
      component: 'citation_list',
    },
  };
}

export function createKnowledgeGraph() {
  const workflow = new StateGraph(ChatStateAnnotation)
    .addNode('search_knowledge', searchKnowledgeNode)
    .addNode('generate_response', generateKnowledgeResponseNode)
    .addEdge(START, 'search_knowledge')
    .addEdge('search_knowledge', 'generate_response')
    .addEdge('generate_response', END);

  return workflow.compile();
}
