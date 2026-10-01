import { z } from 'zod';
import { ApplicationTool, ToolContext, ToolResult } from '../core/tool.interface.js';
import { can } from '../../auth/authorization/authorizer.js';
import { PERMISSIONS } from '../../auth/authorization/permissions.js';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: 'policy' | 'faq' | 'internal_sop';
  isConfidential: boolean;
}

export const MOCK_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: 'doc-001',
    title: '30-Day Happiness Guarantee Return Policy',
    category: 'policy',
    isConfidential: false,
    content: 'Customers may initiate a return or exchange on any unworn, clean item within 30 days of delivery. Original packaging, tags, and receipt must be intact. Refunds are credited back to the original payment method within 3 to 5 business days upon warehouse receipt.',
  },
  {
    id: 'doc-002',
    title: 'Standard & Express Shipping Timelines',
    category: 'faq',
    isConfidential: false,
    content: 'Orders are processed within 24 hours Monday through Friday. Standard ground shipping takes 3-5 business days across metros and 5-7 days for tier 2/3 locations. Express priority courier delivery arrives within 24-48 hours.',
  },
  {
    id: 'doc-003',
    title: 'Internal SOP: High-Value Refund Approval Guidelines',
    category: 'internal_sop',
    isConfidential: true,
    content: 'Refunds exceeding ₹5,000 / $100 require explicit supervisor sign-off before submission. When initiating a high-value refund, agents must document the order condition, inspect courier tracking confirmation, and obtain approval from a Support Lead.',
  },
  {
    id: 'doc-004',
    title: 'Shoe Sizing and Arch Fit Recommendations',
    category: 'faq',
    isConfidential: false,
    content: 'Our carbon-plated marathon runners (e.g. Velocity Nitro) feature an athletic snug fit; runners with wide feet should order a half-size up. Everyday trainers (AeroGlide) fit true to standard athletic shoe sizes.',
  },
  {
    id: 'doc-005',
    title: 'Customer Support Contact Channels & Business Hours',
    category: 'faq',
    isConfidential: false,
    content: 'You can reach our dedicated support desk via Email at support@company.com or toll-free at +91 (800) 456-7890. Support lines are open Monday through Saturday from 9:00 AM to 8:00 PM IST. Live chat assistance is available 24/7.',
  },
  {
    id: 'doc-006',
    title: 'About Our Brand & Manufacturing Quality Guarantee',
    category: 'faq',
    isConfidential: false,
    content: 'Founded in 2021, our products are engineered with eco-friendly recycled polymers and aerospace-grade nitrogen-infused foam. All footwear and technical apparel undergo strict ISO-9001 mechanical endurance testing and come with a 6-month manufacturer warranty against material defects.',
  },
  {
    id: 'doc-007',
    title: 'Pricing & Transparent Currency Policy',
    category: 'policy',
    isConfidential: false,
    content: 'All listed prices include standard GST and local taxes. We accept UPI, Net Banking, Credit/Debit cards (Visa, Mastercard, RuPay), and Cash on Delivery (COD) for domestic orders under ₹10,000.',
  },
];

export const SearchDocumentsInputSchema = z.object({
  query: z.string().describe('Search query for knowledge documents or FAQs'),
});

export type SearchDocumentsInput = z.infer<typeof SearchDocumentsInputSchema>;

export class SearchDocumentsTool implements ApplicationTool<SearchDocumentsInput, KnowledgeDocument[]> {
  name = 'searchDocuments';
  description = 'Search company return policies, shipping FAQs, and internal support procedures.';
  inputSchema = SearchDocumentsInputSchema;

  async execute(input: SearchDocumentsInput, context: ToolContext): Promise<ToolResult<KnowledgeDocument[]>> {
    const q = input.query.toLowerCase();
    const hasInternalAccess = can(context.user, PERMISSIONS.INTERNAL_KNOWLEDGE);

    // Filter documents based on permissions: guests and external users cannot see confidential internal SOPs
    const accessibleDocs = MOCK_KNOWLEDGE_DOCS.filter((doc) => !doc.isConfidential || hasInternalAccess);

    const matches = accessibleDocs.filter((doc) =>
      doc.title.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q)
    );

    return {
      success: true,
      data: matches,
    };
  }
}

export const searchDocumentsTool = new SearchDocumentsTool();
