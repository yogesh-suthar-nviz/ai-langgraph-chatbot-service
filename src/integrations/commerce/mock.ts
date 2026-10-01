import { CommerceService, Product, ProductSearchParams } from './interface.js';

/**
 * MOCK surfacing catalogue for local development and demos.
 *
 * Decor names, SKUs, prices and availability are illustrative sample data modelled on a
 * decorative-surfaces product line. They are not a live price list and must not be quoted
 * to customers. Replace this module with a real catalogue integration (PIM / ERP) by
 * implementing `CommerceService` — nothing else in the graph layer needs to change.
 *
 * Prices are per unit (sheet / slab / roll) in INR.
 */
export const MOCK_PRODUCTS: Product[] = [
  // ----------------------------- High Pressure Laminate -----------------------------
  {
    id: 'prod-001',
    sku: 'HPL-1573-60',
    name: 'Carrara Bianco High Pressure Laminate',
    category: 'laminate',
    price: 3250,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.8,
    inStock: true,
    colors: ['white', 'grey'],
    sizes: ['8ft x 4ft', '10ft x 4ft'],
    finish: 'Fine Velvet Texture',
    thicknessMm: 0.8,
    applications: ['countertop', 'vertical', 'cabinet'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51'],
    warrantyYears: 1,
    tags: ['laminate', 'marble', 'stone-look', 'white', 'kitchen'],
    description:
      'Soft white marble visual with fine grey veining. A low-sheen velvet texture hides fingerprints, making it a durable choice for kitchen worktops and vertical cladding.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
  },
  {
    id: 'prod-002',
    sku: 'HPL-4942-38',
    name: 'Calcutta Vicenza High Pressure Laminate',
    category: 'laminate',
    price: 3890,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.7,
    inStock: true,
    colors: ['white', 'beige'],
    sizes: ['8ft x 4ft', '12ft x 5ft'],
    finish: 'High Gloss',
    thicknessMm: 1.0,
    applications: ['countertop', 'vertical'],
    certifications: ['GREENGUARD Gold'],
    warrantyYears: 1,
    tags: ['laminate', 'marble', 'gloss', 'white', 'premium'],
    description:
      'Dramatic warm-toned marble with bold golden veining in a mirror-gloss finish. Specified where a high-end stone look is wanted without slab weight or cost.',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
  },
  {
    id: 'prod-003',
    sku: 'HPL-7960-12',
    name: 'Nordic Oak Woodgrain Laminate',
    category: 'laminate',
    price: 2740,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.6,
    inStock: true,
    colors: ['oak', 'beige', 'natural'],
    sizes: ['8ft x 4ft'],
    finish: 'Soft Grain',
    thicknessMm: 0.8,
    applications: ['vertical', 'cabinet', 'furniture'],
    certifications: ['GREENGUARD Gold', 'FSC Mix'],
    warrantyYears: 1,
    tags: ['laminate', 'woodgrain', 'oak', 'cabinet', 'natural'],
    description:
      'Pale Scandinavian oak with a synchronised soft-grain emboss that registers to the printed grain, giving a convincing timber feel for cabinetry and wall panels.',
    imageUrl: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=600&q=80',
  },
  {
    id: 'prod-004',
    sku: 'HPL-1595-07',
    name: 'Designer White Laminate',
    category: 'laminate',
    price: 1850,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.5,
    inStock: true,
    colors: ['white'],
    sizes: ['8ft x 4ft', '10ft x 4ft', '12ft x 5ft'],
    finish: 'Matte',
    thicknessMm: 0.8,
    applications: ['countertop', 'vertical', 'cabinet', 'furniture'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51'],
    warrantyYears: 1,
    tags: ['laminate', 'solid-colour', 'white', 'budget', 'commercial'],
    description:
      'The workhorse neutral solid colour. Clean opaque white in a matte finish, stocked in every sheet size and the most commonly specified decor for commercial casework.',
    imageUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',
  },
  {
    id: 'prod-005',
    sku: 'HPL-1595-60',
    name: 'Black Alicante Laminate',
    category: 'laminate',
    price: 2980,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.7,
    inStock: true,
    colors: ['black', 'charcoal'],
    sizes: ['8ft x 4ft', '10ft x 4ft'],
    finish: 'Fine Velvet Texture',
    thicknessMm: 0.8,
    applications: ['countertop', 'vertical', 'cabinet'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51'],
    warrantyYears: 1,
    tags: ['laminate', 'black', 'stone-look', 'dark', 'kitchen'],
    description:
      'Deep black ground with fine white mineral veining. The velvet texture substantially reduces visible fingerprinting compared with a gloss black.',
    imageUrl: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&q=80',
  },
  {
    id: 'prod-006',
    sku: 'HPL-4878-38',
    name: 'Brushed Aluminium Laminate',
    category: 'laminate',
    price: 4450,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.4,
    inStock: false,
    colors: ['silver', 'grey'],
    sizes: ['8ft x 4ft'],
    finish: 'Brushed Metallic',
    thicknessMm: 1.0,
    applications: ['vertical', 'cabinet'],
    certifications: ['GREENGUARD Gold'],
    warrantyYears: 1,
    tags: ['laminate', 'metallic', 'silver', 'feature', 'retail'],
    description:
      'Directional brushed metal effect for feature panels, retail fixtures and lift interiors. Vertical applications only — not rated for horizontal work surfaces.',
    imageUrl: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=600&q=80',
  },
  {
    id: 'prod-007',
    sku: 'HPL-8211-16',
    name: 'Smoky Topaz Laminate',
    category: 'laminate',
    price: 3120,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.3,
    inStock: true,
    colors: ['brown', 'bronze', 'charcoal'],
    sizes: ['8ft x 4ft'],
    finish: 'Textured Gloss',
    thicknessMm: 0.8,
    applications: ['vertical', 'cabinet', 'furniture'],
    certifications: ['GREENGUARD Gold'],
    warrantyYears: 1,
    tags: ['laminate', 'brown', 'warm', 'hospitality'],
    description:
      'Warm smoked-bronze translucent effect with depth under light. Popular for hospitality joinery and reception desks.',
    imageUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=80',
  },

  // ----------------------------------- Quartz ---------------------------------------
  {
    id: 'prod-008',
    sku: 'QTZ-9120-SD',
    name: 'Snow Drift Engineered Quartz',
    category: 'quartz',
    price: 24500,
    currency: 'INR',
    priceUnit: 'slab',
    rating: 4.9,
    inStock: true,
    colors: ['white'],
    sizes: ['120in x 55in'],
    finish: 'Polished',
    thicknessMm: 20,
    applications: ['countertop', 'vanity', 'island'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51'],
    warrantyYears: 10,
    tags: ['quartz', 'white', 'engineered-stone', 'countertop', 'premium'],
    description:
      'Near-uniform bright white engineered quartz with a very fine sparkle. Non-porous and never needs sealing — the default specification for busy kitchens and healthcare.',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  },
  {
    id: 'prod-009',
    sku: 'QTZ-9330-GS',
    name: 'Graphite Storm Engineered Quartz',
    category: 'quartz',
    price: 27800,
    currency: 'INR',
    priceUnit: 'slab',
    rating: 4.8,
    inStock: true,
    colors: ['charcoal', 'grey', 'black'],
    sizes: ['120in x 55in'],
    finish: 'Honed',
    thicknessMm: 20,
    applications: ['countertop', 'island', 'vertical'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51'],
    warrantyYears: 10,
    tags: ['quartz', 'charcoal', 'dark', 'honed', 'engineered-stone'],
    description:
      'Deep charcoal field with a soft matte honed surface and subtle lighter movement. Pairs with brushed brass and warm timber cabinetry.',
    imageUrl: 'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=600&q=80',
  },
  {
    id: 'prod-010',
    sku: 'QTZ-9475-CV',
    name: 'Calacatta Vicenza Engineered Quartz',
    category: 'quartz',
    price: 41900,
    currency: 'INR',
    priceUnit: 'slab',
    rating: 4.9,
    inStock: true,
    colors: ['white', 'grey'],
    sizes: ['126in x 63in'],
    finish: 'Polished',
    thicknessMm: 30,
    applications: ['countertop', 'island', 'feature-wall'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51'],
    warrantyYears: 15,
    tags: ['quartz', 'marble-look', 'white', 'jumbo', 'luxury'],
    description:
      'Jumbo-format slab with bold book-matchable Calacatta veining in 30mm. Specified for waterfall islands where vein continuity across the mitre matters.',
    imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&q=80',
  },

  // -------------------------------- Solid Surface -----------------------------------
  {
    id: 'prod-011',
    sku: 'SSF-2201-AW',
    name: 'Arctic White Solid Surface',
    category: 'solid_surface',
    price: 12400,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.7,
    inStock: true,
    colors: ['white'],
    sizes: ['12ft x 30in'],
    finish: 'Matte',
    thicknessMm: 12,
    applications: ['countertop', 'vanity', 'wall-cladding', 'healthcare'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51', 'Class A Fire Rated'],
    warrantyYears: 10,
    tags: ['solid-surface', 'white', 'seamless', 'healthcare', 'thermoformable'],
    description:
      'Thermoformable acrylic solid surface with inconspicuous seams and integral coved sinks. Repairable in place — scratches sand out. Widely used in healthcare and labs.',
    imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80',
  },
  {
    id: 'prod-012',
    sku: 'SSF-2318-PS',
    name: 'Pearl Sandstone Solid Surface',
    category: 'solid_surface',
    price: 13950,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.5,
    inStock: true,
    colors: ['beige', 'sand'],
    sizes: ['12ft x 30in'],
    finish: 'Matte',
    thicknessMm: 12,
    applications: ['countertop', 'vanity', 'wall-cladding'],
    certifications: ['GREENGUARD Gold', 'NSF/ANSI 51', 'Class A Fire Rated'],
    warrantyYears: 10,
    tags: ['solid-surface', 'beige', 'particulate', 'seamless'],
    description:
      'Warm sand-toned particulate solid surface that hides everyday wear better than a plain colour. Thermoformable and renewable.',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80',
  },

  // ------------------------------- Compact Laminate ----------------------------------
  {
    id: 'prod-013',
    sku: 'CPL-6600-CC',
    name: 'Charcoal Core Compact Laminate Panel',
    category: 'compact_laminate',
    price: 7650,
    currency: 'INR',
    priceUnit: 'sheet',
    rating: 4.6,
    inStock: true,
    colors: ['charcoal', 'black'],
    sizes: ['8ft x 4ft'],
    finish: 'Matte',
    thicknessMm: 12,
    applications: ['washroom-cubicle', 'locker', 'lab-worktop', 'vertical'],
    certifications: ['GREENGUARD Gold', 'Class A Fire Rated'],
    warrantyYears: 5,
    tags: ['compact', 'self-supporting', 'charcoal', 'washroom', 'wet-area'],
    description:
      'Self-supporting 12mm compact grade with a solid charcoal core — no substrate required. Moisture and impact resistant, standard for washroom cubicles and lab benches.',
    imageUrl: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600&q=80',
  },

  // --------------------------------- Edgebanding ------------------------------------
  {
    id: 'prod-014',
    sku: 'EDG-1595-PVC',
    name: 'Designer White PVC Edgebanding 22mm',
    category: 'edgeband',
    price: 980,
    currency: 'INR',
    priceUnit: 'roll',
    rating: 4.4,
    inStock: true,
    colors: ['white'],
    sizes: ['22mm x 50m'],
    finish: 'Matte',
    thicknessMm: 1,
    applications: ['cabinet', 'furniture'],
    certifications: ['GREENGUARD Gold'],
    warrantyYears: 1,
    tags: ['edgeband', 'pvc', 'white', 'matching', 'cabinet'],
    description:
      'Colour-matched 1mm PVC edgebanding for Designer White laminate. 50m roll, suitable for hot-melt and EVA automatic edgebanders.',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80',
  },
  {
    id: 'prod-015',
    sku: 'EDG-7960-ABS',
    name: 'Nordic Oak ABS Edgebanding 22mm',
    category: 'edgeband',
    price: 1240,
    currency: 'INR',
    priceUnit: 'roll',
    rating: 4.5,
    inStock: true,
    colors: ['oak', 'natural'],
    sizes: ['22mm x 50m'],
    finish: 'Soft Grain',
    thicknessMm: 1,
    applications: ['cabinet', 'furniture'],
    certifications: ['GREENGUARD Gold', 'Halogen Free'],
    warrantyYears: 1,
    tags: ['edgeband', 'abs', 'oak', 'woodgrain', 'matching'],
    description:
      'Grain-matched ABS edgebanding for Nordic Oak laminate, with the same soft-grain emboss so the edge reads continuous with the face. Halogen-free alternative to PVC.',
    imageUrl: 'https://images.unsplash.com/photo-1600456899121-68eda5705257?w=600&q=80',
  },
];

export class MockCommerceService implements CommerceService {
  async searchProducts(params: ProductSearchParams): Promise<Product[]> {
    let results = [...MOCK_PRODUCTS];

    if (params.query) {
      const terms = params.query.toLowerCase().split(/\s+/).filter(Boolean);
      results = results.filter((p) => {
        const haystack = [
          p.name,
          p.category.replace(/_/g, ' '),
          p.description,
          p.tags.join(' '),
          p.finish || '',
          (p.applications || []).join(' '),
          p.sku || '',
        ]
          .join(' ')
          .toLowerCase();

        return terms.some((t) => {
          const stem = t.endsWith('s') ? t.slice(0, -1) : t;
          return haystack.includes(t) || (stem.length > 3 && haystack.includes(stem));
        });
      });
    }

    if (params.category) {
      const cat = params.category.toLowerCase().replace(/\s+/g, '_');
      results = results.filter((p) => p.category.toLowerCase().includes(cat));
    }

    if (params.color) {
      const col = params.color.toLowerCase();
      results = results.filter((p) => p.colors.some((c) => c.toLowerCase().includes(col)));
    }

    if (params.finish) {
      const fin = params.finish.toLowerCase();
      results = results.filter((p) => (p.finish || '').toLowerCase().includes(fin));
    }

    if (params.application) {
      const app = params.application.toLowerCase();
      results = results.filter((p) => (p.applications || []).some((a) => a.toLowerCase().includes(app)));
    }

    if (params.maxPrice !== undefined) {
      results = results.filter((p) => p.price <= params.maxPrice!);
    }

    if (params.minPrice !== undefined) {
      results = results.filter((p) => p.price >= params.minPrice!);
    }

    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  async getProductById(id: string): Promise<Product | null> {
    const key = (id || '').trim().toLowerCase();
    return (
      MOCK_PRODUCTS.find((p) => p.id.toLowerCase() === key || (p.sku || '').toLowerCase() === key) || null
    );
  }

  async getRecommendations(category?: string, limit = 4): Promise<Product[]> {
    if (category) {
      const filtered = MOCK_PRODUCTS.filter((p) => p.category === category);
      if (filtered.length > 0) return filtered.slice(0, limit);
    }
    return MOCK_PRODUCTS.slice(0, limit);
  }
}

export const commerceService = new MockCommerceService();
