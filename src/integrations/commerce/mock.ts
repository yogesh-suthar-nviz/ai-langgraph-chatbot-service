import { CommerceService, Product, ProductSearchParams } from './interface.js';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Velocity Nitro Carbon Runner',
    category: 'running_shoes',
    price: 8499,
    currency: 'INR',
    rating: 4.8,
    inStock: true,
    colors: ['black', 'anthracite', 'white'],
    sizes: ['7', '8', '9', '10', '11'],
    tags: ['running', 'marathon', 'cushioned', 'black'],
    description: 'High-performance carbon plate marathon running shoe with ultra-responsive nitrogen foam.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  },
  {
    id: 'prod-002',
    name: 'AeroGlide Everyday Trainer',
    category: 'running_shoes',
    price: 6299,
    currency: 'INR',
    rating: 4.6,
    inStock: true,
    colors: ['black', 'blue', 'grey'],
    sizes: ['8', '9', '10', '11'],
    tags: ['running', 'breathable', 'daily-trainer', 'black'],
    description: 'Lightweight road running shoe designed for high-mileage comfort and breathable mesh upper.',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
  },
  {
    id: 'prod-003',
    name: 'TrailVenture Waterproof Pro',
    category: 'running_shoes',
    price: 9990,
    currency: 'INR',
    rating: 4.9,
    inStock: true,
    colors: ['black', 'olive', 'stealth-black'],
    sizes: ['7', '8', '9', '10'],
    tags: ['running', 'trail', 'waterproof', 'black'],
    description: 'Rugged Gore-Tex trail runner with Vibram Megagrip traction for all-weather conditions.',
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80',
  },
  {
    id: 'prod-004',
    name: 'PulseFlow Recovery Sneaker',
    category: 'running_shoes',
    price: 4999,
    currency: 'INR',
    rating: 4.4,
    inStock: true,
    colors: ['black', 'white'],
    sizes: ['6', '7', '8', '9', '10'],
    tags: ['running', 'recovery', 'slip-on', 'black'],
    description: 'Cushioned post-run recovery shoes engineered with ergonomic footbed and memory foam.',
    imageUrl: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600&q=80',
  },
  {
    id: 'prod-005',
    name: 'Apex Speed Elite Track Spikes',
    category: 'running_shoes',
    price: 13500,
    currency: 'INR',
    rating: 4.7,
    inStock: true,
    colors: ['black', 'gold'],
    sizes: ['8', '9', '10'],
    tags: ['running', 'track', 'spikes', 'black'],
    description: 'Professional sprint spikes engineered for maximum power transfer and aerodynamic efficiency.',
    imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80',
  },
  {
    id: 'prod-006',
    name: 'Quantum Court Basketball Shoes',
    category: 'basketball',
    price: 8999,
    currency: 'INR',
    rating: 4.5,
    inStock: true,
    colors: ['red', 'black', 'white'],
    sizes: ['9', '10', '11', '12'],
    tags: ['basketball', 'ankle-support', 'court'],
    description: 'High-top basketball shoe featuring lockdown strap and multi-directional herringbone traction.',
    imageUrl: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=600&q=80',
  },
  {
    id: 'prod-007',
    name: 'StormShield Windrunner Jacket',
    category: 'apparel',
    price: 3499,
    currency: 'INR',
    rating: 4.8,
    inStock: true,
    colors: ['black', 'navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    tags: ['jacket', 'windbreaker', 'apparel', 'black'],
    description: 'Packable wind-resistant shell jacket with reflective accents for night visibility.',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
  },
  {
    id: 'prod-008',
    name: 'HydroDry Compression Running Tights',
    category: 'apparel',
    price: 2199,
    currency: 'INR',
    rating: 4.7,
    inStock: true,
    colors: ['black'],
    sizes: ['S', 'M', 'L', 'XL'],
    tags: ['tights', 'compression', 'apparel', 'black'],
    description: 'Sweat-wicking technical running tights featuring zip pocket and 4-way stretch fabric.',
    imageUrl: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80',
  },
  {
    id: 'prod-009',
    name: 'Summit Explore Hiking Boots',
    category: 'outdoor',
    price: 11499,
    currency: 'INR',
    rating: 4.8,
    inStock: true,
    colors: ['brown', 'black'],
    sizes: ['8', '9', '10', '11'],
    tags: ['hiking', 'boots', 'waterproof', 'outdoor'],
    description: 'Full-grain leather waterproof hiking boot with reinforced toe guard and cushioned ankle collar.',
    imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&q=80',
  },
  {
    id: 'prod-010',
    name: 'CloudStratus Walking Loafers',
    category: 'casual',
    price: 4299,
    currency: 'INR',
    rating: 4.3,
    inStock: true,
    colors: ['black', 'tan', 'grey'],
    sizes: ['7', '8', '9', '10'],
    tags: ['casual', 'comfortable', 'black'],
    description: 'Orthopedic comfort walking slip-on shoes for all-day standing and walking.',
    imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80',
  },
  {
    id: 'prod-011',
    name: 'UrbanCommute Laptop Backpack 25L',
    category: 'accessories',
    price: 2999,
    currency: 'INR',
    rating: 4.9,
    inStock: true,
    colors: ['black', 'charcoal'],
    sizes: ['One Size'],
    tags: ['backpack', 'commute', 'water-resistant', 'black'],
    description: 'Water-resistant city backpack with dedicated 16-inch padded laptop sleeve and USB charging port.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
  },
  {
    id: 'prod-012',
    name: 'ThermoTech Fleece Running Beanie',
    category: 'accessories',
    price: 899,
    currency: 'INR',
    rating: 4.6,
    inStock: true,
    colors: ['black', 'neon'],
    sizes: ['One Size'],
    tags: ['accessories', 'beanie', 'winter', 'black'],
    description: 'Insulated thermal fleece beanie designed to wick moisture during cold morning workouts.',
    imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80',
  },
];

export class MockCommerceService implements CommerceService {
  async searchProducts(params: ProductSearchParams): Promise<Product[]> {
    let results = [...MOCK_PRODUCTS];

    if (params.query) {
      const terms = params.query.toLowerCase().split(/\s+/).filter(Boolean);
      results = results.filter((p) => {
        const haystack = `${p.name} ${p.category} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
        return terms.some((t) => {
          const stem = t.endsWith('s') ? t.slice(0, -1) : t;
          return haystack.includes(t) || (stem.length > 3 && haystack.includes(stem));
        });
      });
    }

    if (params.category) {
      const cat = params.category.toLowerCase();
      results = results.filter((p) => p.category.toLowerCase().includes(cat));
    }

    if (params.color) {
      const col = params.color.toLowerCase();
      results = results.filter((p) => p.colors.some((c) => c.toLowerCase().includes(col)));
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
    return MOCK_PRODUCTS.find((p) => p.id === id) || null;
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
