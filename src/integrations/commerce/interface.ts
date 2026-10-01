export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  inStock: boolean;
  colors: string[];
  sizes: string[];
  tags: string[];
  description: string;
  imageUrl?: string;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  limit?: number;
}

export interface CommerceService {
  searchProducts(params: ProductSearchParams): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getRecommendations(category?: string, limit?: number): Promise<Product[]>;
}
