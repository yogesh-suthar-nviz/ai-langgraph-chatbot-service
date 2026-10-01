import { Annotation } from '@langchain/langgraph';
import { UserIdentity } from '../../auth/identity/identity.types.js';
import { Product } from '../../integrations/commerce/interface.js';
import { Order } from '../../integrations/orders/interface.js';
import { KnowledgeDocument } from '../../tools/knowledge/search-documents.js';

export type Intent =
  | 'general_question'
  | 'product_search'
  | 'product_details'
  | 'order_status'
  | 'return_request'
  | 'refund_request'
  | 'account_help'
  | 'knowledge_search'
  | 'unknown';

export interface GraphMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface GraphToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface GraphToolResult {
  callId: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface HumanApprovalDetails {
  approvalType: 'refund' | 'order_cancel' | 'custom';
  entityId: string;
  amount?: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  comments?: string;
}

/**
 * State interface representing the workflow state across LangGraph executions.
 */
export interface ChatState {
  conversationId: string;
  user: UserIdentity;
  messages: GraphMessage[];
  intent?: Intent;
  route?: string;
  query?: string;
  extractedFilters?: {
    query?: string;
    category?: string;
    color?: string;
    maxPrice?: number;
    minPrice?: number;
  };
  searchAttempts: number;
  matchedProducts?: Product[];
  currentOrder?: Order | null;
  retrievedDocuments?: KnowledgeDocument[];
  requiresHumanApproval: boolean;
  humanApprovalDetails?: HumanApprovalDetails;
  response?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

/**
 * LangGraph State Annotation
 */
export const ChatStateAnnotation = Annotation.Root({
  conversationId: Annotation<string>({
    reducer: (_x, y) => y,
    default: () => '',
  }),
  user: Annotation<UserIdentity>({
    reducer: (_x, y) => y,
  }),
  messages: Annotation<GraphMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  intent: Annotation<Intent | undefined>({
    reducer: (_x, y) => y,
  }),
  route: Annotation<string | undefined>({
    reducer: (_x, y) => y,
  }),
  query: Annotation<string | undefined>({
    reducer: (_x, y) => y,
  }),
  extractedFilters: Annotation<ChatState['extractedFilters']>({
    reducer: (_x, y) => y,
  }),
  searchAttempts: Annotation<number>({
    reducer: (_x, y) => y,
    default: () => 0,
  }),
  matchedProducts: Annotation<Product[] | undefined>({
    reducer: (_x, y) => y,
  }),
  currentOrder: Annotation<Order | null | undefined>({
    reducer: (_x, y) => y,
  }),
  retrievedDocuments: Annotation<KnowledgeDocument[] | undefined>({
    reducer: (_x, y) => y,
  }),
  requiresHumanApproval: Annotation<boolean>({
    reducer: (_x, y) => y,
    default: () => false,
  }),
  humanApprovalDetails: Annotation<HumanApprovalDetails | undefined>({
    reducer: (_x, y) => y,
  }),
  response: Annotation<string | undefined>({
    reducer: (_x, y) => y,
  }),
  error: Annotation<string | undefined>({
    reducer: (_x, y) => y,
  }),
  metadata: Annotation<Record<string, unknown>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
});
