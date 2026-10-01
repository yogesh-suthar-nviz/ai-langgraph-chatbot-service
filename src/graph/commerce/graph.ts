import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatStateAnnotation } from '../core/types.js';
import { extractFiltersNode } from './nodes/extract-filters.js';
import { validateFiltersNode } from './nodes/validate-filters.js';
import { searchProductsNode } from './nodes/search-products.js';
import { evaluateResultsCondition, refineQueryNode } from './nodes/evaluate-results.js';
import { generateCommerceResponseNode } from './nodes/generate-response.js';

export function createCommerceGraph() {
  const workflow = new StateGraph(ChatStateAnnotation)
    .addNode('extract_filters', extractFiltersNode)
    .addNode('validate_filters', validateFiltersNode)
    .addNode('search_products', searchProductsNode)
    .addNode('refine_query', refineQueryNode)
    .addNode('commerce_response', generateCommerceResponseNode)
    // Edges
    .addEdge(START, 'extract_filters')
    .addEdge('extract_filters', 'validate_filters')
    .addEdge('validate_filters', 'search_products')
    .addConditionalEdges('search_products', evaluateResultsCondition, {
      refine_query: 'refine_query',
      commerce_response: 'commerce_response',
    })
    .addEdge('refine_query', 'search_products')
    .addEdge('commerce_response', END);

  return workflow.compile();
}
