export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  inStock: boolean;
  /** Decor / colour family used for filtering (e.g. white, charcoal, walnut). */
  colors: string[];
  /** Available sheet or slab sizes (e.g. "8ft x 4ft"). */
  sizes: string[];
  tags: string[];
  description: string;
  imageUrl?: string;

  // --- Surfacing-specific attributes ---
  /** Manufacturer SKU / decor number. */
  sku?: string;
  /** Surface finish (e.g. Matte, High Gloss, Fine Velvet Texture, Soft Grain). */
  finish?: string;
  /** Nominal thickness in millimetres. */
  thicknessMm?: number;
  /** Where the product may be specified. */
  applications?: string[];
  /** Compliance and sustainability marks. */
  certifications?: string[];
  /** Limited warranty period in years. */
  warrantyYears?: number;
  /** Unit the price is quoted in (sheet, slab, roll). */
  priceUnit?: string;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  /** Filter by surface finish. */
  finish?: string;
  /** Filter by intended application (countertop, vertical, cabinet...). */
  application?: string;
  limit?: number;
}

export interface CommerceService {
  searchProducts(params: ProductSearchParams): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getRecommendations(category?: string, limit?: number): Promise<Product[]>;
}
