export const GRAPH_CONSTANTS = {
  MAX_SEARCH_ATTEMPTS: 3,
  DEFAULT_MAX_ITERATIONS: 10,
  REFUND_APPROVAL_THRESHOLD_INR: 5000,
  ROUTES: {
    COMMERCE: 'commerce',
    SUPPORT: 'support',
    KNOWLEDGE: 'knowledge',
    CLARIFICATION: 'clarification',
  },
  NODES: {
    // Main Graph
    LOAD_CONTEXT: 'load_context',
    VALIDATE_REQUEST: 'validate_request',
    UNDERSTAND_INTENT: 'understand_intent',
    ROUTE_DISPATCH: 'route_dispatch',
    RESPONSE_GENERATION: 'response_generation',
    OUTPUT_VALIDATION: 'output_validation',

    // Commerce Subgraph
    EXTRACT_FILTERS: 'extract_filters',
    VALIDATE_FILTERS: 'validate_filters',
    SEARCH_PRODUCTS: 'search_products',
    EVALUATE_RESULTS: 'evaluate_results',
    REFINE_QUERY: 'refine_query',
    COMMERCE_RESPONSE: 'commerce_response',

    // Support Subgraph
    SUPPORT_UNDERSTAND: 'support_understand',
    SUPPORT_AUTHENTICATE: 'support_authenticate',
    SUPPORT_AUTHORIZE: 'support_authorize',
    RETRIEVE_ORDER: 'retrieve_order',
    CHECK_RULES: 'check_rules',
    HUMAN_APPROVAL: 'human_approval',
    EXECUTE_ACTION: 'execute_action',
    SUPPORT_RESPONSE: 'support_response',

    // Knowledge Subgraph
    KNOWLEDGE_SEARCH: 'knowledge_search',
    KNOWLEDGE_RESPONSE: 'knowledge_response',
  },
} as const;

export class GraphExecutionError extends Error {
  constructor(
    public readonly node: string,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(`Graph execution failed at node '${node}': ${message}`);
    this.name = 'GraphExecutionError';
  }
}
