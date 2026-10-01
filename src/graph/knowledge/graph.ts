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
      response: 'I could not find an answer in our store documentation. Please contact support or ask another question.',
    };
  }

  const citations = docs.map((d) => `• **${d.title}**: ${d.content}`).join('\n\n');
  const responseText = `Here is what I found in our policies and documentation:\n\n${citations}`;

  return {
    response: responseText,
    metadata: {
      citations: docs.map((d) => ({ id: d.id, title: d.title })),
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
