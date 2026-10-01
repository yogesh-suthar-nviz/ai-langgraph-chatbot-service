import { FastifyRequest, FastifyReply } from 'fastify';
import { conversationRepo } from '../../database/conversation-repository.js';
import { authService } from '../../auth/authentication/authenticator.js';
import { FeedbackRequest } from '../schemas/chat.schema.js';

export async function listConversationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = await authService.resolveIdentity(req.headers.authorization);
  const list = await conversationRepo.listConversations(user.id);
  reply.send({ conversations: list });
}

export async function createConversationHandler(req: FastifyRequest<{ Body: { title?: string } }>, reply: FastifyReply) {
  const user = await authService.resolveIdentity(req.headers.authorization);
  const conv = await conversationRepo.createConversation(user.id, user.tenantId, req.body?.title);
  reply.status(201).send(conv);
}

export async function getConversationHandler(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const user = await authService.resolveIdentity(req.headers.authorization);
  const conv = await conversationRepo.getConversation(req.params.id, user.id);
  if (!conv) {
    reply.status(404).send({ error: 'Conversation not found' });
    return;
  }
  const messages = await conversationRepo.getMessages(req.params.id);
  reply.send({
    ...conv,
    messages,
  });
}

export async function deleteConversationHandler(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const user = await authService.resolveIdentity(req.headers.authorization);
  const success = await conversationRepo.deleteConversation(req.params.id, user.id);
  if (!success) {
    reply.status(404).send({ error: 'Conversation not found or not owned by user' });
    return;
  }
  reply.send({ success: true, message: 'Conversation deleted successfully' });
}

export async function feedbackHandler(req: FastifyRequest<{ Body: FeedbackRequest }>, reply: FastifyReply) {
  const user = await authService.resolveIdentity(req.headers.authorization);
  const body = req.body;

  // Extract role-specific fields into details object
  const details: Record<string, unknown> = {
    // Guest fields
    foundWhatLookingFor: body.foundWhatLookingFor,
    browsingCategory: body.browsingCategory,
    contactEmail: body.contactEmail,

    // External Customer fields
    resolutionStatus: body.resolutionStatus,
    orderId: body.orderId,
    supportExperienceScore: body.supportExperienceScore,

    // Internal Specialist fields
    accuracyScore: body.accuracyScore,
    routingCorrect: body.routingCorrect,
    policyCompliant: body.policyCompliant,
    reportedIssueType: body.reportedIssueType,
    internalNotes: body.internalNotes,
  };

  const feedback = await conversationRepo.recordFeedback(
    body.conversationId,
    user.id,
    body.rating,
    body.messageId,
    body.comment,
    user.type,
    details
  );
  reply.status(201).send(feedback);
}
