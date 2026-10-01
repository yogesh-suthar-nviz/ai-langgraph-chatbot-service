import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatStateAnnotation } from '../core/types.js';
import { understandSupportRequestNode } from './nodes/understand-request.js';
import { authenticateSupportNode, authorizeSupportNode } from './nodes/authenticate.js';
import { retrieveOrderNode } from './nodes/retrieve-order.js';
import { checkBusinessRulesNode } from './nodes/check-rules.js';
import { humanApprovalNode } from './nodes/human-approval.js';
import { executeSupportActionNode, generateSupportResponseNode } from './nodes/execute-action.js';

export function createSupportGraph() {
  const workflow = new StateGraph(ChatStateAnnotation)
    .addNode('understand_request', understandSupportRequestNode)
    .addNode('authenticate', authenticateSupportNode)
    .addNode('authorize', authorizeSupportNode)
    .addNode('retrieve_order', retrieveOrderNode)
    .addNode('check_rules', checkBusinessRulesNode)
    .addNode('human_approval', humanApprovalNode)
    .addNode('execute_action', executeSupportActionNode)
    .addNode('generate_response', generateSupportResponseNode)
    // Pipeline sequence
    .addEdge(START, 'understand_request')
    .addEdge('understand_request', 'authenticate')
    .addEdge('authenticate', 'authorize')
    .addEdge('authorize', 'retrieve_order')
    .addEdge('retrieve_order', 'check_rules')
    .addEdge('check_rules', 'human_approval')
    .addEdge('human_approval', 'execute_action')
    .addEdge('execute_action', 'generate_response')
    .addEdge('generate_response', END);

  return workflow.compile();
}
