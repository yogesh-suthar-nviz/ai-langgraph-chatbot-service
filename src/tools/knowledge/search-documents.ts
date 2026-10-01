import { z } from 'zod';
import { ApplicationTool, ToolContext, ToolResult } from '../core/tool.interface.js';
import { can } from '../../auth/authorization/authorizer.js';
import { PERMISSIONS } from '../../auth/authorization/permissions.js';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: 'policy' | 'faq' | 'spec' | 'internal_sop';
  isConfidential: boolean;
  /** Retrieval aids: synonyms and trade terms a customer might use instead of the title words. */
  keywords?: string[];
}

/**
 * MOCK knowledge base for local development and demos.
 *
 * Illustrative sample content modelled on decorative-surfaces documentation. Figures,
 * warranty terms and contact details are examples, not published commitments. Swap this
 * array for a real document source (CMS / DAM / SharePoint) without touching the graph.
 *
 * Documents flagged `isConfidential` are only retrievable by identities holding the
 * `internal.knowledge` permission — enforced in `vector-store.search()` and below.
 */
export const MOCK_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: 'doc-001',
    title: 'Laminate Care & Cleaning Guide',
    category: 'faq',
    isConfidential: false,
    keywords: ['clean', 'cleaning', 'care', 'maintain', 'maintenance', 'stain', 'scratch', 'laminate', 'hpl'],
    content:
      'For routine cleaning of high pressure laminate, use a damp cloth with warm water and mild detergent, then dry with a soft cloth. For stubborn marks use a non-abrasive household cleaner. Never use abrasive powders, steel wool, or cleaners containing hydrofluoric acid or strong alkali — these permanently dull the surface. Do not place hot pans directly on laminate; always use a trivet. Laminate is not a cutting surface; use a chopping board to avoid scoring the melamine wear layer.',
  },
  {
    id: 'doc-002',
    title: 'Quartz Care & Cleaning Guide',
    category: 'faq',
    isConfidential: false,
    keywords: ['quartz', 'clean', 'care', 'sealing', 'seal', 'stain', 'heat', 'engineered stone'],
    content:
      'Engineered quartz is non-porous and never requires sealing. Clean with warm water, mild soap and a soft cloth. Avoid bleach, oven cleaner, drain cleaner, paint remover and any high-pH or high-acid product. Quartz contains a polymer resin binder, so it is heat resistant but not heat proof — prolonged or direct contact with hot cookware can cause thermal shock or discolouration. Always use a trivet or hot pad. Avoid prolonged direct sunlight on quartz used outdoors or in conservatories, as some pigments may fade.',
  },
  {
    id: 'doc-003',
    title: 'Solid Surface Care, Renewal & Repair',
    category: 'faq',
    isConfidential: false,
    keywords: ['solid surface', 'repair', 'scratch', 'sand', 'renew', 'acrylic', 'seam'],
    content:
      'Solid surface is a homogeneous acrylic material: the colour runs through the full thickness, so most scratches and minor burns can be repaired in place. For matte finishes, clean with a soapy abrasive pad in a circular motion to restore uniformity. Deeper damage can be sanded out by a certified fabricator and the finish re-polished to the original sheen. Inconspicuous seams and integral coved sinks make solid surface the usual choice for healthcare, laboratory and food-preparation environments where a crevice-free surface is required.',
  },
  {
    id: 'doc-004',
    title: 'Product Warranty Summary',
    category: 'policy',
    isConfidential: false,
    keywords: ['warranty', 'guarantee', 'defect', 'claim', 'cover', 'covered'],
    content:
      'High pressure laminate carries a 1-year limited warranty against manufacturing defects. Engineered quartz carries a 10-year limited residential warranty (15 years on 30mm jumbo-format slabs). Solid surface carries a 10-year limited warranty. Warranties cover manufacturing defects in material only; they do not cover damage from improper installation, abuse, excessive heat, chemical damage, or normal wear. Warranty is valid only when the product was installed by a certified fabricator in accordance with published fabrication guidelines, and requires the original invoice.',
  },
  {
    id: 'doc-005',
    title: 'Returns, Cancellations & Restocking Policy',
    category: 'policy',
    isConfidential: false,
    keywords: ['return', 'refund', 'restocking', 'cancel', 'exchange', 'money back'],
    content:
      'Uncut full sheets and unopened edgebanding rolls in original condition may be returned within 30 days of delivery. A 25% restocking fee applies to all stock returns. Cut-to-size material, fabricated tops, thermoformed components and special-order decors are made to order and are non-returnable and non-cancellable once production has begun. Refunds are issued to the original payment method within 3 to 5 business days of warehouse receipt and inspection. Freight charges are non-refundable except where the return results from a supply error or a confirmed material defect.',
  },
  {
    id: 'doc-006',
    title: 'Damaged Shipment & Freight Claim Procedure',
    category: 'policy',
    isConfidential: false,
    keywords: ['damaged', 'damage', 'freight', 'shipping damage', 'claim', 'broken', 'cracked', 'delivery'],
    content:
      'Inspect all material before signing the delivery receipt. Any visible damage must be noted on the carrier paperwork at the time of delivery — an unqualified signature limits the ability to recover a freight claim. Concealed damage must be reported within 5 business days of delivery with photographs of the damage, the packaging and the batch label. Do not fabricate or install suspect material: installed material is deemed accepted. Replacement for a confirmed freight claim is normally despatched within 5 working days.',
  },
  {
    id: 'doc-007',
    title: 'Lead Times, Stock Availability & Freight',
    category: 'faq',
    isConfidential: false,
    keywords: ['lead time', 'delivery', 'how long', 'shipping', 'dispatch', 'stock', 'availability', 'eta'],
    content:
      'Stocked laminate decors and edgebanding despatch within 2 business days. Quartz and solid surface slabs despatch within 3 to 5 business days subject to slab availability at the regional distribution centre. Non-stock and special-order decors are produced to order with an indicative lead time of 4 to 6 weeks. Full sheet goods ship on a dedicated flatbed or rack vehicle; kerbside delivery is standard and offloading is the customer responsibility unless a tail-lift and porterage have been booked in advance.',
  },
  {
    id: 'doc-008',
    title: 'Ordering Samples, Chips & Full Sheets',
    category: 'faq',
    isConfidential: false,
    keywords: ['sample', 'samples', 'chip', 'swatch', 'try', 'see colour', 'specimen'],
    content:
      'Up to five A4 decor samples per project are supplied free of charge and typically arrive within 3 to 5 business days. Larger 12in x 12in specification samples are available to specifiers and designers on request. A full chip deck covering the complete decor range is available to trade accounts. Printed and on-screen representations are indicative only — always confirm a final decor selection against a physical sample under the lighting conditions of the installation, as decor batches can vary slightly.',
  },
  {
    id: 'doc-009',
    title: 'Fabrication & Installation Guidelines',
    category: 'spec',
    isConfidential: false,
    keywords: ['fabrication', 'install', 'installation', 'substrate', 'adhesive', 'postform', 'radius', 'cut'],
    content:
      'Condition sheets flat for a minimum of 48 hours at the installation temperature and humidity before bonding. Use an 18mm moisture-resistant MDF or particleboard substrate for horizontal work. Always apply a backing or balancing laminate to the reverse face to prevent bowing. Maintain a minimum internal corner radius of 3mm on all cut-outs — square internal corners are the single most common cause of stress cracking around sink and hob apertures. Post-forming requires a minimum bend radius of 10mm and controlled heating to 160-170 degrees Celsius.',
  },
  {
    id: 'doc-010',
    title: 'Fire Rating & Building Code Compliance',
    category: 'spec',
    isConfidential: false,
    keywords: ['fire', 'fire rating', 'class a', 'astm', 'code', 'compliance', 'flame spread', 'smoke'],
    content:
      'Compact laminate panels and solid surface sheets are tested to ASTM E84 and achieve a Class A surface burning characteristic rating (flame spread index 25 or less, smoke developed index 450 or less) when installed over a non-combustible substrate. Standard 0.8mm high pressure laminate is tested as a composite with its substrate; the rating is a property of the assembly, not the laminate alone. Request the specific test certificate for the exact build-up before specifying in an egress corridor or other rated assembly.',
  },
  {
    id: 'doc-011',
    title: 'Sustainability: GREENGUARD Gold & LEED Contribution',
    category: 'spec',
    isConfidential: false,
    keywords: ['sustainability', 'green', 'greenguard', 'leed', 'environment', 'voc', 'recycled', 'eco'],
    content:
      'All laminate, quartz and solid surface decors are GREENGUARD Gold certified for low chemical emissions, making them suitable for schools and healthcare settings. Products can contribute toward LEED v4 credits under Low-Emitting Materials and, where regional sourcing applies, Building Product Disclosure and Optimization. Laminate papers are sourced from FSC Mix certified supply chains. Environmental Product Declarations and Health Product Declarations are available on request for project submittals.',
  },
  {
    id: 'doc-012',
    title: 'Edgebanding Compatibility & Decor Matching',
    category: 'spec',
    isConfidential: false,
    keywords: ['edgeband', 'edging', 'edge', 'matching', 'pvc', 'abs', 'trim'],
    content:
      'Every stocked laminate decor has a colour-matched 1mm edgebanding in either PVC or halogen-free ABS. Woodgrain decors use a grain-matched ABS band with the same emboss as the face so the edge reads continuous. Standard roll format is 22mm x 50m, compatible with hot-melt EVA and PUR automatic edgebanders. Apply at a glue pot temperature of 180-200 degrees Celsius. Note that decor batch and edgeband batch are produced on separate lines: order face and edge material together to minimise shade variation.',
  },
  {
    id: 'doc-013',
    title: 'Thickness, Sheet Size & Format Reference',
    category: 'spec',
    isConfidential: false,
    keywords: ['thickness', 'size', 'dimension', 'sheet size', 'slab size', 'format', 'mm', 'jumbo'],
    content:
      'High pressure laminate is supplied in 0.8mm general purpose and 1.0mm heavy duty grades, in 8ft x 4ft, 10ft x 4ft and 12ft x 5ft sheets. Compact laminate is self-supporting and supplied in 12mm in 8ft x 4ft. Solid surface is supplied in 12mm, 12ft x 30in. Engineered quartz is supplied in 20mm standard slabs at 120in x 55in and 30mm jumbo slabs at 126in x 63in. Jumbo format reduces seam count on long runs and islands but requires appropriate lifting equipment and access survey.',
  },
  {
    id: 'doc-014',
    title: 'Customer Support Contact Channels & Hours',
    category: 'faq',
    isConfidential: false,
    keywords: ['contact', 'support', 'phone', 'email', 'help', 'reach', 'customer service', 'hours', 'talk to'],
    content:
      'Reach the customer support desk by email at support@example-surfaces.com or on the toll-free line at +91 (800) 456-7890. Phone support operates Monday to Saturday, 9:00 AM to 8:00 PM IST. Live chat assistance is available 24/7 through this assistant. For technical fabrication queries ask for the Technical Services team; for order, delivery and freight claim queries ask for Customer Care. Please have your order number (format ORD-XXXX) ready.',
  },
  {
    id: 'doc-015',
    title: 'Internal SOP: High-Value Credit & Refund Approval',
    category: 'internal_sop',
    isConfidential: true,
    keywords: ['sop', 'approval', 'credit', 'refund authority', 'threshold', 'supervisor'],
    content:
      'Refunds and credits exceeding Rs 5,000 require explicit supervisor sign-off before submission. The agent must document the order condition, attach courier proof-of-delivery, record the batch and decor number, and obtain approval from a Support Lead. Credits above Rs 50,000 additionally require Regional Manager authorisation and a written root-cause note. Never confirm a refund to a customer before the approval is recorded in the system — confirm only that the request has been raised for review.',
  },
  {
    id: 'doc-016',
    title: 'Internal SOP: Fabricator Warranty Claim Triage',
    category: 'internal_sop',
    isConfidential: true,
    keywords: ['sop', 'warranty claim', 'triage', 'fabricator', 'defect', 'investigation'],
    content:
      'On receiving a warranty claim, first establish whether the failure is a material defect or an installation fault, as the latter is not covered. Request photographs of the full installation, the failure location and the batch label. Stress cracking radiating from a sink or hob cut-out corner almost always indicates an insufficient corner radius or a missing balancing laminate, both installation faults. Confirm the fabricator certification status before authorising any replacement material. Escalate suspected batch-wide defects to Quality immediately and place a hold on remaining stock of that batch.',
  },
];

export const SearchDocumentsInputSchema = z.object({
  query: z.string().describe('Search query for product documentation, specifications, policies or FAQs'),
});

export type SearchDocumentsInput = z.infer<typeof SearchDocumentsInputSchema>;

export class SearchDocumentsTool implements ApplicationTool<SearchDocumentsInput, KnowledgeDocument[]> {
  name = 'searchDocuments';
  description =
    'Search product care guides, fabrication specifications, warranty terms, return policies and FAQs.';
  inputSchema = SearchDocumentsInputSchema;

  async execute(input: SearchDocumentsInput, context: ToolContext): Promise<ToolResult<KnowledgeDocument[]>> {
    const q = input.query.toLowerCase().trim();
    const hasInternalAccess = can(context.user, PERMISSIONS.INTERNAL_KNOWLEDGE);

    // Guests and external customers never see confidential internal SOPs.
    const accessibleDocs = MOCK_KNOWLEDGE_DOCS.filter((doc) => !doc.isConfidential || hasInternalAccess);

    const terms = q.split(/\s+/).filter(Boolean);
    const matches = accessibleDocs.filter((doc) => {
      const haystack = `${doc.title} ${doc.content} ${(doc.keywords || []).join(' ')}`.toLowerCase();
      return haystack.includes(q) || terms.some((t) => t.length > 2 && haystack.includes(t));
    });

    return {
      success: true,
      data: matches,
    };
  }
}

export const searchDocumentsTool = new SearchDocumentsTool();
