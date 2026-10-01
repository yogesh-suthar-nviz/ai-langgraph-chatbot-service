import { z } from 'zod';

export const ChatRequestSchema = z.object({
  conversationId: z.string().optional().describe('Unique conversation identifier. If omitted, a new conversation is created.'),
  message: z.string().min(1).describe('The user inquiry message'),
  stream: z.boolean().optional().default(true).describe('Whether to stream the graph events and response'),
  guestSessionId: z.string().optional().describe('Anonymous session ID for guest visitors'),
  action: z.enum(['message', 'approve_refund', 'reject_refund']).optional().default('message').describe('Action type, used for Human-in-the-loop resumption'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const FeedbackRequestSchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().optional(),
  rating: z.string(),
  comment: z.string().optional(),
  userType: z.enum(['guest', 'external', 'internal']).optional(),

  // Guest Specific Fields
  foundWhatLookingFor: z.boolean().optional(),
  browsingCategory: z.string().optional(),
  contactEmail: z.string().optional(),

  // External Customer Specific Fields
  resolutionStatus: z.enum(['resolved', 'partially_resolved', 'unresolved']).optional(),
  orderId: z.string().optional(),
  supportExperienceScore: z.number().min(1).max(5).optional(),

  // Internal Specialist Specific Fields
  accuracyScore: z.number().min(1).max(5).optional(),
  routingCorrect: z.boolean().optional(),
  policyCompliant: z.boolean().optional(),
  reportedIssueType: z.enum(['hallucination', 'tool_failure', 'unauthorized_attempt', 'workflow_logic', 'none']).optional(),
  internalNotes: z.string().optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
