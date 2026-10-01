import { z } from 'zod';

export const ChatRequestSchema = z.object({
  conversationId: z.string().optional().describe('Unique conversation identifier. If omitted, a new conversation is created.'),
  message: z.string().min(1).describe('The user inquiry message'),
  stream: z.boolean().optional().default(true).describe('Whether to stream the graph events and response'),
  guestSessionId: z.string().optional().describe('Anonymous session ID for guest visitors'),
  action: z.enum(['message', 'approve_refund', 'reject_refund']).optional().default('message').describe('Action type, used for Human-in-the-loop resumption'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Unified feedback payload. A single form is presented to every identity; `userType`
 * is recorded for segmentation rather than used to branch the form.
 */
export const FeedbackRequestSchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().optional(),
  /** Coarse rating derived client-side from `csat`. */
  rating: z.enum(['thumbs_up', 'thumbs_down']),
  /** 1-5 satisfaction score. */
  csat: z.number().min(1).max(5),
  /** What the user was asking about. */
  topic: z.string().optional(),
  /** Selected reason chips; the option set depends on the score. */
  reasons: z.array(z.string()).optional(),
  comment: z.string().optional(),
  allowContact: z.boolean().optional(),
  contactEmail: z.string().optional(),
  userType: z.enum(['guest', 'external', 'internal']).optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
